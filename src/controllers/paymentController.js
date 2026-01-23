const paymentService = require('../services/paymentService');
const Payment = require('../models/Payment');

/**
 * @desc    Criar pagamento para um agendamento
 * @route   POST /api/payments
 * @access  Private (Clinic, Psychologist)
 */
const createPayment = async (req, res) => {
  try {
    const {
      appointmentId,
      sessionValue,
      discount,
      paymentMethod,
      dueDate,
      notes,
      healthInsurance,
    } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'ID do agendamento é obrigatório',
      });
    }

    const payment = await paymentService.createPaymentForAppointment({
      appointmentId,
      sessionValue,
      discount,
      paymentMethod,
      dueDate,
      notes,
      healthInsurance,
    });

    res.status(201).json({
      success: true,
      message: 'Pagamento criado com sucesso',
      data: payment,
    });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao criar pagamento',
    });
  }
};

/**
 * @desc    Criar pagamentos em lote
 * @route   POST /api/payments/batch
 * @access  Private (Clinic, Psychologist)
 */
const createBatchPayments = async (req, res) => {
  try {
    const { appointmentIds, options } = req.body;

    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de IDs de agendamentos é obrigatória',
      });
    }

    const results = await paymentService.createBatchPayments(appointmentIds, options || {});

    res.status(200).json({
      success: true,
      message: `${results.created.length} pagamentos criados, ${results.skipped.length} ignorados, ${results.failed.length} falharam`,
      data: results,
    });
  } catch (error) {
    console.error('Erro ao criar pagamentos em lote:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao criar pagamentos em lote',
    });
  }
};

/**
 * @desc    Obter pagamento por ID
 * @route   GET /api/payments/:id
 * @access  Private (Clinic, Psychologist, Patient)
 */
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('appointmentId', 'date duration type status')
      .populate('patientId', 'name email phone')
      .populate('psychologistId', 'name crp')
      .populate('clinicId', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado',
      });
    }

    // Verificar acesso
    const userId = req.user._id.toString();
    const userRole = req.user.role;

    const hasAccess =
      userRole === 'clinic' && payment.clinicId?._id.toString() === userId ||
      userRole === 'psychologist' && payment.psychologistId._id.toString() === userId ||
      userRole === 'patient' && payment.patientId._id.toString() === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Acesso não autorizado a este pagamento',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pagamento',
    });
  }
};

/**
 * @desc    Listar pagamentos com filtros
 * @route   GET /api/payments
 * @access  Private (Clinic, Psychologist, Patient)
 */
const listPayments = async (req, res) => {
  try {
    const {
      status,
      paymentMethod,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const userId = req.user._id.toString();
    const userRole = req.user.role;

    // Definir filtros baseado no role
    const filters = {};
    if (userRole === 'clinic') {
      filters.clinicId = userId;
    } else if (userRole === 'psychologist') {
      filters.psychologistId = userId;
    } else if (userRole === 'patient') {
      filters.patientId = userId;
    }

    // Adicionar filtros opcionais
    if (status) filters.status = status;
    if (paymentMethod) filters.paymentMethod = paymentMethod;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await paymentService.listPayments(filters, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder === 'asc' ? 1 : -1,
    });

    res.status(200).json({
      success: true,
      data: result.payments,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar pagamentos',
    });
  }
};

/**
 * @desc    Registrar pagamento como efetuado
 * @route   POST /api/payments/:id/pay
 * @access  Private (Clinic, Psychologist, Patient)
 */
const registerPayment = async (req, res) => {
  try {
    const { paymentMethod, paidAt } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Método de pagamento é obrigatório',
      });
    }

    const payment = await paymentService.registerPayment(req.params.id, {
      paymentMethod,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      changedById: req.user._id,
      changedByModel: capitalizeRole(req.user.role),
    });

    res.status(200).json({
      success: true,
      message: 'Pagamento registrado com sucesso',
      data: payment,
    });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao registrar pagamento',
    });
  }
};

/**
 * @desc    Confirmar pagamento (após recebimento real)
 * @route   POST /api/payments/:id/confirm
 * @access  Private (Clinic, Psychologist)
 */
const confirmPayment = async (req, res) => {
  try {
    const { internalNotes } = req.body;

    const payment = await paymentService.confirmPayment(req.params.id, {
      confirmedById: req.user._id,
      confirmedByModel: capitalizeRole(req.user.role),
      internalNotes,
    });

    res.status(200).json({
      success: true,
      message: 'Pagamento confirmado com sucesso',
      data: payment,
    });
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao confirmar pagamento',
    });
  }
};

/**
 * @desc    Confirmar múltiplos pagamentos em lote
 * @route   POST /api/payments/batch/confirm
 * @access  Private (Clinic)
 */
