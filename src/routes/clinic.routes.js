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
  getFinancialSummary,
  updatePaymentSettings,
  getPaymentSettings,
} = require('../controllers/clinicController');
const { getClinicOccupancy, getRoomOccupancy } = require('../controllers/availabilityController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { singleImage } = require('../config/multer');
const { handleLogoUpload, handleMulterError } = require('../middleware/uploadHandler');
const roomRoutes = require('./room.routes');

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

/**
 * @route   GET /api/clinics/:clinicId/occupancy
 * @desc    Obter taxa de ocupação da clínica
 * @access  Private (Clinic)
 */
router.get('/:clinicId/occupancy', protect, authorize('clinic'), getClinicOccupancy);

/**
 * @route   GET /api/clinics/:clinicId/rooms/:roomId/occupancy
 * @desc    Obter taxa de ocupação de uma sala específica
 * @access  Private (Clinic)
 */
router.get('/:clinicId/rooms/:roomId/occupancy', protect, authorize('clinic', 'psychologist'), getRoomOccupancy);

/**
 * @route   GET /api/clinics/:id/financial-summary
 * @desc    Obter resumo financeiro da clínica
 * @access  Private (Clinic)
 */
router.get('/:id/financial-summary', protect, authorize('clinic'), getFinancialSummary);

/**
 * @route   GET /api/clinics/:id/payment-settings
 * @desc    Obter configurações de pagamento da clínica
 * @access  Private (Clinic)
 */
router.get('/:id/payment-settings', protect, authorize('clinic'), getPaymentSettings);

/**
 * @route   PUT /api/clinics/:id/payment-settings
 * @desc    Atualizar configurações de pagamento da clínica
 * @access  Private (Clinic)
 */
router.put('/:id/payment-settings', protect, authorize('clinic'), updatePaymentSettings);

/**
 * Rotas de salas aninhadas em /api/clinics/:clinicId/rooms
 */
router.use('/:clinicId/rooms', roomRoutes);

module.exports = router;
