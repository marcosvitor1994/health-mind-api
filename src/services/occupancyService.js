const Appointment = require('../models/Appointment');
const WorkingHours = require('../models/WorkingHours');
const Psychologist = require('../models/Psychologist');
const Room = require('../models/Room');

/**
 * Converte string de horário (HH:MM) para minutos desde meia-noite
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calcula total de minutos disponíveis em um array de slots
 */
function calculateMinutesFromSlots(slots) {
  return slots.reduce((total, slot) => {
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    return total + (end - start);
  }, 0);
}

/**
 * Verifica se duas datas são o mesmo dia
 */
function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Calcula horas disponíveis no período para uma entidade
 * @param {String} entityType - 'clinic', 'psychologist' ou 'room'
 * @param {String} entityId - ID da entidade
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final
 * @param {String} clinicId - ID da clínica (para psicólogos)
 * @returns {Number} - Total de horas disponíveis
 */
async function calculateAvailableHours(entityType, entityId, startDate, endDate, clinicId = null) {
  let totalMinutes = 0;

  // Para salas, usa horário da clínica
  const lookupType = entityType === 'room' ? 'clinic' : entityType;
  const lookupId = entityType === 'room' ? clinicId : entityId;

  const workingHours = await WorkingHours.findOne({
    entityType: lookupType,
    entityId: lookupId,
    deletedAt: null,
  });

  // Se não há horário definido, usa padrão (8h/dia, seg-sex)
  const defaultSlots = [{ startTime: '08:00', endTime: '18:00' }];
  const defaultMinutesPerDay = 600; // 10 horas

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Itera por cada dia no período
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();

    if (!workingHours) {
      // Usa padrão: seg-sex, 10 horas por dia
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        totalMinutes += defaultMinutesPerDay;
      }
      continue;
    }

    // Verifica se há override para esta data
    const override = workingHours.dateOverrides.find((o) => isSameDay(o.date, date));

    if (override) {
      if (override.isOpen && override.slots.length > 0) {
        totalMinutes += calculateMinutesFromSlots(override.slots);
      }
      continue;
    }

    // Usa schedule semanal
    const daySchedule = workingHours.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);

    if (daySchedule && daySchedule.isOpen && daySchedule.slots.length > 0) {
      totalMinutes += calculateMinutesFromSlots(daySchedule.slots);
    }
  }

  return totalMinutes / 60; // Retorna em horas
}

/**
 * Calcula horas ocupadas no período
 * @param {String} entityType - 'clinic', 'psychologist' ou 'room'
 * @param {String} entityId - ID da entidade
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final
 * @returns {Number} - Total de horas ocupadas
 */
async function calculateOccupiedHours(entityType, entityId, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const matchQuery = {
    date: { $gte: start, $lte: end },
    status: { $in: ['completed', 'confirmed', 'scheduled'] },
    deletedAt: null,
  };

  if (entityType === 'clinic') {
    // Para clínica, soma de todos os psicólogos vinculados
    const psychologists = await Psychologist.find({
      clinicId: entityId,
      deletedAt: null,
    });
    matchQuery.psychologistId = { $in: psychologists.map((p) => p._id) };
  } else if (entityType === 'psychologist') {
    matchQuery.psychologistId = entityId;
  } else if (entityType === 'room') {
    matchQuery.roomId = entityId;
  }

  const result = await Appointment.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$duration' },
        totalAppointments: { $sum: 1 },
      },
    },
  ]);

  return {
    hours: result.length > 0 ? result[0].totalMinutes / 60 : 0,
    appointments: result.length > 0 ? result[0].totalAppointments : 0,
  };
}

/**
 * Calcula taxa de ocupação para uma entidade
 * @param {Object} params
 * @param {String} params.entityType - 'clinic', 'psychologist' ou 'room'
 * @param {String} params.entityId - ID da entidade
 * @param {String} params.startDate - Data inicial (YYYY-MM-DD)
 * @param {String} params.endDate - Data final (YYYY-MM-DD)
 * @param {String} params.clinicId - ID da clínica (necessário para rooms)
 * @returns {Object} - {availableHours, occupiedHours, occupancyRate, period, appointments}
 */
