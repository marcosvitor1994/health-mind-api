/**
 * Middleware para verificar roles/permissões
 * @param  {...String} roles - Roles permitidos
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} não tem permissão para acessar esta rota`,
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se é o próprio usuário ou tem permissão superior
 */
const authorizeOwnerOrAbove = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    const resourceId = req.params[paramName];

    // Verifica se é o próprio usuário
    if (req.user._id.toString() === resourceId) {
      return next();
    }

    // Lógica de hierarquia:
    // - Clínica pode acessar seus psicólogos
    // - Psicólogo pode acessar seus pacientes
    // - Paciente só acessa seus próprios dados

    if (req.user.role === 'clinic') {
      // Clínica tem acesso amplo (verificação adicional pode ser feita no controller)
      return next();
    }

    if (req.user.role === 'psychologist') {
      // Psicólogo pode acessar seus pacientes (verificação adicional no controller)
      return next();
    }

    // Paciente não tem acesso a outros recursos
    return res.status(403).json({
      success: false,
      message: 'Você não tem permissão para acessar este recurso',
    });
  };
};

/**
 * Middleware para verificar se clínica pode acessar psicólogo
 */
const authorizeClinicForPsychologist = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    // Se for o próprio psicólogo, permite
    if (req.user.role === 'psychologist' && req.user._id.toString() === req.params.id) {
      return next();
    }

    // Se for clínica, verifica se o psicólogo pertence a ela
    if (req.user.role === 'clinic') {
      const Psychologist = require('../models/Psychologist');
      const psychologist = await Psychologist.findById(req.params.id).notDeleted();

      if (!psychologist) {
        return res.status(404).json({
          success: false,
          message: 'Psicólogo não encontrado',
        });
      }

      if (!psychologist.clinicId || psychologist.clinicId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Este psicólogo não pertence à sua clínica',
        });
      }

      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Você não tem permissão para acessar este recurso',
    });
  } catch (error) {
    console.error('Erro no middleware de autorização:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor',
    });
  }
};

/**
 * Middleware para verificar se psicólogo pode acessar paciente
 */
const authorizePsychologistForPatient = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    const patientId = req.params.id || req.params.patientId;

    // Se for o próprio paciente, permite
    if (req.user.role === 'patient' && req.user._id.toString() === patientId) {
      return next();
    }

    // Se for psicólogo, verifica se o paciente pertence a ele
    if (req.user.role === 'psychologist') {
      const Patient = require('../models/Patient');
      const patient = await Patient.findById(patientId).notDeleted();

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado',
        });
      }

      if (!patient.psychologistId || patient.psychologistId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Este paciente não está sob seus cuidados',
        });
      }

      return next();
    }

    // Se for clínica, verifica se o paciente pertence a ela diretamente ou através de um psicólogo
    if (req.user.role === 'clinic') {
      const Patient = require('../models/Patient');
      const Psychologist = require('../models/Psychologist');

      const patient = await Patient.findById(patientId).notDeleted();

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Paciente não encontrado',
        });
      }

      // Verifica se paciente está vinculado diretamente à clínica
      if (patient.clinicId && patient.clinicId.toString() === req.user._id.toString()) {
        return next();
      }

      // Verifica se paciente pertence a algum psicólogo da clínica
      if (patient.psychologistId) {
        const psychologist = await Psychologist.findById(patient.psychologistId).notDeleted();

        if (psychologist && psychologist.clinicId && psychologist.clinicId.toString() === req.user._id.toString()) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Este paciente não pertence à sua clínica',
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Você não tem permissão para acessar este recurso',
    });
  } catch (error) {
    console.error('Erro no middleware de autorização:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor',
    });
  }
};

/**
 * Middleware para verificar se usuário pode acessar documento
 */
const authorizeDocumentAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado',
      });
    }

    const Document = require('../models/Document');
    const document = await Document.findById(req.params.id).notDeleted();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    // Paciente pode acessar seus próprios documentos
    if (req.user.role === 'patient' && document.patientId.toString() === req.user._id.toString()) {
      return next();
    }

    // Psicólogo pode acessar documentos dos seus pacientes
    if (req.user.role === 'psychologist' && document.psychologistId.toString() === req.user._id.toString()) {
      return next();
    }

    // Clínica pode acessar através da hierarquia
    if (req.user.role === 'clinic') {
      const Psychologist = require('../models/Psychologist');
      const psychologist = await Psychologist.findById(document.psychologistId).notDeleted();

      if (psychologist && psychologist.clinicId.toString() === req.user._id.toString()) {
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Você não tem permissão para acessar este documento',
    });
  } catch (error) {
    console.error('Erro no middleware de autorização de documento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor',
    });
  }
};

module.exports = {
  authorize,
  authorizeOwnerOrAbove,
  authorizeClinicForPsychologist,
  authorizePsychologistForPatient,
  authorizeDocumentAccess,
};
