const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, deleteMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

/**
 * @route   POST /api/chat
 * @desc    Enviar mensagem no chat com IA
 * @access  Private (Patient)
 */
router.post('/', protect, authorize('patient'), sendMessage);

/**
 * @route   GET /api/chat/patient/:patientId
 * @desc    Obter histórico de chat de um paciente
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.get('/patient/:patientId', protect, authorize('patient', 'psychologist', 'clinic'), getChatHistory);

/**
 * @route   DELETE /api/chat/:id
 * @desc    Deletar mensagem do chat (soft delete)
 * @access  Private (Patient)
 */
router.delete('/:id', protect, authorize('patient'), deleteMessage);

module.exports = router;
