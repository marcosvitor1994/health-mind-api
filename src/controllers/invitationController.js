const Invitation = require('../models/Invitation');
const Clinic = require('../models/Clinic');
const Psychologist = require('../models/Psychologist');
const Patient = require('../models/Patient');
const { isValidEmail } = require('../utils/validator');
const {
  sendClinicInvitation,
  sendPsychologistInvitation,
  sendPatientInvitation,
} = require('../services/emailService');

/**
 * [ADMIN] Criar convite para clínica
 * @route POST /api/invitations/clinic
 * @access Private (Admin only)
 */
exports.inviteClinic = async (req, res) => {
  try {
    const { email, name, cnpj } = req.body;

    // Validações
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email e nome são obrigatórios',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    // Verificar se já existe usuário com este email
    const existingClinic = await Clinic.findOne({ email });
    if (existingClinic) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma clínica cadastrada com este email',
      });
    }

    // Verificar se já existe convite pendente
    const existingInvitation = await Invitation.findOne({
      email,
      role: 'clinic',
      status: 'pending',
    });

    if (existingInvitation && existingInvitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um convite pendente para este email',
      });
    }

    // Criar convite
    const token = Invitation.generateToken();

    const invitation = await Invitation.create({
      email,
      role: 'clinic',
      token,
      preFilledData: {
        name,
        cnpj: cnpj ? cnpj.replace(/\D/g, '') : undefined,
      },
      invitedBy: {
        userId: req.user._id,
        userModel: 'Admin',
        userName: req.user.name || 'Administrador',
      },
    });

    // Enviar e-mail
    try {
      await sendClinicInvitation(invitation);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
      // Não falhar a requisição se o e-mail falhar
    }

    res.status(201).json({
      success: true,
      message: 'Convite enviado com sucesso',
      data: {
        invitation: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          invitationUrl: invitation.invitationUrl,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao criar convite para clínica:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar convite',
      error: error.message,
    });
  }
};

/**
 * [CLINIC] Criar convite para psicólogo
 * @route POST /api/invitations/psychologist
 * @access Private (Clinic only)
 */
exports.invitePsychologist = async (req, res) => {
  try {
    const { email, name, crp, specialties, phone } = req.body;
    const clinicId = req.user._id;

    // Validações
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email e nome são obrigatórios',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    // Verificar se já existe psicólogo com este email
    const existingPsychologist = await Psychologist.findOne({ email });
    if (existingPsychologist) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um psicólogo cadastrado com este email',
      });
    }

    // Verificar se já existe convite pendente
    const existingInvitation = await Invitation.findOne({
      email,
      role: 'psychologist',
      status: 'pending',
    });

    if (existingInvitation && existingInvitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um convite pendente para este email',
      });
    }

    // Criar convite
    const token = Invitation.generateToken();

    const invitation = await Invitation.create({
      email,
      role: 'psychologist',
      token,
      preFilledData: {
        name,
        clinicId,
        crp,
        specialties: Array.isArray(specialties) ? specialties : [],
        phone,
      },
      invitedBy: {
        userId: clinicId,
        userModel: 'Clinic',
        userName: req.user.name,
      },
    });

    // Enviar e-mail
    try {
      await sendPsychologistInvitation(invitation, req.user.name);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Convite enviado com sucesso',
      data: {
        invitation: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          invitationUrl: invitation.invitationUrl,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao criar convite para psicólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar convite',
      error: error.message,
    });
  }
};

/**
 * [PSYCHOLOGIST/CLINIC] Criar convite para paciente
 * @route POST /api/invitations/patient
 * @access Private (Psychologist, Clinic)
 */
