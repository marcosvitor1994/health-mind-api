const Appointment = require('../models/Appointment');
const WorkingHours = require('../models/WorkingHours');
const Room = require('../models/Room');
const Psychologist = require('../models/Psychologist');

/**
 * Converte string de horário (HH:MM) para minutos desde meia-noite
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos desde meia-noite para string de horário (HH:MM)
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Gera todos os slots de tempo possíveis baseado nos períodos de trabalho
 * @param {Array} workingSlots - Array de {startTime, endTime}
 * @param {Number} sessionDuration - Duração da sessão em minutos
 * @param {Number} buffer - Buffer entre sessões em minutos
 * @returns {Array} - Array de {startTime, endTime} slots
 */
function generateTimeSlots(workingSlots, sessionDuration, buffer) {
  const slots = [];

  for (const period of workingSlots) {
    const periodStart = timeToMinutes(period.startTime);
    const periodEnd = timeToMinutes(period.endTime);

    let currentStart = periodStart;

    while (currentStart + sessionDuration <= periodEnd) {
      slots.push({
        startTime: minutesToTime(currentStart),
        endTime: minutesToTime(currentStart + sessionDuration),
      });
      currentStart += sessionDuration + buffer;
    }
  }

  return slots;
}

/**
 * Verifica se um slot tem conflito com appointments existentes
 * @param {Object} slot - {startTime, endTime}
 * @param {Array} appointments - Array de appointments
 * @param {Date} baseDate - Data base para comparação
 * @returns {Boolean}
 */
function slotHasConflict(slot, appointments, baseDate) {
  const slotStart = timeToMinutes(slot.startTime);
  const slotEnd = timeToMinutes(slot.endTime);

  for (const appt of appointments) {
    const apptDate = new Date(appt.date);
    const apptStart = apptDate.getHours() * 60 + apptDate.getMinutes();
    const apptEnd = apptStart + appt.duration;

    // Verifica sobreposição
    if (slotStart < apptEnd && slotEnd > apptStart) {
      return true;
    }
  }

  return false;
}

/**
 * Obtém slots disponíveis para um psicólogo em uma data específica
 * @param {Object} params
 * @param {String} params.psychologistId - ID do psicólogo
 * @param {String} params.date - Data no formato YYYY-MM-DD
 * @param {Number} params.duration - Duração desejada (opcional)
 * @param {Boolean} params.includeRooms - Se deve incluir salas disponíveis
 * @returns {Object} - {slots: Array, isOpen: Boolean, reason: String}
 */
async function getAvailableSlots(params) {
  const { psychologistId, date, duration, includeRooms = false } = params;

  // Busca o psicólogo para obter clinicId
  const psychologist = await Psychologist.findById(psychologistId);
  if (!psychologist || psychologist.deletedAt) {
    throw new Error('Psicólogo não encontrado');
  }

  // Obtém horário efetivo (considerando clínica se houver)
  const effectiveHours = await WorkingHours.getEffectiveWorkingHours(
    'psychologist',
    psychologistId,
    date,
    psychologist.clinicId
  );

  if (!effectiveHours.isOpen) {
    return {
      slots: [],
      isOpen: false,
      reason: effectiveHours.reason || 'Fechado nesta data',
    };
  }

  // Determina duração da sessão
  const sessionDuration =
    duration ||
    psychologist.settings?.defaultSessionDuration ||
    effectiveHours.defaultSessionDuration ||
    50;

  // Gera todos os slots possíveis
  const allSlots = generateTimeSlots(
    effectiveHours.slots,
    sessionDuration,
    effectiveHours.bufferBetweenSessions
  );

  // Busca appointments existentes para o dia
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await Appointment.find({
    psychologistId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled', 'confirmed'] },
    deletedAt: null,
  });

  // Filtra slots ocupados
  const availableSlots = allSlots.filter(
    (slot) => !slotHasConflict(slot, existingAppointments, targetDate)
  );

  // Se deve incluir disponibilidade de salas
  if (includeRooms && psychologist.clinicId) {
    const slotsWithRooms = await addRoomAvailability(
      availableSlots,
      psychologist.clinicId,
      date,
      sessionDuration
    );
    return {
      slots: slotsWithRooms,
      isOpen: true,
      reason: null,
      sessionDuration,
    };
  }

  return {
    slots: availableSlots,
    isOpen: true,
    reason: null,
    sessionDuration,
  };
}

