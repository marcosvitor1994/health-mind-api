const Clinic = require('../models/Clinic');
const Psychologist = require('../models/Psychologist');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { processImageUpload, validateFileSize } = require('../utils/fileHelper');
const { uploadToFirebase, deleteFromFirebase } = require('../config/firebase');
const { isValidObjectId } = require('../utils/validator');
const occupancyService = require('../services/occupancyService');
const paymentService = require('../services/paymentService');

/**
 * Obter dados da clínica
 * @route GET /api/clinics/:id
 * @access Private (Clinic)
 */
exports.getClinic = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica inválido',
      });
    }

    // Buscar clínica
    const clinic = await Clinic.findById(id).notDeleted();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Clínica encontrada com sucesso',
      data: clinic,
    });
  } catch (error) {
    console.error('Erro ao buscar clínica:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar clínica',
      error: error.message,
    });
  }
};

/**
 * Atualizar dados da clínica
 * @route PUT /api/clinics/:id
 * @access Private (Clinic)
 */
exports.updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica inválido',
      });
    }

    // Buscar clínica
    const clinic = await Clinic.findById(id).notDeleted();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    // Atualizar campos permitidos
    if (name) clinic.name = name;
    if (phone) clinic.phone = phone;
    if (address) clinic.address = { ...clinic.address, ...address };

    await clinic.save();

    res.status(200).json({
      success: true,
      message: 'Clínica atualizada com sucesso',
      data: clinic,
    });
  } catch (error) {
    console.error('Erro ao atualizar clínica:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar clínica',
      error: error.message,
    });
  }
};

/**
 * Upload de logo da clínica
 * @route POST /api/clinics/:id/logo
 * @access Private (Clinic)
 */
exports.uploadLogo = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica inválido',
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

    // Buscar clínica
    const clinic = await Clinic.findById(id).notDeleted();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    // Deletar logo antigo do Firebase se existir
    if (clinic.logo) {
      await deleteFromFirebase(clinic.logo);
    }

    // Processar e fazer upload do logo
    const { buffer, mimetype } = await processImageUpload(req.file.buffer, req.file.mimetype, 'logo');
    const filePath = `logos/${id}_${Date.now()}.png`;
    const logoUrl = await uploadToFirebase(buffer, filePath, mimetype);
    clinic.logo = logoUrl;

    await clinic.save();

    res.status(200).json({
      success: true,
      message: 'Logo atualizado com sucesso',
      data: {
        logo: clinic.logo,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer upload do logo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload do logo',
      error: error.message,
    });
  }
};

/**
 * Obter psicólogos da clínica
 * @route GET /api/clinics/:id/psychologists
 * @access Private (Clinic)
 */
exports.getPsychologists = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica inválido',
      });
    }

    // Verificar se clínica existe
    const clinic = await Clinic.findById(id).notDeleted();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    // Construir query
    const query = { clinicId: id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { crp: { $regex: search, $options: 'i' } },
      ];
    }

    // Buscar psicólogos com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const psychologists = await Psychologist.find(query)
      .notDeleted()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Psychologist.countDocuments({ ...query, deletedAt: null });

    // Adicionar contagem de pacientes e próxima consulta para cada psicólogo
    const Patient = require('../models/Patient');
    const Appointment = require('../models/Appointment');

    const psychologistsWithStats = await Promise.all(
      psychologists.map(async (psy) => {
        const psychologistObj = psy.toObject();

        // Contar pacientes
        const patientCount = await Patient.countDocuments({
          psychologistId: psy._id,
          deletedAt: null,
        });

        // Buscar próxima consulta (hoje ou futura)
        const now = new Date();
        const nextAppointment = await Appointment.findOne({
          psychologistId: psy._id,
          dateTime: { $gte: now },
          status: { $in: ['scheduled', 'confirmed'] },
        })
          .sort({ dateTime: 1 })
          .select('dateTime');

        return {
          ...psychologistObj,
          patientCount,
          nextAppointment: nextAppointment?.dateTime,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Psicólogos encontrados com sucesso',
      data: {
        psychologists: psychologistsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar psicólogos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar psicólogos',
      error: error.message,
    });
  }
};

/**
 * Vincular psicólogo à clínica
 * @route POST /api/clinics/:clinicId/psychologists/:psychologistId/link
 * @access Private (Clinic)
 */
exports.linkPsychologist = async (req, res) => {
  try {
    const { clinicId, psychologistId } = req.params;

    // Validar ObjectIds
    if (!isValidObjectId(clinicId) || !isValidObjectId(psychologistId)) {
      return res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
    }

    // Verificar se clínica existe
    const clinic = await Clinic.findById(clinicId).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
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

    // Verificar se psicólogo já está vinculado a outra clínica
    if (psychologist.clinicId && psychologist.clinicId.toString() !== clinicId) {
      return res.status(400).json({
        success: false,
        message: 'Psicólogo já está vinculado a outra clínica',
      });
    }

    // Vincular psicólogo à clínica
    psychologist.clinicId = clinicId;
    await psychologist.save();

    res.status(200).json({
      success: true,
      message: 'Psicólogo vinculado à clínica com sucesso',
      data: psychologist,
    });
  } catch (error) {
    console.error('Erro ao vincular psicólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao vincular psicólogo',
      error: error.message,
    });
  }
};

