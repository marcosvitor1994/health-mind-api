const Admin = require('../models/Admin');
const Clinic = require('../models/Clinic');
const Psychologist = require('../models/Psychologist');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { isValidObjectId } = require('../utils/validator');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

/**
 * Obter estatísticas do dashboard
 * @route GET /api/admin/dashboard/stats
 * @access Private (Admin)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Contagens totais
    const [totalClinics, totalPsychologists, totalPatients, totalAdmins] = await Promise.all([
      Clinic.countDocuments({ deletedAt: null }),
      Psychologist.countDocuments({ deletedAt: null }),
      Patient.countDocuments({ deletedAt: null }),
      Admin.countDocuments({ deletedAt: null }),
    ]);

    // Usuários ativos (logaram nos últimos 30 dias) - baseado em updatedAt como proxy
    const [activeClinics, activePsychologists, activePatients] = await Promise.all([
      Clinic.countDocuments({ deletedAt: null, updatedAt: { $gte: thirtyDaysAgo } }),
      Psychologist.countDocuments({ deletedAt: null, updatedAt: { $gte: thirtyDaysAgo } }),
      Patient.countDocuments({ deletedAt: null, updatedAt: { $gte: thirtyDaysAgo } }),
    ]);

    // Novos usuários este mês
    const [newClinicsThisMonth, newPsychologistsThisMonth, newPatientsThisMonth] = await Promise.all([
      Clinic.countDocuments({ deletedAt: null, createdAt: { $gte: startOfMonth } }),
      Psychologist.countDocuments({ deletedAt: null, createdAt: { $gte: startOfMonth } }),
      Patient.countDocuments({ deletedAt: null, createdAt: { $gte: startOfMonth } }),
    ]);

    // Consultas este mês
    const appointmentsThisMonth = await Appointment.countDocuments({
      deletedAt: null,
      dateTime: { $gte: startOfMonth },
    });

    res.status(200).json({
      success: true,
      data: {
        totals: {
          clinics: totalClinics,
          psychologists: totalPsychologists,
          patients: totalPatients,
          admins: totalAdmins,
        },
        activeUsers: {
          clinics: activeClinics,
          psychologists: activePsychologists,
          patients: activePatients,
          total: activeClinics + activePsychologists + activePatients,
        },
        newThisMonth: {
          clinics: newClinicsThisMonth,
          psychologists: newPsychologistsThisMonth,
          patients: newPatientsThisMonth,
          total: newClinicsThisMonth + newPsychologistsThisMonth + newPatientsThisMonth,
        },
        appointmentsThisMonth,
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
 * Listar todas as clínicas
 * @route GET /api/admin/clinics
 * @access Private (Admin)
 */
exports.listClinics = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', includeDeleted = 'false' } = req.query;

    const query = {};

    // Filtrar deletados
    if (includeDeleted !== 'true') {
      query.deletedAt = null;
    }

    // Busca por nome ou email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clinics, total] = await Promise.all([
      Clinic.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Clinic.countDocuments(query),
    ]);

    // Buscar contagens de psicólogos e pacientes para cada clínica
    const clinicsWithStats = await Promise.all(
      clinics.map(async (clinic) => {
        const [psychologistsCount, patientsCount] = await Promise.all([
          Psychologist.countDocuments({ clinicId: clinic._id, deletedAt: null }),
          Patient.countDocuments({ clinicId: clinic._id, deletedAt: null }),
        ]);

        return {
          ...clinic.toObject(),
          psychologistsCount,
          patientsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        clinics: clinicsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao listar clínicas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar clínicas',
      error: error.message,
    });
  }
};

/**
 * Obter detalhes de uma clínica
 * @route GET /api/admin/clinics/:id
 * @access Private (Admin)
 */
