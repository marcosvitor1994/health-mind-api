const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCODING = 'base64';
const SEPARATOR = ':';

// Chave de criptografia do .env (32 bytes = 64 chars hex)
function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY nao definida nas variaveis de ambiente');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Criptografa texto com AES-256-GCM
 * Retorna formato: iv:authTag:ciphertext (tudo em base64)
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') return text;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted,
  ].join(SEPARATOR);
}

/**
 * Descriptografa texto cifrado com AES-256-GCM
 * Espera formato: iv:authTag:ciphertext (base64)
 */
function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;

  // Se nao esta no formato criptografado, retorna como esta
  if (!isEncrypted(encryptedText)) return encryptedText;

  try {
    const key = getKey();
    const parts = encryptedText.split(SEPARATOR);

    if (parts.length !== 3) return encryptedText;

    const iv = Buffer.from(parts[0], ENCODING);
    const authTag = Buffer.from(parts[1], ENCODING);
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Se falhar ao descriptografar, retorna o texto original
    // Isso permite compatibilidade com dados ainda nao criptografados
    console.error('Erro ao descriptografar:', error.message);
    return encryptedText;
  }
}

/**
 * Gera HMAC-SHA256 do texto (blind index para buscas)
 * Retorna hash deterministico - mesmo texto sempre gera mesmo hash
 */
function hash(text) {
  if (!text || typeof text !== 'string') return text;

  const key = getKey();
  return crypto.createHmac('sha256', key).update(text).digest('hex');
}

/**
 * Verifica se o texto parece estar no formato criptografado
 * Formato esperado: base64:base64:base64
 */
function isEncrypted(text) {
  if (!text || typeof text !== 'string') return false;

  const parts = text.split(SEPARATOR);
  if (parts.length !== 3) return false;

  // Verifica se cada parte parece ser base64 valido
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return parts.every((part) => base64Regex.test(part) && part.length > 0);
}

module.exports = { encrypt, decrypt, hash, isEncrypted };