/**
 * Desvincular psicólogo da clínica
 * @route POST /api/clinics/:clinicId/psychologists/:psychologistId/unlink
 * @access Private (Clinic)
 */
exports.unlinkPsychologist = async (req, res) => {
  try {
    const { clinicId, psychologistId } = req.params;

    // Validar ObjectIds
    if (!isValidObjectId(clinicId) || !isValidObjectId(psychologistId)) {
      return res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
    }

    // Verificar se clínica existe
    const clinic = await Clinic.findById(clinicId).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
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

    // Verificar se psicólogo pertence a esta clínica
    if (!psychologist.clinicId || psychologist.clinicId.toString() !== clinicId) {
      return res.status(400).json({
        success: false,
        message: 'Psicólogo não está vinculado a esta clínica',
      });
    }

    // Desvincular psicólogo da clínica
    psychologist.clinicId = null;
    await psychologist.save();

    // Desvincular todos os pacientes deste psicólogo que estão vinculados à clínica
    await Patient.updateMany(
      { psychologistId: psychologistId, clinicId: clinicId },
      { $set: { psychologistId: null } }
    );

    res.status(200).json({
      success: true,
      message: 'Psicólogo desvinculado da clínica com sucesso. Pacientes vinculados a este psicólogo foram desvinculados.',
      data: psychologist,
    });
  } catch (error) {
    console.error('Erro ao desvincular psicólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desvincular psicólogo',
      error: error.message,
    });
  }
};

/**
 * Vincular paciente à clínica
 * @route POST /api/clinics/:clinicId/patients/:patientId/link
 * @access Private (Clinic)
 */
exports.linkPatient = async (req, res) => {
  try {
    const { clinicId, patientId } = req.params;

    // Validar ObjectIds
    if (!isValidObjectId(clinicId) || !isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
    }

    // Verificar se clínica existe
    const clinic = await Clinic.findById(clinicId).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
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

    // Verificar se paciente já está vinculado a outra clínica
    if (patient.clinicId && patient.clinicId.toString() !== clinicId) {
      return res.status(400).json({
        success: false,
        message: 'Paciente já está vinculado a outra clínica',
      });
    }

    // Vincular paciente à clínica
    patient.clinicId = clinicId;
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Paciente vinculado à clínica com sucesso',
      data: patient,
    });
  } catch (error) {
    console.error('Erro ao vincular paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao vincular paciente',
      error: error.message,
    });
  }
};

/**
 * Desvincular paciente da clínica
 * @route POST /api/clinics/:clinicId/patients/:patientId/unlink
 * @access Private (Clinic)
 */
exports.unlinkPatient = async (req, res) => {
  try {
    const { clinicId, patientId } = req.params;

    // Validar ObjectIds
    if (!isValidObjectId(clinicId) || !isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
    }

    // Verificar se clínica existe
    const clinic = await Clinic.findById(clinicId).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
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

    // Verificar se paciente pertence a esta clínica
    if (!patient.clinicId || patient.clinicId.toString() !== clinicId) {
      return res.status(400).json({
        success: false,
        message: 'Paciente não está vinculado a esta clínica',
      });
    }

    // Desvincular paciente da clínica
    patient.clinicId = null;
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Paciente desvinculado da clínica com sucesso',
      data: patient,
    });
  } catch (error) {
    console.error('Erro ao desvincular paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desvincular paciente',
      error: error.message,
    });
  }
};

