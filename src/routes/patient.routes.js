const express = require('express');
const router = express.Router();
const {
  getPatient,
  updatePatient,
  uploadAvatar,
  getAppointments,
  getDocuments,
} = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const { authorize, authorizePsychologistForPatient } = require('../middleware/roleCheck');
const { singleImage } = require('../config/multer');
const { handleAvatarUpload, handleMulterError } = require('../middleware/uploadHandler');

/**
 * @route   GET /api/patients/:id
 * @desc    Obter dados do paciente
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.get(
  '/:id',
  protect,
  authorize('patient', 'psychologist', 'clinic'),
  authorizePsychologistForPatient,
  getPatient
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Atualizar dados do paciente
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.put('/:id', protect, authorize('patient', 'psychologist', 'clinic'), authorizePsychologistForPatient, updatePatient);

/**
 * @route   POST /api/patients/:id/avatar
 * @desc    Upload de avatar do paciente
 * @access  Private (Patient)
 */
router.post(
  '/:id/avatar',
  protect,
  authorize('patient'),
  singleImage('avatar'),
  handleMulterError,
  handleAvatarUpload,
  uploadAvatar
);

/**
 * @route   GET /api/patients/:id/appointments
 * @desc    Listar agendamentos do paciente
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.get(
  '/:id/appointments',
  protect,
  authorize('patient', 'psychologist', 'clinic'),
  authorizePsychologistForPatient,
  getAppointments
);

/**
 * @route   GET /api/patients/:id/documents
 * @desc    Listar documentos do paciente
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.get(
  '/:id/documents',
  protect,
  authorize('patient', 'psychologist', 'clinic'),
  authorizePsychologistForPatient,
  getDocuments
);

module.exports = router;
