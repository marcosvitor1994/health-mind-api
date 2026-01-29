const sharp = require('sharp');

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
 * Redimensiona imagem mantendo proporção
 * @param {Buffer} buffer - Buffer da imagem
 * @param {Number} maxWidth - Largura máxima
 * @param {Number} maxHeight - Altura máxima
 * @returns {Promise<Buffer>} Buffer da imagem redimensionada
 */
const resizeImage = async (buffer, maxWidth = 1024, maxHeight = 1024) => {
  try {
    return await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch (error) {
    throw new Error('Erro ao redimensionar imagem: ' + error.message);
  }
};

/**
 * Otimiza imagem para avatar
 * @param {Buffer} buffer - Buffer da imagem
 * @returns {Promise<Buffer>} Buffer da imagem otimizada
 */
const optimizeAvatar = async (buffer) => {
  try {
    return await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    throw new Error('Erro ao otimizar avatar: ' + error.message);
  }
};

/**
 * Otimiza logo para clínica
 * @param {Buffer} buffer - Buffer da imagem
 * @returns {Promise<Buffer>} Buffer da imagem otimizada
 */
const optimizeLogo = async (buffer) => {
  try {
    return await sharp(buffer)
      .resize(500, 500, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png({ quality: 90 })
      .toBuffer();
  } catch (error) {
    throw new Error('Erro ao otimizar logo: ' + error.message);
  }
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

/**
 * Processa upload de imagem (redimensiona e retorna buffer otimizado)
 * @param {Buffer} buffer - Buffer da imagem
 * @param {String} mimetype - Tipo MIME
 * @param {String} type - Tipo de imagem ('avatar', 'logo', 'general')
 * @returns {Promise<{buffer: Buffer, mimetype: String}>} Buffer otimizado e mimetype
 */
const processImageUpload = async (buffer, mimetype, type = 'general') => {
  try {
    let processedBuffer;
    let outputMimetype;

    switch (type) {
      case 'avatar':
        processedBuffer = await optimizeAvatar(buffer);
        outputMimetype = 'image/jpeg';
        break;
      case 'logo':
        processedBuffer = await optimizeLogo(buffer);
        outputMimetype = 'image/png';
        break;
      default:
        processedBuffer = await resizeImage(buffer);
        outputMimetype = 'image/jpeg';
    }

    return { buffer: processedBuffer, mimetype: outputMimetype };
  } catch (error) {
    throw new Error('Erro ao processar imagem: ' + error.message);
  }
};

module.exports = {
  bufferToBase64,
  base64ToBuffer,
  resizeImage,
  optimizeAvatar,
  optimizeLogo,
  validateFileSize,
  getBase64Info,
  isValidBase64,
  processImageUpload,
};
