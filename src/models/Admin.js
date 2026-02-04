const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const encryptionPlugin = require('../utils/encryptionPlugin');

const adminSchema = new mongoose.Schema(
  {
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
    avatar: {
      type: String,
      default: null,
    },
    permissions: {
      manageUsers: {
        type: Boolean,
        default: true,
      },
      manageClinics: {
        type: Boolean,
        default: true,
      },
      viewMetrics: {
        type: Boolean,
        default: true,
      },
      promoteAdmin: {
        type: Boolean,
        default: false,
      },
    },
    role: {
      type: String,
      default: 'admin',
      immutable: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
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
adminSchema.index({ deletedAt: 1 });
adminSchema.index({ email: 1, deletedAt: 1 });

// Hash de senha antes de salvar
adminSchema.pre('save', async function (next) {
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
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para soft delete
adminSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Método para restaurar
adminSchema.methods.restore = async function () {
  this.deletedAt = null;
  return await this.save();
};

// Query helper para filtrar deletados
adminSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Criptografia AES-256 para campos sensíveis
adminSchema.plugin(encryptionPlugin, {
  fields: ['phone'],
  hashFields: [],
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
