const Patient = require('../models/Patient');
const Psychologist = require('../models/Psychologist');
const Clinic = require('../models/Clinic');

/**
 * Registrar token de push notification
 * @route POST /api/push/register-token
 * @access Private (Patient, Psychologist, Clinic)
 */
exports.registerPushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({
        success: false,
        message: 'Token é obrigatório',
      });
    }

    // Validar formato do token Expo
    if (!expoPushToken.startsWith('ExponentPushToken')) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido. Deve ser um Expo Push Token.',
      });
    }

    const userId = req.user._id || req.user.id;
    const role = req.user.role;

    let Model;
    if (role === 'patient') {
      Model = Patient;
    } else if (role === 'psychologist') {
      Model = Psychologist;
    } else if (role === 'clinic') {
      Model = Clinic;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Role inválido',
      });
    }

    await Model.findByIdAndUpdate(userId, { expoPushToken });

    res.status(200).json({
      success: true,
      message: 'Token registrado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao registrar push token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar token',
      error: error.message,
    });
  }
};
