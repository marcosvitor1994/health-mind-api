const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: [true, 'Horário de início é obrigatório'],
      validate: {
        validator: function (v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Formato de horário inválido. Use HH:MM',
      },
    },
    endTime: {
      type: String,
      required: [true, 'Horário de término é obrigatório'],
      validate: {
        validator: function (v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Formato de horário inválido. Use HH:MM',
      },
    },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: [true, 'Dia da semana é obrigatório'],
      min: [0, 'Dia da semana deve ser entre 0 (Domingo) e 6 (Sábado)'],
      max: [6, 'Dia da semana deve ser entre 0 (Domingo) e 6 (Sábado)'],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    slots: {
      type: [timeSlotSchema],
      default: [],
    },
  },
  { _id: false }
);

const dateOverrideSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Data é obrigatória'],
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    slots: {
      type: [timeSlotSchema],
      default: [],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [200, 'Motivo deve ter no máximo 200 caracteres'],
    },
  },
  { _id: false }
);

const workingHoursSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: [true, 'Tipo de entidade é obrigatório'],
      enum: {
        values: ['clinic', 'psychologist'],
        message: '{VALUE} não é um tipo de entidade válido',
      },
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'ID da entidade é obrigatório'],
      refPath: 'entityTypeRef',
    },
    // Campo auxiliar para populate dinâmico
    entityTypeRef: {
      type: String,
      default: function () {
        return this.entityType === 'clinic' ? 'Clinic' : 'Psychologist';
      },
    },
    weeklySchedule: {
      type: [dayScheduleSchema],
      default: function () {
        // Default: Segunda a Sexta, 08:00-18:00
        return [
          { dayOfWeek: 0, isOpen: false, slots: [] }, // Domingo
          { dayOfWeek: 1, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] },
          { dayOfWeek: 2, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] },
          { dayOfWeek: 3, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] },
          { dayOfWeek: 4, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] },
          { dayOfWeek: 5, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] },
          { dayOfWeek: 6, isOpen: false, slots: [] }, // Sábado
        ];
      },
      validate: {
        validator: function (v) {
          // Deve ter exatamente 7 dias (0-6)
          if (v.length !== 7) return false;
          const days = v.map((d) => d.dayOfWeek).sort();
          return JSON.stringify(days) === JSON.stringify([0, 1, 2, 3, 4, 5, 6]);
        },
        message: 'weeklySchedule deve conter todos os 7 dias da semana (0-6)',
      },
    },
    dateOverrides: {
      type: [dateOverrideSchema],
      default: [],
    },
    defaultSessionDuration: {
      type: Number,
      default: 50,
      min: [15, 'Duração mínima de 15 minutos'],
      max: [240, 'Duração máxima de 240 minutos'],
    },
    bufferBetweenSessions: {
      type: Number,
      default: 10,
      min: [0, 'Buffer mínimo de 0 minutos'],
      max: [60, 'Buffer máximo de 60 minutos'],
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
        delete ret.entityTypeRef;
        return ret;
      },
    },
  }
);

// Índice composto único - apenas um registro por entidade
workingHoursSchema.index(
  { entityType: 1, entityId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
workingHoursSchema.index({ deletedAt: 1 });

// Query helper para filtrar deletados
workingHoursSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Método para soft delete
workingHoursSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Método para obter horário efetivo de um dia específico
workingHoursSchema.methods.getEffectiveSchedule = function (date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Primeiro verifica se há override para esta data
  const override = this.dateOverrides.find((o) => {
    const overrideDate = new Date(o.date);
    overrideDate.setHours(0, 0, 0, 0);
    return overrideDate.getTime() === targetDate.getTime();
  });

  if (override) {
    return {
      isOpen: override.isOpen,
      slots: override.slots,
      reason: override.reason,
      isOverride: true,
    };
  }

  // Senão, usa o schedule semanal
  const dayOfWeek = targetDate.getDay();
  const daySchedule = this.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);

  return {
    isOpen: daySchedule ? daySchedule.isOpen : false,
    slots: daySchedule ? daySchedule.slots : [],
    reason: null,
    isOverride: false,
  };
};

// Método para adicionar uma exceção de data
workingHoursSchema.methods.addDateOverride = async function (date, isOpen, slots = [], reason = '') {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Remove override existente para mesma data
  this.dateOverrides = this.dateOverrides.filter((o) => {
    const overrideDate = new Date(o.date);
    overrideDate.setHours(0, 0, 0, 0);
    return overrideDate.getTime() !== targetDate.getTime();
  });

  // Adiciona novo override
  this.dateOverrides.push({
    date: targetDate,
    isOpen,
    slots,
    reason,
  });

  return await this.save();
};

// Método para remover uma exceção de data
workingHoursSchema.methods.removeDateOverride = async function (date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  this.dateOverrides = this.dateOverrides.filter((o) => {
    const overrideDate = new Date(o.date);
    overrideDate.setHours(0, 0, 0, 0);
    return overrideDate.getTime() !== targetDate.getTime();
  });

  return await this.save();
};

// Método estático para buscar ou criar horários padrão
workingHoursSchema.statics.findOrCreate = async function (entityType, entityId) {
  let workingHours = await this.findOne({
    entityType,
    entityId,
    deletedAt: null,
  });

  if (!workingHours) {
    workingHours = await this.create({
      entityType,
      entityId,
    });
  }

  return workingHours;
};

// Método estático para obter horário efetivo considerando hierarquia
// (psicólogo herda da clínica se não tiver próprio, mas limitado aos horários da clínica)
workingHoursSchema.statics.getEffectiveWorkingHours = async function (entityType, entityId, date, clinicId = null) {
  // Busca horário da entidade
  const entityHours = await this.findOne({
    entityType,
    entityId,
    deletedAt: null,
  });

  // Se é psicólogo e tem clínica, precisa considerar horário da clínica também
  if (entityType === 'psychologist' && clinicId) {
    const clinicHours = await this.findOne({
      entityType: 'clinic',
      entityId: clinicId,
      deletedAt: null,
    });

    // Se clínica está fechada neste dia, psicólogo também está
    if (clinicHours) {
      const clinicSchedule = clinicHours.getEffectiveSchedule(date);
      if (!clinicSchedule.isOpen) {
        return {
          isOpen: false,
          slots: [],
          reason: clinicSchedule.reason || 'Clínica fechada',
          defaultSessionDuration: entityHours?.defaultSessionDuration || clinicHours.defaultSessionDuration,
          bufferBetweenSessions: entityHours?.bufferBetweenSessions || clinicHours.bufferBetweenSessions,
        };
      }
    }
  }

  // Se entidade não tem horário definido, usa padrão
  if (!entityHours) {
    return {
      isOpen: true,
      slots: [{ startTime: '08:00', endTime: '18:00' }],
      reason: null,
      defaultSessionDuration: 50,
      bufferBetweenSessions: 10,
    };
  }

  const schedule = entityHours.getEffectiveSchedule(date);
  return {
    ...schedule,
    defaultSessionDuration: entityHours.defaultSessionDuration,
    bufferBetweenSessions: entityHours.bufferBetweenSessions,
  };
};

const WorkingHours = mongoose.model('WorkingHours', workingHoursSchema);

module.exports = WorkingHours;
