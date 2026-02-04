const mongoose = require('mongoose');
const encryptionPlugin = require('../utils/encryptionPlugin');

const therapeuticReportSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: {
        values: ['generating', 'completed', 'failed'],
        message: '{VALUE} não é um status válido',
      },
      default: 'generating',
    },
    periodStart: {
      type: Date,
      default: null,
    },
    periodEnd: {
      type: Date,
      required: [true, 'Data final do período é obrigatória'],
    },
    messagesAnalyzed: {
      type: Number,
      default: 0,
    },
    sections: {
      temasAbordados: {
        type: String,
        default: '',
      },
      sentimentosIdentificados: {
        type: String,
        default: '',
      },
      padroesComportamentais: {
        type: String,
        default: '',
      },
      pontosDeAtencao: {
        type: String,
        default: '',
      },
      evolucaoObservada: {
        type: String,
        default: '',
      },
      sugestoesParaSessao: {
        type: String,
        default: '',
      },
    },
    summary: {
      type: String,
      default: '',
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

// Indexes
therapeuticReportSchema.index({ patientId: 1, psychologistId: 1, createdAt: -1 });
therapeuticReportSchema.index({ patientId: 1, periodEnd: -1 });

// Query helper para filtrar deletados
therapeuticReportSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Método para soft delete
therapeuticReportSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Criptografia AES-256 para conteúdo clínico sensível
therapeuticReportSchema.plugin(encryptionPlugin, {
  fields: [
    'sections.temasAbordados',
    'sections.sentimentosIdentificados',
    'sections.padroesComportamentais',
    'sections.pontosDeAtencao',
    'sections.evolucaoObservada',
    'sections.sugestoesParaSessao',
    'summary',
  ],
  hashFields: [],
});

const TherapeuticReport = mongoose.model('TherapeuticReport', therapeuticReportSchema);

module.exports = TherapeuticReport;
