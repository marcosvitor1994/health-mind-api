const Clinic = require('../models/Clinic');
const Psychologist = require('../models/Psychologist');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');
const Invitation = require('../models/Invitation');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { isValidEmail, validatePasswordStrength } = require('../utils/validator');
const { sendWelcomeEmail } = require('../services/emailService');
const { hash: encryptionHash } = require('../utils/encryption');

/**
 * Registrar clínica
 * @route POST /api/auth/register/clinic
 * @access Public
 */
exports.registerClinic = async (req, res) => {
  try {
    const { name, cnpj, email, password, phone, address } = req.body;

    // Validações
    if (!name || !cnpj || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça todos os campos obrigatórios',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.errors.join(', '),
      });
    }

    // Verificar se email já existe
    const emailExists = await Clinic.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado',
      });
    }

    // Verificar se CNPJ já existe (busca por hash criptografado)
    const cnpjExists = await Clinic.findOne({ _cnpjHash: encryptionHash(cnpj.replace(/\D/g, '')) });
    if (cnpjExists) {
      return res.status(400).json({
        success: false,
        message: 'CNPJ já cadastrado',
      });
    }

    // Criar clínica
    const clinic = await Clinic.create({
      name,
      cnpj: cnpj.replace(/\D/g, ''),
      email,
      password,
      phone,
      address,
    });

    // Gerar tokens
    const token = generateToken(clinic._id, clinic.role);
    const refreshToken = generateRefreshToken(clinic._id, clinic.role);

    res.status(201).json({
      success: true,
      message: 'Clínica registrada com sucesso',
      data: {
        user: clinic,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar clínica:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar clínica',
      error: error.message,
    });
  }
};

/**
 * Registrar psicólogo
 * @route POST /api/auth/register/psychologist
 * @access Public (requer clinicId)
 */
exports.registerPsychologist = async (req, res) => {
  try {
    const { clinicId, name, email, password, crp, phone, specialties } = req.body;

    // Validações
    if (!clinicId || !name || !email || !password || !crp) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça todos os campos obrigatórios',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.errors.join(', '),
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

    // Verificar se email já existe
    const emailExists = await Psychologist.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado',
      });
    }

    // Verificar se CRP já existe (busca por hash criptografado)
    const crpExists = await Psychologist.findOne({ _crpHash: encryptionHash(crp) });
    if (crpExists) {
      return res.status(400).json({
        success: false,
        message: 'CRP já cadastrado',
      });
    }

    // Criar psicólogo
    const psychologist = await Psychologist.create({
      clinicId,
      name,
      email,
      password,
      crp,
      phone,
      specialties: Array.isArray(specialties) ? specialties : [],
    });

    // Gerar tokens
    const token = generateToken(psychologist._id, psychologist.role);
    const refreshToken = generateRefreshToken(psychologist._id, psychologist.role);

    res.status(201).json({
      success: true,
      message: 'Psicólogo registrado com sucesso',
      data: {
        user: psychologist,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar psicólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar psicólogo',
      error: error.message,
    });
  }
};

/**
 * Registrar paciente
 * @route POST /api/auth/register/patient
 * @access Public (requer psychologistId)
 */
exports.registerPatient = async (req, res) => {
  try {
    const { psychologistId, name, email, password, phone, birthDate, cpf, emergencyContact } = req.body;

    // Validações
    if (!psychologistId || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça todos os campos obrigatórios',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido',
      });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.errors.join(', '),
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

    // Verificar se email já existe
    const emailExists = await Patient.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado',
      });
    }

    // Verificar se CPF já existe (busca por hash criptografado)
    if (cpf) {
      const cpfExists = await Patient.findOne({ _cpfHash: encryptionHash(cpf.replace(/\D/g, '')) });
      if (cpfExists) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado',
        });
      }
    }

    // Criar paciente
    const patient = await Patient.create({
      psychologistId,
      name,
      email,
      password,
      phone,
      birthDate,
      cpf: cpf ? cpf.replace(/\D/g, '') : undefined,
      emergencyContact,
    });

    // Gerar tokens
    const token = generateToken(patient._id, patient.role);
    const refreshToken = generateRefreshToken(patient._id, patient.role);

    res.status(201).json({
      success: true,
      message: 'Paciente registrado com sucesso',
      data: {
        user: patient,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar paciente',
      error: error.message,
    });
  }
};