/**
 * Atribuir paciente a um psicólogo
 * @route PUT /api/clinics/:clinicId/patients/:patientId/assign-psychologist
 * @access Private (Clinic)
 */
exports.assignPsychologistToPatient = async (req, res) => {
  try {
    const { clinicId, patientId } = req.params;
    const { psychologistId } = req.body;

    // Validar ObjectIds
    if (!isValidObjectId(clinicId) || !isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
    }

    // Se psychologistId foi fornecido, validar
    if (psychologistId && !isValidObjectId(psychologistId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do psicólogo inválido',
      });
    }

    // Verificar se clínica existe
    const clinic = await Clinic.findById(clinicId).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    // Verificar se paciente existe e está vinculado à clínica
    const patient = await Patient.findById(patientId).notDeleted();
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    if (!patient.clinicId || patient.clinicId.toString() !== clinicId) {
      return res.status(400).json({
        success: false,
        message: 'Paciente não está vinculado a esta clínica',
      });
    }

    // Se psychologistId foi fornecido, verificar se existe e está vinculado à clínica
    if (psychologistId) {
      const psychologist = await Psychologist.findById(psychologistId).notDeleted();
      if (!psychologist) {
        return res.status(404).json({
          success: false,
          message: 'Psicólogo não encontrado',
        });
      }

      if (!psychologist.clinicId || psychologist.clinicId.toString() !== clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Psicólogo não está vinculado a esta clínica',
        });
      }

      patient.psychologistId = psychologistId;
    } else {
      // Se psychologistId não foi fornecido, desvincular
      patient.psychologistId = null;
    }

    await patient.save();

    // Popular dados relacionados
    await patient.populate([
      { path: 'psychologistId', select: 'name email crp' },
      { path: 'clinicId', select: 'name email' },
    ]);

    res.status(200).json({
      success: true,
      message: psychologistId
        ? 'Psicólogo atribuído ao paciente com sucesso'
        : 'Paciente desvinculado do psicólogo com sucesso',
      data: patient,
    });
  } catch (error) {
    console.error('Erro ao atribuir psicólogo ao paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atribuir psicólogo ao paciente',
      error: error.message,
    });
  }
};

/**
 * Obter pacientes da clínica
 * @route GET /api/clinics/:id/patients
 * @access Private (Clinic)
 */
exports.getPatients = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search = '', psychologistId = '' } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica inválido',
      });
    }

    // Verificar se clínica existe
    const clinic = await Clinic.findById(id).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    // Construir query
    const query = { clinicId: id };

    // Filtrar por psicólogo se fornecido
    if (psychologistId) {
      if (!isValidObjectId(psychologistId)) {
        return res.status(400).json({
          success: false,
          message: 'ID do psicólogo inválido',
        });
      }
      query.psychologistId = psychologistId;
    }

    // Busca por nome ou email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Buscar pacientes com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const patients = await Patient.find(query)
      .notDeleted()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('psychologistId', 'name email crp');

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
 * Obter estatísticas da clínica
 * @route GET /api/clinics/:id/stats
 * @access Private (Clinic)
 */
exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica inválido',
      });
    }

    // Verificar se clínica existe
    const clinic = await Clinic.findById(id).notDeleted();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    // Contar psicólogos
    const totalPsychologists = await Psychologist.countDocuments({
      clinicId: id,
      deletedAt: null,
    });

    // Buscar IDs dos psicólogos da clínica
    const psychologists = await Psychologist.find({ clinicId: id, deletedAt: null }).select('_id');
    const psychologistIds = psychologists.map((p) => p._id);

    // Contar pacientes
    const totalPatients = await Patient.countDocuments({
      psychologistId: { $in: psychologistIds },
      deletedAt: null,
    });

    // Contar agendamentos
    const totalAppointments = await Appointment.countDocuments({
      psychologistId: { $in: psychologistIds },
      deletedAt: null,
    });

    // Agendamentos por status
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $match: {
          psychologistId: { $in: psychologistIds },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Agendamentos do mês atual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const appointmentsThisMonth = await Appointment.countDocuments({
      psychologistId: { $in: psychologistIds },
      deletedAt: null,
      createdAt: { $gte: currentMonth },
    });

    // Agendamentos de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentsToday = await Appointment.countDocuments({
      psychologistId: { $in: psychologistIds },
      deletedAt: null,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'confirmed'] },
    });

    // Calcular taxa de ocupação do mês atual
    let occupancyRate = 0;
    try {
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const occupancy = await occupancyService.calculateOccupancyRate({
        entityType: 'clinic',
        entityId: id,
        startDate: currentMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
      });
      occupancyRate = occupancy.occupancyRate;
    } catch (occupancyError) {
      console.error('Erro ao calcular taxa de ocupação:', occupancyError);
      // Continua com occupancyRate = 0 se houver erro
    }

    res.status(200).json({
      success: true,
      message: 'Estatísticas obtidas com sucesso',
      data: {
        totalPsychologists,
        totalPatients,
        totalAppointments,
        appointmentsThisMonth,
        appointmentsToday,
        occupancyRate,
        appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas',
      error: error.message,
    });
  }
};

/**
 * Obter resumo financeiro da clínica
 * @route GET /api/clinics/:id/financial-summary
 * @access Private (Clinic)
 */
exports.getFinancialSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica inválido',
      });
    }

    // Verificar datas obrigatórias
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data inicial e final são obrigatórias',
      });
    }

    // Verificar se clínica existe
    const clinic = await Clinic.findById(id).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    const summary = await paymentService.getClinicFinancialSummary(id, startDate, endDate);

    res.status(200).json({
      success: true,
      message: 'Resumo financeiro obtido com sucesso',
      data: summary,
    });
  } catch (error) {
    console.error('Erro ao obter resumo financeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter resumo financeiro',
      error: error.message,
    });
  }
};

/**
 * Atualizar configurações de pagamento da clínica
 * @route PUT /api/clinics/:id/payment-settings
 * @access Private (Clinic)
 */
exports.updatePaymentSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      defaultSessionValue,
      clinicPercentage,
      acceptsHealthInsurance,
      acceptedHealthInsurances,
      defaultPaymentDueDays,
      acceptedPaymentMethods,
      bankInfo,
    } = req.body;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica inválido',
      });
    }

    // Buscar clínica
    const clinic = await Clinic.findById(id).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    // Atualizar configurações de pagamento
    if (!clinic.paymentSettings) {
      clinic.paymentSettings = {};
    }

    if (defaultSessionValue !== undefined) {
      clinic.paymentSettings.defaultSessionValue = defaultSessionValue;
    }
    if (clinicPercentage !== undefined) {
      clinic.paymentSettings.clinicPercentage = clinicPercentage;
    }
    if (acceptsHealthInsurance !== undefined) {
      clinic.paymentSettings.acceptsHealthInsurance = acceptsHealthInsurance;
    }
    if (acceptedHealthInsurances !== undefined) {
      clinic.paymentSettings.acceptedHealthInsurances = acceptedHealthInsurances;
    }
    if (defaultPaymentDueDays !== undefined) {
      clinic.paymentSettings.defaultPaymentDueDays = defaultPaymentDueDays;
    }
    if (acceptedPaymentMethods !== undefined) {
      clinic.paymentSettings.acceptedPaymentMethods = acceptedPaymentMethods;
    }
    if (bankInfo !== undefined) {
      clinic.paymentSettings.bankInfo = { ...clinic.paymentSettings.bankInfo, ...bankInfo };
    }

    await clinic.save();

    res.status(200).json({
      success: true,
      message: 'Configurações de pagamento atualizadas com sucesso',
      data: clinic.paymentSettings,
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações de pagamento',
      error: error.message,
    });
  }
};

/**
 * Obter configurações de pagamento da clínica
 * @route GET /api/clinics/:id/payment-settings
 * @access Private (Clinic)
 */
exports.getPaymentSettings = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da clínica inválido',
      });
    }

    // Buscar clínica
    const clinic = await Clinic.findById(id).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Configurações de pagamento obtidas com sucesso',
      data: clinic.paymentSettings || {},
    });
  } catch (error) {
    console.error('Erro ao obter configurações de pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter configurações de pagamento',
      error: error.message,
    });
  }
};
