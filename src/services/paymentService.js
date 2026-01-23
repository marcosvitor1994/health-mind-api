const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Psychologist = require('../models/Psychologist');
const Clinic = require('../models/Clinic');
const Patient = require('../models/Patient');

/**
 * Determina o valor da sessão baseado na hierarquia:
 * 1. Valor definido no agendamento
 * 2. Valor do psicólogo (se independente ou com valor próprio)
 * 3. Valor da clínica
 * 4. 0 se nenhum valor definido
 */
async function getSessionValue(appointment, psychologist, clinic) {
  // 1. Valor definido diretamente no agendamento
  if (appointment.sessionValue !== null && appointment.sessionValue !== undefined) {
    return appointment.sessionValue;
  }

  // 2. Psicólogo independente ou com valor próprio
  if (!clinic || !psychologist.paymentSettings?.useClinicValue) {
    return psychologist.paymentSettings?.defaultSessionValue || 0;
  }

  // 3. Valor da clínica
  return clinic.paymentSettings?.defaultSessionValue || 0;
}

/**
 * Determina a porcentagem da clínica
 */
function getClinicPercentage(clinic) {
  if (!clinic) return 0;
  return clinic.paymentSettings?.clinicPercentage || 0;
}

/**
 * Cria um registro de pagamento para um agendamento
 * @param {Object} params
 * @param {String} params.appointmentId - ID do agendamento
 * @param {Number} params.sessionValue - Valor da sessão (opcional, será calculado se não informado)
 * @param {Number} params.discount - Desconto a aplicar (opcional)
 * @param {String} params.paymentMethod - Método de pagamento (opcional)
 * @param {Date} params.dueDate - Data de vencimento (opcional)
 * @param {String} params.notes - Observações (opcional)
 * @param {Object} params.healthInsurance - Dados do plano de saúde (opcional)
 * @returns {Object} - Payment criado
 */
async function createPaymentForAppointment(params) {
  const {
    appointmentId,
    sessionValue: customSessionValue,
    discount = 0,
    paymentMethod = null,
    dueDate = null,
    notes = null,
    healthInsurance = null,
  } = params;

  // Busca o agendamento com dados relacionados
  const appointment = await Appointment.findById(appointmentId)
    .populate('psychologistId')
    .populate('clinicId');

  if (!appointment) {
    throw new Error('Agendamento não encontrado');
  }

  if (appointment.paymentId) {
    throw new Error('Este agendamento já possui um pagamento vinculado');
  }

  const psychologist = appointment.psychologistId;
  const clinic = appointment.clinicId;

  // Determina o valor da sessão
  const sessionValue = customSessionValue !== undefined
    ? customSessionValue
    : await getSessionValue(appointment, psychologist, clinic);

  // Determina a porcentagem da clínica
  const clinicPercentage = getClinicPercentage(clinic);

  // Cria o pagamento
  const payment = await Payment.create({
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    psychologistId: psychologist._id,
    clinicId: clinic?._id || null,
    sessionValue,
    clinicPercentage,
    discount,
    finalValue: Math.max(0, sessionValue - discount),
    status: 'pending',
    paymentMethod,
    dueDate,
    notes,
    healthInsurance,
    statusHistory: [{
      status: 'pending',
      changedAt: new Date(),
      reason: 'Pagamento criado',
    }],
  });

  // Atualiza o agendamento com a referência do pagamento
  appointment.paymentId = payment._id;
  if (customSessionValue !== undefined) {
    appointment.sessionValue = customSessionValue;
  }
  await appointment.save();

  return payment;
}

/**
 * Cria pagamentos em lote para múltiplos agendamentos
 * @param {Array} appointmentIds - Array de IDs de agendamentos
 * @param {Object} options - Opções comuns para todos os pagamentos
 * @returns {Object} - Resultado da operação
 */
