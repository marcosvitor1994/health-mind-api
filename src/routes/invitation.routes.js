const express = require('express');
const router = express.Router();
const {
  inviteClinic,
  invitePsychologist,
  invitePatient,
  validateInvitation,
  listInvitations,
  cancelInvitation,
  resendInvitation,
} = require('../controllers/invitationController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

/**
 * @route   POST /api/invitations/clinic
 * @desc    [ADMIN] Criar convite para clínica
 * @access  Private (Admin only - implementar middleware)
 */
router.post('/clinic', protect, inviteClinic);

/**
 * @route   POST /api/invitations/psychologist
 * @desc    [CLINIC] Criar convite para psicólogo
 * @access  Private (Clinic only)
 */
router.post('/psychologist', protect, authorize('clinic'), invitePsychologist);

/**
 * @route   POST /api/invitations/patient
 * @desc    [PSYCHOLOGIST/CLINIC] Criar convite para paciente
 * @access  Private (Psychologist, Clinic)
 */
router.post('/patient', protect, authorize('psychologist', 'clinic'), invitePatient);

/**
 * @route   GET /api/invitations/validate/:token
 * @desc    Validar token de convite
 * @access  Public
 */
router.get('/validate/:token', validateInvitation);

/**
 * @route   GET /api/invitations
 * @desc    Listar convites enviados
 * @access  Private (Clinic, Psychologist, Admin)
 */
router.get('/', protect, authorize('clinic', 'psychologist'), listInvitations);

/**
 * @route   DELETE /api/invitations/:id
 * @desc    Cancelar convite
 * @access  Private (Clinic, Psychologist, Admin)
 */
router.delete('/:id', protect, authorize('clinic', 'psychologist'), cancelInvitation);

/**
 * @route   POST /api/invitations/:id/resend
 * @desc    Reenviar convite
 * @access  Private (Clinic, Psychologist, Admin)
 */
router.post('/:id/resend', protect, authorize('clinic', 'psychologist'), resendInvitation);

module.exports = router;
