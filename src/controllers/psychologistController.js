const Psychologist = require('../models/Psychologist');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { processImageUpload, validateFileSize } = require('../utils/fileHelper');
const { uploadToFirebase, deleteFromFirebase } = require('../config/firebase');
const { isValidObjectId } = require('../utils/validator');

/**
 * Obter dados do psicólogo
 * @route GET /api/psychologists/:id
 * @access Private (Psychologist, Clinic)
 */
exports.getPsychologist = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do psicólogo inválido',
      });
    }

    // Buscar psicólogo
    const psychologist = await Psychologist.findById(id)
      .notDeleted()
      .populate('clinicId', 'name email phone');

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Psicólogo encontrado com sucesso',
      data: psychologist,
    });
  } catch (error) {
    console.error('Erro ao buscar psicólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar psicólogo',
      error: error.message,
    });
  }
};

/**
 * Atualizar dados do psicólogo
 * @route PUT /api/psychologists/:id
 * @access Private (Psychologist)
 */
exports.updatePsychologist = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, specialties } = req.body;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do psicólogo inválido',
      });
    }

    // Buscar psicólogo
    const psychologist = await Psychologist.findById(id).notDeleted();

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    // Atualizar campos permitidos
    if (name) psychologist.name = name;
    if (phone) psychologist.phone = phone;
    if (specialties && Array.isArray(specialties)) {
      psychologist.specialties = specialties;
    }

    await psychologist.save();

    res.status(200).json({
      success: true,
      message: 'Psicólogo atualizado com sucesso',
      data: psychologist,
    });
  } catch (error) {
    console.error('Erro ao atualizar psicólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar psicólogo',
      error: error.message,
    });
  }
};

/**
 * Upload de avatar do psicólogo
 * @route POST /api/psychologists/:id/avatar
 * @access Private (Psychologist)
 */
exports.uploadAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do psicólogo inválido',
      });
    }

    // Validar arquivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado',
      });
    }

    // Validar tamanho do arquivo (5MB)
    if (!validateFileSize(req.file.buffer, 5 * 1024 * 1024)) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho máximo: 5MB',
      });
    }

    // Buscar psicólogo
    const psychologist = await Psychologist.findById(id).notDeleted();

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    // Deletar avatar antigo do Firebase se existir
    if (psychologist.avatar) {
      await deleteFromFirebase(psychologist.avatar);
    }

    // Processar e fazer upload do avatar
    const { buffer, mimetype } = await processImageUpload(req.file.buffer, req.file.mimetype, 'avatar');
    const ext = mimetype === 'image/png' ? 'png' : 'jpg';
    const filePath = `avatars/psychologists/${id}_${Date.now()}.${ext}`;
    const avatarUrl = await uploadToFirebase(buffer, filePath, mimetype);
    psychologist.avatar = avatarUrl;

    await psychologist.save();

    res.status(200).json({
      success: true,
      message: 'Avatar atualizado com sucesso',
      data: {
        avatar: psychologist.avatar,
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
 * Obter pacientes do psicólogo
 * @route GET /api/psychologists/:id/patients
 * @access Private (Psychologist)
 */
exports.getPatients = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do psicólogo inválido',
      });
    }

    // Verificar se psicólogo existe
    const psychologist = await Psychologist.findById(id).notDeleted();

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    // Construir query
    const query = { psychologistId: id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { cpf: { $regex: search, $options: 'i' } },
      ];
    }

    // Buscar pacientes com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const patients = await Patient.find(query)
      .notDeleted()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const total = await Patient.countDocuments({ ...query, deletedAt: null });

    res.status(200).json({
      success: true,
      message: 'Pacientes encontrados com sucesso',
      data: {
        patients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pacientes',
      error: error.message,
    });
  }
};

/**
 * Obter agendamentos do psicólogo
 * @route GET /api/psychologists/:id/appointments
 * @access Private (Psychologist)
 */
exports.getAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status = '', startDate = '', endDate = '' } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do psicólogo inválido',
      });
    }

    // Verificar se psicólogo existe
    const psychologist = await Psychologist.findById(id).notDeleted();

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    // Construir query
    const query = { psychologistId: id };

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
