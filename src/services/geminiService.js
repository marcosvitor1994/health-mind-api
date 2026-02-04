const axios = require('axios');

const MODELS = [
  'gemini-robotics-er-1.5-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

/**
 * Chama a API do Gemini com fallback entre modelos
 * @param {String} prompt - Texto do prompt
 * @param {Number} modelIndex - Índice do modelo atual (para fallback)
 * @param {Array} errors - Acumulador de erros
 * @param {Object} options - Opções adicionais (temperature, maxOutputTokens, timeout)
 * @returns {Promise<String>} Texto gerado pelo Gemini
 */
async function callGemini(prompt, modelIndex = 0, errors = [], options = {}) {
  if (modelIndex >= MODELS.length) {
    const details = errors.join(' | ');
    throw new Error(`Todos os modelos Gemini falharam: ${details}`);
  }

  const {
    temperature = 0.7,
    maxOutputTokens = 4096,
    timeout = 60000,
  } = options;

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
          temperature,
          maxOutputTokens,
        },
      },
      {
        timeout,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      errors.push(`${model}: resposta vazia`);
      return callGemini(prompt, modelIndex + 1, errors, options);
    }

    return text;
  } catch (error) {
    const errorMsg =
      error.response?.data?.error?.message || error.message || 'erro desconhecido';
    errors.push(`${model}: ${errorMsg}`);
    return callGemini(prompt, modelIndex + 1, errors, options);
  }
}

module.exports = { callGemini, MODELS };
