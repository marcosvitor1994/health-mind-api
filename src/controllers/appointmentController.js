const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Psychologist = require('../models/Psychologist');
const { isValidObjectId } = require('../utils/validator');

/**
 * Criar agendamento
 * @route POST /api/appointments
 * @access Private (Patient, Psychologist)
 */
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, psychologistId, date, duration, type, notes } = req.body;

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

    // Verificar se o paciente pertence ao psicólogo
    if (patient.psychologistId.toString() !== psychologistId) {
      return res.status(403).json({
        success: false,
        message: 'Este paciente não está associado a este psicólogo',
      });
    }

    // Verificar conflito de horário
    const hasConflict = await Appointment.checkConflict(
      psychologistId,
      appointmentDate,
      duration || 50
    );

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um agendamento neste horário',
      });
    }

    // Criar agendamento
    const appointment = await Appointment.create({
      patientId,
      psychologistId,
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
      .populate('psychologistId', 'name email phone crp specialties avatar');

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
 * @access Private (Patient, Psychologist)
 */
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, duration, type, notes, status } = req.body;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do agendamento inválido',
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

    // Atualizar campos permitidos
    if (date) {
      const newDate = new Date(date);

      // Validar data (deve ser no futuro)
      if (newDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Data do agendamento deve ser no futuro',
        });
      }

      // Verificar conflito de horário (excluindo o agendamento atual)
      const hasConflict = await Appointment.checkConflict(
        appointment.psychologistId,
        newDate,
        duration || appointment.duration,
        appointment._id
      );

      if (hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'Já existe um agendamento neste horário',
        });
      }

      appointment.date = newDate;
    }

    if (duration) appointment.duration = duration;
    if (type) appointment.type = type;
    if (notes !== undefined) appointment.notes = notes;
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
 * @access Private (Patient, Psychologist)
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