/**
 * Login
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça email e senha',
      });
    }

    // Buscar usuário em todas as collections
    let user = await Clinic.findOne({ email }).select('+password').notDeleted();
    let role = 'clinic';

    if (!user) {
      user = await Psychologist.findOne({ email }).select('+password').notDeleted();
      role = 'psychologist';
    }

    if (!user) {
      user = await Patient.findOne({ email }).select('+password').notDeleted();
      role = 'patient';
    }

    if (!user) {
      user = await Admin.findOne({ email }).select('+password').notDeleted();
      role = 'admin';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    // Verificar senha
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    // Remover senha do objeto
    user.password = undefined;

    // Gerar tokens
    const token = generateToken(user._id, role);
    const refreshToken = generateRefreshToken(user._id, role);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login',
      error: error.message,
    });
  }
};

/**
 * Refresh token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token não fornecido',
      });
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Gerar novos tokens
    const newToken = generateToken(decoded.id, decoded.role);
    const newRefreshToken = generateRefreshToken(decoded.id, decoded.role);

    res.status(200).json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido ou expirado',
    });
  }
};

/**
 * Obter dados do usuário logado
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário',
    });
  }
};

/**
 * Logout
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = async (req, res) => {
  try {
    // Em uma implementação com blacklist de tokens, você adicionaria o token aqui
    // Por enquanto, apenas retorna sucesso (o cliente deve remover o token)

    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer logout',
    });
  }
};

/**
 * Finalizar cadastro de clínica (via convite)
 * @route POST /api/auth/complete-registration/clinic
 * @access Public
 */
exports.completeClinicRegistration = async (req, res) => {
  try {
    const { token, password, phone, address } = req.body;

    // Validações
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token e senha são obrigatórios',
      });
    }

    // Buscar convite
    const invitation = await Invitation.findOne({ token, role: 'clinic' });

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

    // Validar senha
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.errors.join(', '),
      });
    }

    // Verificar se email já foi cadastrado (pode ter sido durante o período do convite)
    const emailExists = await Clinic.findOne({ email: invitation.email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado',
      });
    }

    // Criar clínica com dados pré-preenchidos + dados do formulário
    const clinic = await Clinic.create({
      name: invitation.preFilledData.name,
      cnpj: invitation.preFilledData.cnpj,
      email: invitation.email,
      password,
      phone: phone || invitation.preFilledData.phone,
      address,
    });

    // Marcar convite como aceito
    await invitation.accept(req.ip);

    // Enviar e-mail de boas-vindas
    try {
      await sendWelcomeEmail(clinic);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de boas-vindas:', emailError);
    }

    // Gerar tokens
    const accessToken = generateToken(clinic._id, clinic.role);
    const refreshToken = generateRefreshToken(clinic._id, clinic.role);

    res.status(201).json({
      success: true,
      message: 'Cadastro concluído com sucesso',
      data: {
        user: clinic,
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Erro ao finalizar cadastro de clínica:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao finalizar cadastro',
      error: error.message,
    });
  }
};

/**
 * Finalizar cadastro de psicólogo (via convite)
 * @route POST /api/auth/complete-registration/psychologist
 * @access Public
 */
