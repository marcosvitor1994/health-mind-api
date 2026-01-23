const availabilityService = require('../services/availabilityService');
const occupancyService = require('../services/occupancyService');
const Clinic = require('../models/Clinic');
const Psychologist = require('../models/Psychologist');

/**
 * Obter slots disponíveis
 * GET /api/availability/slots
 * Query params: psychologistId, date, duration, includeRooms
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { psychologistId, date, duration, includeRooms } = req.query;

    if (!psychologistId) {
      return res.status(400).json({ message: 'psychologistId é obrigatório' });
    }

    if (!date) {
      return res.status(400).json({ message: 'date é obrigatório (formato: YYYY-MM-DD)' });
    }

    // Valida formato da data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
    }

    const slots = await availabilityService.getAvailableSlots({
      psychologistId,
      date,
      duration: duration ? parseInt(duration) : undefined,
      includeRooms: includeRooms === 'true',
    });

    res.json(slots);
  } catch (error) {
    console.error('Erro ao buscar slots disponíveis:', error);
    if (error.message === 'Psicólogo não encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Obter salas disponíveis para um período
 * GET /api/availability/rooms
 * Query params: clinicId, date, startTime, endTime
 */
exports.getAvailableRooms = async (req, res) => {
  try {
    const { clinicId, date, startTime, endTime } = req.query;

    if (!clinicId) {
      return res.status(400).json({ message: 'clinicId é obrigatório' });
    }

    if (!date) {
      return res.status(400).json({ message: 'date é obrigatório (formato: YYYY-MM-DD)' });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'startTime e endTime são obrigatórios (formato: HH:MM)' });
    }

    // Valida formatos
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Formato de data inválido. Use YYYY-MM-DD' });
    }

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Formato de horário inválido. Use HH:MM' });
    }

    // Verifica se a clínica existe
    const clinic = await Clinic.findOne({ _id: clinicId, deletedAt: null });
    if (!clinic) {
      return res.status(404).json({ message: 'Clínica não encontrada' });
    }

    const rooms = await availabilityService.getAvailableRooms({
      clinicId,
      date,
      startTime,
      endTime,
    });

    res.json(rooms);
  } catch (error) {
    console.error('Erro ao buscar salas disponíveis:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Obter taxa de ocupação da clínica
 * GET /api/clinics/:clinicId/occupancy
 * Query params: startDate, endDate, detailed, groupBy
 */
exports.getClinicOccupancy = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate, detailed, groupBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate e endDate são obrigatórios' });
    }

    // Verifica se a clínica existe
    const clinic = await Clinic.findOne({ _id: clinicId, deletedAt: null });
    if (!clinic) {
      return res.status(404).json({ message: 'Clínica não encontrada' });
    }

    // Se detalhado, retorna breakdown por psicólogo e sala
    if (detailed === 'true') {
      const detailedOccupancy = await occupancyService.getClinicOccupancyDetailed(
        clinicId,
        startDate,
        endDate
      );
      return res.json(detailedOccupancy);
    }

    // Se agrupado por período
    if (groupBy) {
      const occupancyByPeriod = await occupancyService.getOccupancyByPeriod({
        entityType: 'clinic',
        entityId: clinicId,
        startDate,
        endDate,
        groupBy,
      });
      return res.json(occupancyByPeriod);
    }

    // Ocupação simples
    const occupancy = await occupancyService.calculateOccupancyRate({
      entityType: 'clinic',
      entityId: clinicId,
      startDate,
      endDate,
    });

    res.json(occupancy);
  } catch (error) {
    console.error('Erro ao calcular ocupação da clínica:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Obter taxa de ocupação do psicólogo
 * GET /api/psychologists/:id/occupancy
 * Query params: startDate, endDate, groupBy
 */
exports.getPsychologistOccupancy = async (req, res) => {
  try {
    const { id: psychologistId } = req.params;
    const { startDate, endDate, groupBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate e endDate são obrigatórios' });
    }

    // Verifica se o psicólogo existe
    const psychologist = await Psychologist.findOne({ _id: psychologistId, deletedAt: null });
    if (!psychologist) {
      return res.status(404).json({ message: 'Psicólogo não encontrado' });
    }

    // Se agrupado por período
    if (groupBy) {
      const occupancyByPeriod = await occupancyService.getOccupancyByPeriod({
        entityType: 'psychologist',
        entityId: psychologistId,
        startDate,
        endDate,
        groupBy,
      });
      return res.json(occupancyByPeriod);
    }

    const occupancy = await occupancyService.calculateOccupancyRate({
      entityType: 'psychologist',
      entityId: psychologistId,
      startDate,
      endDate,
    });

    res.json(occupancy);
  } catch (error) {
    console.error('Erro ao calcular ocupação do psicólogo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Obter taxa de ocupação de uma sala
 * GET /api/clinics/:clinicId/rooms/:roomId/occupancy
 * Query params: startDate, endDate, groupBy
 */
exports.getRoomOccupancy = async (req, res) => {
  try {
    const { clinicId, roomId } = req.params;
    const { startDate, endDate, groupBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate e endDate são obrigatórios' });
    }

    // Se agrupado por período
    if (groupBy) {
      const occupancyByPeriod = await occupancyService.getOccupancyByPeriod({
        entityType: 'room',
        entityId: roomId,
        startDate,
        endDate,
        groupBy,
        clinicId,
      });
      return res.json(occupancyByPeriod);
    }

    const occupancy = await occupancyService.calculateOccupancyRate({
      entityType: 'room',
      entityId: roomId,
      startDate,
      endDate,
      clinicId,
    });

    res.json(occupancy);
  } catch (error) {
    console.error('Erro ao calcular ocupação da sala:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
