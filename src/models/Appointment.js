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
        values: ['scheduled', 'confirmed', 'completed', 'cancelled'],
        message: '{VALUE} não é um status válido',
      },
      default: 'scheduled',
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

// Virtual para verificar se está próximo (dentro de 24h)
appointmentSchema.virtual('isUpcoming').get(function () {
  const now = new Date();
  const appointmentTime = new Date(this.date);
  const diffHours = (appointmentTime - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 24;
});

// Método estático para verificar conflitos de horário
appointmentSchema.statics.checkConflict = async function (psychologistId, date, duration, excludeId = null) {
  const startTime = new Date(date);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  const query = {
    psychologistId,
    status: { $in: ['scheduled', 'confirmed'] },
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

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflicts = await this.find(query);
  return conflicts.length > 0;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
