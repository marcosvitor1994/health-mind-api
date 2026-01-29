const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
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

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
};

/**
 * Deleta um arquivo do Firebase Storage a partir da URL
 * @param {String} fileUrl - URL pública do arquivo
 */
const deleteFromFirebase = async (fileUrl) => {
  if (!fileUrl || !fileUrl.includes(bucket.name)) return;

  try {
    const filePath = fileUrl.split(`${bucket.name}/`)[1];
    if (filePath) {
      await bucket.file(filePath).delete();
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo do Firebase:', error.message);
  }
};

module.exports = { uploadToFirebase, deleteFromFirebase };