exports.getClinic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const clinic = await Clinic.findById(id).select('-password');

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    // Buscar estatísticas
    const [psychologistsCount, patientsCount, appointmentsCount] = await Promise.all([
      Psychologist.countDocuments({ clinicId: id, deletedAt: null }),
      Patient.countDocuments({ clinicId: id, deletedAt: null }),
      Appointment.countDocuments({ clinicId: id, deletedAt: null }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...clinic.toObject(),
        stats: {
          psychologistsCount,
          patientsCount,
          appointmentsCount,
        },
      },
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
 * Atualizar clínica
 * @route PUT /api/admin/clinics/:id
 * @access Private (Admin)
 */
exports.updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const clinic = await Clinic.findById(id);

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    if (name) clinic.name = name;
    if (phone) clinic.phone = phone;
    if (address) clinic.address = address;

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
 * Deletar clínica (soft delete)
 * @route DELETE /api/admin/clinics/:id
 * @access Private (Admin)
 */
exports.deleteClinic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const clinic = await Clinic.findById(id).notDeleted();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    await clinic.softDelete();

    res.status(200).json({
      success: true,
      message: 'Clínica desativada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar clínica:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar clínica',
      error: error.message,
    });
  }
};

/**
 * Restaurar clínica
 * @route POST /api/admin/clinics/:id/restore
 * @access Private (Admin)
 */
exports.restoreClinic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const clinic = await Clinic.findById(id);

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    if (!clinic.deletedAt) {
      return res.status(400).json({
        success: false,
        message: 'Clínica não está desativada',
      });
    }

    clinic.deletedAt = null;
    await clinic.save();

    res.status(200).json({
      success: true,
      message: 'Clínica restaurada com sucesso',
      data: clinic,
    });
  } catch (error) {
    console.error('Erro ao restaurar clínica:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao restaurar clínica',
      error: error.message,
    });
  }
};

/**
 * Listar todos os psicólogos
 * @route GET /api/admin/psychologists
 * @access Private (Admin)
 */
exports.listAllPsychologists = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', includeDeleted = 'false' } = req.query;

    const query = {};

    if (includeDeleted !== 'true') {
      query.deletedAt = null;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [psychologists, total] = await Promise.all([
      Psychologist.find(query)
        .select('-password')
        .populate('clinicId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Psychologist.countDocuments(query),
    ]);

    // Buscar contagem de pacientes para cada psicólogo
    const psychologistsWithStats = await Promise.all(
      psychologists.map(async (psych) => {
        const patientsCount = await Patient.countDocuments({
          psychologistId: psych._id,
          deletedAt: null,
        });

        return {
          ...psych.toObject(),
          patientsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
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
    console.error('Erro ao listar psicólogos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar psicólogos',
      error: error.message,
    });
  }
};

/**
 * Deletar psicólogo (soft delete)
 * @route DELETE /api/admin/psychologists/:id
 * @access Private (Admin)
 */
exports.deletePsychologist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const psychologist = await Psychologist.findById(id).notDeleted();

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    await psychologist.softDelete();

    res.status(200).json({
      success: true,
      message: 'Psicólogo desativado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar psicólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar psicólogo',
      error: error.message,
    });
  }
};

/**
 * Restaurar psicólogo
 * @route POST /api/admin/psychologists/:id/restore
 * @access Private (Admin)
 */
exports.restorePsychologist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const psychologist = await Psychologist.findById(id);

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    if (!psychologist.deletedAt) {
      return res.status(400).json({
        success: false,
        message: 'Psicólogo não está desativado',
      });
    }

    psychologist.deletedAt = null;
    await psychologist.save();

    res.status(200).json({
      success: true,
      message: 'Psicólogo restaurado com sucesso',
      data: psychologist,
    });
  } catch (error) {
    console.error('Erro ao restaurar psicólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao restaurar psicólogo',
      error: error.message,
    });
  }
};

/**
 * Listar todos os pacientes
 * @route GET /api/admin/patients
 * @access Private (Admin)
 */
