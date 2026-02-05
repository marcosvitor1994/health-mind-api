const express = require('express');
const router = express.Router();
const { generateSystemPrompt } = require('../controllers/aiController');
const {
  generateReport,
  getReports,
  getReportById,
} = require('../controllers/therapeuticReportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

/**
 * @route   POST /api/ai/generate-system-prompt
 * @desc    Gerar system prompt personalizado via Claude
 * @access  Public (usado durante registro de psicologo)
 */
router.post('/generate-system-prompt', generateSystemPrompt);

/**
 * @route   POST /api/ai/generate-therapeutic-report
 * @desc    Gerar relatório terapêutico a partir das conversas do paciente
 * @access  Private (Psychologist)
 */
router.post('/generate-therapeutic-report', protect, authorize('psychologist'), generateReport);

/**
 * @route   GET /api/ai/therapeutic-reports/:patientId
 * @desc    Listar relatórios terapêuticos de um paciente
 * @access  Private (Psychologist)
 */
router.get('/therapeutic-reports/:patientId', protect, authorize('psychologist'), getReports);

/**
 * @route   GET /api/ai/therapeutic-report/:reportId
 * @desc    Obter relatório terapêutico por ID
 * @access  Private (Psychologist)
 */
router.get('/therapeutic-report/:reportId', protect, authorize('psychologist'), getReportById);

module.exports = router;
