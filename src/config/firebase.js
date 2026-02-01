const admin = require('firebase-admin');

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
 * @param {String} filePath - Caminho do arquivo no Storage (ex: "avatars/patients/123_1700000000.jpg")
 * @param {String} mimetype - Tipo MIME do arquivo
 * @returns {Promise<String>} URL pública do arquivo
 */
const uploadToFirebase = async (buffer, filePath, mimetype) => {
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
    },
  });

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
};

/**
 * Deleta um arquivo do Firebase Storage a partir da URL
 * @param {String} fileUrl - URL pública do arquivo
 */
const deleteFromFirebase = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    let filePath;

    if (fileUrl.includes('/o/')) {
      // Formato: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media
      const encoded = fileUrl.split('/o/')[1]?.split('?')[0];
      filePath = encoded ? decodeURIComponent(encoded) : null;
    } else if (fileUrl.includes(bucket.name)) {
      // Formato antigo: https://storage.googleapis.com/bucket/path
      filePath = fileUrl.split(`${bucket.name}/`)[1];
    }

    if (filePath) {
      await bucket.file(filePath).delete();
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo do Firebase:', error.message);
  }
};

module.exports = { uploadToFirebase, deleteFromFirebase };
