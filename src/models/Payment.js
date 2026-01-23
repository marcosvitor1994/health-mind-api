const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // Referências principais
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Agendamento é obrigatório'],
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Paciente é obrigatório'],
      index: true,
    },
    psychologistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Psychologist',
      required: [true, 'Psicólogo é obrigatório'],
      index: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      default: null,
      index: true,
    },

    // Valores
    sessionValue: {
      type: Number,
      required: [true, 'Valor da sessão é obrigatório'],
      min: [0, 'Valor não pode ser negativo'],
    },
    // Porcentagem que fica com a clínica (0-100)
    clinicPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Porcentagem mínima é 0'],
      max: [100, 'Porcentagem máxima é 100'],
    },
    // Valor calculado para a clínica
    clinicAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Valor calculado para o psicólogo
    psychologistAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Desconto aplicado (se houver)
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Valor final após desconto
    finalValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Status do pagamento
    status: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'awaiting_confirmation', 'confirmed', 'cancelled', 'refunded'],
        message: '{VALUE} não é um status válido',
      },
      default: 'pending',
      index: true,
    },

    // Método de pagamento
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'health_insurance', 'other'],
        message: '{VALUE} não é um método válido',
      },
      default: null,
    },

    // Informações do plano de saúde (quando aplicável)
    healthInsurance: {
      name: { type: String, trim: true },
      planNumber: { type: String, trim: true },
      authorizationCode: { type: String, trim: true },
    },

    // Datas importantes
    dueDate: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'confirmedByModel',
      default: null,
    },
    confirmedByModel: {
      type: String,
      enum: ['Clinic', 'Psychologist'],
      default: null,
    },

    // Observações e notas
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Observações devem ter no máximo 1000 caracteres'],
    },
    // Notas internas da clínica (não visíveis para paciente)
    internalNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notas internas devem ter no máximo 1000 caracteres'],
    },

    // Comprovante/Recibo
    receiptUrl: {
      type: String,
      default: null,
    },

    // Histórico de alterações de status
    statusHistory: [{
      status: {
        type: String,
        enum: ['pending', 'awaiting_confirmation', 'confirmed', 'cancelled', 'refunded'],
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'statusHistory.changedByModel',
      },
      changedByModel: {
        type: String,
        enum: ['Clinic', 'Psychologist', 'Patient'],
      },
      reason: String,
    }],

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes compostos para queries otimizadas
paymentSchema.index({ clinicId: 1, status: 1 });
paymentSchema.index({ psychologistId: 1, status: 1 });
paymentSchema.index({ patientId: 1, status: 1 });
paymentSchema.index({ clinicId: 1, createdAt: -1 });
paymentSchema.index({ psychologistId: 1, createdAt: -1 });
paymentSchema.index({ patientId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, dueDate: 1 });
paymentSchema.index({ deletedAt: 1 });

// Query helper para filtrar deletados
paymentSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Pre-save: calcular valores da clínica e psicólogo
paymentSchema.pre('save', function (next) {
  // Calcula valor final se não estiver definido
  if (this.isModified('sessionValue') || this.isModified('discount')) {
    this.finalValue = Math.max(0, this.sessionValue - (this.discount || 0));
  }

  // Calcula divisão entre clínica e psicólogo
  if (this.isModified('finalValue') || this.isModified('clinicPercentage')) {
    if (this.clinicId && this.clinicPercentage > 0) {
      this.clinicAmount = Math.round((this.finalValue * this.clinicPercentage / 100) * 100) / 100;
      this.psychologistAmount = Math.round((this.finalValue - this.clinicAmount) * 100) / 100;
    } else {
      this.clinicAmount = 0;
      this.psychologistAmount = this.finalValue;
    }
  }

  next();
});

// Método para soft delete
paymentSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Método para marcar como pago (aguardando confirmação)
paymentSchema.methods.markAsPaid = async function (paymentMethod, paidAt = new Date(), changedBy = null, changedByModel = null) {
  this.status = 'awaiting_confirmation';
  this.paymentMethod = paymentMethod;
  this.paidAt = paidAt;

  this.statusHistory.push({
    status: 'awaiting_confirmation',
    changedAt: new Date(),
    changedBy,
    changedByModel,
    reason: 'Pagamento registrado, aguardando confirmação',
  });

  return await this.save();
};

// Método para confirmar pagamento (usado pela clínica após receber o valor)
paymentSchema.methods.confirmPayment = async function (confirmedBy, confirmedByModel, notes = null) {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  this.confirmedBy = confirmedBy;
  this.confirmedByModel = confirmedByModel;

  if (notes) {
    this.internalNotes = notes;
  }

  this.statusHistory.push({
    status: 'confirmed',
    changedAt: new Date(),
    changedBy: confirmedBy,
    changedByModel,
    reason: 'Pagamento confirmado',
  });

  return await this.save();
};

// Método para cancelar pagamento
paymentSchema.methods.cancel = async function (reason, changedBy = null, changedByModel = null) {
  this.status = 'cancelled';

  this.statusHistory.push({
    status: 'cancelled',
    changedAt: new Date(),
    changedBy,
    changedByModel,
    reason,
  });

  return await this.save();
};

