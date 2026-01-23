const express = require('express');
const router = express.Router();
const {
  getPsychologist,
  updatePsychologist,
  uploadAvatar,
  getPatients,
  getAppointments,
} = require('../controllers/psychologistController');
const { getPsychologistOccupancy } = require('../controllers/availabilityController');
const { protect } = require('../middleware/auth');
const { authorize, authorizeClinicForPsychologist } = require('../middleware/roleCheck');
const { singleImage } = require('../config/multer');
const { handleAvatarUpload, handleMulterError } = require('../middleware/uploadHandler');

/**
 * @route   GET /api/psychologists/:id
 * @desc    Obter dados do psicólogo
 * @access  Private (Psychologist, Clinic)
 */
router.get('/:id', protect, authorize('psychologist', 'clinic'), authorizeClinicForPsychologist, getPsychologist);

/**
 * @route   PUT /api/psychologists/:id
 * @desc    Atualizar dados do psicólogo
 * @access  Private (Psychologist, Clinic)
 */
router.put('/:id', protect, authorize('psychologist', 'clinic'), authorizeClinicForPsychologist, updatePsychologist);

/**
 * @route   POST /api/psychologists/:id/avatar
 * @desc    Upload de avatar do psicólogo
 * @access  Private (Psychologist)
 */
router.post(
  '/:id/avatar',
  protect,
  authorize('psychologist'),
  singleImage('avatar'),
  handleMulterError,
  handleAvatarUpload,
  uploadAvatar
);

/**
 * @route   GET /api/psychologists/:id/patients
 * @desc    Listar pacientes do psicólogo
 * @access  Private (Psychologist, Clinic)
 */
router.get('/:id/patients', protect, authorize('psychologist', 'clinic'), authorizeClinicForPsychologist, getPatients);

/**
 * @route   GET /api/psychologists/:id/appointments
 * @desc    Listar agendamentos do psicólogo
 * @access  Private (Psychologist, Clinic)
 */
router.get(
  '/:id/appointments',
  protect,
  authorize('psychologist', 'clinic'),
  authorizeClinicForPsychologist,
  getAppointments
);

/**
 * @route   GET /api/psychologists/:id/occupancy
 * @desc    Obter taxa de ocupação do psicólogo
 * @access  Private (Psychologist, Clinic)
 */
router.get(
  '/:id/occupancy',
  protect,
  authorize('psychologist', 'clinic'),
  authorizeClinicForPsychologist,
  getPsychologistOccupancy
);

module.exports = router;
