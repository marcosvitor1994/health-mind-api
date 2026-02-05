const TherapeuticReport = require('../models/TherapeuticReport');
const ChatMessage = require('../models/ChatMessage');
const Patient = require('../models/Patient');
const { callClaude } = require('../services/claudeService');
const { isValidObjectId } = require('../utils/validator');

/**
 * Limita o tamanho das mensagens para não exceder o contexto
 * Prioriza as mensagens mais recentes
 */
function prepareMessagesForPrompt(messages, maxChars = 80000) {
  const formatted = messages.map((msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString('pt-BR');
    const time = new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const role = msg.isAI ? 'Assistente IA' : 'Paciente';
    const text = msg.message || '';
    return `[${date} ${time}] ${role}: ${text}`;
  });

  // Se o total exceder o limite, pegar as mais recentes
  let result = formatted.join('\n\n');
  if (result.length > maxChars) {
    const truncated = [];
    let totalLength = 0;
    // Percorrer de trás para frente (mais recentes primeiro)
    for (let i = formatted.length - 1; i >= 0; i--) {
      if (totalLength + formatted[i].length + 2 > maxChars) break;
      truncated.unshift(formatted[i]);
      totalLength += formatted[i].length + 2;
    }
    result = truncated.join('\n\n');
  }

  return result;
}

/**
 * Constrói o prompt para gerar o relatório terapêutico
 */
function buildReportPrompt(messagesText, periodStart, periodEnd, messagesCount) {
  const startStr = periodStart
    ? new Date(periodStart).toLocaleDateString('pt-BR')
    : 'início dos registros';
  const endStr = new Date(periodEnd).toLocaleDateString('pt-BR');

  return `Você é um assistente clínico especializado em análise terapêutica. Analise as conversas abaixo entre um paciente e uma assistente terapêutica de IA e gere um relatório clínico ESTRUTURADO para o psicólogo responsável.

CONTEXTO:
- Período analisado: ${startStr} a ${endStr}
- Total de mensagens no período: ${messagesCount}

REGRAS IMPORTANTES:
- NÃO cite trechos literais das conversas
- NÃO faça citações diretas do paciente
- NÃO inclua nomes ou dados pessoais identificáveis
- Foque em padrões, temas recorrentes e insights clínicos
- Use linguagem profissional e clínica
- O relatório deve ser rico em informações úteis para o psicólogo na preparação da sessão
- Seja detalhado e específico nas observações, sem ser genérico
- Identifique nuances emocionais e comportamentais

CONVERSAS DO PERÍODO:

${messagesText}

FORMATO DE RESPOSTA (use EXATAMENTE estas seções com ###):

### TEMAS ABORDADOS
Descreva os principais temas e assuntos discutidos pelo paciente no período. Agrupe temas relacionados e indique a frequência relativa de cada tema (ex: muito recorrente, mencionado pontualmente).

### SENTIMENTOS IDENTIFICADOS
Liste os sentimentos e emoções expressados pelo paciente. Indique a intensidade percebida, a frequência com que aparecem e em que contextos surgem. Descreva mudanças emocionais ao longo do período.

### PADRÕES COMPORTAMENTAIS
Descreva padrões de comportamento, hábitos, rotinas e formas de lidar com situações que foram mencionados ou podem ser inferidos das conversas. Inclua padrões de pensamento recorrentes.

### PONTOS DE ATENÇÃO
Liste alertas clínicos, sinais que merecem acompanhamento especial, temas sensíveis, possíveis gatilhos identificados e qualquer aspecto que o psicólogo deve monitorar com atenção.

### EVOLUÇÃO OBSERVADA
Descreva mudanças percebidas ao longo do período analisado. Identifique progressos, regressões, oscilações ou estagnações. Compare o início e o fim do período quando possível.

### SUGESTÕES PARA SESSÃO
Forneça sugestões práticas de temas para abordar, técnicas terapêuticas que podem ser úteis, perguntas a explorar e pontos a aprofundar na próxima sessão.

### RESUMO
Escreva um resumo geral de 2-3 frases sobre o estado do paciente no período analisado.`;
}

/**
 * Parseia a resposta do Claude em seções estruturadas
 */
