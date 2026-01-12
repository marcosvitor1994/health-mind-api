#!/usr/bin/env node

/**
 * Script para criar convite de clínica
 *
 * Uso:
 * node scripts/createClinicInvite.js
 *
 * Ou adicione ao package.json:
 * npm run invite:clinic
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const Invitation = require('../src/models/Invitation');
const Clinic = require('../src/models/Clinic');
const { sendClinicInvitation } = require('../src/services/emailService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para fazer perguntas
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

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

// Validar email
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Limpar CNPJ
const cleanCNPJ = (cnpj) => {
  return cnpj.replace(/\D/g, '');
};

// Script principal
const main = async () => {
  try {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║                                                  ║');
    console.log('║     🏥 CRIAR CONVITE PARA CLÍNICA 🏥            ║');
    console.log('║                                                  ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // Conectar ao banco
    await connectDB();

    // Coletar dados
    const email = await question('📧 E-mail da clínica: ');

    if (!isValidEmail(email)) {
      console.log('❌ E-mail inválido!');
      process.exit(1);
    }

    // Verificar se email já existe
    const existingClinic = await Clinic.findOne({ email });
    if (existingClinic) {
      console.log('❌ Já existe uma clínica cadastrada com este e-mail!');
      process.exit(1);
    }

    // Verificar se já existe convite pendente
    const existingInvitation = await Invitation.findOne({
      email,
      role: 'clinic',
      status: 'pending',
    });

    if (existingInvitation && existingInvitation.isValid()) {
      console.log('❌ Já existe um convite pendente para este e-mail!');
      console.log(`\nLink do convite: ${existingInvitation.invitationUrl}`);
      console.log(`Expira em: ${existingInvitation.expiresAt.toLocaleString()}\n`);

      const resend = await question('Deseja reenviar o e-mail? (s/n): ');

      if (resend.toLowerCase() === 's') {
        try {
          await sendClinicInvitation(existingInvitation);
          console.log('✅ E-mail reenviado com sucesso!\n');
        } catch (error) {
          console.log('⚠️  Erro ao enviar e-mail, mas o convite existe.');
          console.log(`Link: ${existingInvitation.invitationUrl}\n`);
        }
      }

      process.exit(0);
    }

    const name = await question('🏢 Nome da clínica: ');
    const cnpj = await question('📄 CNPJ (opcional, pressione Enter para pular): ');

    console.log('\n📝 Confirmação dos dados:');
    console.log(`   E-mail: ${email}`);
    console.log(`   Nome: ${name}`);
    if (cnpj) {
      console.log(`   CNPJ: ${cnpj}`);
    }
    console.log('');

    const confirm = await question('Confirma os dados? (s/n): ');

    if (confirm.toLowerCase() !== 's') {
      console.log('❌ Operação cancelada!');
      process.exit(0);
    }

    // Criar convite
    console.log('\n🔄 Criando convite...');

    const token = Invitation.generateToken();

    const invitation = await Invitation.create({
      email,
      role: 'clinic',
      token,
      preFilledData: {
        name,
        cnpj: cnpj ? cleanCNPJ(cnpj) : undefined,
      },
      invitedBy: {
        userModel: 'Admin',
        userName: 'Administrador do Sistema',
      },
    });

    console.log('✅ Convite criado com sucesso!\n');

    // Tentar enviar e-mail
    console.log('📧 Enviando e-mail...');
    console.log(`DEBUG - EMAIL_USER: ${process.env.EMAIL_USER ? 'Configurado' : 'NÃO configurado'}`);
    console.log(`DEBUG - EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? 'Configurado' : 'NÃO configurado'}`);

    try {
      await sendClinicInvitation(invitation);
      console.log('✅ E-mail enviado com sucesso!\n');
    } catch (emailError) {
      console.log('⚠️  Erro ao enviar e-mail:', emailError.message);
      console.log('   Mas o convite foi criado com sucesso!\n');
    }

    // Mostrar informações
    console.log('╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                     CONVITE CRIADO COM SUCESSO!                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 Informações do Convite:');
    console.log('');
    console.log(`   ID: ${invitation._id}`);
    console.log(`   E-mail: ${invitation.email}`);
    console.log(`   Nome: ${invitation.preFilledData.name}`);
    console.log(`   Status: ${invitation.status}`);
    console.log(`   Expira em: ${invitation.expiresAt.toLocaleString()}`);
    console.log('');
    console.log('🔗 Link de Convite:');
    console.log(`   ${invitation.invitationUrl}`);
    console.log('');
    console.log('💡 Envie este link para a clínica finalizar o cadastro!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    mongoose.connection.close();
  }
};

// Executar
main();
