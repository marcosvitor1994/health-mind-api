const admin = require('firebase-admin');
const crypto = require('crypto');

const privateKey = process.env.PRIVATE_KEY
  ? process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n')
  : undefined;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey,
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

/**
 * Faz upload de um arquivo para o Firebase Storage
 * @param {Buffer} buffer - Buffer do arquivo
 * @param {String} filePath - Caminho do arquivo no Storage
 * @param {String} mimetype - Tipo MIME do arquivo
 * @returns {Promise<String>} URL do arquivo com download token
 */
const uploadToFirebase = async (buffer, filePath, mimetype) => {
  const file = bucket.file(filePath);
  const downloadToken = crypto.randomUUID();

  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;
};

/**
 * Deleta um arquivo do Firebase Storage a partir da URL
 * @param {String} fileUrl - URL do arquivo
 */
const deleteFromFirebase = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    let filePath;

    if (fileUrl.includes('/o/')) {
      // Formato: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media&token=...
      const encoded = fileUrl.split('/o/')[1]?.split('?')[0];
      filePath = encoded ? decodeURIComponent(encoded) : null;
    } else if (fileUrl.includes(`${bucket.name}/`)) {
      // Formato antigo: https://storage.googleapis.com/bucket/path?...
      const afterBucket = fileUrl.split(`${bucket.name}/`)[1];
      filePath = afterBucket ? afterBucket.split('?')[0] : null;
    }

    if (filePath) {
      await bucket.file(filePath).delete();
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo do Firebase:', error.message);
  }
};

module.exports = { uploadToFirebase, deleteFromFirebase };
