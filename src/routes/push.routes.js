const express = require('express');
const router = express.Router();
const { registerPushToken } = require('../controllers/pushController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/push/register-token
 * @desc    Registrar token de push notification
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.post('/register-token', protect, registerPushToken);

module.exports = router;
