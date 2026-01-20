const express = require('express');
const router = express.Router();
const {
  getClinic,
  updateClinic,
  uploadLogo,
  getPsychologists,
  getPatients,
  getStats,
  linkPsychologist,
  unlinkPsychologist,
  linkPatient,
  unlinkPatient,
  assignPsychologistToPatient,
} = require('../controllers/clinicController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { singleImage } = require('../config/multer');
const { handleLogoUpload, handleMulterError } = require('../middleware/uploadHandler');

/**
 * @route   GET /api/clinics/:id
 * @desc    Obter dados da clínica
 * @access  Private (Clinic)
 */
router.get('/:id', protect, authorize('clinic'), getClinic);

/**
 * @route   PUT /api/clinics/:id
 * @desc    Atualizar dados da clínica
 * @access  Private (Clinic)
 */
router.put('/:id', protect, authorize('clinic'), updateClinic);

/**
 * @route   POST /api/clinics/:id/logo
 * @desc    Upload de logo da clínica
 * @access  Private (Clinic)
 */
router.post(
  '/:id/logo',
  protect,
  authorize('clinic'),
  singleImage('logo'),
  handleMulterError,
  handleLogoUpload,
  uploadLogo
);

/**
 * @route   GET /api/clinics/:id/psychologists
 * @desc    Listar psicólogos da clínica
 * @access  Private (Clinic)
 */
router.get('/:id/psychologists', protect, authorize('clinic'), getPsychologists);

/**
 * @route   GET /api/clinics/:id/stats
 * @desc    Obter estatísticas da clínica
 * @access  Private (Clinic)
 */
router.get('/:id/stats', protect, authorize('clinic'), getStats);

/**
 * @route   GET /api/clinics/:id/patients
 * @desc    Listar pacientes da clínica
 * @access  Private (Clinic)
 */
router.get('/:id/patients', protect, authorize('clinic'), getPatients);

/**
 * @route   POST /api/clinics/:clinicId/psychologists/:psychologistId/link
 * @desc    Vincular psicólogo à clínica
 * @access  Private (Clinic)
 */
router.post('/:clinicId/psychologists/:psychologistId/link', protect, authorize('clinic'), linkPsychologist);

/**
 * @route   POST /api/clinics/:clinicId/psychologists/:psychologistId/unlink
 * @desc    Desvincular psicólogo da clínica
 * @access  Private (Clinic)
 */
router.post('/:clinicId/psychologists/:psychologistId/unlink', protect, authorize('clinic'), unlinkPsychologist);

/**
 * @route   POST /api/clinics/:clinicId/patients/:patientId/link
 * @desc    Vincular paciente à clínica
 * @access  Private (Clinic)
 */
router.post('/:clinicId/patients/:patientId/link', protect, authorize('clinic'), linkPatient);

/**
 * @route   POST /api/clinics/:clinicId/patients/:patientId/unlink
 * @desc    Desvincular paciente da clínica
 * @access  Private (Clinic)
 */
router.post('/:clinicId/patients/:patientId/unlink', protect, authorize('clinic'), unlinkPatient);

/**
 * @route   PUT /api/clinics/:clinicId/patients/:patientId/assign-psychologist
 * @desc    Atribuir paciente a um psicólogo da clínica
 * @access  Private (Clinic)
 */
router.put('/:clinicId/patients/:patientId/assign-psychologist', protect, authorize('clinic'), assignPsychologistToPatient);

module.exports = router;
