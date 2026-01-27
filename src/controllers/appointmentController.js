const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Psychologist = require('../models/Psychologist');
const Room = require('../models/Room');
const Clinic = require('../models/Clinic');
const { isValidObjectId } = require('../utils/validator');

/**
 * Criar agendamento
 * @route POST /api/appointments
 * @access Private (Patient, Psychologist, Clinic)
 */
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, psychologistId, date, duration, type, notes, roomId } = req.body;

    // Validações
    if (!patientId || !psychologistId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça todos os campos obrigatórios',
      });
    }

    // Validar ObjectIds
    if (!isValidObjectId(patientId) || !isValidObjectId(psychologistId)) {
      return res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
    }

    // Validar roomId se fornecido
    if (roomId && !isValidObjectId(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da sala inválido',
      });
    }

    // Validar data (deve ser no futuro)
    const appointmentDate = new Date(date);
    if (appointmentDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Data do agendamento deve ser no futuro',
      });
    }

    // Verificar se paciente existe
    const patient = await Patient.findById(patientId).notDeleted();
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    // Verificar se psicólogo existe
    const psychologist = await Psychologist.findById(psychologistId).notDeleted();
    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    // Validações específicas por role
    if (req.user.role === 'clinic') {
      // Clínica criando agendamento: validar que psicólogo pertence à clínica
      if (!psychologist.clinicId || psychologist.clinicId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Psicólogo não pertence a esta clínica',
        });
      }

      // Validar que paciente pertence à clínica (diretamente ou via psicólogo da clínica)
      const patientBelongsToClinic =
        (patient.clinicId && patient.clinicId.toString() === req.user._id.toString()) ||
        (patient.psychologistId && psychologist.clinicId &&
         psychologist.clinicId.toString() === req.user._id.toString());

      if (!patientBelongsToClinic) {
        return res.status(403).json({
          success: false,
          message: 'Paciente não pertence a esta clínica',
        });
      }
    } else {
      // Psicólogo ou Paciente criando agendamento: validar vínculo paciente-psicólogo
      if (!patient.psychologistId || patient.psychologistId.toString() !== psychologistId) {
        return res.status(403).json({
          success: false,
          message: 'Este paciente não está associado a este psicólogo',
        });
      }
    }

    // Validar sala se fornecida
    let validatedRoomId = null;
    if (roomId) {
      const room = await Room.findOne({
        _id: roomId,
        isActive: true,
        deletedAt: null,
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Sala não encontrada ou inativa',
        });
      }

      // Verificar se a sala pertence à clínica do psicólogo
      if (psychologist.clinicId && room.clinicId.toString() !== psychologist.clinicId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Sala não pertence à clínica do psicólogo',
        });
      }

      validatedRoomId = roomId;
    }

    // Verificar se clínica requer sala para consultas presenciais
    if (type === 'in_person' && psychologist.clinicId) {
      const clinic = await Clinic.findById(psychologist.clinicId);
      if (clinic?.settings?.requireRoomForInPerson && !validatedRoomId) {
        return res.status(400).json({
          success: false,
          message: 'Consultas presenciais nesta clínica requerem atribuição de sala',
        });
      }
    }

    // Verificar conflito de horário (psicólogo e sala)
    const conflictResult = await Appointment.checkConflict({
      psychologistId,
      date: appointmentDate,
      duration: duration || 50,
      roomId: validatedRoomId,
    });

    if (conflictResult.hasConflict) {
      return res.status(409).json({
        success: false,
        message: conflictResult.message || 'Já existe um agendamento neste horário',
        conflictType: conflictResult.type,
      });
    }

    // Criar agendamento
    const appointment = await Appointment.create({
      patientId,
      psychologistId,
      clinicId: psychologist.clinicId || null,
      roomId: validatedRoomId,
      date: appointmentDate,
      duration: duration || 50,
      type: type || 'online',
      notes,
      status: 'scheduled',
    });

    // Popular dados relacionados
    await appointment.populate([
      { path: 'patientId', select: 'name email phone' },
      { path: 'psychologistId', select: 'name email crp' },
      { path: 'roomId', select: 'name number' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Agendamento criado com sucesso',
      data: appointment,
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar agendamento',
      error: error.message,
    });
  }
};

/**
 * Obter agendamento
 * @route GET /api/appointments/:id
 * @access Private (Patient, Psychologist)
 */
exports.getAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do agendamento inválido',
      });
    }

    // Buscar agendamento
    const appointment = await Appointment.findById(id)
      .notDeleted()
      .populate('patientId', 'name email phone avatar')
      .populate('psychologistId', 'name email phone crp specialties avatar')
      .populate('roomId', 'name number description');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agendamento encontrado com sucesso',
      data: appointment,
    });
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar agendamento',
      error: error.message,
    });
  }
};