exports.listAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', includeDeleted = 'false' } = req.query;

    const query = {};

    if (includeDeleted !== 'true') {
      query.deletedAt = null;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .select('-password')
        .populate('psychologistId', 'name')
        .populate('clinicId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Patient.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
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
    console.error('Erro ao listar pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar pacientes',
      error: error.message,
    });
  }
};

/**
 * Deletar paciente (soft delete)
 * @route DELETE /api/admin/patients/:id
 * @access Private (Admin)
 */
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const patient = await Patient.findById(id).notDeleted();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    await patient.softDelete();

    res.status(200).json({
      success: true,
      message: 'Paciente desativado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar paciente',
      error: error.message,
    });
  }
};

/**
 * Restaurar paciente
 * @route POST /api/admin/patients/:id/restore
 * @access Private (Admin)
 */
exports.restorePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    if (!patient.deletedAt) {
      return res.status(400).json({
        success: false,
        message: 'Paciente não está desativado',
      });
    }

    patient.deletedAt = null;
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Paciente restaurado com sucesso',
      data: patient,
    });
  } catch (error) {
    console.error('Erro ao restaurar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao restaurar paciente',
      error: error.message,
    });
  }
};

/**
 * Listar todos os admins
 * @route GET /api/admin/admins
 * @access Private (Admin com permissão promoteAdmin)
 */
exports.listAdmins = async (req, res) => {
  try {
    // Verificar permissão
    if (!req.user.permissions?.promoteAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para gerenciar administradores',
      });
    }

    const { page = 1, limit = 20, includeDeleted = 'false' } = req.query;

    const query = {};

    if (includeDeleted !== 'true') {
      query.deletedAt = null;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admins, total] = await Promise.all([
      Admin.find(query)
        .select('-password')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Admin.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        admins,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao listar admins:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar administradores',
      error: error.message,
    });
  }
};

/**
 * Criar novo admin
 * @route POST /api/admin/admins
 * @access Private (Admin com permissão promoteAdmin)
 */
exports.createAdmin = async (req, res) => {
  try {
    // Verificar permissão
    if (!req.user.permissions?.promoteAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para criar administradores',
      });
    }

    const { name, email, password, phone, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios',
      });
    }

    // Verificar se email já existe
    const emailExists = await Admin.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado',
      });
    }

    const admin = await Admin.create({
      name,
      email,
      password,
      phone,
      permissions: {
        manageUsers: permissions?.manageUsers ?? true,
        manageClinics: permissions?.manageClinics ?? true,
        viewMetrics: permissions?.viewMetrics ?? true,
        promoteAdmin: permissions?.promoteAdmin ?? false,
      },
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Administrador criado com sucesso',
      data: admin,
    });
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar administrador',
      error: error.message,
    });
  }
};

/**
 * Revogar admin (soft delete)
 * @route DELETE /api/admin/admins/:id
 * @access Private (Admin com permissão promoteAdmin)
 */
exports.revokeAdmin = async (req, res) => {
  try {
    // Verificar permissão
    if (!req.user.permissions?.promoteAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para revogar administradores',
      });
    }

    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
    }

    // Não permitir auto-revogação
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Você não pode revogar seu próprio acesso',
      });
    }

    const admin = await Admin.findById(id).notDeleted();

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador não encontrado',
      });
    }

    await admin.softDelete();

    res.status(200).json({
      success: true,
      message: 'Administrador revogado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao revogar admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao revogar administrador',
      error: error.message,
    });
  }
};

/**
 * Obter perfil do admin logado
 * @route GET /api/admin/profile
 * @access Private (Admin)
 */
exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfil',
      error: error.message,
    });
  }
};

/**
 * Atualizar perfil do admin
 * @route PUT /api/admin/profile
 * @access Private (Admin)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const admin = await Admin.findById(req.user._id);

    if (name) admin.name = name;
    if (phone) admin.phone = phone;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: admin,
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil',
      error: error.message,
    });
  }
};
