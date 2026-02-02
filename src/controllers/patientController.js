const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Document = require('../models/Document');
const { deleteFromFirebase } = require('../config/firebase');
const { isValidObjectId } = require('../utils/validator');

/**
 * Obter dados do paciente
 * @route GET /api/patients/:id
 * @access Private (Patient, Psychologist)
 */
exports.getPatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    // Buscar paciente
    const patient = await Patient.findById(id)
      .notDeleted()
      .populate('psychologistId', 'name email phone crp specialties');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Paciente encontrado com sucesso',
      data: patient,
    });
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar paciente',
      error: error.message,
    });
  }
};

/**
 * Atualizar dados do paciente
 * @route PUT /api/patients/:id
 * @access Private (Patient)
 */
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, birthDate, emergencyContact } = req.body;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    // Buscar paciente
    const patient = await Patient.findById(id).notDeleted();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    // Atualizar campos permitidos
    if (name) patient.name = name;
    if (phone) patient.phone = phone;
    if (birthDate) patient.birthDate = birthDate;
    if (emergencyContact) {
      patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
    }

    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Paciente atualizado com sucesso',
      data: patient,
    });
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar paciente',
      error: error.message,
    });
  }
};

/**
 * Upload de avatar do paciente
 * @route POST /api/patients/:id/avatar
 * @access Private (Patient)
 */
exports.uploadAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    if (!req.body.avatar) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado',
      });
    }

    const patient = await Patient.findById(id).notDeleted();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    // Deletar avatar antigo do Firebase se existir
    if (patient.avatar) {
      await deleteFromFirebase(patient.avatar);
    }

    // URL já foi gerada pelo middleware handleAvatarUpload
    patient.avatar = req.body.avatar;
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Avatar atualizado com sucesso',
      data: {
        avatar: patient.avatar,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload do avatar',
      error: error.message,
    });
  }
};

/**
 * Obter agendamentos do paciente
 * @route GET /api/patients/:id/appointments
 * @access Private (Patient)
 */
exports.getAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status = '', startDate = '', endDate = '' } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    // Verificar se paciente existe
    const patient = await Patient.findById(id).notDeleted();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    // Construir query
    const query = { patientId: id };

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

/**
 * Obter documentos do paciente
 * @route GET /api/patients/:id/documents
 * @access Private (Patient, Psychologist)
 */
exports.getDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type = '' } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    // Verificar se paciente existe
    const patient = await Patient.findById(id).notDeleted();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    // Construir query
    const query = { patientId: id };

    if (type) {
      query.type = type;
    }

    // Buscar documentos com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const documents = await Document.find(query)
      .notDeleted()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('psychologistId', 'name crp')
      .select('-pdfFile'); // Não retornar PDF na listagem

    const total = await Document.countDocuments({ ...query, deletedAt: null });

    res.status(200).json({
      success: true,
      message: 'Documentos encontrados com sucesso',
      data: {
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar documentos',
      error: error.message,
    });
  }
};
