/**
 * Converte buffer de arquivo para Base64
 * @param {Buffer} buffer - Buffer do arquivo
 * @param {String} mimetype - Tipo MIME do arquivo
 * @returns {String} String Base64 com data URI
 */
const bufferToBase64 = (buffer, mimetype) => {
  if (!buffer) return null;
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
};

/**
 * Converte Base64 para buffer
 * @param {String} base64String - String Base64 (com ou sem data URI)
 * @returns {Buffer} Buffer do arquivo
 */
const base64ToBuffer = (base64String) => {
  if (!base64String) return null;

  // Remove o data URI prefix se existir
  const base64Data = base64String.replace(/^data:.*?;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

/**
 * Valida tamanho do arquivo
 * @param {Buffer} buffer - Buffer do arquivo
 * @param {Number} maxSize - Tamanho máximo em bytes
 * @returns {Boolean}
 */
const validateFileSize = (buffer, maxSize) => {
  return buffer.length <= maxSize;
};

/**
 * Extrai informações do arquivo Base64
 * @param {String} base64String - String Base64
 * @returns {Object} Objeto com mimetype e size
 */
const getBase64Info = (base64String) => {
  if (!base64String) return null;

  const matches = base64String.match(/^data:(.+?);base64,(.+)$/);

  if (!matches) {
    return {
      mimetype: 'unknown',
      size: Buffer.from(base64String, 'base64').length,
    };
  }

  const mimetype = matches[1];
  const base64Data = matches[2];
  const size = Buffer.from(base64Data, 'base64').length;

  return { mimetype, size };
};

/**
 * Valida se string é Base64 válida
 * @param {String} str - String para validar
 * @returns {Boolean}
 */
const isValidBase64 = (str) => {
  if (!str || typeof str !== 'string') return false;

  // Remove data URI prefix se existir
  const base64Data = str.replace(/^data:.*?;base64,/, '');

  // Valida formato Base64
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(base64Data);
};

module.exports = {
  bufferToBase64,
  base64ToBuffer,
  validateFileSize,
  getBase64Info,
  isValidBase64,
};
