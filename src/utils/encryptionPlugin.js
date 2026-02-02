const { encrypt, decrypt, hash, isEncrypted } = require('./encryption');

/**
 * Plugin Mongoose para criptografia transparente de campos
 *
 * Uso:
 *   schema.plugin(encryptionPlugin, {
 *     fields: ['cpf', 'phone', 'emergencyContact.phone'],
 *     hashFields: ['cpf'],  // campos que precisam de blind index para busca
 *   });
 *
 * Para hashFields, o plugin cria automaticamente um campo _<field>Hash
 * que pode ser usado para buscas (ex: _cpfHash).
 */
function encryptionPlugin(schema, options = {}) {
  const { fields = [], hashFields = [] } = options;

  if (fields.length === 0) return;

  // --- Helper para acessar/setar campos aninhados (ex: 'emergencyContact.phone') ---
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (current && current[key] !== undefined) return current[key];
      return undefined;
    }, obj);
    if (target && lastKey) {
      target[lastKey] = value;
    }
  }

  // --- PRE SAVE: criptografar campos antes de salvar ---
  schema.pre('save', function (next) {
    try {
      for (const field of fields) {
        const value = getNestedValue(this, field);

        if (value && typeof value === 'string' && !isEncrypted(value)) {
          // Criptografar o valor
          setNestedValue(this, field, encrypt(value));

          // Se o campo precisa de hash para busca, gerar blind index
          if (hashFields.includes(field)) {
            const hashField = '_' + field.replace(/\./g, '_') + 'Hash';
            this[hashField] = hash(value);
          }
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  // --- POST INIT: descriptografar ao carregar documento individual ---
  schema.post('init', function (doc) {
    decryptFields(doc);
  });

  // --- POST FIND: descriptografar resultados de queries ---
  schema.post('find', function (docs) {
    if (Array.isArray(docs)) {
      docs.forEach((doc) => decryptFields(doc));
    }
  });

  schema.post('findOne', function (doc) {
    if (doc) decryptFields(doc);
  });

  schema.post('findOneAndUpdate', function (doc) {
    if (doc) decryptFields(doc);
  });

  // --- Funcao de descriptografia ---
  function decryptFields(doc) {
    if (!doc) return;

    for (const field of fields) {
      const value = getNestedValue(doc, field);

      if (value && typeof value === 'string' && isEncrypted(value)) {
        setNestedValue(doc, field, decrypt(value));
      }
    }
  }
}

module.exports = encryptionPlugin;
