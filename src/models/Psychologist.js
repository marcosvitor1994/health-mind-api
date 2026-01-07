const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const psychologistSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clínica é obrigatória'],
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
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Formato: 12/12345 ou 12/123456
          return /^\d{2}\/\d{5,6}$/.test(v);
        },
        message: 'CRP inválido. Formato: XX/XXXXX ou XX/XXXXXX',
      },
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
    googleId: {
      type: String,
      unique: true,
      sparse: true,
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

const Psychologist = mongoose.model('Psychologist', psychologistSchema);

module.exports = Psychologist;
