/**
 * Script para verificar o estado atual do banco de dados
 *
 * Execute com: node scripts/checkDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Importar modelos
const Clinic = require('../src/models/Clinic');
const Psychologist = require('../src/models/Psychologist');
const Patient = require('../src/models/Patient');
const Room = require('../src/models/Room');
const WorkingHours = require('../src/models/WorkingHours');
const Appointment = require('../src/models/Appointment');
const Payment = require('../src/models/Payment');
const Invitation = require('../src/models/Invitation');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`${colors.green}✓${colors.reset} Conectado ao MongoDB\n`);
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Erro ao conectar ao MongoDB: ${error.message}`);
    process.exit(1);
  }
}

async function checkDatabase() {
  console.log(`${colors.bright}${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║       VERIFICAÇÃO DO BANCO DE DADOS                      ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Contar documentos
  const clinicsCount = await Clinic.countDocuments({ deletedAt: null });
  const psychologistsCount = await Psychologist.countDocuments({ deletedAt: null });
  const patientsCount = await Patient.countDocuments({ deletedAt: null });
  const roomsCount = await Room.countDocuments({ deletedAt: null });
  const workingHoursCount = await WorkingHours.countDocuments({ deletedAt: null });
  const appointmentsCount = await Appointment.countDocuments({ deletedAt: null });
  const paymentsCount = await Payment.countDocuments({ deletedAt: null });
  const invitationsCount = await Invitation.countDocuments({});

  // Estatísticas detalhadas
  const appointmentsByStatus = await Appointment.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const paymentsByStatus = await Payment.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const psychologistsWithClinic = await Psychologist.countDocuments({
    deletedAt: null,
    clinicId: { $ne: null }
  });

  const patientsWithPsychologist = await Patient.countDocuments({
    deletedAt: null,
    psychologistId: { $ne: null }
  });

  // Exibir resumo
  console.log(`${colors.blue}📊 RESUMO GERAL${colors.reset}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`${colors.cyan}Clínicas:${colors.reset}              ${clinicsCount}`);
  console.log(`${colors.cyan}Psicólogos:${colors.reset}            ${psychologistsCount} (${psychologistsWithClinic} vinculados, ${psychologistsCount - psychologistsWithClinic} independentes)`);
  console.log(`${colors.cyan}Pacientes:${colors.reset}             ${patientsCount} (${patientsWithPsychologist} vinculados, ${patientsCount - patientsWithPsychologist} não vinculados)`);
  console.log(`${colors.cyan}Salas:${colors.reset}                 ${roomsCount}`);
  console.log(`${colors.cyan}Horários configurados:${colors.reset} ${workingHoursCount}`);
  console.log(`${colors.cyan}Agendamentos:${colors.reset}          ${appointmentsCount}`);
  console.log(`${colors.cyan}Pagamentos:${colors.reset}            ${paymentsCount}`);
  console.log(`${colors.cyan}Convites:${colors.reset}              ${invitationsCount}\n`);

  // Agendamentos por status
  if (appointmentsByStatus.length > 0) {
    console.log(`${colors.blue}📅 AGENDAMENTOS POR STATUS${colors.reset}`);
    console.log(`${'─'.repeat(60)}`);
    const statusLabels = {
      scheduled: 'Agendados',
      confirmed: 'Confirmados',
      completed: 'Completados',
      cancelled: 'Cancelados',
    };
    appointmentsByStatus.forEach(item => {
      const label = statusLabels[item._id] || item._id;
      console.log(`${colors.cyan}${label}:${colors.reset} ${item.count}`);
    });
    console.log();
  }

  // Pagamentos por status
  if (paymentsByStatus.length > 0) {
    console.log(`${colors.blue}💰 PAGAMENTOS POR STATUS${colors.reset}`);
    console.log(`${'─'.repeat(60)}`);
    const statusLabels = {
      pending: 'Pendentes',
      awaiting_confirmation: 'Aguardando confirmação',
      confirmed: 'Confirmados',
      cancelled: 'Cancelados',
      refunded: 'Reembolsados',
    };
    paymentsByStatus.forEach(item => {
      const label = statusLabels[item._id] || item._id;
      console.log(`${colors.cyan}${label}:${colors.reset} ${item.count}`);
    });
    console.log();
  }

  // Listar clínicas
  if (clinicsCount > 0) {
    console.log(`${colors.blue}🏥 CLÍNICAS CADASTRADAS${colors.reset}`);
    console.log(`${'─'.repeat(60)}`);
    const clinics = await Clinic.find({ deletedAt: null }).select('name email');
    clinics.forEach(clinic => {
      console.log(`${colors.cyan}•${colors.reset} ${clinic.name} (${clinic.email})`);
    });
    console.log();
  }

  // Listar psicólogos
  if (psychologistsCount > 0) {
    console.log(`${colors.blue}👨‍⚕️ PSICÓLOGOS CADASTRADOS${colors.reset}`);
    console.log(`${'─'.repeat(60)}`);
    const psychologists = await Psychologist.find({ deletedAt: null })
      .populate('clinicId', 'name')
      .select('name email clinicId');
    psychologists.forEach(psycho => {
      const clinicInfo = psycho.clinicId ? ` - ${psycho.clinicId.name}` : ' - Independente';
      console.log(`${colors.cyan}•${colors.reset} ${psycho.name} (${psycho.email})${clinicInfo}`);
    });
    console.log();
  }

  // Próximos agendamentos
  const upcomingAppointments = await Appointment.find({
    deletedAt: null,
    status: { $in: ['scheduled', 'confirmed'] },
    date: { $gte: new Date() },
  })
    .sort({ date: 1 })
    .limit(5)
    .populate('patientId', 'name')
    .populate('psychologistId', 'name')
    .select('date status type patientId psychologistId');

  if (upcomingAppointments.length > 0) {
    console.log(`${colors.blue}📆 PRÓXIMOS AGENDAMENTOS (${upcomingAppointments.length})${colors.reset}`);
    console.log(`${'─'.repeat(60)}`);
    upcomingAppointments.forEach(apt => {
      const dateStr = apt.date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const statusIcon = apt.status === 'confirmed' ? '✓' : '○';
      console.log(`${colors.cyan}${statusIcon}${colors.reset} ${dateStr} - ${apt.patientId.name} com ${apt.psychologistId.name} (${apt.type})`);
    });
    console.log();
  }

  // Verificar se está vazio
  const totalDocs = clinicsCount + psychologistsCount + patientsCount +
                   roomsCount + appointmentsCount + paymentsCount;

  if (totalDocs === 0) {
    console.log(`${colors.yellow}⚠${colors.reset}  ${colors.yellow}Banco de dados vazio!${colors.reset}`);
    console.log(`${colors.yellow}Execute "npm run seed" para popular o banco de dados.${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓${colors.reset} Banco de dados populado com ${totalDocs} documentos.\n`);
  }
}

async function main() {
  try {
    await connectDatabase();
    await checkDatabase();
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Erro: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(`${colors.blue}ℹ${colors.reset} Conexão com MongoDB fechada`);
  }
}

main();
