const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
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
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Data é obrigatória'],
      index: true,
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: 'Data do agendamento deve ser no futuro',
      },
    },
    duration: {
      type: Number,
      default: 50,
      min: [15, 'Duração mínima de 15 minutos'],
      max: [240, 'Duração máxima de 240 minutos'],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['scheduled', 'confirmed', 'awaiting_patient', 'awaiting_psychologist', 'completed', 'cancelled'],
        message: '{VALUE} não é um status válido',
      },
      default: 'awaiting_patient',
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['online', 'in_person'],
        message: '{VALUE} não é um tipo válido',
      },
      default: 'online',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notas devem ter no máximo 1000 caracteres'],
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    rescheduleRequestedBy: {
      type: String,
      enum: ['patient', 'psychologist', null],
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ['patient', 'psychologist', 'clinic', null],
      default: null,
    },
    cancelledReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Motivo do cancelamento deve ter no máximo 500 caracteres'],
    },
    // Campos de pagamento
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
      index: true,
    },
    // Valor da sessão (pode ser definido no momento do agendamento)
    sessionValue: {
      type: Number,
      default: null,
      min: [0, 'Valor não pode ser negativo'],
    },
    // Se o pagamento é obrigatório para esta sessão
    paymentRequired: {
      type: Boolean,
      default: true,
    },
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
appointmentSchema.index({ psychologistId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ psychologistId: 1, status: 1 });
appointmentSchema.index({ date: 1, status: 1 });
appointmentSchema.index({ deletedAt: 1 });
appointmentSchema.index({ roomId: 1, date: 1 });
appointmentSchema.index({ clinicId: 1, date: 1 });

// Query helper para filtrar deletados
appointmentSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Método para soft delete
appointmentSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Método para cancelar agendamento
appointmentSchema.methods.cancel = async function (cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancelledBy = cancelledBy;
  this.cancelledReason = reason;
  return await this.save();
};

// Método para confirmar agendamento
appointmentSchema.methods.confirm = async function () {
  this.status = 'confirmed';
  return await this.save();
};

// Método para completar agendamento
appointmentSchema.methods.complete = async function () {
  this.status = 'completed';
  return await this.save();
};

// Método para solicitar reagendamento
appointmentSchema.methods.requestReschedule = async function (requestedBy) {
  if (requestedBy === 'patient') {
    this.status = 'awaiting_psychologist';
  } else if (requestedBy === 'psychologist') {
    this.status = 'awaiting_patient';
  }
  this.rescheduleRequestedBy = requestedBy;
  return await this.save();
};

// Virtual para verificar se está próximo (dentro de 24h)
appointmentSchema.virtual('isUpcoming').get(function () {
  const now = new Date();
  const appointmentTime = new Date(this.date);
  const diffHours = (appointmentTime - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 24;
});

// Método estático para verificar conflitos de horário (psicólogo e/ou sala)
appointmentSchema.statics.checkConflict = async function (params) {
  const { psychologistId, date, duration, roomId = null, excludeId = null } = params;

  // Se receber parâmetros no formato antigo (para compatibilidade)
  const actualParams =
    typeof params === 'object' && params.psychologistId
      ? params
      : {
          psychologistId: arguments[0],
          date: arguments[1],
          duration: arguments[2],
          excludeId: arguments[3],
        };

  const startTime = new Date(actualParams.date);
  const endTime = new Date(startTime.getTime() + actualParams.duration * 60000);

  const baseQuery = {
    status: { $in: ['scheduled', 'confirmed', 'awaiting_patient', 'awaiting_psychologist'] },
    deletedAt: null,
    $or: [
      {
        date: {
          $gte: startTime,
          $lt: endTime,
        },
      },
      {
        $expr: {
          $and: [
            { $lte: ['$date', startTime] },
            {
              $gte: [
                { $add: ['$date', { $multiply: ['$duration', 60000] }] },
                startTime,
              ],
            },
          ],
        },
      },
    ],
  };

  if (actualParams.excludeId) {
    baseQuery._id = { $ne: actualParams.excludeId };
  }

  // Verifica conflito do psicólogo
  const psychologistQuery = { ...baseQuery, psychologistId: actualParams.psychologistId };
  const psychologistConflict = await this.findOne(psychologistQuery);

  if (psychologistConflict) {
    return {
      hasConflict: true,
      type: 'psychologist',
      conflictWith: psychologistConflict,
      message: 'Psicólogo já possui agendamento neste horário',
    };
  }

  // Verifica conflito de sala (apenas se roomId foi informado)
  if (actualParams.roomId) {
    const roomQuery = { ...baseQuery, roomId: actualParams.roomId };
    const roomConflict = await this.findOne(roomQuery);

    if (roomConflict) {
      return {
        hasConflict: true,
        type: 'room',
        conflictWith: roomConflict,
        message: 'Sala já está ocupada neste horário',
      };
    }
  }

  return { hasConflict: false };
};

// Método de compatibilidade para código antigo que usa retorno booleano
appointmentSchema.statics.hasConflict = async function (psychologistId, date, duration, excludeId = null) {
  const result = await this.checkConflict({ psychologistId, date, duration, excludeId });
  return result.hasConflict;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