async function calculateOccupancyRate(params) {
  const { entityType, entityId, startDate, endDate, clinicId } = params;

  const availableHours = await calculateAvailableHours(
    entityType,
    entityId,
    startDate,
    endDate,
    clinicId
  );

  const occupied = await calculateOccupiedHours(entityType, entityId, startDate, endDate);

  const occupancyRate =
    availableHours > 0 ? Math.round((occupied.hours / availableHours) * 100) : 0;

  return {
    availableHours: Math.round(availableHours * 10) / 10,
    occupiedHours: Math.round(occupied.hours * 10) / 10,
    occupancyRate: Math.min(occupancyRate, 100), // Cap at 100%
    totalAppointments: occupied.appointments,
    period: {
      startDate,
      endDate,
    },
  };
}

/**
 * Calcula ocupação da clínica com breakdown por psicólogo
 * @param {String} clinicId - ID da clínica
 * @param {String} startDate - Data inicial
 * @param {String} endDate - Data final
 * @returns {Object} - Ocupação geral e por psicólogo
 */
async function getClinicOccupancyDetailed(clinicId, startDate, endDate) {
  // Ocupação geral da clínica
  const overall = await calculateOccupancyRate({
    entityType: 'clinic',
    entityId: clinicId,
    startDate,
    endDate,
  });

  // Busca psicólogos da clínica
  const psychologists = await Psychologist.find({
    clinicId,
    deletedAt: null,
  }).select('name');

  // Calcula ocupação por psicólogo
  const byPsychologist = await Promise.all(
    psychologists.map(async (psych) => {
      const occupancy = await calculateOccupancyRate({
        entityType: 'psychologist',
        entityId: psych._id,
        startDate,
        endDate,
      });
      return {
        psychologistId: psych._id,
        name: psych.name,
        ...occupancy,
      };
    })
  );

  // Busca salas da clínica
  const rooms = await Room.find({
    clinicId,
    isActive: true,
    deletedAt: null,
  }).select('name number');

  // Calcula ocupação por sala
  const byRoom = await Promise.all(
    rooms.map(async (room) => {
      const occupancy = await calculateOccupancyRate({
        entityType: 'room',
        entityId: room._id,
        startDate,
        endDate,
        clinicId,
      });
      return {
        roomId: room._id,
        name: room.name,
        number: room.number,
        ...occupancy,
      };
    })
  );

  return {
    overall,
    byPsychologist: byPsychologist.sort((a, b) => b.occupancyRate - a.occupancyRate),
    byRoom: byRoom.sort((a, b) => b.occupancyRate - a.occupancyRate),
  };
}

/**
 * Calcula ocupação agrupada por período (dia, semana, mês)
 * @param {Object} params
 * @param {String} params.entityType
 * @param {String} params.entityId
 * @param {String} params.startDate
 * @param {String} params.endDate
 * @param {String} params.groupBy - 'day', 'week', 'month'
 * @returns {Array} - Array de ocupações por período
 */
async function getOccupancyByPeriod(params) {
  const { entityType, entityId, startDate, endDate, groupBy = 'day', clinicId } = params;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const results = [];

  if (groupBy === 'day') {
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayStr = date.toISOString().split('T')[0];
      const occupancy = await calculateOccupancyRate({
        entityType,
        entityId,
        startDate: dayStr,
        endDate: dayStr,
        clinicId,
      });
      results.push({
        date: dayStr,
        ...occupancy,
      });
    }
  } else if (groupBy === 'week') {
    let weekStart = new Date(start);
    while (weekStart <= end) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > end) weekEnd.setTime(end.getTime());

      const occupancy = await calculateOccupancyRate({
        entityType,
        entityId,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        clinicId,
      });
      results.push({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        ...occupancy,
      });

      weekStart.setDate(weekStart.getDate() + 7);
    }
  } else if (groupBy === 'month') {
    let monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    while (monthStart <= end) {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      if (monthEnd > end) monthEnd.setTime(end.getTime());
      if (monthStart < start) monthStart.setTime(start.getTime());

      const occupancy = await calculateOccupancyRate({
        entityType,
        entityId,
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
        clinicId,
      });
      results.push({
        month: `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}`,
        ...occupancy,
      });

      monthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    }
  }

  return results;
}

module.exports = {
  calculateOccupancyRate,
  calculateAvailableHours,
  calculateOccupiedHours,
  getClinicOccupancyDetailed,
  getOccupancyByPeriod,
};