/**
 * Adiciona informação de salas disponíveis a cada slot
 */
async function addRoomAvailability(slots, clinicId, date, duration) {
  // Busca todas as salas ativas da clínica
  const rooms = await Room.find({
    clinicId,
    isActive: true,
    deletedAt: null,
  });

  if (rooms.length === 0) {
    return slots.map((slot) => ({ ...slot, availableRooms: [] }));
  }

  // Busca appointments que usam salas neste dia
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const roomAppointments = await Appointment.find({
    roomId: { $in: rooms.map((r) => r._id) },
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled', 'confirmed'] },
    deletedAt: null,
  });

  // Para cada slot, verifica quais salas estão disponíveis
  return slots.map((slot) => {
    const availableRooms = rooms.filter((room) => {
      const roomAppts = roomAppointments.filter(
        (a) => a.roomId && a.roomId.toString() === room._id.toString()
      );
      return !slotHasConflict(slot, roomAppts, targetDate);
    });

    return {
      ...slot,
      availableRooms: availableRooms.map((r) => ({
        _id: r._id,
        name: r.name,
        number: r.number,
      })),
    };
  });
}

/**
 * Obtém salas disponíveis para um período específico
 * @param {Object} params
 * @param {String} params.clinicId - ID da clínica
 * @param {String} params.date - Data no formato YYYY-MM-DD
 * @param {String} params.startTime - Horário de início HH:MM
 * @param {String} params.endTime - Horário de término HH:MM
 * @returns {Array} - Array de salas disponíveis
 */
async function getAvailableRooms(params) {
  const { clinicId, date, startTime, endTime } = params;

  // Busca todas as salas ativas da clínica
  const rooms = await Room.find({
    clinicId,
    isActive: true,
    deletedAt: null,
  });

  if (rooms.length === 0) {
    return [];
  }

  // Busca appointments que usam salas neste período
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const roomAppointments = await Appointment.find({
    roomId: { $in: rooms.map((r) => r._id) },
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled', 'confirmed'] },
    deletedAt: null,
  });

  const requestedSlot = { startTime, endTime };

  // Filtra salas disponíveis no período solicitado
  const availableRooms = rooms.filter((room) => {
    const roomAppts = roomAppointments.filter(
      (a) => a.roomId && a.roomId.toString() === room._id.toString()
    );
    return !slotHasConflict(requestedSlot, roomAppts, targetDate);
  });

  return availableRooms;
}

/**
 * Obtém a agenda de uma sala específica para um dia
 * @param {String} roomId - ID da sala
 * @param {String} date - Data no formato YYYY-MM-DD
 * @returns {Object} - {room, appointments}
 */
async function getRoomSchedule(roomId, date) {
  const room = await Room.findOne({
    _id: roomId,
    deletedAt: null,
  });

  if (!room) {
    throw new Error('Sala não encontrada');
  }

  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    roomId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled', 'confirmed', 'completed'] },
    deletedAt: null,
  })
    .populate('psychologistId', 'name')
    .populate('patientId', 'name')
    .sort({ date: 1 });

  return {
    room,
    appointments: appointments.map((appt) => ({
      _id: appt._id,
      startTime: `${appt.date.getHours().toString().padStart(2, '0')}:${appt.date.getMinutes().toString().padStart(2, '0')}`,
      endTime: minutesToTime(
        appt.date.getHours() * 60 + appt.date.getMinutes() + appt.duration
      ),
      duration: appt.duration,
      status: appt.status,
      type: appt.type,
      psychologist: appt.psychologistId?.name,
      patient: appt.patientId?.name,
    })),
  };
}

/**
 * Obtém agenda de todas as salas de uma clínica para um dia
 * @param {String} clinicId - ID da clínica
 * @param {String} date - Data no formato YYYY-MM-DD
 * @returns {Array} - Array de {room, appointments}
 */
async function getClinicRoomsSchedule(clinicId, date) {
  const rooms = await Room.find({
    clinicId,
    isActive: true,
    deletedAt: null,
  }).sort({ name: 1 });

  const schedules = await Promise.all(
    rooms.map(async (room) => {
      const schedule = await getRoomSchedule(room._id, date);
      return schedule;
    })
  );

  return schedules;
}

module.exports = {
  getAvailableSlots,
  getAvailableRooms,
  getRoomSchedule,
  getClinicRoomsSchedule,
  generateTimeSlots,
  timeToMinutes,
  minutesToTime,
};