function parseReportSections(text) {
  const sections = {
    temasAbordados: '',
    sentimentosIdentificados: '',
    padroesComportamentais: '',
    pontosDeAtencao: '',
    evolucaoObservada: '',
    sugestoesParaSessao: '',
  };
  let summary = '';

  const sectionMap = {
    'TEMAS ABORDADOS': 'temasAbordados',
    'SENTIMENTOS IDENTIFICADOS': 'sentimentosIdentificados',
    'PADRÕES COMPORTAMENTAIS': 'padroesComportamentais',
    'PADROES COMPORTAMENTAIS': 'padroesComportamentais',
    'PONTOS DE ATENÇÃO': 'pontosDeAtencao',
    'PONTOS DE ATENCAO': 'pontosDeAtencao',
    'EVOLUÇÃO OBSERVADA': 'evolucaoObservada',
    'EVOLUCAO OBSERVADA': 'evolucaoObservada',
    'SUGESTÕES PARA SESSÃO': 'sugestoesParaSessao',
    'SUGESTOES PARA SESSAO': 'sugestoesParaSessao',
    'RESUMO': '_summary',
  };

  // Dividir por ### headers
  const parts = text.split(/###\s*/);

  for (const part of parts) {
    if (!part.trim()) continue;

    // Pegar a primeira linha como título
    const lines = part.trim().split('\n');
    const title = lines[0].trim().replace(/\*\*/g, '').toUpperCase();
    const content = lines.slice(1).join('\n').trim();

    // Encontrar a seção correspondente
    for (const [key, field] of Object.entries(sectionMap)) {
      if (title.includes(key)) {
        if (field === '_summary') {
          summary = content;
        } else {
          sections[field] = content;
        }
        break;
      }
    }
  }

  return { sections, summary };
}

/**
 * Gerar relatório terapêutico via Claude
 * @route POST /api/ai/generate-therapeutic-report
 * @access Private (Psychologist)
 */
exports.generateReport = async (req, res) => {
  let report = null;

  try {
    const { patientId } = req.body;
    const psychologistId = req.user._id;

    // Validações
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente é obrigatório',
      });
    }

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    // Verificar se paciente existe e pertence ao psicólogo
    const patient = await Patient.findById(patientId).notDeleted();
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Paciente não encontrado',
      });
    }

    if (
      patient.psychologistId &&
      patient.psychologistId.toString() !== psychologistId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para gerar relatório deste paciente',
      });
    }

    // Buscar o último relatório gerado para este par
    const lastReport = await TherapeuticReport.findOne({
      patientId,
      psychologistId,
      status: 'completed',
      deletedAt: null,
    }).sort({ periodEnd: -1 });

    const periodStart = lastReport ? lastReport.periodEnd : null;
    const periodEnd = new Date();

    // Buscar mensagens no período
    const messageQuery = {
      patientId,
      deletedAt: null,
    };

    if (periodStart) {
      messageQuery.createdAt = {
        $gt: periodStart,
        $lte: periodEnd,
      };
    } else {
      messageQuery.createdAt = { $lte: periodEnd };
    }

    const messages = await ChatMessage.find(messageQuery)
      .notDeleted()
      .sort({ createdAt: 1 });

    if (!messages || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Não há conversas novas para gerar relatório neste período',
      });
    }

    // Criar registro com status "generating"
    report = await TherapeuticReport.create({
      patientId,
      psychologistId,
      status: 'generating',
      periodStart,
      periodEnd,
      messagesAnalyzed: messages.length,
    });

    // Preparar mensagens para o prompt (com limite de tamanho)
    const messagesText = prepareMessagesForPrompt(messages);

    // Construir prompt
    const prompt = buildReportPrompt(messagesText, periodStart, periodEnd, messages.length);

    // Chamar Claude com timeout maior e mais tokens
    const claudeResponse = await callClaude(prompt, {
      temperature: 0.4,
      maxTokens: 8192,
      timeout: 120000,
    });

    // Parsear resposta em seções
    const { sections, summary } = parseReportSections(claudeResponse);

    // Atualizar relatório com conteúdo
    report.sections = sections;
    report.summary = summary;
    report.status = 'completed';
    await report.save();

    // Recarregar para aplicar decriptação nos hooks
    const completedReport = await TherapeuticReport.findById(report._id);

    res.status(201).json({
      success: true,
      message: 'Relatório terapêutico gerado com sucesso',
      data: completedReport,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório terapêutico:', error);

    // Marcar como falho se o registro já foi criado
    if (report && report._id) {
      try {
        await TherapeuticReport.findByIdAndUpdate(report._id, {
          status: 'failed',
        });
      } catch (updateErr) {
        console.error('Erro ao atualizar status do relatório:', updateErr);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao gerar relatório terapêutico',
    });
  }
};

/**
 * Listar relatórios terapêuticos de um paciente
 * @route GET /api/ai/therapeutic-reports/:patientId
 * @access Private (Psychologist)
 */
exports.getReports = async (req, res) => {
  try {
    const { patientId } = req.params;
    const psychologistId = req.user._id;

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do paciente inválido',
      });
    }

    const reports = await TherapeuticReport.find({
      patientId,
      psychologistId,
      deletedAt: null,
    })
      .select('patientId psychologistId status periodStart periodEnd messagesAnalyzed summary createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Relatórios obtidos com sucesso',
      data: {
        reports,
        total: reports.length,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar relatórios terapêuticos',
      error: error.message,
    });
  }
};

/**
 * Obter relatório terapêutico por ID
 * @route GET /api/ai/therapeutic-report/:reportId
 * @access Private (Psychologist)
 */
exports.getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const psychologistId = req.user._id;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'ID do relatório inválido',
      });
    }

    const report = await TherapeuticReport.findOne({
      _id: reportId,
      psychologistId,
      deletedAt: null,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Relatório não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Relatório obtido com sucesso',
      data: report,
    });
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar relatório terapêutico',
      error: error.message,
    });
  }
};
