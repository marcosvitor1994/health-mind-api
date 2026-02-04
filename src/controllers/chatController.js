const axios = require('axios');
const ChatMessage = require('../models/ChatMessage');
const Patient = require('../models/Patient');
const Psychologist = require('../models/Psychologist');
const { isValidObjectId, sanitizeString } = require('../utils/validator');

const N8N_WEBHOOK_URL = 'https://losningtech.app.n8n.cloud/webhook/chat/message';

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
    const createdUserMessage = await ChatMessage.create({
      patientId,
      message: sanitizeString(message),
      isAI: false,
      sentiment,
    });

    // Gerar resposta da IA (placeholder - integrar com OpenAI/Claude depois)
    const aiResponse = await generateAIResponse(message, patient);

    // Criar mensagem da IA
    const createdAiMessage = await ChatMessage.create({
      patientId,
      message: aiResponse,
      response: aiResponse,
      isAI: true,
      sentiment: 'neutral',
    });

    // Buscar as mensagens criadas para acionar hooks de descriptografia
    const userMessage = await ChatMessage.findById(createdUserMessage._id);
    const aiMessage = await ChatMessage.findById(createdAiMessage._id);

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
 * Gerar resposta da IA via n8n webhook
 * @param {String} message - Mensagem do usuário
 * @param {Object} patient - Objeto do paciente
 * @returns {Promise<String>} Resposta da IA
 */
async function generateAIResponse(message, patient) {
  try {
    const psychologistId = patient.psychologistId
      ? patient.psychologistId.toString()
      : null;

    const response = await axios.post(
      N8N_WEBHOOK_URL,
      {
        message,
        userId: patient._id.toString(),
        psychologistId,
      },
      {
        timeout: 120000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const aiText = response.data?.resposta;

    if (aiText) {
      return aiText;
    }

    console.error('Resposta do n8n sem campo "resposta":', response.data);
    return 'Desculpe, não consegui processar sua mensagem no momento. Tente novamente.';
  } catch (error) {
    console.error('Erro ao chamar n8n:', error.message);
    return 'Desculpe, não consegui processar sua mensagem no momento. Tente novamente.';
  }
}
