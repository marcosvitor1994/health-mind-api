/**
 * Script de migracao: criptografa dados existentes no MongoDB
 *
 * Uso: node src/scripts/migrateEncryption.js
 *
 * Este script:
 * 1. Le todos os documentos de cada collection
 * 2. Criptografa campos sensiveis que ainda estao em texto plano
 * 3. Gera hashes (blind index) para CPF, CRP e CNPJ
 * 4. Pode ser executado multiplas vezes com seguranca (idempotente)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { encrypt, hash, isEncrypted } = require('../utils/encryption');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI nao definida');
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY) {
  console.error('ENCRYPTION_KEY nao definida');
  process.exit(1);
}

async function migrateCollection(db, collectionName, fields, hashFields = {}) {
  const collection = db.collection(collectionName);
  const cursor = collection.find({});
  let total = 0;
  let updated = 0;

  console.log(`\n--- Migrando ${collectionName} ---`);

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    total++;
    const updateObj = {};
    let needsUpdate = false;

    for (const field of fields) {
      const value = getNestedValue(doc, field);

      if (value && typeof value === 'string' && !isEncrypted(value)) {
        setNestedValue(updateObj, field, encrypt(value));
        needsUpdate = true;
      }
    }

    // Gerar hashes para campos de busca
    for (const [field, hashField] of Object.entries(hashFields)) {
      const value = getNestedValue(doc, field);

      if (value && typeof value === 'string') {
        // Usar o valor original (antes de criptografar) para gerar o hash
        const originalValue = isEncrypted(value) ? null : value;
        if (originalValue) {
          updateObj[hashField] = hash(originalValue);
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      await collection.updateOne({ _id: doc._id }, { $set: updateObj });
      updated++;
    }
  }

  console.log(`  Total: ${total} | Atualizados: ${updated}`);
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

async function main() {
  console.log('Conectando ao MongoDB...');
  const conn = await mongoose.connect(MONGODB_URI);
  const db = conn.connection.db;
  console.log('Conectado!');

  // Patient: cpf, phone, emergencyContact.name, emergencyContact.phone
  await migrateCollection(
    db,
    'patients',
    ['cpf', 'phone', 'emergencyContact.name', 'emergencyContact.phone'],
    { cpf: '_cpfHash' }
  );

  // Psychologist: crp, phone, paymentSettings.bankInfo.agency/account/pixKey
  await migrateCollection(
    db,
    'psychologists',
    ['crp', 'phone', 'paymentSettings.bankInfo.agency', 'paymentSettings.bankInfo.account', 'paymentSettings.bankInfo.pixKey'],
    { crp: '_crpHash' }
  );

  // Clinic: cnpj, phone, paymentSettings.bankInfo.agency/account/pixKey
  await migrateCollection(
    db,
    'clinics',
    ['cnpj', 'phone', 'paymentSettings.bankInfo.agency', 'paymentSettings.bankInfo.account', 'paymentSettings.bankInfo.pixKey'],
    { cnpj: '_cnpjHash' }
  );

  // ChatMessage: message, response
  await migrateCollection(
    db,
    'chatmessages',
    ['message', 'response']
  );

  // Document: content
  await migrateCollection(
    db,
    'documents',
    ['content']
  );

  console.log('\n=== Migracao concluida! ===');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error('Erro na migracao:', error);
  process.exit(1);
});
