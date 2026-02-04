/**
 * Script para criar o admin inicial do sistema
 *
 * Uso:
 *   node src/scripts/seedAdmin.js
 *
 * Ou com senha customizada:
 *   ADMIN_PASSWORD=minhasenha node src/scripts/seedAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@healthmind.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';

async function seedAdmin() {
  try {
    // Conectar ao MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI não definida no .env');
    }

    console.log('Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Conectado ao MongoDB');

    // Verificar se já existe um admin
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('\n⚠️  Admin já existe com este email:', ADMIN_EMAIL);
      console.log('Se você precisa redefinir a senha, delete o admin manualmente primeiro.');

      // Mostrar informações do admin existente
      console.log('\nAdmin existente:');
      console.log('  ID:', existingAdmin._id);
      console.log('  Nome:', existingAdmin.name);
      console.log('  Email:', existingAdmin.email);
      console.log('  Super Admin:', existingAdmin.permissions?.promoteAdmin ? 'Sim' : 'Não');
      console.log('  Criado em:', existingAdmin.createdAt);

      await mongoose.connection.close();
      process.exit(0);
    }

    // Criar admin
    console.log('\nCriando admin inicial...');

    const admin = await Admin.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      permissions: {
        manageUsers: true,
        manageClinics: true,
        viewMetrics: true,
        promoteAdmin: true, // Super admin pode criar outros admins
      },
    });

    console.log('\n✅ Admin criado com sucesso!');
    console.log('\n═══════════════════════════════════════════');
    console.log('  CREDENCIAIS DO ADMIN');
    console.log('═══════════════════════════════════════════');
    console.log('  Email:', ADMIN_EMAIL);
    console.log('  Senha:', ADMIN_PASSWORD);
    console.log('═══════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    console.log('\nID do Admin:', admin._id);

    await mongoose.connection.close();
    console.log('\nConexão com MongoDB fechada.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao criar admin:', error.message);

    if (error.code === 11000) {
      console.log('O email já está em uso por outro usuário.');
    }

    await mongoose.connection.close();
    process.exit(1);
  }
}

seedAdmin();
