const express = require('express');
const router = express.Router();
const { generateSystemPrompt } = require('../controllers/aiController');

/**
 * @route   POST /api/ai/generate-system-prompt
 * @desc    Gerar system prompt personalizado via Gemini
 * @access  Public (usado durante registro de psicologo)
 */
router.post('/generate-system-prompt', generateSystemPrompt);

module.exports = router;
