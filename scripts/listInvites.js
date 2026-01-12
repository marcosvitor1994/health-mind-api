#!/usr/bin/env node

/**
 * Script para listar convites
 *
 * Uso:
 * node scripts/listInvites.js
 *
 * Ou adicione ao package.json:
 * npm run invites:list
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

// Formatar data
const formatDate = (date) => {
  return new Date(date).toLocaleString('pt-BR');
};

// Obter emoji de status
const getStatusEmoji = (status) => {
  const emojis = {
    pending: '⏳',
    accepted: '✅',
    expired: '❌',
  };
  return emojis[status] || '❓';
};

// Obter emoji de role
const getRoleEmoji = (role) => {
  const emojis = {
    clinic: '🏥',
    psychologist: '👨‍⚕️',
    patient: '🧑‍🦱',
  };
  return emojis[role] || '👤';
};

// Script principal
const main = async () => {
  try {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║                                                  ║');
    console.log('║          📨 LISTA DE CONVITES 📨                ║');
    console.log('║                                                  ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // Conectar ao banco
    await connectDB();

    // Buscar convites
    const invitations = await Invitation.find()
      .sort({ createdAt: -1 })
      .limit(50);

    if (invitations.length === 0) {
      console.log('📭 Nenhum convite encontrado.\n');
      process.exit(0);
    }

    // Contar por status
    const counts = {
      pending: 0,
      accepted: 0,
      expired: 0,
    };

    invitations.forEach((inv) => {
      counts[inv.status]++;
    });

    console.log('📊 Resumo:');
    console.log(`   ⏳ Pendentes: ${counts.pending}`);
    console.log(`   ✅ Aceitos: ${counts.accepted}`);
    console.log(`   ❌ Expirados: ${counts.expired}`);
    console.log(`   📝 Total: ${invitations.length}\n`);

    console.log('═══════════════════════════════════════════════════════════════════════════════════\n');

    // Listar convites
    invitations.forEach((inv, index) => {
      const statusEmoji = getStatusEmoji(inv.status);
      const roleEmoji = getRoleEmoji(inv.role);

      console.log(`${index + 1}. ${statusEmoji} ${roleEmoji} ${inv.preFilledData.name || 'Sem nome'}`);
      console.log(`   E-mail: ${inv.email}`);
      console.log(`   Tipo: ${inv.role}`);
      console.log(`   Status: ${inv.status}`);
      console.log(`   Criado em: ${formatDate(inv.createdAt)}`);
      console.log(`   Expira em: ${formatDate(inv.expiresAt)}`);

      if (inv.status === 'accepted' && inv.acceptedAt) {
        console.log(`   Aceito em: ${formatDate(inv.acceptedAt)}`);
      }

      if (inv.status === 'pending') {
        console.log(`   🔗 Link: ${inv.invitationUrl}`);
      }

      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

// Executar
main();
