#!/usr/bin/env node

/**
 * Script para cancelar um convite
 *
 * Uso:
 * node scripts/cancelInvite.js <email_ou_id>
 *
 * Exemplo:
 * node scripts/cancelInvite.js clinica@example.com
 * node scripts/cancelInvite.js 65abc123def456...
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Invitation = require('../src/models/Invitation');

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB conectado\n');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
};

// Script principal
const main = async () => {
  try {
    const searchTerm = process.argv[2];

    if (!searchTerm) {
      console.log('❌ Uso: node scripts/cancelInvite.js <email_ou_id>\n');
      console.log('Exemplos:');
      console.log('  node scripts/cancelInvite.js clinica@example.com');
      console.log('  node scripts/cancelInvite.js 65abc123def456...\n');
      process.exit(1);
    }

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║                                                  ║');
    console.log('║           🚫 CANCELAR CONVITE 🚫                ║');
    console.log('║                                                  ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // Conectar ao banco
    await connectDB();

    // Buscar convite
    let invitation;

    if (mongoose.Types.ObjectId.isValid(searchTerm)) {
      invitation = await Invitation.findById(searchTerm);
    } else {
      invitation = await Invitation.findOne({ email: searchTerm, status: 'pending' });
    }

    if (!invitation) {
      console.log('❌ Convite não encontrado!\n');
      process.exit(1);
    }

    // Mostrar informações
    console.log('📋 Convite encontrado:');
    console.log(`   ID: ${invitation._id}`);
    console.log(`   E-mail: ${invitation.email}`);
    console.log(`   Nome: ${invitation.preFilledData.name}`);
    console.log(`   Tipo: ${invitation.role}`);
    console.log(`   Status: ${invitation.status}\n`);

    if (invitation.status !== 'pending') {
      console.log(`⚠️  Este convite já está com status: ${invitation.status}`);
      console.log('   Apenas convites pendentes podem ser cancelados.\n');
      process.exit(0);
    }

    // Cancelar
    invitation.status = 'expired';
    await invitation.save();

    console.log('✅ Convite cancelado com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

// Executar
main();