exports.completePsychologistRegistration = async (req, res) => {
  try {
    const {
      token, password, phone, bio,
      formacaoAcademica, posGraduacao, abordagemPrincipal, descricaoTrabalho,
      publicosEspecificos, temasEspecializados, tonsComunicacao,
      tecnicasFavoritas, restricoesTematicas, diferenciais,
      experienciaViolencia, situacoesLimite, linguagemPreferida,
      exemploAcolhimento, exemploLimiteEtico,
      systemPrompt,
    } = req.body;

    // Validações
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token e senha são obrigatórios',
      });
    }

    // Validar systemPrompt
    if (systemPrompt && systemPrompt.length > 20000) {
      return res.status(400).json({
        success: false,
        message: 'System prompt excede o limite de 20000 caracteres',
      });
    }

    // Buscar convite
    const invitation = await Invitation.findOne({ token, role: 'psychologist' });

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

    // Validar senha
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.errors.join(', '),
      });
    }

    // Verificar se email já foi cadastrado
    const emailExists = await Psychologist.findOne({ email: invitation.email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado',
      });
    }

    // Verificar se a clínica ainda existe
    const clinic = await Clinic.findById(invitation.preFilledData.clinicId).notDeleted();
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clínica não encontrada',
      });
    }

    // Merge specialties: invitation + wizard
    const allSpecialties = [
      ...(invitation.preFilledData.specialties || []),
      ...(publicosEspecificos || []),
      ...(temasEspecializados || []),
    ];
    const uniqueSpecialties = [...new Set(allSpecialties)];

    // Criar psicólogo
    const psychologist = await Psychologist.create({
      name: invitation.preFilledData.name,
      email: invitation.email,
      password,
      clinicId: invitation.preFilledData.clinicId,
      crp: invitation.preFilledData.crp,
      specialties: uniqueSpecialties,
      phone: phone || invitation.preFilledData.phone,
      bio,
      systemPrompt: systemPrompt || null,
      therapeuticProfile: {
        formacaoAcademica: formacaoAcademica || null,
        posGraduacao: posGraduacao || null,
        abordagemPrincipal: abordagemPrincipal || null,
        descricaoTrabalho: descricaoTrabalho || null,
        publicosEspecificos: publicosEspecificos || [],
        temasEspecializados: temasEspecializados || [],
        tonsComunicacao: tonsComunicacao || [],
        tecnicasFavoritas: tecnicasFavoritas || [],
        restricoesTematicas: restricoesTematicas || null,
        diferenciais: diferenciais || null,
        experienciaViolencia: experienciaViolencia || null,
        situacoesLimite: situacoesLimite || null,
        linguagemPreferida: linguagemPreferida || null,
        exemploAcolhimento: exemploAcolhimento || null,
        exemploLimiteEtico: exemploLimiteEtico || null,
      },
    });

    // Marcar convite como aceito
    await invitation.accept(req.ip);

    // Enviar e-mail de boas-vindas
    try {
      await sendWelcomeEmail(psychologist);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de boas-vindas:', emailError);
    }

    // Gerar tokens
    const accessToken = generateToken(psychologist._id, psychologist.role);
    const refreshToken = generateRefreshToken(psychologist._id, psychologist.role);

    res.status(201).json({
      success: true,
      message: 'Cadastro concluído com sucesso',
      data: {
        user: psychologist,
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Erro ao finalizar cadastro de psicólogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao finalizar cadastro',
      error: error.message,
    });
  }
};

/**
 * Finalizar cadastro de paciente (via convite)
 * @route POST /api/auth/complete-registration/patient
 * @access Public
 */
exports.completePatientRegistration = async (req, res) => {
  try {
    const { token, password, cpf, emergencyContact } = req.body;

    // Validações
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token e senha são obrigatórios',
      });
    }

    // Buscar convite
    const invitation = await Invitation.findOne({ token, role: 'patient' });

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

    // Validar senha
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.errors.join(', '),
      });
    }

    // Verificar se email já foi cadastrado
    const emailExists = await Patient.findOne({ email: invitation.email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado',
      });
    }

    // Verificar se CPF já existe (busca por hash criptografado)
    if (cpf) {
      const cpfExists = await Patient.findOne({ _cpfHash: encryptionHash(cpf.replace(/\D/g, '')) });
      if (cpfExists) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado',
        });
      }
    }

    // Verificar se o psicólogo ainda existe
    const psychologist = await Psychologist.findById(invitation.preFilledData.psychologistId).notDeleted();
    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    // Criar paciente
    const patient = await Patient.create({
      name: invitation.preFilledData.name,
      email: invitation.email,
      password,
      psychologistId: invitation.preFilledData.psychologistId,
      phone: invitation.preFilledData.phone,
      birthDate: invitation.preFilledData.birthDate,
      cpf: cpf ? cpf.replace(/\D/g, '') : undefined,
      emergencyContact,
    });

    // Marcar convite como aceito
    await invitation.accept(req.ip);

    // Enviar e-mail de boas-vindas
    try {
      await sendWelcomeEmail(patient);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de boas-vindas:', emailError);
    }

    // Gerar tokens
    const accessToken = generateToken(patient._id, patient.role);
    const refreshToken = generateRefreshToken(patient._id, patient.role);

    res.status(201).json({
      success: true,
      message: 'Cadastro concluído com sucesso',
      data: {
        user: patient,
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Erro ao finalizar cadastro de paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao finalizar cadastro',
      error: error.message,
    });
  }
};
