const Document = require('../models/Document');
const Patient = require('../models/Patient');
const Psychologist = require('../models/Psychologist');
const { deleteFromFirebase } = require('../config/firebase');
const { isValidObjectId, sanitizeString } = require('../utils/validator');

/**
 * Criar documento
 * @route POST /api/documents
 * @access Private (Psychologist)
 */
exports.createDocument = async (req, res) => {
  try {
    const { patientId, psychologistId, type, title, content, tags, isPrivate } = req.body;

    // Validações
    if (!patientId || !psychologistId || !type || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça todos os campos obrigatórios',
      });
    }

    // Validar ObjectIds
    if (!isValidObjectId(patientId) || !isValidObjectId(psychologistId)) {
      return res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
    }

    // Validar tipo de documento
    const validTypes = ['anamnesis', 'session_report', 'evaluation', 'prescription', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento inválido',
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

    // Verificar se psicólogo existe
    const psychologist = await Psychologist.findById(psychologistId).notDeleted();
    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psicólogo não encontrado',
      });
    }

    // Verificar se o paciente pertence ao psicólogo
    if (patient.psychologistId.toString() !== psychologistId) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para criar documentos para este paciente',
      });
    }

    // Criar documento
    const document = await Document.create({
      patientId,
      psychologistId,
      type,
      title: sanitizeString(title),
      content: sanitizeString(content),
      tags: Array.isArray(tags) ? tags.map(tag => sanitizeString(tag)) : [],
      isPrivate: isPrivate !== undefined ? isPrivate : true,
    });

    res.status(201).json({
      success: true,
      message: 'Documento criado com sucesso',
      data: document,
    });
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar documento',
      error: error.message,
    });
  }
};

/**
 * Obter documento
 * @route GET /api/documents/:id
 * @access Private (Psychologist, Patient)
 */
exports.getDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do documento inválido',
      });
    }

    // Buscar documento
    const document = await Document.findById(id)
      .notDeleted()
      .populate('patientId', 'name email')
      .populate('psychologistId', 'name crp');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Documento encontrado com sucesso',
      data: document,
    });
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar documento',
      error: error.message,
    });
  }
};

/**
 * Atualizar documento
 * @route PUT /api/documents/:id
 * @access Private (Psychologist)
 */
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isPrivate } = req.body;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do documento inválido',
      });
    }

    // Buscar documento
    const document = await Document.findById(id).notDeleted();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    // Atualizar campos permitidos
    if (title) document.title = sanitizeString(title);
    if (content) document.content = sanitizeString(content);
    if (tags && Array.isArray(tags)) {
      document.tags = tags.map(tag => sanitizeString(tag));
    }
    if (isPrivate !== undefined) document.isPrivate = isPrivate;

    await document.save();

    res.status(200).json({
      success: true,
      message: 'Documento atualizado com sucesso',
      data: document,
    });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar documento',
      error: error.message,
    });
  }
};

/**
 * Deletar documento (soft delete)
 * @route DELETE /api/documents/:id
 * @access Private (Psychologist)
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do documento inválido',
      });
    }

    // Buscar documento
    const document = await Document.findById(id).notDeleted();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    // Soft delete
    await document.softDelete();

    res.status(200).json({
      success: true,
      message: 'Documento deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar documento',
      error: error.message,
    });
  }
};

/**
 * Upload de PDF para documento
 * @route POST /api/documents/:id/pdf
 * @access Private (Psychologist)
 */
exports.uploadPDF = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do documento inválido',
      });
    }

    if (!req.body.pdfFile) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado',
      });
    }

    const document = await Document.findById(id).notDeleted();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado',
      });
    }

    // Deletar PDF antigo do Firebase se existir
    if (document.pdfFile) {
      await deleteFromFirebase(document.pdfFile);
    }

    // URL já foi gerada pelo middleware handlePDFUpload
    document.pdfFile = req.body.pdfFile;
    await document.save();

    res.status(200).json({
      success: true,
      message: 'PDF anexado com sucesso',
      data: {
        hasPDF: true,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer upload do PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload do PDF',
      error: error.message,
    });
  }
};

/**
 * Obter documentos de um paciente
 * @route GET /api/documents/patient/:patientId
 * @access Private (Psychologist, Patient)
 */
exports.getPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10, type = '', search = '' } = req.query;

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

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Buscar documentos com paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const documents = await Document.find(query)
      .notDeleted()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('psychologistId', 'name crp')
      .select('-pdfFile'); // Não retornar PDF na listagem

    const total = await Document.countDocuments({ ...query, deletedAt: null });

    res.status(200).json({
      success: true,
      message: 'Documentos encontrados com sucesso',
      data: {
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar documentos',
      error: error.message,
    });
  }
};
