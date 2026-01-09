const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Tipo de usuário é obrigatório'],
      enum: ['clinic', 'psychologist', 'patient'],
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    },
    // Dados pré-preenchidos pelo convidador
    preFilledData: {
      name: String,
      // Clínica
      cnpj: String,
      // Psicólogo
      clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
      },
      crp: String,
      specialties: [String],
      // Paciente
      psychologistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Psychologist',
      },
      phone: String,
      birthDate: Date,
    },
    // Quem enviou o convite
    invitedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'invitedBy.userModel',
      },
      userModel: {
        type: String,
        enum: ['Admin', 'Clinic', 'Psychologist'],
      },
      userName: String,
    },
    // Quando foi aceito
    acceptedAt: Date,
    // IP de onde foi aceito (segurança)
    acceptedFromIp: String,
  },
  {
    timestamps: true,
  }
);

// Índices para performance
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ token: 1 });
invitationSchema.index({ expiresAt: 1 });

// Gerar token único
invitationSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

// Verificar se o convite está expirado
invitationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

// Verificar se o convite é válido
invitationSchema.methods.isValid = function () {
  return this.status === 'pending' && !this.isExpired();
};

// Marcar como expirado automaticamente
invitationSchema.pre('save', function (next) {
  if (this.isExpired() && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

// Método para aceitar convite
invitationSchema.methods.accept = function (ip) {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.acceptedFromIp = ip;
  return this.save();
};

// Virtual para URL de convite
invitationSchema.virtual('invitationUrl').get(function () {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/auth/complete-registration/${this.token}`;
});

// Incluir virtuals no JSON
invitationSchema.set('toJSON', { virtuals: true });
invitationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Invitation', invitationSchema);
