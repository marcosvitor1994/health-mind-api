const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Modelo principal: Claude 3.5 Haiku — robusto para análise clínica, custo acessível
const MODEL = 'claude-3-5-haiku-latest';

/**
 * Chama a API do Claude (Anthropic) para gerar texto
 * @param {String} prompt - Texto do prompt
 * @param {Object} options - Opções adicionais (temperature, maxTokens, timeout)
 * @returns {Promise<String>} Texto gerado pelo Claude
 */
async function callClaude(prompt, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 4096,
    timeout = 60000,
  } = options;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }, {
      timeout,
    });

    const text = message.content?.[0]?.text;

    if (!text) {
      throw new Error('Claude retornou resposta vazia');
    }

    return text;
  } catch (error) {
    const errorMsg = error.message || 'Erro desconhecido ao chamar Claude';
    throw new Error(`Claude API error: ${errorMsg}`);
  }
}

module.exports = { callClaude, MODEL };
