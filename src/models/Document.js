const mongoose = require('mongoose');
const encryptionPlugin = require('../utils/encryptionPlugin');

const documentSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: [true, 'Tipo de documento é obrigatório'],
      enum: {
        values: ['anamnesis', 'session_report', 'evaluation', 'prescription', 'other'],
        message: '{VALUE} não é um tipo válido',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
      maxlength: [200, 'Título deve ter no máximo 200 caracteres'],
    },
    content: {
      type: String,
      required: [true, 'Conteúdo é obrigatório'],
    },
    pdfFile: {
      type: String, // Base64 encoded PDF
      default: null,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length <= 10;
        },
        message: 'Máximo de 10 tags permitidas',
      },
    },
    isPrivate: {
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
documentSchema.index({ patientId: 1, type: 1 });
documentSchema.index({ psychologistId: 1, createdAt: -1 });
documentSchema.index({ patientId: 1, deletedAt: 1 });
documentSchema.index({ tags: 1 });

// Query helper para filtrar deletados
documentSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Método para soft delete
documentSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Virtual para verificar se tem PDF anexado
documentSchema.virtual('hasPDF').get(function () {
  return !!this.pdfFile;
});

// Middleware para limpar tags vazias
documentSchema.pre('save', function (next) {
  if (this.tags && Array.isArray(this.tags)) {
    this.tags = this.tags.filter(tag => tag && tag.trim() !== '');
    this.tags = [...new Set(this.tags)]; // Remove duplicatas
  }
  next();
});

// Criptografia AES-256 para conteudo clinico
documentSchema.plugin(encryptionPlugin, {
  fields: ['content'],
  hashFields: [],
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