/**
 * Atualizar agendamento
 * @route PUT /api/appointments/:id
 * @access Private (Patient, Psychologist, Clinic)
 */
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, duration, type, notes, status, roomId } = req.body;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do agendamento inválido',
      });
    }

    // Validar roomId se fornecido
    if (roomId !== undefined && roomId !== null && !isValidObjectId(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'ID da sala inválido',
      });
    }

    // Buscar agendamento
    const appointment = await Appointment.findById(id).notDeleted();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado',
      });
    }

    // Não permitir atualização de agendamentos já completados ou cancelados
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível atualizar agendamentos completados ou cancelados',
      });
    }

    // Validar sala se fornecida
    let validatedRoomId = appointment.roomId;
    if (roomId !== undefined) {
      if (roomId === null) {
        validatedRoomId = null;
      } else {
        const room = await Room.findOne({
          _id: roomId,
          isActive: true,
          deletedAt: null,
        });

        if (!room) {
          return res.status(404).json({
            success: false,
            message: 'Sala não encontrada ou inativa',
          });
        }

        // Verificar se a sala pertence à clínica do agendamento
        if (appointment.clinicId && room.clinicId.toString() !== appointment.clinicId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Sala não pertence à clínica do agendamento',
          });
        }

        validatedRoomId = roomId;
      }
    }

    // Atualizar campos permitidos
    const newDate = date ? new Date(date) : appointment.date;
    const newDuration = duration || appointment.duration;

    if (date) {
      // Validar data (deve ser no futuro)
      if (newDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Data do agendamento deve ser no futuro',
        });
      }
    }

    // Verificar conflito de horário (excluindo o agendamento atual)
    // Verifica se mudou data, duração ou sala
    if (date || duration || roomId !== undefined) {
      const conflictResult = await Appointment.checkConflict({
        psychologistId: appointment.psychologistId,
        date: newDate,
        duration: newDuration,
        roomId: validatedRoomId,
        excludeId: appointment._id,
      });

      if (conflictResult.hasConflict) {
        return res.status(409).json({
          success: false,
          message: conflictResult.message || 'Já existe um agendamento neste horário',
          conflictType: conflictResult.type,
        });
      }
    }

    if (date) appointment.date = newDate;
    if (duration) appointment.duration = duration;
    if (type) appointment.type = type;
    if (notes !== undefined) appointment.notes = notes;
    if (roomId !== undefined) appointment.roomId = validatedRoomId;
    if (status) {
      // Validar status
      const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido',
        });
      }
      appointment.status = status;
    }

    await appointment.save();

    // Popular dados relacionados
    await appointment.populate([
      { path: 'patientId', select: 'name email phone' },
      { path: 'psychologistId', select: 'name email crp' },
      { path: 'roomId', select: 'name number' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Agendamento atualizado com sucesso',
      data: appointment,
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar agendamento',
      error: error.message,
    });
  }
};

/**
 * Cancelar agendamento
 * @route DELETE /api/appointments/:id
 * @access Private (Patient, Psychologist, Clinic)
 */
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelledBy, reason } = req.body;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do agendamento inválido',
      });
    }

    // Validar campos obrigatórios
    if (!cancelledBy) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, informe quem está cancelando',
      });
    }

    // Validar cancelledBy
    const validCancelledBy = ['patient', 'psychologist', 'clinic'];
    if (!validCancelledBy.includes(cancelledBy)) {
      return res.status(400).json({
        success: false,
        message: 'Valor inválido para cancelledBy',
      });
    }

    // Buscar agendamento
    const appointment = await Appointment.findById(id).notDeleted();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Agendamento não encontrado',
      });
    }

    // Não permitir cancelamento de agendamentos já completados
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível cancelar agendamentos completados',
      });
    }

    // Não permitir cancelamento de agendamentos já cancelados
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Este agendamento já está cancelado',
      });
    }

    // Cancelar agendamento
    await appointment.cancel(cancelledBy, reason);

    res.status(200).json({
      success: true,
      message: 'Agendamento cancelado com sucesso',
      data: appointment,
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar agendamento',
      error: error.message,
    });
  }
};

/**
 * Obter agendamentos do psicólogo
 * @route GET /api/appointments/psychologist/:psychologistId
 * @access Private (Psychologist)
 */
exports.getPsychologistAppointments = async (req, res) => {
  try {
    const { psychologistId } = req.params;
    const { page = 1, limit = 10, status = '', startDate = '', endDate = '' } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(psychologistId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do psicólogo inválido',
      });
    }

    // Verificar se psicólogo existe
    const psychologist = await Psychologist.findById(psychologistId).notDeleted();
    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    // Construir query
    const query = { psychologistId };

    if (status) {
      query.status = status;
    }

    // Filtrar por data
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Buscar agendamentos com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const appointments = await Appointment.find(query)
      .notDeleted()
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('patientId', 'name email phone avatar');

    const total = await Appointment.countDocuments({ ...query, deletedAt: null });

    res.status(200).json({
      success: true,
      message: 'Agendamentos encontrados com sucesso',
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar agendamentos',
      error: error.message,
    });
  }
};

/**
 * Obter agendamentos do paciente
 * @route GET /api/appointments/patient/:patientId
 * @access Private (Patient)
 */
exports.getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status = '', startDate = '', endDate = '' } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    // Verificar se paciente existe
    const patient = await Patient.findById(patientId).notDeleted();
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    // Construir query
    const query = { patientId };

    if (status) {
      query.status = status;
    }

    // Filtrar por data
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Buscar agendamentos com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const appointments = await Appointment.find(query)
      .notDeleted()
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('psychologistId', 'name email phone crp specialties avatar');

    const total = await Appointment.countDocuments({ ...query, deletedAt: null });

    res.status(200).json({
      success: true,
      message: 'Agendamentos encontrados com sucesso',
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar agendamentos',
      error: error.message,
    });
  }
};
