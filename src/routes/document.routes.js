const express = require('express');
const router = express.Router();
const {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  uploadPDF,
  getPatientDocuments,
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { authorize, authorizeDocumentAccess } = require('../middleware/roleCheck');
const { singlePDF } = require('../config/multer');
const { handlePDFUpload, handleMulterError } = require('../middleware/uploadHandler');

/**
 * @route   POST /api/documents
 * @desc    Criar novo documento
 * @access  Private (Psychologist)
 */
router.post('/', protect, authorize('psychologist'), createDocument);

/**
 * @route   GET /api/documents/:id
 * @desc    Obter documento específico
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.get('/:id', protect, authorize('patient', 'psychologist', 'clinic'), authorizeDocumentAccess, getDocument);

/**
 * @route   PUT /api/documents/:id
 * @desc    Atualizar documento
 * @access  Private (Psychologist)
 */
router.put('/:id', protect, authorize('psychologist'), authorizeDocumentAccess, updateDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Deletar documento (soft delete)
 * @access  Private (Psychologist)
 */
router.delete('/:id', protect, authorize('psychologist'), authorizeDocumentAccess, deleteDocument);

/**
 * @route   POST /api/documents/:id/pdf
 * @desc    Upload de PDF para documento
 * @access  Private (Psychologist)
 */
router.post(
  '/:id/pdf',
  protect,
  authorize('psychologist'),
  authorizeDocumentAccess,
  singlePDF('pdf'),
  handleMulterError,
  handlePDFUpload,
  uploadPDF
);

/**
 * @route   GET /api/documents/patient/:patientId
 * @desc    Listar documentos de um paciente
 * @access  Private (Patient, Psychologist, Clinic)
 */
router.get('/patient/:patientId', protect, authorize('patient', 'psychologist', 'clinic'), getPatientDocuments);

module.exports = router;