async function createBatchPayments(appointmentIds, options = {}) {
  const results = {
    created: [],
    failed: [],
    skipped: [],
  };

  for (const appointmentId of appointmentIds) {
    try {
      // Verifica se já existe pagamento
      const appointment = await Appointment.findById(appointmentId);
      if (appointment?.paymentId) {
        results.skipped.push({
          appointmentId,
          reason: 'Já possui pagamento vinculado',
        });
        continue;
      }

      const payment = await createPaymentForAppointment({
        appointmentId,
        ...options,
      });
      results.created.push(payment);
    } catch (error) {
      results.failed.push({
        appointmentId,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Registra um pagamento como efetuado (aguardando confirmação)
 * @param {String} paymentId - ID do pagamento
 * @param {Object} params
 * @param {String} params.paymentMethod - Método de pagamento
 * @param {Date} params.paidAt - Data do pagamento
 * @param {String} params.changedById - ID de quem registrou
 * @param {String} params.changedByModel - Tipo (Clinic, Psychologist, Patient)
 * @returns {Object} - Payment atualizado
 */
async function registerPayment(paymentId, params) {
  const { paymentMethod, paidAt = new Date(), changedById, changedByModel } = params;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Pagamento não encontrado');
  }

  if (payment.status === 'confirmed') {
    throw new Error('Pagamento já foi confirmado');
  }

  if (payment.status === 'cancelled' || payment.status === 'refunded') {
    throw new Error('Pagamento foi cancelado ou reembolsado');
  }

  await payment.markAsPaid(paymentMethod, paidAt, changedById, changedByModel);

  return payment;
}

/**
 * Confirma um pagamento (normalmente feito pela clínica após receber o valor)
 * @param {String} paymentId - ID do pagamento
 * @param {Object} params
 * @param {String} params.confirmedById - ID de quem confirmou
 * @param {String} params.confirmedByModel - Tipo (Clinic, Psychologist)
 * @param {String} params.internalNotes - Notas internas
 * @returns {Object} - Payment atualizado
 */
async function confirmPayment(paymentId, params) {
  const { confirmedById, confirmedByModel, internalNotes = null } = params;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Pagamento não encontrado');
  }

  if (payment.status === 'confirmed') {
    throw new Error('Pagamento já foi confirmado');
  }

  if (payment.status === 'cancelled' || payment.status === 'refunded') {
    throw new Error('Não é possível confirmar pagamento cancelado ou reembolsado');
  }

  await payment.confirmPayment(confirmedById, confirmedByModel, internalNotes);

  return payment;
}

/**
 * Confirma múltiplos pagamentos em lote
 * @param {Array} paymentIds - Array de IDs de pagamentos
 * @param {Object} params - Parâmetros de confirmação
 * @returns {Object} - Resultado da operação
 */
async function confirmBatchPayments(paymentIds, params) {
  const results = {
    confirmed: [],
    failed: [],
  };

  for (const paymentId of paymentIds) {
    try {
      const payment = await confirmPayment(paymentId, params);
      results.confirmed.push(payment);
    } catch (error) {
      results.failed.push({
        paymentId,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Cancela um pagamento
 * @param {String} paymentId - ID do pagamento
 * @param {Object} params
 * @param {String} params.reason - Motivo do cancelamento
 * @param {String} params.changedById - ID de quem cancelou
 * @param {String} params.changedByModel - Tipo
 * @returns {Object} - Payment atualizado
 */
async function cancelPayment(paymentId, params) {
  const { reason, changedById, changedByModel } = params;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Pagamento não encontrado');
  }

  if (payment.status === 'confirmed') {
    throw new Error('Não é possível cancelar pagamento já confirmado. Use reembolso.');
  }

  await payment.cancel(reason, changedById, changedByModel);

  return payment;
}

/**
 * Reembolsa um pagamento
 * @param {String} paymentId - ID do pagamento
 * @param {Object} params
 * @param {String} params.reason - Motivo do reembolso
 * @param {String} params.changedById - ID de quem reembolsou
 * @param {String} params.changedByModel - Tipo
 * @returns {Object} - Payment atualizado
 */
async function refundPayment(paymentId, params) {
  const { reason, changedById, changedByModel } = params;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Pagamento não encontrado');
  }

  if (payment.status !== 'confirmed' && payment.status !== 'awaiting_confirmation') {
    throw new Error('Apenas pagamentos confirmados ou aguardando confirmação podem ser reembolsados');
  }

  await payment.refund(reason, changedById, changedByModel);

  return payment;
}

/**
 * Obtém resumo financeiro do psicólogo
 * @param {String} psychologistId
 * @param {String} startDate - YYYY-MM-DD
 * @param {String} endDate - YYYY-MM-DD
 * @returns {Object} - Resumo financeiro
 */
async function getPsychologistFinancialSummary(psychologistId, startDate, endDate) {
  const summary = await Payment.getPsychologistSummary(psychologistId, startDate, endDate);

  // Calcula valores previstos vs confirmados
  summary.expectedEarnings =
    summary.confirmedPayments.psychologistValue +
    summary.awaitingConfirmation.psychologistValue +
    summary.pendingPayments.psychologistValue;

  summary.confirmedEarnings = summary.confirmedPayments.psychologistValue;

  summary.pendingEarnings =
    summary.awaitingConfirmation.psychologistValue +
    summary.pendingPayments.psychologistValue;

  return summary;
}

/**
 * Obtém resumo financeiro da clínica
 * @param {String} clinicId
 * @param {String} startDate - YYYY-MM-DD
 * @param {String} endDate - YYYY-MM-DD
 * @returns {Object} - Resumo financeiro
 */
async function getClinicFinancialSummary(clinicId, startDate, endDate) {
  const summary = await Payment.getClinicSummary(clinicId, startDate, endDate);

  // Calcula valores por psicólogo
  const psychologists = await Psychologist.find({
    clinicId,
    deletedAt: null,
  }).select('name');

  const byPsychologist = await Promise.all(
    psychologists.map(async (psych) => {
      const psychSummary = await Payment.getPsychologistSummary(
        psych._id,
        startDate,
        endDate
      );
      return {
        psychologistId: psych._id,
        name: psych.name,
        ...psychSummary,
      };
    })
  );

  return {
    ...summary,
    byPsychologist: byPsychologist.sort(
      (a, b) => b.confirmedPayments.value - a.confirmedPayments.value
    ),
  };
}

/**
 * Obtém resumo financeiro do paciente
 * @param {String} patientId
 * @returns {Object} - Resumo financeiro
 */
async function getPatientFinancialSummary(patientId) {
  const summary = await Payment.getPatientSummary(patientId);
  const pendingPayments = await Payment.getPatientPendingPayments(patientId);

  return {
    ...summary,
    pendingPayments,
  };
}

/**
 * Lista pagamentos com filtros
 * @param {Object} filters
 * @param {Object} options - Paginação e ordenação
 * @returns {Object} - Lista paginada de pagamentos
 */
async function listPayments(filters, options = {}) {
  const {
    clinicId,
    psychologistId,
    patientId,
    status,
    paymentMethod,
    startDate,
    endDate,
  } = filters;

  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = options;

  const query = { deletedAt: null };

  if (clinicId) query.clinicId = clinicId;
  if (psychologistId) query.psychologistId = psychologistId;
  if (patientId) query.patientId = patientId;
  if (status) {
    query.status = Array.isArray(status) ? { $in: status } : status;
  }
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('appointmentId', 'date duration type status')
      .populate('patientId', 'name email phone')
      .populate('psychologistId', 'name crp')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit)),
    Payment.countDocuments(query),
  ]);

  return {
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Atualiza valor da sessão de um pagamento
 * @param {String} paymentId
 * @param {Number} newValue
 * @param {Number} discount
 * @returns {Object} - Payment atualizado
 */
async function updatePaymentValue(paymentId, newValue, discount = null) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Pagamento não encontrado');
  }

  if (payment.status === 'confirmed') {
    throw new Error('Não é possível alterar valor de pagamento já confirmado');
  }

  payment.sessionValue = newValue;
  if (discount !== null) {
    payment.discount = discount;
  }
  // Os valores serão recalculados no pre-save

  await payment.save();

  return payment;
}

/**
 * Adiciona observação interna ao pagamento
 * @param {String} paymentId
 * @param {String} note
 * @returns {Object} - Payment atualizado
 */
async function addInternalNote(paymentId, note) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Pagamento não encontrado');
  }

  payment.internalNotes = payment.internalNotes
    ? `${payment.internalNotes}\n---\n${new Date().toISOString()}: ${note}`
    : `${new Date().toISOString()}: ${note}`;

  await payment.save();

  return payment;
}

module.exports = {
  createPaymentForAppointment,
  createBatchPayments,
  registerPayment,
  confirmPayment,
  confirmBatchPayments,
  cancelPayment,
  refundPayment,
  getPsychologistFinancialSummary,
  getClinicFinancialSummary,
  getPatientFinancialSummary,
  listPayments,
  updatePaymentValue,
  addInternalNote,
  getSessionValue,
  getClinicPercentage,
};