exports.invitePatient = async (req, res) => {
  try {
    const { email, name, phone, birthDate, psychologistId } = req.body;

    // Validações
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email e nome são obrigatórios',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    // Determinar psychologistId
    let finalPsychologistId = psychologistId;

    if (req.user.role === 'psychologist') {
      // Se for psicólogo, usar o próprio ID
      finalPsychologistId = req.user._id;
    } else if (req.user.role === 'clinic') {
      // Se for clínica, psychologistId é obrigatório
      if (!psychologistId) {
        return res.status(400).json({
          success: false,
          message: 'psychologistId é obrigatório quando o convite é feito pela clínica',
        });
      }

      // Verificar se o psicólogo pertence à clínica
      const psychologist = await Psychologist.findById(psychologistId).notDeleted();
      if (!psychologist || psychologist.clinicId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Psicólogo não encontrado ou não pertence a esta clínica',
        });
      }
    }

    // Verificar se já existe paciente com este email
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um paciente cadastrado com este email',
      });
    }

    // Verificar se já existe convite pendente
    const existingInvitation = await Invitation.findOne({
      email,
      role: 'patient',
      status: 'pending',
    });

    if (existingInvitation && existingInvitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um convite pendente para este email',
      });
    }

    // Criar convite
    const token = Invitation.generateToken();

    const invitation = await Invitation.create({
      email,
      role: 'patient',
      token,
      preFilledData: {
        name,
        psychologistId: finalPsychologistId,
        phone,
        birthDate,
      },
      invitedBy: {
        userId: req.user._id,
        userModel: req.user.role === 'clinic' ? 'Clinic' : 'Psychologist',
        userName: req.user.name,
      },
    });

    // Buscar nome do psicólogo para o e-mail
    const psychologist = await Psychologist.findById(finalPsychologistId);

    // Enviar e-mail
    try {
      await sendPatientInvitation(invitation, psychologist?.name || 'Seu psicólogo');
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Convite enviado com sucesso',
      data: {
        invitation: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          invitationUrl: invitation.invitationUrl,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao criar convite para paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar convite',
      error: error.message,
    });
  }
};

/**
 * Validar token de convite
 * @route GET /api/invitations/validate/:token
 * @access Public
 */
exports.validateInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Convite não encontrado',
      });
    }

    if (!invitation.isValid()) {
      return res.status(400).json({
        success: false,
        message: invitation.isExpired() ? 'Este convite expirou' : 'Convite já foi utilizado',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        preFilledData: invitation.preFilledData,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Erro ao validar convite:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar convite',
      error: error.message,
    });
  }
};

/**
 * Listar convites enviados
 * @route GET /api/invitations
 * @access Private (Clinic, Psychologist, Admin)
 */
exports.listInvitations = async (req, res) => {
  try {
    const { status, role } = req.query;

    const query = {
      'invitedBy.userId': req.user._id,
    };

    if (status) {
      query.status = status;
    }

    if (role) {
      query.role = role;
    }

    const invitations = await Invitation.find(query)
      .sort({ createdAt: -1 })
      .select('-token'); // Não expor o token

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations,
    });
  } catch (error) {
    console.error('Erro ao listar convites:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar convites',
      error: error.message,
    });
  }
};

/**
 * Cancelar convite
 * @route DELETE /api/invitations/:id
 * @access Private (Clinic, Psychologist, Admin)
 */
exports.cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Convite não encontrado',
      });
    }

    // Verificar permissão
    if (invitation.invitedBy.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para cancelar este convite',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Apenas convites pendentes podem ser cancelados',
      });
    }

    invitation.status = 'expired';
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Convite cancelado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao cancelar convite:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar convite',
      error: error.message,
    });
  }
};

/**
 * Reenviar convite
 * @route POST /api/invitations/:id/resend
 * @access Private (Clinic, Psychologist, Admin)
 */
exports.resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Convite não encontrado',
      });
    }

    // Verificar permissão
    if (invitation.invitedBy.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para reenviar este convite',
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Apenas convites pendentes podem ser reenviados',
      });
    }

    // Reenviar e-mail baseado no role
    try {
      if (invitation.role === 'clinic') {
        await sendClinicInvitation(invitation);
      } else if (invitation.role === 'psychologist') {
        const clinic = await Clinic.findById(invitation.preFilledData.clinicId);
        await sendPsychologistInvitation(invitation, clinic?.name);
      } else if (invitation.role === 'patient') {
        const psychologist = await Psychologist.findById(invitation.preFilledData.psychologistId);
        await sendPatientInvitation(invitation, psychologist?.name);
      }
    } catch (emailError) {
      console.error('Erro ao reenviar e-mail:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar e-mail',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Convite reenviado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao reenviar convite:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reenviar convite',
      error: error.message,
    });
  }
};
