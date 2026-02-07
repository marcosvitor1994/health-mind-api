const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const encryptionPlugin = require('../utils/encryptionPlugin');

const psychologistSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: 'Email inválido',
      },
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'Senha deve ter no mínimo 6 caracteres'],
      select: false,
    },
    crp: {
      type: String,
      required: [true, 'CRP é obrigatório'],
      trim: true,
    },
    _crpHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    specialties: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return Array.isArray(v);
        },
        message: 'Especialidades devem ser um array',
      },
    },
    avatar: {
      type: String, // Base64 encoded image
      default: null,
    },
    systemPrompt: {
      type: String,
      default: null,
      maxlength: [20000, 'System prompt deve ter no máximo 20000 caracteres'],
      trim: true,
    },
    // Perfil terapêutico (dados brutos do wizard de cadastro)
    therapeuticProfile: {
      formacaoAcademica: { type: String, trim: true },
      posGraduacao: { type: String, trim: true },
      abordagemPrincipal: { type: String, trim: true },
      descricaoTrabalho: { type: String, trim: true, maxlength: 200 },
      publicosEspecificos: { type: [String], default: [] },
      temasEspecializados: { type: [String], default: [] },
      tonsComunicacao: { type: [String], default: [] },
      tecnicasFavoritas: { type: [String], default: [] },
      restricoesTematicas: { type: String, trim: true },
      diferenciais: { type: String, trim: true, maxlength: 100 },
      experienciaViolencia: { type: String, trim: true },
      situacoesLimite: { type: String, trim: true },
      linguagemPreferida: { type: String, trim: true },
      exemploAcolhimento: { type: String, trim: true },
      exemploLimiteEtico: { type: String, trim: true },
    },
    settings: {
      defaultSessionDuration: {
        type: Number,
        default: 50,
        min: [15, 'Duração mínima de 15 minutos'],
        max: [240, 'Duração máxima de 240 minutos'],
      },
      acceptsOnline: {
        type: Boolean,
        default: true,
      },
      acceptsInPerson: {
        type: Boolean,
        default: true,
      },
      preferredRoomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null,
      },
    },
    // Configurações de pagamento do psicólogo
    paymentSettings: {
      // Valor padrão da sessão (usado quando psicólogo é independente ou tem valor próprio)
      defaultSessionValue: {
        type: Number,
        default: 0,
        min: [0, 'Valor não pode ser negativo'],
      },
      // Se usa o valor da clínica ou valor próprio (quando vinculado a clínica)
      useClinicValue: {
        type: Boolean,
        default: true,
      },
      // Se aceita plano de saúde (psicólogo independente)
      acceptsHealthInsurance: {
        type: Boolean,
        default: false,
      },
      // Métodos de pagamento aceitos (psicólogo independente)
      acceptedPaymentMethods: {
        type: [String],
        default: ['cash', 'pix'],
        validate: {
          validator: function (v) {
            const validMethods = ['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'health_insurance', 'other'];
            return v.every((method) => validMethods.includes(method));
          },
          message: 'Método de pagamento inválido',
        },
      },
      // Dados bancários para recebimento (psicólogo independente)
      bankInfo: {
        bankName: { type: String, trim: true },
        bankCode: { type: String, trim: true },
        agency: { type: String, trim: true },
        account: { type: String, trim: true },
        accountType: {
          type: String,
          enum: ['checking', 'savings'],
          default: 'checking',
        },
        pixKey: { type: String, trim: true },
        pixKeyType: {
          type: String,
          enum: ['cpf', 'cnpj', 'email', 'phone', 'random'],
        },
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    expoPushToken: {
      type: String,
      default: null,
      trim: true,
    },
    role: {
      type: String,
      default: 'psychologist',
      immutable: true,
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
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
// Indexes (email, crp e googleId já têm unique: true que cria index)
psychologistSchema.index({ clinicId: 1 });
psychologistSchema.index({ deletedAt: 1 });

// Hash de senha antes de salvar
psychologistSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
psychologistSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para soft delete
psychologistSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Query helper para filtrar deletados
psychologistSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Criptografia AES-256 para campos sensiveis
psychologistSchema.plugin(encryptionPlugin, {
  fields: ['crp', 'phone', 'paymentSettings.bankInfo.agency', 'paymentSettings.bankInfo.account', 'paymentSettings.bankInfo.pixKey'],
  hashFields: ['crp'],
});

const Psychologist = mongoose.model('Psychologist', psychologistSchema);

module.exports = Psychologist;
