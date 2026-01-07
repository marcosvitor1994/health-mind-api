const { processImageUpload, bufferToBase64, validateFileSize } = require('../utils/fileHelper');

/**
 * Middleware para processar upload de avatar
 */
const handleAvatarUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Valida tamanho do arquivo
    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024;

    if (!validateFileSize(req.file.buffer, maxSize)) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
      });
    }

    // Processa e otimiza imagem
    const base64Image = await processImageUpload(req.file.buffer, req.file.mimetype, 'avatar');

    // Adiciona ao body para ser usado no controller
    req.body.avatar = base64Image;

    next();
  } catch (error) {
    console.error('Erro ao processar avatar:', error);
    return res.status(400).json({
      success: false,
      message: 'Erro ao processar imagem: ' + error.message,
    });
  }
};

/**
 * Middleware para processar upload de logo
 */
const handleLogoUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Valida tamanho do arquivo
    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024;

    if (!validateFileSize(req.file.buffer, maxSize)) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
      });
    }

    // Processa e otimiza imagem
    const base64Image = await processImageUpload(req.file.buffer, req.file.mimetype, 'logo');

    // Adiciona ao body para ser usado no controller
    req.body.logo = base64Image;

    next();
  } catch (error) {
    console.error('Erro ao processar logo:', error);
    return res.status(400).json({
      success: false,
      message: 'Erro ao processar imagem: ' + error.message,
    });
  }
};

/**
 * Middleware para processar upload de PDF
 */
const handlePDFUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Valida tamanho do arquivo
    const maxSize = parseInt(process.env.MAX_PDF_SIZE) || 10 * 1024 * 1024;

    if (!validateFileSize(req.file.buffer, maxSize)) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
      });
    }

    // Converte PDF para Base64
    const base64PDF = bufferToBase64(req.file.buffer, req.file.mimetype);

    // Adiciona ao body para ser usado no controller
    req.body.pdfFile = base64PDF;

    next();
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return res.status(400).json({
      success: false,
      message: 'Erro ao processar PDF: ' + error.message,
    });
  }
};

/**
 * Middleware para processar upload de imagem genérica
 */
const handleImageUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Valida tamanho do arquivo
    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024;

    if (!validateFileSize(req.file.buffer, maxSize)) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
      });
    }

    // Processa e otimiza imagem
    const base64Image = await processImageUpload(req.file.buffer, req.file.mimetype, 'general');

    // Adiciona ao body para ser usado no controller
    req.body.image = base64Image;

    next();
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    return res.status(400).json({
      success: false,
      message: 'Erro ao processar imagem: ' + error.message,
    });
  }
};

/**
 * Middleware de erro para multer
 */
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de arquivo inesperado',
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Erro ao fazer upload do arquivo',
    });
  }

  next();
};

module.exports = {
  handleAvatarUpload,
  handleLogoUpload,
  handlePDFUpload,
  handleImageUpload,
  handleMulterError,
};
