const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clínica é obrigatória'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nome da sala é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome deve ter no máximo 100 caracteres'],
    },
    number: {
      type: String,
      trim: true,
      maxlength: [20, 'Número deve ter no máximo 20 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Descrição deve ter no máximo 500 caracteres'],
    },
    capacity: {
      type: Number,
      default: 2,
      min: [1, 'Capacidade mínima de 1 pessoa'],
      max: [10, 'Capacidade máxima de 10 pessoas'],
    },
    amenities: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          const validAmenities = [
            'ar_condicionado',
            'acessibilidade',
            'soundproof',
            'wifi',
            'tv',
            'sofa',
            'banheiro_privativo',
          ];
          return v.every((amenity) => validAmenities.includes(amenity));
        },
        message: 'Amenidade inválida',
      },
    },
    isActive: {
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

// Indexes
roomSchema.index({ clinicId: 1, isActive: 1 });
roomSchema.index({ clinicId: 1, name: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
roomSchema.index({ deletedAt: 1 });

// Query helper para filtrar deletados
roomSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Query helper para filtrar apenas ativos
roomSchema.query.active = function () {
  return this.where({ isActive: true, deletedAt: null });
};

// Método para soft delete
roomSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  this.isActive = false;
  return await this.save();
};

// Método para reativar sala
roomSchema.methods.activate = async function () {
  this.isActive = true;
  return await this.save();
};

// Método para desativar sala (sem deletar)
roomSchema.methods.deactivate = async function () {
  this.isActive = false;
  return await this.save();
};

// Método estático para verificar se sala pertence à clínica
roomSchema.statics.belongsToClinic = async function (roomId, clinicId) {
  const room = await this.findOne({
    _id: roomId,
    clinicId,
    deletedAt: null,
  });
  return !!room;
};

// Método estático para contar salas ativas de uma clínica
roomSchema.statics.countActiveByClinic = async function (clinicId) {
  return await this.countDocuments({
    clinicId,
    isActive: true,
    deletedAt: null,
  });
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
