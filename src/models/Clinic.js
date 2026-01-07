const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{14}$/.test(v.replace(/\D/g, ''));
        },
        message: 'CNPJ inválido',
      },
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

// Index para queries comuns
clinicSchema.index({ email: 1 });
clinicSchema.index({ cnpj: 1 });
clinicSchema.index({ googleId: 1 });
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

const Clinic = mongoose.model('Clinic', clinicSchema);

module.exports = Clinic;
