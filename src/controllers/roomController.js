const Room = require('../models/Room');
const Clinic = require('../models/Clinic');
const Appointment = require('../models/Appointment');
const availabilityService = require('../services/availabilityService');

/**
 * Criar nova sala
 * POST /api/clinics/:clinicId/rooms
 */
exports.createRoom = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { name, number, description, capacity, amenities } = req.body;

    // Verifica se a clínica existe
    const clinic = await Clinic.findOne({ _id: clinicId, deletedAt: null });
    if (!clinic) {
      return res.status(404).json({ message: 'Clínica não encontrada' });
    }

    // Verifica permissão (apenas a própria clínica pode criar salas)
    if (req.user.role === 'clinic' && req.user.id !== clinicId) {
      return res.status(403).json({ message: 'Sem permissão para criar salas nesta clínica' });
    }

    // Verifica se já existe sala com mesmo nome na clínica
    const existingRoom = await Room.findOne({
      clinicId,
      name,
      deletedAt: null,
    });
    if (existingRoom) {
      return res.status(400).json({ message: 'Já existe uma sala com este nome' });
    }

    const room = await Room.create({
      clinicId,
      name,
      number,
      description,
      capacity,
      amenities,
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Listar salas da clínica
 * GET /api/clinics/:clinicId/rooms
 */
exports.getRooms = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { includeInactive } = req.query;

    // Verifica se a clínica existe
    const clinic = await Clinic.findOne({ _id: clinicId, deletedAt: null });
    if (!clinic) {
      return res.status(404).json({ message: 'Clínica não encontrada' });
    }

    const query = {
      clinicId,
      deletedAt: null,
    };

    // Por padrão, só retorna salas ativas
    if (includeInactive !== 'true') {
      query.isActive = true;
    }

    const rooms = await Room.find(query).sort({ name: 1 });

    res.json(rooms);
  } catch (error) {
    console.error('Erro ao listar salas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Obter detalhes de uma sala
 * GET /api/clinics/:clinicId/rooms/:roomId
 */
exports.getRoom = async (req, res) => {
  try {
    const { clinicId, roomId } = req.params;

    const room = await Room.findOne({
      _id: roomId,
      clinicId,
      deletedAt: null,
    });

    if (!room) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }

    res.json(room);
  } catch (error) {
    console.error('Erro ao buscar sala:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Atualizar sala
 * PUT /api/clinics/:clinicId/rooms/:roomId
 */
exports.updateRoom = async (req, res) => {
  try {
    const { clinicId, roomId } = req.params;
    const { name, number, description, capacity, amenities, isActive } = req.body;

    // Verifica permissão
    if (req.user.role === 'clinic' && req.user.id !== clinicId) {
      return res.status(403).json({ message: 'Sem permissão para atualizar salas desta clínica' });
    }

    const room = await Room.findOne({
      _id: roomId,
      clinicId,
      deletedAt: null,
    });

    if (!room) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }

    // Se está alterando o nome, verifica duplicidade
    if (name && name !== room.name) {
      const existingRoom = await Room.findOne({
        clinicId,
        name,
        _id: { $ne: roomId },
        deletedAt: null,
      });
      if (existingRoom) {
        return res.status(400).json({ message: 'Já existe uma sala com este nome' });
      }
    }

    // Atualiza campos
    if (name !== undefined) room.name = name;
    if (number !== undefined) room.number = number;
    if (description !== undefined) room.description = description;
    if (capacity !== undefined) room.capacity = capacity;
    if (amenities !== undefined) room.amenities = amenities;
    if (isActive !== undefined) room.isActive = isActive;

    await room.save();

    res.json(room);
  } catch (error) {
    console.error('Erro ao atualizar sala:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Deletar sala (soft delete)
 * DELETE /api/clinics/:clinicId/rooms/:roomId
 */
exports.deleteRoom = async (req, res) => {
  try {
    const { clinicId, roomId } = req.params;

    // Verifica permissão
    if (req.user.role === 'clinic' && req.user.id !== clinicId) {
      return res.status(403).json({ message: 'Sem permissão para deletar salas desta clínica' });
    }

    const room = await Room.findOne({
      _id: roomId,
      clinicId,
      deletedAt: null,
    });

    if (!room) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }

    // Verifica se há agendamentos futuros nesta sala
    const futureAppointments = await Appointment.countDocuments({
      roomId,
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
      deletedAt: null,
    });

    if (futureAppointments > 0) {
      return res.status(400).json({
        message: `Não é possível deletar a sala. Existem ${futureAppointments} agendamento(s) futuro(s) vinculado(s).`,
        futureAppointments,
      });
    }

    await room.softDelete();

    res.json({ message: 'Sala deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar sala:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Obter agenda de uma sala
 * GET /api/clinics/:clinicId/rooms/:roomId/schedule
 */
exports.getRoomSchedule = async (req, res) => {
  try {
    const { clinicId, roomId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    // Verifica se a sala pertence à clínica
    const room = await Room.findOne({
      _id: roomId,
      clinicId,
      deletedAt: null,
    });

    if (!room) {
      return res.status(404).json({ message: 'Sala não encontrada' });
    }

    const schedule = await availabilityService.getRoomSchedule(roomId, date);

    res.json(schedule);
  } catch (error) {
    console.error('Erro ao buscar agenda da sala:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

/**
 * Obter agenda de todas as salas da clínica
 * GET /api/clinics/:clinicId/rooms/schedule
 */
exports.getAllRoomsSchedule = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    // Verifica se a clínica existe
    const clinic = await Clinic.findOne({ _id: clinicId, deletedAt: null });
    if (!clinic) {
      return res.status(404).json({ message: 'Clínica não encontrada' });
    }

    const schedules = await availabilityService.getClinicRoomsSchedule(clinicId, date);

    res.json(schedules);
  } catch (error) {
    console.error('Erro ao buscar agenda das salas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
