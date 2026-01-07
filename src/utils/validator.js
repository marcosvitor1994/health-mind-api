/**
 * Valida formato de email
 * @param {String} email
 * @returns {Boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return emailRegex.test(email);
};

/**
 * Valida CPF (11 dígitos)
 * @param {String} cpf
 * @returns {Boolean}
 */
const isValidCPF = (cpf) => {
  if (!cpf) return false;

  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
};

/**
 * Valida CNPJ (14 dígitos)
 * @param {String} cnpj
 * @returns {Boolean}
 */
const isValidCNPJ = (cnpj) => {
  if (!cnpj) return false;

  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/\D/g, '');

  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  // Validação dos dígitos verificadores
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

/**
 * Valida CRP (formato: XX/XXXXX ou XX/XXXXXX)
 * @param {String} crp
 * @returns {Boolean}
 */
const isValidCRP = (crp) => {
  if (!crp) return false;
  const crpRegex = /^\d{2}\/\d{5,6}$/;
  return crpRegex.test(crp);
};

/**
 * Valida telefone brasileiro
 * @param {String} phone
 * @returns {Boolean}
 */
const isValidPhone = (phone) => {
  if (!phone) return false;

  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');

  // Verifica se tem 10 ou 11 dígitos (DDD + número)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

/**
 * Valida CEP brasileiro
 * @param {String} zipCode
 * @returns {Boolean}
 */
const isValidZipCode = (zipCode) => {
  if (!zipCode) return false;

  // Remove caracteres não numéricos
  const cleanZip = zipCode.replace(/\D/g, '');

  // Verifica se tem 8 dígitos
  return cleanZip.length === 8;
};

/**
 * Valida força da senha
 * @param {String} password
 * @returns {Object} { valid: Boolean, errors: Array }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password) {
    return { valid: false, errors: ['Senha é obrigatória'] };
  }

  if (password.length < 6) {
    errors.push('Senha deve ter no mínimo 6 caracteres');
  }

  if (password.length > 128) {
    errors.push('Senha deve ter no máximo 128 caracteres');
  }

  // Recomendações adicionais (não obrigatórias)
  const recommendations = [];

  if (!/[A-Z]/.test(password)) {
    recommendations.push('Senha deveria conter letras maiúsculas');
  }

  if (!/[a-z]/.test(password)) {
    recommendations.push('Senha deveria conter letras minúsculas');
  }

  if (!/[0-9]/.test(password)) {
    recommendations.push('Senha deveria conter números');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    recommendations.push('Senha deveria conter caracteres especiais');
  }

  return {
    valid: errors.length === 0,
    errors,
    recommendations,
  };
};

/**
 * Sanitiza string removendo caracteres especiais perigosos
 * @param {String} str
 * @returns {String}
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';

  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Valida data de nascimento (não pode ser futura e idade mínima)
 * @param {Date|String} birthDate
 * @param {Number} minAge - Idade mínima permitida
 * @returns {Boolean}
 */
const isValidBirthDate = (birthDate, minAge = 0) => {
  const date = new Date(birthDate);
  const today = new Date();

  // Verifica se é data válida
  if (isNaN(date.getTime())) return false;

  // Não pode ser futura
  if (date > today) return false;

  // Calcula idade
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  // Verifica idade mínima
  return age >= minAge;
};

/**
 * Valida ObjectId do MongoDB
 * @param {String} id
 * @returns {Boolean}
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Formata CPF
 * @param {String} cpf
 * @returns {String}
 */
const formatCPF = (cpf) => {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ
 * @param {String} cnpj
 * @returns {String}
 */
const formatCNPJ = (cnpj) => {
  if (!cnpj) return '';
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata telefone
 * @param {String} phone
 * @returns {String}
 */
const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
};

module.exports = {
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  isValidCRP,
  isValidPhone,
  isValidZipCode,
  validatePasswordStrength,
  sanitizeString,
  isValidBirthDate,
  isValidObjectId,
  formatCPF,
  formatCNPJ,
  formatPhone,
};
