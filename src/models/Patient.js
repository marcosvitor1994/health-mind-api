const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema(
  {
    psychologistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Psychologist',
      required: [true, 'Psicólogo é obrigatório'],
      index: true,
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
    phone: {
      type: String,
      trim: true,
    },
    birthDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return v <= new Date();
        },
        message: 'Data de nascimento não pode ser no futuro',
      },
    },
    cpf: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // CPF é opcional
          return /^\d{11}$/.test(v.replace(/\D/g, ''));
        },
        message: 'CPF inválido',
      },
    },
    avatar: {
      type: String, // Base64 encoded image
      default: null,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      default: 'patient',
      immutable: true,
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
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
patientSchema.index({ email: 1 });
patientSchema.index({ cpf: 1 });
patientSchema.index({ psychologistId: 1 });
patientSchema.index({ googleId: 1 });
patientSchema.index({ deletedAt: 1 });

// Hash de senha antes de salvar
patientSchema.pre('save', async function (next) {
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
patientSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para soft delete
patientSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Query helper para filtrar deletados
patientSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Virtual para calcular idade
patientSchema.virtual('age').get(function () {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
