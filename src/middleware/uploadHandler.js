const { validateFileSize } = require('../utils/fileHelper');
const { uploadToFirebase } = require('../config/firebase');

/**
 * Middleware para processar upload de avatar
 */
const handleAvatarUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024;

    if (!validateFileSize(req.file.buffer, maxSize)) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
      });
    }

    const entityId = req.params.id || 'unknown';
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filePath = `avatars/${entityId}_${Date.now()}.${ext}`;

    const url = await uploadToFirebase(req.file.buffer, filePath, req.file.mimetype);
    req.body.avatar = url;

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

    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024;

    if (!validateFileSize(req.file.buffer, maxSize)) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
      });
    }

    const entityId = req.params.id || 'unknown';
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filePath = `logos/${entityId}_${Date.now()}.${ext}`;

    const url = await uploadToFirebase(req.file.buffer, filePath, req.file.mimetype);
    req.body.logo = url;

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

    const maxSize = parseInt(process.env.MAX_PDF_SIZE) || 10 * 1024 * 1024;

    if (!validateFileSize(req.file.buffer, maxSize)) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
      });
    }

    const entityId = req.params.id || 'unknown';
    const filePath = `documents/${entityId}_${Date.now()}.pdf`;

    const url = await uploadToFirebase(req.file.buffer, filePath, 'application/pdf');
    req.body.pdfFile = url;

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

    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024;

    if (!validateFileSize(req.file.buffer, maxSize)) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
      });
    }

    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filePath = `images/${Date.now()}.${ext}`;

    const url = await uploadToFirebase(req.file.buffer, filePath, req.file.mimetype);
    req.body.image = url;

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
