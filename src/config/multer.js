const multer = require('multer');
const path = require('path');

// Configuração de armazenamento em memória (para converter para Base64)
const storage = multer.memoryStorage();

// Filtro de tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png/;
  const allowedPdfTypes = /pdf/;

  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;

  // Verificar se é imagem
  if (file.fieldname === 'image' || file.fieldname === 'logo' || file.fieldname === 'avatar') {
    const isValidImage = allowedImageTypes.test(extname) &&
                         (mimetype === 'image/jpeg' || mimetype === 'image/jpg' || mimetype === 'image/png');

    if (isValidImage) {
      return cb(null, true);
    } else {
      return cb(new Error('Apenas arquivos JPEG, JPG e PNG são permitidos para imagens'), false);
    }
  }

  // Verificar se é PDF
  if (file.fieldname === 'pdf' || file.fieldname === 'pdfFile') {
    const isValidPdf = allowedPdfTypes.test(extname) && mimetype === 'application/pdf';

    if (isValidPdf) {
      return cb(null, true);
    } else {
      return cb(new Error('Apenas arquivos PDF são permitidos'), false);
    }
  }

  cb(new Error('Tipo de arquivo não suportado'), false);
};

// Limites de tamanho
const limits = {
  fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024, // 5MB default
};

// Configuração do multer para imagens
const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024,
  },
});

// Configuração do multer para PDFs
const uploadPDF = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_PDF_SIZE) || 10 * 1024 * 1024,
  },
});

// Middleware para upload único de imagem
const singleImage = (fieldName = 'image') => uploadImage.single(fieldName);

// Middleware para upload único de PDF
const singlePDF = (fieldName = 'pdf') => uploadPDF.single(fieldName);

// Middleware para múltiplos arquivos
const multipleImages = (fieldName = 'images', maxCount = 5) =>
  uploadImage.array(fieldName, maxCount);

module.exports = {
  uploadImage,
  uploadPDF,
  singleImage,
  singlePDF,
  multipleImages,
};
