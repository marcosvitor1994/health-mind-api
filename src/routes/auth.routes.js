const express = require('express');
const router = express.Router();
const {
  registerClinic,
  registerPsychologist,
  registerPatient,
  login,
  refreshToken,
  getMe,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const passport = require('../config/oauth');

/**
 * @route   POST /api/auth/register/clinic
 * @desc    Registrar nova clínica
 * @access  Public
 */
router.post('/register/clinic', registerClinic);

/**
 * @route   POST /api/auth/register/psychologist
 * @desc    Registrar novo psicólogo
 * @access  Public
 */
router.post('/register/psychologist', registerPsychologist);

/**
 * @route   POST /api/auth/register/patient
 * @desc    Registrar novo paciente
 * @access  Public
 */
router.post('/register/patient', registerPatient);

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Renovar token JWT
 * @access  Public
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Obter dados do usuário logado
 * @access  Private
 */
router.get('/me', protect, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout de usuário
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   GET /api/auth/google
 * @desc    Iniciar autenticação Google OAuth
 * @access  Public
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Callback do Google OAuth
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Gera tokens JWT
    const token = require('../middleware/auth').generateToken(req.user._id, req.user.role);
    const refreshToken = require('../middleware/auth').generateRefreshToken(req.user._id, req.user.role);

    // Redireciona para o frontend com os tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}`);
  }
);

module.exports = router;
