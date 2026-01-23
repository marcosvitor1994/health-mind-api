const express = require('express');
const router = express.Router();
const {
  createPayment,
  createBatchPayments,
  getPayment,
  listPayments,
  registerPayment,
  confirmPayment,
  confirmBatchPayments,
  cancelPayment,
  refundPayment,
  updatePaymentValue,
  addInternalNote,
  getPsychologistFinancialSummary,
  getClinicFinancialSummary,
  getPatientFinancialSummary,
  getPatientPendingPayments,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize, authorizeClinicForPsychologist } = require('../middleware/roleCheck');

/**
 * @route   POST /api/payments
 * @desc    Criar pagamento para um agendamento
 * @access  Private (Clinic, Psychologist)
 */
router.post('/', protect, authorize('clinic', 'psychologist'), createPayment);

/**
 * @route   POST /api/payments/batch
 * @desc    Criar pagamentos em lote para múltiplos agendamentos
 * @access  Private (Clinic, Psychologist)
 */
router.post('/batch', protect, authorize('clinic', 'psychologist'), createBatchPayments);

/**
 * @route   POST /api/payments/batch/confirm
 * @desc    Confirmar múltiplos pagamentos em lote
 * @access  Private (Clinic)
 */
router.post('/batch/confirm', protect, authorize('clinic'), confirmBatchPayments);

/**
 * @route   GET /api/payments
 * @desc    Listar pagamentos com filtros
 * @access  Private (Clinic, Psychologist, Patient)
 */
router.get('/', protect, authorize('clinic', 'psychologist', 'patient'), listPayments);

/**
 * @route   GET /api/payments/summary/clinic/:clinicId
 * @desc    Obter resumo financeiro da clínica
 * @access  Private (Clinic)
 */
router.get(
  '/summary/clinic/:clinicId',
  protect,
  authorize('clinic'),
  getClinicFinancialSummary
);

/**
 * @route   GET /api/payments/summary/psychologist/:psychologistId
 * @desc    Obter resumo financeiro do psicólogo
 * @access  Private (Psychologist, Clinic)
 */
router.get(
  '/summary/psychologist/:psychologistId',
  protect,
  authorize('psychologist', 'clinic'),
  getPsychologistFinancialSummary
);

/**
 * @route   GET /api/payments/summary/patient/:patientId
 * @desc    Obter resumo financeiro do paciente
 * @access  Private (Patient, Clinic, Psychologist)
 */
router.get(
  '/summary/patient/:patientId',
  protect,
  authorize('patient', 'clinic', 'psychologist'),
  getPatientFinancialSummary
);

/**
 * @route   GET /api/payments/patient/:patientId/pending
 * @desc    Obter pagamentos pendentes do paciente
 * @access  Private (Patient, Clinic, Psychologist)
 */
router.get(
  '/patient/:patientId/pending',
  protect,
  authorize('patient', 'clinic', 'psychologist'),
  getPatientPendingPayments
);

/**
 * @route   GET /api/payments/:id
 * @desc    Obter pagamento por ID
 * @access  Private (Clinic, Psychologist, Patient)
 */
router.get('/:id', protect, authorize('clinic', 'psychologist', 'patient'), getPayment);

/**
 * @route   POST /api/payments/:id/pay
 * @desc    Registrar pagamento como efetuado (aguardando confirmação)
 * @access  Private (Clinic, Psychologist, Patient)
 */
router.post(
  '/:id/pay',
  protect,
  authorize('clinic', 'psychologist', 'patient'),
  registerPayment
);

/**
 * @route   POST /api/payments/:id/confirm
 * @desc    Confirmar pagamento (após recebimento real)
 * @access  Private (Clinic, Psychologist)
 */
router.post('/:id/confirm', protect, authorize('clinic', 'psychologist'), confirmPayment);

/**
 * @route   POST /api/payments/:id/cancel
 * @desc    Cancelar pagamento
 * @access  Private (Clinic, Psychologist)
 */
router.post('/:id/cancel', protect, authorize('clinic', 'psychologist'), cancelPayment);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Reembolsar pagamento
 * @access  Private (Clinic, Psychologist)
 */
router.post('/:id/refund', protect, authorize('clinic', 'psychologist'), refundPayment);

/**
 * @route   PUT /api/payments/:id/value
 * @desc    Atualizar valor do pagamento
 * @access  Private (Clinic, Psychologist)
 */
router.put('/:id/value', protect, authorize('clinic', 'psychologist'), updatePaymentValue);

/**
 * @route   POST /api/payments/:id/notes
 * @desc    Adicionar observação interna ao pagamento
 * @access  Private (Clinic, Psychologist)
 */
router.post('/:id/notes', protect, authorize('clinic', 'psychologist'), addInternalNote);

module.exports = router;
