const axios = require('axios');

const MODELS = [
  'gemini-robotics-er-1.5-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

const SECOES_OBRIGATORIAS = `

---

## REGRAS CRITICAS E LIMITES ETICOS

### 1. Diagnosticos Medicos ou Psiquiatricos
- **NUNCA** nomeie transtornos (depressao, ansiedade, borderline, etc.)
- **NUNCA** interprete sintomas como doencas
- Se o paciente perguntar sobre diagnosticos, responda: "Essa e uma avaliacao que apenas o(a) [NOME_PSICOLOGO] pode fazer durante as sessoes ou por um neuropsicologo a partir de um processo de avaliacao psicologica. O que posso fazer e acolher o que voce esta sentindo agora."

### 2. Prescricao ou Orientacao sobre Medicamentos
- **NUNCA** sugira, comente ou opine sobre medicacao
- **NUNCA** recomende alteracoes em tratamentos medicos
- Redirecione para o(a) psicologo(a) ou psiquiatra

### 3. Etica Profissional
- **NUNCA** substitua a terapia presencial - voce e um complemento
- **NUNCA** faca julgamentos morais ou de conselhos diretos
- **NUNCA** diga "voce deveria fazer X" - prefira "Como voce imagina que poderia lidar com isso?"
- Respeite a autonomia e as escolhas do paciente
- Mantenha sigilo e confidencialidade

### 4. PROTOCOLO DE EMERGENCIA

Se identificar **risco iminente de suicidio, autolesao grave ou violencia**:

**PARE O ATENDIMENTO IMEDIATAMENTE** e responda:

"Percebo que voce esta passando por um momento muito dificil e de muita dor. Neste momento, e fundamental que voce tenha apoio imediato e especializado.

**Por favor, entre em contato agora:**

- CVV - Centro de Valorizacao da Vida: 188 (Ligacao gratuita, atendimento 24h, tambem por chat no site cvv.org.br)
- SAMU: 192 (em caso de emergencia medica)
- Policia Militar: 190 (em caso de violencia ou risco imediato)
- 180 - Central de Atendimento a Mulher (em casos de violencia de genero)
- Procure o pronto-socorro ou UPA mais proximo

Voce nao esta sozinha(o) e sua vida importa. Vou comunicar o(a) [NOME_PSICOLOGO] sobre essa situacao para que ele(a) possa te acompanhar com urgencia."

**Apos enviar essa mensagem, nao continue a conversa ate que o paciente confirme que buscou ajuda ou que o momento de crise passou.**

#### Sinais de alerta que acionam o protocolo:
- Mencao explicita de planos ou ideacao suicida
- Descricao de metodos especificos de autolesao
- Despedidas ou mensagens de "fim"
- Relatos de violencia fisica grave em curso e/ou automutilacao
- Indicacao de abuso ou risco iminente a criancas

---
`;

function buildGeminiPrompt(dados) {
  const especializacoes = [
    ...(dados.publicosEspecificos || []).map((p) => `publico ${p}`),
    ...(dados.temasEspecializados || []).map((t) => t),
  ]
    .filter(Boolean)
    .join(', ');

  const tecnicas = (dados.tecnicasFavoritas || [])
    .filter((t) => t.trim())
    .map((t) => `- "${t.trim()}"`)
    .join('\n');

  return `Voce e um especialista em construir system prompts para assistentes terapeuticas digitais de psicologos.

Com base nos dados abaixo, gere um system prompt completo e personalizado para a assistente digital deste psicologo. O prompt deve ser detalhado, profissional e seguir a estrutura de um bom system prompt terapeutico.

## DADOS DO PSICOLOGO:

- **Nome Completo**: ${dados.nomeCompleto}
- **CRP**: ${dados.crp}
- **Formacao Academica**: ${dados.formacaoAcademica}
- **Abordagem Principal**: ${dados.abordagemPrincipal}
- **Descricao do trabalho**: ${dados.descricaoTrabalho}
- **Publicos especificos**: ${(dados.publicosEspecificos || []).join(', ') || 'Nao especificado'}
- **Temas especializados**: ${(dados.temasEspecializados || []).join(', ') || 'Nao especificado'}
- **Tons de comunicacao**: ${(dados.tonsComunicacao || []).join(', ')}
- **Tecnicas favoritas**: ${tecnicas || 'Nao especificado'}
- **Restricoes tematicas**: ${dados.restricoesTematicas || 'Nenhuma'}
- **Diferenciais**: ${dados.diferenciais || 'Nao especificado'}

## INSTRUCOES PARA GERAR O SYSTEM PROMPT:

1. **IDENTIDADE E CONTEXTO**: Apresente a assistente como extensao do processo terapeutico do(a) psicologo(a), com base na abordagem informada.

2. **SOBRE O PSICOLOGO**: Inclua nome, CRP, formacao, abordagem e especializacoes.

3. **PROPOSITO E FUNCAO**: Defina que a assistente e um espaco de acolhimento e registro entre sessoes - NAO substitui terapia.

4. **ABORDAGEM CLINICA**: Detalhe principios e tecnicas da abordagem ${dados.abordagemPrincipal} que a assistente deve seguir, usando as tecnicas favoritas informadas.

5. **ESTILO DE COMUNICACAO**: Defina o tom como ${(dados.tonsComunicacao || []).join(', ')}. Respostas de no maximo 3 paragrafos, terminando com pergunta reflexiva.

6. **ESPECIALIZACOES**: Gere orientacoes especificas para cada publico e tema listado (${especializacoes || 'geral'}).

7. **EXEMPLOS DE INTERACAO**: Crie 3-5 exemplos de dialogos realistas entre paciente e assistente.

8. **INICIO DA INTERACAO**: Crie uma mensagem de boas-vindas personalizada.

## SECOES OBRIGATORIAS (inclua EXATAMENTE como esta abaixo, substituindo [NOME_PSICOLOGO] por ${dados.nomeCompleto}):

${SECOES_OBRIGATORIAS}

## FORMATO DE SAIDA:
- Retorne APENAS o system prompt, sem explicacoes ou comentarios adicionais
- Use markdown para formatacao
- O prompt deve ter entre 3000 e 8000 caracteres
- Substitua todas as ocorrencias de [NOME_PSICOLOGO] pelo nome real: ${dados.nomeCompleto}`;
}

async function callGemini(prompt, modelIndex = 0, errors = []) {
  if (modelIndex >= MODELS.length) {
    const details = errors.join(' | ');
    throw new Error(`Todos os modelos Gemini falharam: ${details}`);
  }

  const model = MODELS[modelIndex];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      },
      {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      errors.push(`${model}: resposta vazia`);
      return callGemini(prompt, modelIndex + 1, errors);
    }

    return text;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error?.message || error.message || 'erro desconhecido';
    errors.push(`${model}: ${errorMsg}`);
    return callGemini(prompt, modelIndex + 1, errors);
  }
}

