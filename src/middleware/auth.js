const jwt = require('jsonwebtoken');
const Clinic = require('../models/Clinic');
const Psychologist = require('../models/Psychologist');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');

/**
 * Middleware de autenticação JWT
 * Verifica token e adiciona user ao req
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Verificar se token existe no header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado. Token não fornecido.',
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuário baseado no role
      let user;

      switch (decoded.role) {
        case 'admin':
          user = await Admin.findById(decoded.id).select('-password');
          break;
        case 'clinic':
          user = await Clinic.findById(decoded.id).select('-password');
          break;
        case 'psychologist':
          user = await Psychologist.findById(decoded.id).select('-password');
          break;
        case 'patient':
          user = await Patient.findById(decoded.id).select('-password');
          break;
        default:
          return res.status(401).json({
            success: false,
            message: 'Role inválido no token',
          });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      // Verificar se usuário não foi deletado (soft delete)
      if (user.deletedAt) {
        return res.status(401).json({
          success: false,
          message: 'Conta desativada',
        });
      }

      // Adicionar usuário ao request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido',
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor',
    });
  }
};

/**
 * Gera token JWT
 * @param {String} id - ID do usuário
 * @param {String} role - Role do usuário
 * @returns {String} Token JWT
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

/**
 * Gera refresh token JWT
 * @param {String} id - ID do usuário
 * @param {String} role - Role do usuário
 * @returns {String} Refresh token JWT
 */
const generateRefreshToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Verifica refresh token
 * @param {String} token - Refresh token
 * @returns {Object} Payload decodificado
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Middleware opcional de autenticação
 * Similar ao protect mas não retorna erro se não houver token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user;

      switch (decoded.role) {
        case 'admin':
          user = await Admin.findById(decoded.id).select('-password');
          break;
        case 'clinic':
          user = await Clinic.findById(decoded.id).select('-password');
          break;
        case 'psychologist':
          user = await Psychologist.findById(decoded.id).select('-password');
          break;
        case 'patient':
          user = await Patient.findById(decoded.id).select('-password');
          break;
      }

      req.user = user && !user.deletedAt ? user : null;
    } catch (error) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação opcional:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  protect,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  optionalAuth,
};
