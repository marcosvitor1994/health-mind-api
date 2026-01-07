const ChatMessage = require('../models/ChatMessage');
const Patient = require('../models/Patient');
const { isValidObjectId, sanitizeString } = require('../utils/validator');

/**
 * Enviar mensagem no chat
 * @route POST /api/chat
 * @access Private (Patient)
 */
exports.sendMessage = async (req, res) => {
  try {
    const { patientId, message } = req.body;

    // Validações
    if (!patientId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça todos os campos obrigatórios',
      });
    }

    // Validar ObjectId
    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    // Validar tamanho da mensagem
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem muito longa. Máximo de 2000 caracteres',
      });
    }

    // Verificar se paciente existe
    const patient = await Patient.findById(patientId).notDeleted();
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    // Análise de sentimento
    const sentiment = ChatMessage.analyzeSentiment(message);

    // Criar mensagem do usuário
    const userMessage = await ChatMessage.create({
      patientId,
      message: sanitizeString(message),
      isAI: false,
      sentiment,
    });

    // Gerar resposta da IA (placeholder - integrar com OpenAI/Claude depois)
    const aiResponse = await generateAIResponse(message, patientId);

    // Criar mensagem da IA
    const aiMessage = await ChatMessage.create({
      patientId,
      message: aiResponse,
      response: aiResponse,
      isAI: true,
      sentiment: 'neutral',
    });

    res.status(201).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: {
        userMessage,
        aiMessage,
      },
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar mensagem',
      error: error.message,
    });
  }
};

/**
 * Obter histórico de chat do paciente
 * @route GET /api/chat/patient/:patientId
 * @access Private (Patient, Psychologist)
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 50, startDate = '', endDate = '' } = req.query;

    // Validar ObjectId
    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    // Verificar se paciente existe
    const patient = await Patient.findById(patientId).notDeleted();
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    // Construir query
    const query = { patientId };

    // Filtrar por data
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Buscar mensagens com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await ChatMessage.find(query)
      .notDeleted()
      .sort({ createdAt: 1 }) // Ordem cronológica
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChatMessage.countDocuments({ ...query, deletedAt: null });

    // Calcular estatísticas de sentimento
    const sentimentStats = await ChatMessage.getSentimentStats(patientId, startDate, endDate);

    res.status(200).json({
      success: true,
      message: 'Histórico de chat obtido com sucesso',
      data: {
        messages,
        sentimentStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de chat:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico de chat',
      error: error.message,
    });
  }
};

/**
 * Deletar mensagem (soft delete)
 * @route DELETE /api/chat/:id
 * @access Private (Patient, Psychologist)
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID da mensagem inválido',
      });
    }

    // Buscar mensagem
    const message = await ChatMessage.findById(id).notDeleted();

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensagem não encontrada',
      });
    }

    // Soft delete
    await message.softDelete();

    res.status(200).json({
      success: true,
      message: 'Mensagem deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar mensagem',
      error: error.message,
    });
  }
};

/**
 * Gerar resposta da IA (placeholder)
 * TODO: Integrar com OpenAI/Claude API
 * @param {String} message - Mensagem do usuário
 * @param {String} patientId - ID do paciente
 * @returns {Promise<String>} Resposta da IA
 */
async function generateAIResponse(message, patientId) {
  // Placeholder - resposta padrão
  // Aqui você integraria com OpenAI GPT-4, Claude, ou outro modelo de IA

  const responses = [
    'Entendo como você está se sentindo. Pode me contar mais sobre isso?',
    'Obrigado por compartilhar isso comigo. Como isso tem afetado seu dia a dia?',
    'Essa é uma questão importante. Você já conversou com seu psicólogo sobre isso?',
    'Estou aqui para ouvir. O que você acha que poderia ajudar nessa situação?',
    'É normal sentir-se assim. Lembre-se de que você não está sozinho nessa jornada.',
  ];

  // Análise simples da mensagem para escolher resposta mais adequada
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('triste') || lowerMessage.includes('deprimido')) {
    return 'Sinto muito que você esteja se sentindo assim. Seus sentimentos são válidos. Você tem conversado com seu psicólogo sobre esses sentimentos? Lembre-se de que estou aqui para apoiá-lo, mas em casos de sentimentos intensos, é importante buscar ajuda profissional.';
  }

  if (lowerMessage.includes('ansioso') || lowerMessage.includes('preocupado')) {
    return 'A ansiedade pode ser desafiadora. Você tem praticado alguma técnica de respiração ou mindfulness? Seu psicólogo pode te ajudar com estratégias específicas para gerenciar esses sentimentos.';
  }

  if (lowerMessage.includes('feliz') || lowerMessage.includes('bem') || lowerMessage.includes('melhor')) {
    return 'Que maravilha saber que você está se sentindo bem! É importante celebrar esses momentos positivos. O que você acha que contribuiu para esse sentimento?';
  }

  // Resposta padrão aleatória
  return responses[Math.floor(Math.random() * responses.length)];
}