/**
 * Gerar system prompt personalizado via Gemini
 * @route POST /api/ai/generate-system-prompt
 * @access Public (usado durante registro)
 */
exports.generateSystemPrompt = async (req, res) => {
  try {
    const dados = req.body;

    // Validacoes basicas
    if (!dados.nomeCompleto || !dados.crp || !dados.abordagemPrincipal) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatorios: nomeCompleto, crp, abordagemPrincipal',
      });
    }

    if (!dados.tonsComunicacao || !Array.isArray(dados.tonsComunicacao) || dados.tonsComunicacao.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tonsComunicacao deve ser um array com pelo menos um item',
      });
    }

    // Gerar prompt e chamar Gemini
    const prompt = buildGeminiPrompt(dados);
    let systemPrompt = await callGemini(prompt);

    // Garantir secoes obrigatorias (protocolo de emergencia)
    const secoesComNome = SECOES_OBRIGATORIAS.replace(
      /\[NOME_PSICOLOGO\]/g,
      dados.nomeCompleto
    );

    if (!systemPrompt.includes('188') || !systemPrompt.includes('192')) {
      systemPrompt = systemPrompt + '\n' + secoesComNome;
    }

    // Truncar a 20000 caracteres
    systemPrompt = systemPrompt.substring(0, 20000);

    res.status(200).json({
      success: true,
      message: 'System prompt gerado com sucesso',
      data: { systemPrompt },
    });
  } catch (error) {
    console.error('Erro ao gerar system prompt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao gerar system prompt',
    });
  }
};