// Método para reembolsar
paymentSchema.methods.refund = async function (reason, changedBy = null, changedByModel = null) {
  this.status = 'refunded';

  this.statusHistory.push({
    status: 'refunded',
    changedAt: new Date(),
    changedBy,
    changedByModel,
    reason,
  });

  return await this.save();
};

// Método estático para calcular resumo financeiro do psicólogo
paymentSchema.statics.getPsychologistSummary = async function (psychologistId, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const result = await this.aggregate([
    {
      $match: {
        psychologistId: new mongoose.Types.ObjectId(psychologistId),
        deletedAt: null,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$finalValue' },
        psychologistTotal: { $sum: '$psychologistAmount' },
      },
    },
  ]);

  const summary = {
    totalSessions: 0,
    confirmedPayments: { count: 0, value: 0, psychologistValue: 0 },
    pendingPayments: { count: 0, value: 0, psychologistValue: 0 },
    awaitingConfirmation: { count: 0, value: 0, psychologistValue: 0 },
    cancelledPayments: { count: 0, value: 0 },
  };

  result.forEach((item) => {
    summary.totalSessions += item.count;
    switch (item._id) {
      case 'confirmed':
        summary.confirmedPayments = {
          count: item.count,
          value: item.totalValue,
          psychologistValue: item.psychologistTotal,
        };
        break;
      case 'pending':
        summary.pendingPayments = {
          count: item.count,
          value: item.totalValue,
          psychologistValue: item.psychologistTotal,
        };
        break;
      case 'awaiting_confirmation':
        summary.awaitingConfirmation = {
          count: item.count,
          value: item.totalValue,
          psychologistValue: item.psychologistTotal,
        };
        break;
      case 'cancelled':
      case 'refunded':
        summary.cancelledPayments.count += item.count;
        summary.cancelledPayments.value += item.totalValue;
        break;
    }
  });

  return summary;
};

// Método estático para calcular resumo financeiro da clínica
paymentSchema.statics.getClinicSummary = async function (clinicId, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const result = await this.aggregate([
    {
      $match: {
        clinicId: new mongoose.Types.ObjectId(clinicId),
        deletedAt: null,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$finalValue' },
        clinicTotal: { $sum: '$clinicAmount' },
        psychologistTotal: { $sum: '$psychologistAmount' },
      },
    },
  ]);

  const summary = {
    totalSessions: 0,
    confirmedPayments: { count: 0, totalValue: 0, clinicValue: 0, psychologistValue: 0 },
    pendingPayments: { count: 0, totalValue: 0, clinicValue: 0, psychologistValue: 0 },
    awaitingConfirmation: { count: 0, totalValue: 0, clinicValue: 0, psychologistValue: 0 },
    cancelledPayments: { count: 0, totalValue: 0 },
  };

  result.forEach((item) => {
    summary.totalSessions += item.count;
    switch (item._id) {
      case 'confirmed':
        summary.confirmedPayments = {
          count: item.count,
          totalValue: item.totalValue,
          clinicValue: item.clinicTotal,
          psychologistValue: item.psychologistTotal,
        };
        break;
      case 'pending':
        summary.pendingPayments = {
          count: item.count,
          totalValue: item.totalValue,
          clinicValue: item.clinicTotal,
          psychologistValue: item.psychologistTotal,
        };
        break;
      case 'awaiting_confirmation':
        summary.awaitingConfirmation = {
          count: item.count,
          totalValue: item.totalValue,
          clinicValue: item.clinicTotal,
          psychologistValue: item.psychologistTotal,
        };
        break;
      case 'cancelled':
      case 'refunded':
        summary.cancelledPayments.count += item.count;
        summary.cancelledPayments.totalValue += item.totalValue;
        break;
    }
  });

  return summary;
};

// Método estático para obter pagamentos pendentes do paciente
paymentSchema.statics.getPatientPendingPayments = async function (patientId) {
  return await this.find({
    patientId,
    status: { $in: ['pending', 'awaiting_confirmation'] },
    deletedAt: null,
  })
    .populate('appointmentId', 'date duration type')
    .populate('psychologistId', 'name')
    .sort({ dueDate: 1, createdAt: 1 });
};

// Método estático para obter resumo do paciente
paymentSchema.statics.getPatientSummary = async function (patientId) {
  const result = await this.aggregate([
    {
      $match: {
        patientId: new mongoose.Types.ObjectId(patientId),
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$finalValue' },
      },
    },
  ]);

  const summary = {
    totalSessions: 0,
    paidSessions: { count: 0, value: 0 },
    pendingSessions: { count: 0, value: 0 },
    totalPaid: 0,
    totalPending: 0,
  };

  result.forEach((item) => {
    summary.totalSessions += item.count;
    if (item._id === 'confirmed') {
      summary.paidSessions = { count: item.count, value: item.totalValue };
      summary.totalPaid = item.totalValue;
    } else if (item._id === 'pending' || item._id === 'awaiting_confirmation') {
      summary.pendingSessions.count += item.count;
      summary.pendingSessions.value += item.totalValue;
      summary.totalPending += item.totalValue;
    }
  });

  return summary;
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
