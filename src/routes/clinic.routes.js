const express = require('express');
const router = express.Router();
const {
  getClinic,
  updateClinic,
  uploadLogo,
  getPsychologists,
  getStats,
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

module.exports = router;