const confirmBatchPayments = async (req, res) => {
  try {
    const { paymentIds, internalNotes } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de IDs de pagamentos é obrigatória',
      });
    }

    const results = await paymentService.confirmBatchPayments(paymentIds, {
      confirmedById: req.user._id,
      confirmedByModel: capitalizeRole(req.user.role),
      internalNotes,
    });

    res.status(200).json({
      success: true,
      message: `${results.confirmed.length} pagamentos confirmados, ${results.failed.length} falharam`,
      data: results,
    });
  } catch (error) {
    console.error('Erro ao confirmar pagamentos em lote:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao confirmar pagamentos em lote',
    });
  }
};

/**
 * @desc    Cancelar pagamento
 * @route   POST /api/payments/:id/cancel
 * @access  Private (Clinic, Psychologist)
 */
const cancelPayment = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Motivo do cancelamento é obrigatório',
      });
    }

    const payment = await paymentService.cancelPayment(req.params.id, {
      reason,
      changedById: req.user._id,
      changedByModel: capitalizeRole(req.user.role),
    });

    res.status(200).json({
      success: true,
      message: 'Pagamento cancelado com sucesso',
      data: payment,
    });
  } catch (error) {
    console.error('Erro ao cancelar pagamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao cancelar pagamento',
    });
  }
};

/**
 * @desc    Reembolsar pagamento
 * @route   POST /api/payments/:id/refund
 * @access  Private (Clinic, Psychologist)
 */
const refundPayment = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Motivo do reembolso é obrigatório',
      });
    }

    const payment = await paymentService.refundPayment(req.params.id, {
      reason,
      changedById: req.user._id,
      changedByModel: capitalizeRole(req.user.role),
    });

    res.status(200).json({
      success: true,
      message: 'Pagamento reembolsado com sucesso',
      data: payment,
    });
  } catch (error) {
    console.error('Erro ao reembolsar pagamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao reembolsar pagamento',
    });
  }
};

/**
 * @desc    Atualizar valor do pagamento
 * @route   PUT /api/payments/:id/value
 * @access  Private (Clinic, Psychologist)
 */
const updatePaymentValue = async (req, res) => {
  try {
    const { sessionValue, discount } = req.body;

    if (sessionValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Valor da sessão é obrigatório',
      });
    }

    const payment = await paymentService.updatePaymentValue(
      req.params.id,
      sessionValue,
      discount
    );

    res.status(200).json({
      success: true,
      message: 'Valor atualizado com sucesso',
      data: payment,
    });
  } catch (error) {
    console.error('Erro ao atualizar valor do pagamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao atualizar valor do pagamento',
    });
  }
};

/**
 * @desc    Adicionar observação interna ao pagamento
 * @route   POST /api/payments/:id/notes
 * @access  Private (Clinic, Psychologist)
 */
const addInternalNote = async (req, res) => {
  try {
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'Observação é obrigatória',
      });
    }

    const payment = await paymentService.addInternalNote(req.params.id, note);

    res.status(200).json({
      success: true,
      message: 'Observação adicionada com sucesso',
      data: payment,
    });
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao adicionar observação',
    });
  }
};

/**
 * @desc    Obter resumo financeiro do psicólogo
 * @route   GET /api/payments/summary/psychologist/:psychologistId
 * @access  Private (Psychologist, Clinic)
 */
const getPsychologistFinancialSummary = async (req, res) => {
  try {
    const { psychologistId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data inicial e final são obrigatórias',
      });
    }

    const summary = await paymentService.getPsychologistFinancialSummary(
      psychologistId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Erro ao obter resumo financeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter resumo financeiro',
    });
  }
};

/**
 * @desc    Obter resumo financeiro da clínica
 * @route   GET /api/payments/summary/clinic/:clinicId
 * @access  Private (Clinic)
 */
const getClinicFinancialSummary = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data inicial e final são obrigatórias',
      });
    }

    const summary = await paymentService.getClinicFinancialSummary(
      clinicId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Erro ao obter resumo financeiro da clínica:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter resumo financeiro da clínica',
    });
  }
};

/**
 * @desc    Obter resumo financeiro do paciente
 * @route   GET /api/payments/summary/patient/:patientId
 * @access  Private (Patient, Clinic, Psychologist)
 */
const getPatientFinancialSummary = async (req, res) => {
  try {
    const { patientId } = req.params;

    const summary = await paymentService.getPatientFinancialSummary(patientId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Erro ao obter resumo financeiro do paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter resumo financeiro do paciente',
    });
  }
};

/**
 * @desc    Obter pagamentos pendentes do paciente
 * @route   GET /api/payments/patient/:patientId/pending
 * @access  Private (Patient, Clinic, Psychologist)
 */
const getPatientPendingPayments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const payments = await Payment.getPatientPendingPayments(patientId);

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error('Erro ao obter pagamentos pendentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter pagamentos pendentes',
    });
  }
};

// Helper para capitalizar role
function capitalizeRole(role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

module.exports = {
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
};
