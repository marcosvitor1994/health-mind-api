/**
 * Script de Teste - População e Autenticação
 *
 * Este script:
 * 1. Cria usuários de teste (Clínica, Psicólogo, Paciente)
 * 2. Cria agendamentos ligados a eles
 * 3. Testa as rotas de autenticação (login)
 * 4. Verifica as relações entre entidades
 *
 * Uso: node scripts/testPopulateAndAuth.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Clinic = require('../src/models/Clinic');
const Psychologist = require('../src/models/Psychologist');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');

// Auth utilities
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Dados de teste
const testData = {
  clinic: {
    name: 'Clínica Saúde Mental Teste',
    cnpj: '12345678000199',
    email: 'clinica.teste@healthmind.com',
    password: 'Clinica@123',
    phone: '11999998888',
    address: {
      street: 'Rua das Flores',
      number: '123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234567'
    }
  },
  psychologist: {
    name: 'Dr. João Silva',
    email: 'joao.silva@healthmind.com',
    password: 'Psicologo@123',
    crp: '06/123456',
    phone: '11988887777',
    specialties: ['Terapia Cognitivo-Comportamental', 'Ansiedade', 'Depressão']
  },
  patient: {
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    password: 'Paciente@123',
    phone: '11977776666',
    birthDate: new Date('1990-05-15'),
    cpf: '12345678901',
    emergencyContact: {
      name: 'José Santos',
      phone: '11966665555',
      relationship: 'Irmão'
    }
  },
  // Dados adicionais para mais testes
  additionalUsers: [
    {
      type: 'psychologist',
      data: {
        name: 'Dra. Ana Costa',
        email: 'ana.costa@healthmind.com',
        password: 'Psicologo@456',
        crp: '06/654321',
        phone: '11955554444',
        specialties: ['Psicanálise', 'Trauma', 'TEPT']
      }
    },
    {
      type: 'patient',
      data: {
        name: 'Carlos Oliveira',
        email: 'carlos.oliveira@email.com',
        password: 'Paciente@456',
        phone: '11944443333',
        birthDate: new Date('1985-10-20'),
        cpf: '98765432109'
      }
    },
    {
      type: 'patient',
      data: {
        name: 'Juliana Lima',
        email: 'juliana.lima@email.com',
        password: 'Paciente@789',
        phone: '11933332222',
        birthDate: new Date('1995-03-08'),
        cpf: '45678912345'
      }
    }
  ]
};

// Resultados do teste
const results = {
  users: [],
  appointments: [],
  authTests: [],
  relationTests: []
};

// Funções auxiliares
function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

async function testLogin(email, password, expectedRole) {
  const models = { clinic: Clinic, psychologist: Psychologist, patient: Patient };

  for (const [role, Model] of Object.entries(models)) {
    const user = await Model.findOne({ email }).select('+password');
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const token = generateToken(user._id, role);
        return {
          success: true,
          role,
          userId: user._id,
          token,
          matchedExpectedRole: role === expectedRole
        };
      }
    }
  }
  return { success: false, error: 'Credenciais inválidas' };
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Limpando dados de teste anteriores...');

  // Remover por emails específicos de teste
  const testEmails = [
    testData.clinic.email,
    testData.psychologist.email,
    testData.patient.email,
    ...testData.additionalUsers.map(u => u.data.email)
  ];

  await Patient.deleteMany({ email: { $in: testEmails } });
  await Psychologist.deleteMany({ email: { $in: testEmails } });
  await Clinic.deleteMany({ email: { $in: testEmails } });

  console.log('✅ Dados anteriores removidos');
}

async function createTestUsers() {
  console.log('\n👥 Criando usuários de teste...\n');

  // 1. Criar Clínica
  console.log('📍 Criando Clínica...');
  const clinic = new Clinic(testData.clinic);
  await clinic.save();
  results.users.push({
    tipo: 'Clínica',
    nome: clinic.name,
    email: clinic.email,
    senha: testData.clinic.password,
    id: clinic._id
  });
  console.log(`   ✅ Clínica criada: ${clinic.name}`);

  // 2. Criar Psicólogo Principal
  console.log('📍 Criando Psicólogo...');
  const psychologist = new Psychologist({
    ...testData.psychologist,
    clinicId: clinic._id
  });
  await psychologist.save();
  results.users.push({
    tipo: 'Psicólogo',
    nome: psychologist.name,
    email: psychologist.email,
    senha: testData.psychologist.password,
    id: psychologist._id,
    clinicaVinculada: clinic.name
  });
  console.log(`   ✅ Psicólogo criado: ${psychologist.name}`);

  // 3. Criar Paciente Principal
  console.log('📍 Criando Paciente...');
  const patient = new Patient({
    ...testData.patient,
    psychologistId: psychologist._id
  });
  await patient.save();
  results.users.push({
    tipo: 'Paciente',
    nome: patient.name,
    email: patient.email,
    senha: testData.patient.password,
    id: patient._id,
    psicologoVinculado: psychologist.name
  });
  console.log(`   ✅ Paciente criado: ${patient.name}`);

  // 4. Criar usuários adicionais
  let additionalPsychologist = null;

  for (const additional of testData.additionalUsers) {
    if (additional.type === 'psychologist') {
      console.log('📍 Criando Psicólogo adicional...');
      const psych = new Psychologist({
        ...additional.data,
        clinicId: clinic._id
      });
      await psych.save();
      additionalPsychologist = psych;
      results.users.push({
        tipo: 'Psicólogo',
        nome: psych.name,
        email: psych.email,
        senha: additional.data.password,
        id: psych._id,
        clinicaVinculada: clinic.name
      });
      console.log(`   ✅ Psicólogo criado: ${psych.name}`);
    } else if (additional.type === 'patient') {
      console.log('📍 Criando Paciente adicional...');
      // Alterna entre psicólogos
      const assignedPsych = additionalPsychologist || psychologist;
      const pat = new Patient({
        ...additional.data,
        psychologistId: assignedPsych._id
      });
      await pat.save();
      results.users.push({
        tipo: 'Paciente',
        nome: pat.name,
        email: pat.email,
        senha: additional.data.password,
        id: pat._id,
        psicologoVinculado: assignedPsych.name
      });
      console.log(`   ✅ Paciente criado: ${pat.name}`);
    }
  }

  return { clinic, psychologist, patient };
}

async function createTestAppointments(clinic, psychologist, patient) {
  console.log('\n📅 Criando agendamentos de teste...\n');

  // Buscar todos os pacientes e psicólogos criados
  const allPatients = await Patient.find({
    email: { $in: results.users.filter(u => u.tipo === 'Paciente').map(u => u.email) }
  });
  const allPsychologists = await Psychologist.find({
    email: { $in: results.users.filter(u => u.tipo === 'Psicólogo').map(u => u.email) }
  });

  const appointments = [];

  // Criar agendamentos variados
  const appointmentTemplates = [
    {
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      duration: 50,
      type: 'online',
      status: 'scheduled',
      notes: 'Primeira sessão de avaliação'
    },
    {
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dias
      duration: 50,
      type: 'in_person',
      status: 'confirmed',
      notes: 'Sessão presencial confirmada'
    },
    {
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
      duration: 60,
      type: 'online',
      status: 'scheduled',
      notes: 'Sessão estendida para reavaliação'
    },
    {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 semana
      duration: 50,
      type: 'online',
      status: 'scheduled',
      notes: 'Acompanhamento semanal'
    }
  ];

  let templateIndex = 0;

  for (const pat of allPatients) {
    // Encontrar o psicólogo do paciente
    const psych = allPsychologists.find(p => p._id.equals(pat.psychologistId));
    if (!psych) continue;

    // Criar 1-2 agendamentos por paciente
    const numAppointments = Math.min(2, appointmentTemplates.length - templateIndex);

    for (let i = 0; i < numAppointments; i++) {
      const template = appointmentTemplates[templateIndex % appointmentTemplates.length];

      // Ajustar a data para evitar conflitos
      const appointmentDate = new Date(template.date);
      appointmentDate.setHours(9 + templateIndex, 0, 0, 0);

      const appointment = new Appointment({
        patientId: pat._id,
        psychologistId: psych._id,
        date: appointmentDate,
        duration: template.duration,
        type: template.type,
        status: template.status,
        notes: template.notes
      });

      await appointment.save();
      appointments.push(appointment);

      results.appointments.push({
        id: appointment._id,
        paciente: pat.name,
        psicologo: psych.name,
        data: appointmentDate.toLocaleString('pt-BR'),
        duracao: `${template.duration} min`,
        tipo: template.type === 'online' ? 'Online' : 'Presencial',
        status: template.status
      });

      console.log(`   ✅ Agendamento criado: ${pat.name} com ${psych.name} em ${appointmentDate.toLocaleString('pt-BR')}`);
      templateIndex++;
    }
  }

  return appointments;
}

async function testAuthentication() {
  console.log('\n🔐 Testando autenticação...\n');

  for (const user of results.users) {
    const loginResult = await testLogin(user.email, user.senha, user.tipo.toLowerCase());

    results.authTests.push({
      usuario: user.nome,
      email: user.email,
      tipoEsperado: user.tipo,
      loginSucesso: loginResult.success,
      tokenGerado: loginResult.success ? '✅ Sim' : '❌ Não',
      roleCorreto: loginResult.matchedExpectedRole ? '✅ Sim' : '❌ Não'
    });

    if (loginResult.success) {
      console.log(`   ✅ Login OK: ${user.nome} (${user.tipo})`);
    } else {
      console.log(`   ❌ Login FALHOU: ${user.nome} - ${loginResult.error}`);
    }
  }
}

async function testRelations() {
  console.log('\n🔗 Testando relações entre entidades...\n');

  // Teste 1: Clínica -> Psicólogos
  const clinic = await Clinic.findOne({ email: testData.clinic.email });
  const psychologists = await Psychologist.find({ clinicId: clinic._id });

  results.relationTests.push({
    teste: 'Clínica -> Psicólogos',
    resultado: psychologists.length > 0 ? '✅ OK' : '❌ FALHA',
    detalhes: `${psychologists.length} psicólogo(s) vinculado(s) à clínica`
  });
  console.log(`   ${psychologists.length > 0 ? '✅' : '❌'} Clínica -> Psicólogos: ${psychologists.length} encontrado(s)`);

  // Teste 2: Psicólogo -> Pacientes
  for (const psych of psychologists) {
    const patients = await Patient.find({ psychologistId: psych._id });
    results.relationTests.push({
      teste: `Psicólogo (${psych.name}) -> Pacientes`,
      resultado: patients.length > 0 ? '✅ OK' : '⚠️ Sem pacientes',
      detalhes: `${patients.length} paciente(s) vinculado(s)`
    });
    console.log(`   ${patients.length > 0 ? '✅' : '⚠️'} ${psych.name} -> Pacientes: ${patients.length} encontrado(s)`);
  }

  // Teste 3: Paciente -> Agendamentos
  const patients = await Patient.find({ psychologistId: { $in: psychologists.map(p => p._id) } });
  for (const pat of patients) {
    const appointments = await Appointment.find({ patientId: pat._id });
    results.relationTests.push({
      teste: `Paciente (${pat.name}) -> Agendamentos`,
      resultado: appointments.length > 0 ? '✅ OK' : '⚠️ Sem agendamentos',
      detalhes: `${appointments.length} agendamento(s) encontrado(s)`
    });
    console.log(`   ${appointments.length > 0 ? '✅' : '⚠️'} ${pat.name} -> Agendamentos: ${appointments.length} encontrado(s)`);
  }

  // Teste 4: Agendamento -> Populando dados
  const sampleAppointment = await Appointment.findOne()
    .populate('patientId', 'name email')
    .populate('psychologistId', 'name email crp');

  if (sampleAppointment) {
    const populateOk = sampleAppointment.patientId?.name && sampleAppointment.psychologistId?.name;
    results.relationTests.push({
      teste: 'Agendamento -> Population (dados relacionados)',
      resultado: populateOk ? '✅ OK' : '❌ FALHA',
      detalhes: populateOk ?
        `Paciente: ${sampleAppointment.patientId.name}, Psicólogo: ${sampleAppointment.psychologistId.name}` :
        'Falha ao popular dados relacionados'
    });
    console.log(`   ${populateOk ? '✅' : '❌'} Population de agendamento: ${populateOk ? 'OK' : 'FALHA'}`);
  }
}

function printResults() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                               ║');
  console.log('║                    📊 RESULTADOS DO TESTE DE POPULAÇÃO                        ║');
  console.log('║                                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  // Usuários criados
  console.log('\n┌───────────────────────────────────────────────────────────────────────────────┐');
  console.log('│                         👥 USUÁRIOS CRIADOS                                   │');
  console.log('├───────────────────────────────────────────────────────────────────────────────┤');

  for (const user of results.users) {
    console.log(`│ Tipo: ${user.tipo.padEnd(12)} │ Nome: ${user.nome.padEnd(20).substring(0, 20)} │`);
    console.log(`│ Email: ${user.email.padEnd(40).substring(0, 40)}             │`);
    console.log(`│ Senha: ${user.senha.padEnd(20)}                                    │`);
    if (user.clinicaVinculada) {
      console.log(`│ Clínica: ${user.clinicaVinculada.padEnd(30).substring(0, 30)}                      │`);
    }
    if (user.psicologoVinculado) {
      console.log(`│ Psicólogo: ${user.psicologoVinculado.padEnd(30).substring(0, 30)}                    │`);
    }
    console.log('├───────────────────────────────────────────────────────────────────────────────┤');
  }
  console.log('└───────────────────────────────────────────────────────────────────────────────┘');

  // Agendamentos
  console.log('\n┌───────────────────────────────────────────────────────────────────────────────┐');
  console.log('│                         📅 AGENDAMENTOS CRIADOS                               │');
  console.log('├───────────────────────────────────────────────────────────────────────────────┤');

  for (const apt of results.appointments) {
    console.log(`│ Paciente: ${apt.paciente.padEnd(20).substring(0, 20)} │ Psicólogo: ${apt.psicologo.padEnd(15).substring(0, 15)} │`);
    console.log(`│ Data: ${apt.data.padEnd(25)} │ Tipo: ${apt.tipo.padEnd(10)} │ Status: ${apt.status.padEnd(10)} │`);
    console.log('├───────────────────────────────────────────────────────────────────────────────┤');
  }
  console.log('└───────────────────────────────────────────────────────────────────────────────┘');

  // Testes de autenticação
  console.log('\n┌───────────────────────────────────────────────────────────────────────────────┐');
  console.log('│                         🔐 TESTES DE AUTENTICAÇÃO                             │');
  console.log('├───────────────────────────────────────────────────────────────────────────────┤');

  for (const test of results.authTests) {
    const status = test.loginSucesso ? '✅ PASSOU' : '❌ FALHOU';
    console.log(`│ ${test.usuario.padEnd(25).substring(0, 25)} │ ${status.padEnd(15)} │ Token: ${test.tokenGerado} │`);
  }
  console.log('└───────────────────────────────────────────────────────────────────────────────┘');

  // Testes de relações
  console.log('\n┌───────────────────────────────────────────────────────────────────────────────┐');
  console.log('│                         🔗 TESTES DE RELAÇÕES                                 │');
  console.log('├───────────────────────────────────────────────────────────────────────────────┤');

  for (const test of results.relationTests) {
    console.log(`│ ${test.teste.padEnd(45).substring(0, 45)} │ ${test.resultado.padEnd(10)} │`);
    console.log(`│   ${test.detalhes.padEnd(60).substring(0, 60)}        │`);
  }
  console.log('└───────────────────────────────────────────────────────────────────────────────┘');

  // Resumo final
  const authPassed = results.authTests.filter(t => t.loginSucesso).length;
  const authTotal = results.authTests.length;
  const relationPassed = results.relationTests.filter(t => t.resultado.includes('OK')).length;
  const relationTotal = results.relationTests.length;

  console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              📈 RESUMO FINAL                                  ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Usuários criados: ${results.users.length}                                                        ║`);
  console.log(`║  Agendamentos criados: ${results.appointments.length}                                                     ║`);
  console.log(`║  Testes de autenticação: ${authPassed}/${authTotal} passaram                                        ║`);
  console.log(`║  Testes de relações: ${relationPassed}/${relationTotal} passaram                                            ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  // Credenciais para acesso
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🔑 CREDENCIAIS PARA ACESSO AO SISTEMA                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  for (const user of results.users) {
    console.log(`  ${user.tipo.toUpperCase()}: ${user.nome}`);
    console.log(`    📧 Email: ${user.email}`);
    console.log(`    🔒 Senha: ${user.senha}`);
    console.log('');
  }
}

// Função principal
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                               ║');
  console.log('║                    🧠 HEALTH MIND - TESTE DE POPULAÇÃO                        ║');
  console.log('║                                                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  // Conectar ao banco
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Limpar dados anteriores
    await cleanupTestData();

    // Criar usuários
    const { clinic, psychologist, patient } = await createTestUsers();

    // Criar agendamentos
    await createTestAppointments(clinic, psychologist, patient);

    // Testar autenticação
    await testAuthentication();

    // Testar relações
    await testRelations();

    // Imprimir resultados
    printResults();

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexão com MongoDB fechada');
  }
}

// Executar
main();
