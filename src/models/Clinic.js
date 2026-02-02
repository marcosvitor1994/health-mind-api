const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const encryptionPlugin = require('../utils/encryptionPlugin');

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome da clínica é obrigatório'],
      trim: true,
    },
    cnpj: {
      type: String,
      required: [true, 'CNPJ é obrigatório'],
      trim: true,
    },
    _cnpjHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
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
      select: false, // Não retorna senha em queries por padrão
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      number: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true, maxlength: 2 },
      zipCode: { type: String, trim: true },
    },
    logo: {
      type: String, // Base64 encoded image
      default: null,
    },
    settings: {
      defaultSessionDuration: {
        type: Number,
        default: 50,
        min: [15, 'Duração mínima de 15 minutos'],
        max: [240, 'Duração máxima de 240 minutos'],
      },
      allowOnlineAppointments: {
        type: Boolean,
        default: true,
      },
      requireRoomForInPerson: {
        type: Boolean,
        default: false,
      },
    },
    // Configurações de pagamento
    paymentSettings: {
      // Valor padrão da sessão na clínica
      defaultSessionValue: {
        type: Number,
        default: 0,
        min: [0, 'Valor não pode ser negativo'],
      },
      // Porcentagem que a clínica fica (0-100)
      clinicPercentage: {
        type: Number,
        default: 30,
        min: [0, 'Porcentagem mínima é 0'],
        max: [100, 'Porcentagem máxima é 100'],
      },
      // Se aceita plano de saúde
      acceptsHealthInsurance: {
        type: Boolean,
        default: false,
      },
      // Planos de saúde aceitos
      acceptedHealthInsurances: [{
        name: { type: String, trim: true },
        code: { type: String, trim: true },
      }],
      // Prazo padrão de pagamento (dias)
      defaultPaymentDueDays: {
        type: Number,
        default: 0, // 0 = pagamento no ato
        min: 0,
        max: 90,
      },
      // Métodos de pagamento aceitos
      acceptedPaymentMethods: {
        type: [String],
        default: ['cash', 'pix', 'credit_card', 'debit_card'],
        validate: {
          validator: function (v) {
            const validMethods = ['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'health_insurance', 'other'];
            return v.every((method) => validMethods.includes(method));
          },
          message: 'Método de pagamento inválido',
        },
      },
      // Dados bancários para recebimento
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
      sparse: true, // Permite múltiplos null values
    },
    role: {
      type: String,
      default: 'clinic',
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

// Index para queries comuns (email, cnpj e googleId já têm unique: true que cria index)
clinicSchema.index({ deletedAt: 1 });

// Hash de senha antes de salvar
clinicSchema.pre('save', async function (next) {
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
clinicSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para soft delete
clinicSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Query helper para filtrar deletados
clinicSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Criptografia AES-256 para campos sensiveis
clinicSchema.plugin(encryptionPlugin, {
  fields: ['cnpj', 'phone', 'paymentSettings.bankInfo.agency', 'paymentSettings.bankInfo.account', 'paymentSettings.bankInfo.pixKey'],
  hashFields: ['cnpj'],
});

const Clinic = mongoose.model('Clinic', clinicSchema);

module.exports = Clinic;
