const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Paciente é obrigatório'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Mensagem é obrigatória'],
      trim: true,
      maxlength: [2000, 'Mensagem deve ter no máximo 2000 caracteres'],
    },
    response: {
      type: String,
      trim: true,
      maxlength: [5000, 'Resposta deve ter no máximo 5000 caracteres'],
    },
    isAI: {
      type: Boolean,
      default: false,
    },
    sentiment: {
      type: String,
      enum: {
        values: ['positive', 'neutral', 'negative', null],
        message: '{VALUE} não é um sentimento válido',
      },
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
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
chatMessageSchema.index({ patientId: 1, createdAt: -1 });
chatMessageSchema.index({ patientId: 1, sentiment: 1 });
chatMessageSchema.index({ patientId: 1, deletedAt: 1 });

// Query helper para filtrar deletados
chatMessageSchema.query.notDeleted = function () {
  return this.where({ deletedAt: null });
};

// Método para soft delete
chatMessageSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

// Método estático para obter estatísticas de sentimento
chatMessageSchema.statics.getSentimentStats = async function (patientId, startDate, endDate) {
  const match = {
    patientId: mongoose.Types.ObjectId(patientId),
    deletedAt: null,
    sentiment: { $ne: null },
  };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$sentiment',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        sentiment: '$_id',
        count: 1,
      },
    },
  ]);
};

// Método estático para análise simples de sentimento (placeholder - integrar com IA depois)
chatMessageSchema.statics.analyzeSentiment = function (text) {
  const positiveWords = ['bem', 'feliz', 'ótimo', 'bom', 'alegre', 'melhor', 'grato'];
  const negativeWords = ['mal', 'triste', 'ruim', 'péssimo', 'ansioso', 'deprimido', 'preocupado'];

  const lowerText = text.toLowerCase();

  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
