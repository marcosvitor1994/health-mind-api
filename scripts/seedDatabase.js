/**
 * Script para limpar e popular o banco de dados com dados de teste
 *
 * Execute com: node scripts/seedDatabase.js
 *
 * Este script irá:
 * 1. Limpar todas as coleções
 * 2. Criar clínicas com salas e configurações
 * 3. Criar psicólogos (independentes e vinculados à clínica)
 * 4. Criar pacientes (vinculados e não vinculados)
 * 5. Criar agendamentos
 * 6. Criar pagamentos
 * 7. Criar horários de trabalho
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Dados para seed
const SEED_DATA = {
  clinics: [],
  psychologists: [],
  patients: [],
  rooms: [],
  workingHours: [],
  appointments: [],
  payments: [],
};

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Conectado ao MongoDB');
  } catch (error) {
    log.error('Erro ao conectar ao MongoDB: ' + error.message);
    process.exit(1);
  }
}

async function clearDatabase() {
  log.title('🗑️  LIMPANDO BANCO DE DADOS');

  try {
    await Clinic.deleteMany({});
    log.success('Clínicas removidas');

    await Psychologist.deleteMany({});
    log.success('Psicólogos removidos');

    await Patient.deleteMany({});
    log.success('Pacientes removidos');

    await Room.deleteMany({});
    log.success('Salas removidas');

    await WorkingHours.deleteMany({});
    log.success('Horários de trabalho removidos');

    await Appointment.deleteMany({});
    log.success('Agendamentos removidos');

    await Payment.deleteMany({});
    log.success('Pagamentos removidos');

    await Invitation.deleteMany({});
    log.success('Convites removidos');

  } catch (error) {
    log.error('Erro ao limpar banco de dados: ' + error.message);
    throw error;
  }
}

async function createClinics() {
  log.title('🏥 CRIANDO CLÍNICAS');

  const clinicsData = [
    {
      name: 'Clínica Mente Saudável',
      cnpj: '12345678000190',
      email: 'clinica1@test.com',
      password: 'senha123',
      phone: '11987654321',
      address: {
        street: 'Rua das Flores',
        number: '123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234567',
      },
      settings: {
        defaultSessionDuration: 50,
        allowOnlineAppointments: true,
        requireRoomForInPerson: true,
      },
      paymentSettings: {
        defaultSessionValue: 200,
        clinicPercentage: 30,
        acceptsHealthInsurance: true,
        acceptedHealthInsurances: [
          { name: 'Unimed', code: 'UNIMED' },
          { name: 'Amil', code: 'AMIL' },
        ],
        acceptedPaymentMethods: ['cash', 'pix', 'credit_card', 'debit_card', 'health_insurance'],
        bankInfo: {
          bankName: 'Banco do Brasil',
          bankCode: '001',
          agency: '1234',
          account: '12345-6',
          accountType: 'checking',
          pixKey: '12345678000190',
          pixKeyType: 'cnpj',
        },
      },
    },
    {
      name: 'Centro de Psicologia Harmonia',
      cnpj: '98765432000110',
      email: 'clinica2@test.com',
      password: 'senha123',
      phone: '11876543210',
      address: {
        street: 'Av. Principal',
        number: '456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04567890',
      },
      settings: {
        defaultSessionDuration: 60,
        allowOnlineAppointments: true,
        requireRoomForInPerson: false,
      },
      paymentSettings: {
        defaultSessionValue: 180,
        clinicPercentage: 25,
        acceptsHealthInsurance: false,
        acceptedPaymentMethods: ['cash', 'pix', 'credit_card'],
        bankInfo: {
          bankName: 'Itaú',
          bankCode: '341',
          agency: '5678',
          account: '98765-4',
          accountType: 'checking',
          pixKey: 'clinica2@test.com',
          pixKeyType: 'email',
        },
      },
    },
  ];

  for (const clinicData of clinicsData) {
    const clinic = await Clinic.create(clinicData);
    SEED_DATA.clinics.push(clinic);
    log.success(`Clínica criada: ${clinic.name} (${clinic.email})`);
  }
}

async function createRooms() {
  log.title('🚪 CRIANDO SALAS');

  const clinic1 = SEED_DATA.clinics[0];
  const clinic2 = SEED_DATA.clinics[1];

  const roomsData = [
    // Salas da Clínica 1
    {
      clinicId: clinic1._id,
      name: 'Sala Tranquilidade',
      number: '101',
      description: 'Sala com ambiente acolhedor e vista para o jardim',
      capacity: 2,
      amenities: ['ar_condicionado', 'soundproof', 'wifi', 'sofa'],
      isActive: true,
    },
    {
      clinicId: clinic1._id,
      name: 'Sala Serenidade',
      number: '102',
      description: 'Sala ampla com decoração minimalista',
      capacity: 3,
      amenities: ['ar_condicionado', 'soundproof', 'wifi', 'tv'],
      isActive: true,
    },
    {
      clinicId: clinic1._id,
      name: 'Sala Harmonia',
      number: '103',
      description: 'Sala com banheiro privativo',
      capacity: 2,
      amenities: ['ar_condicionado', 'soundproof', 'wifi', 'sofa', 'banheiro_privativo'],
      isActive: true,
    },
    // Salas da Clínica 2
    {
      clinicId: clinic2._id,
      name: 'Consultório A',
      number: '201',
      description: 'Consultório com acessibilidade',
      capacity: 2,
      amenities: ['ar_condicionado', 'acessibilidade', 'wifi'],
      isActive: true,
    },
    {
      clinicId: clinic2._id,
      name: 'Consultório B',
      number: '202',
      description: 'Consultório standard',
      capacity: 2,
      amenities: ['ar_condicionado', 'wifi'],
      isActive: true,
    },
  ];

  for (const roomData of roomsData) {
    const room = await Room.create(roomData);
    SEED_DATA.rooms.push(room);
    log.success(`Sala criada: ${room.name} - ${room.number}`);
  }
}

async function createPsychologists() {
  log.title('👨‍⚕️ CRIANDO PSICÓLOGOS');

  const clinic1 = SEED_DATA.clinics[0];
  const clinic2 = SEED_DATA.clinics[1];

  const psychologistsData = [
    // Psicólogos da Clínica 1
    {
      clinicId: clinic1._id,
      name: 'Dr. João Silva',
      email: 'joao.silva@test.com',
      password: 'senha123',
      crp: '06/123456',
      phone: '11999887766',
      specialties: ['Terapia Cognitivo-Comportamental', 'Ansiedade', 'Depressão'],
      settings: {
        defaultSessionDuration: 50,
        acceptsOnline: true,
        acceptsInPerson: true,
        preferredRoomId: SEED_DATA.rooms[0]._id, // Sala Tranquilidade
      },
      paymentSettings: {
        defaultSessionValue: 200,
        useClinicValue: true,
        acceptsHealthInsurance: false,
        acceptedPaymentMethods: ['cash', 'pix'],
      },
    },
    {
      clinicId: clinic1._id,
      name: 'Dra. Maria Santos',
      email: 'maria.santos@test.com',
      password: 'senha123',
      crp: '06/234567',
      phone: '11988776655',
      specialties: ['Psicanálise', 'Terapia de Casal', 'Trauma'],
      settings: {
        defaultSessionDuration: 60,
        acceptsOnline: true,
        acceptsInPerson: true,
        preferredRoomId: SEED_DATA.rooms[1]._id, // Sala Serenidade
      },
      paymentSettings: {
        defaultSessionValue: 250,
        useClinicValue: false, // Usa valor próprio
        acceptsHealthInsurance: false,
        acceptedPaymentMethods: ['pix', 'credit_card'],
      },
    },
    // Psicólogos da Clínica 2
    {
      clinicId: clinic2._id,
      name: 'Dr. Pedro Oliveira',
      email: 'pedro.oliveira@test.com',
      password: 'senha123',
      crp: '06/345678',
      phone: '11977665544',
      specialties: ['Neuropsicologia', 'TDAH', 'Avaliação Neuropsicológica'],
      settings: {
        defaultSessionDuration: 60,
        acceptsOnline: true,
        acceptsInPerson: true,
        preferredRoomId: SEED_DATA.rooms[3]._id, // Consultório A
      },
      paymentSettings: {
        defaultSessionValue: 180,
        useClinicValue: true,
        acceptsHealthInsurance: false,
        acceptedPaymentMethods: ['cash', 'pix'],
      },
    },
    // Psicólogo independente (sem clínica)
    {
      clinicId: null,
      name: 'Dra. Ana Costa',
      email: 'ana.costa@test.com',
      password: 'senha123',
      crp: '06/456789',
      phone: '11966554433',
      specialties: ['Terapia Familiar', 'Adolescentes', 'Orientação Vocacional'],
      settings: {
        defaultSessionDuration: 50,
        acceptsOnline: true,
        acceptsInPerson: false, // Apenas online
      },
      paymentSettings: {
        defaultSessionValue: 150,
        useClinicValue: false,
        acceptsHealthInsurance: false,
        acceptedPaymentMethods: ['pix'],
        bankInfo: {
          bankName: 'Nubank',
          bankCode: '260',
          pixKey: 'ana.costa@test.com',
          pixKeyType: 'email',
        },
      },
    },
    // Outro psicólogo independente
    {
      clinicId: null,
      name: 'Dr. Carlos Mendes',
      email: 'carlos.mendes@test.com',
      password: 'senha123',
      crp: '06/567890',
      phone: '11955443322',
      specialties: ['Psicologia Positiva', 'Coaching', 'Desenvolvimento Pessoal'],
      settings: {
        defaultSessionDuration: 45,
        acceptsOnline: true,
        acceptsInPerson: false,
      },
      paymentSettings: {
        defaultSessionValue: 120,
        useClinicValue: false,
        acceptsHealthInsurance: false,
        acceptedPaymentMethods: ['pix', 'bank_transfer'],
        bankInfo: {
          bankName: 'Banco Inter',
          bankCode: '077',
          pixKey: '11955443322',
          pixKeyType: 'phone',
        },
      },
    },
  ];

  for (const psychologistData of psychologistsData) {
    const psychologist = await Psychologist.create(psychologistData);
    SEED_DATA.psychologists.push(psychologist);
    log.success(`Psicólogo criado: ${psychologist.name} (${psychologist.email}) ${psychologist.clinicId ? '- Vinculado à clínica' : '- Independente'}`);
  }
}

async function createPatients() {
  log.title('👤 CRIANDO PACIENTES');

  const psycho1 = SEED_DATA.psychologists[0]; // Dr. João
  const psycho2 = SEED_DATA.psychologists[1]; // Dra. Maria
  const psycho3 = SEED_DATA.psychologists[3]; // Dra. Ana (independente)

  const patientsData = [
    // Pacientes vinculados ao Dr. João (Clínica 1)
    {
      psychologistId: psycho1._id,
      clinicId: psycho1.clinicId,
      name: 'Lucas Ferreira',
      email: 'lucas.ferreira@test.com',
      password: 'senha123',
      phone: '11944332211',
      birthDate: new Date('1995-03-15'),
      cpf: '12345678901',
      emergencyContact: {
        name: 'Rita Ferreira',
        phone: '11933221100',
        relationship: 'Mãe',
      },
    },
    {
      psychologistId: psycho1._id,
      clinicId: psycho1.clinicId,
      name: 'Beatriz Lima',
      email: 'beatriz.lima@test.com',
      password: 'senha123',
      phone: '11933221100',
      birthDate: new Date('1988-07-22'),
      cpf: '23456789012',
    },
    // Pacientes vinculados à Dra. Maria (Clínica 1)
    {
      psychologistId: psycho2._id,
      clinicId: psycho2.clinicId,
      name: 'Rafael Souza',
      email: 'rafael.souza@test.com',
      password: 'senha123',
      phone: '11922110099',
      birthDate: new Date('1992-11-08'),
      cpf: '34567890123',
    },
    {
      psychologistId: psycho2._id,
      clinicId: psycho2.clinicId,
      name: 'Juliana Alves',
      email: 'juliana.alves@test.com',
      password: 'senha123',
      phone: '11911009988',
      birthDate: new Date('1990-04-30'),
      cpf: '45678901234',
    },
    // Pacientes vinculados à Dra. Ana (independente)
    {
      psychologistId: psycho3._id,
      clinicId: null,
      name: 'Gabriel Rocha',
      email: 'gabriel.rocha@test.com',
      password: 'senha123',
      phone: '11900998877',
      birthDate: new Date('2005-09-12'),
      cpf: '56789012345',
      emergencyContact: {
        name: 'Paula Rocha',
        phone: '11899887766',
        relationship: 'Mãe',
      },
    },
    // Pacientes não vinculados (podem buscar psicólogos)
    {
      psychologistId: null,
      clinicId: null,
      name: 'Camila Martins',
      email: 'camila.martins@test.com',
      password: 'senha123',
      phone: '11888776655',
      birthDate: new Date('1993-06-18'),
      cpf: '67890123456',
    },
    {
      psychologistId: null,
      clinicId: null,
      name: 'Felipe Barbosa',
      email: 'felipe.barbosa@test.com',
      password: 'senha123',
      phone: '11877665544',
      birthDate: new Date('1987-12-25'),
      cpf: '78901234567',
    },
  ];

  for (const patientData of patientsData) {
    const patient = await Patient.create(patientData);
    SEED_DATA.patients.push(patient);
    log.success(`Paciente criado: ${patient.name} (${patient.email}) ${patient.psychologistId ? '- Vinculado' : '- Não vinculado'}`);
  }
}

async function createWorkingHours() {
  log.title('🕐 CRIANDO HORÁRIOS DE TRABALHO');

  // Horários para Clínica 1
  const clinic1Hours = await WorkingHours.create({
    entityType: 'clinic',
    entityId: SEED_DATA.clinics[0]._id,
    weeklySchedule: [
      { dayOfWeek: 0, isOpen: false, slots: [] }, // Domingo
      { dayOfWeek: 1, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] }, // Segunda
      { dayOfWeek: 2, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] }, // Terça
      { dayOfWeek: 3, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] }, // Quarta
      { dayOfWeek: 4, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] }, // Quinta
      { dayOfWeek: 5, isOpen: true, slots: [{ startTime: '08:00', endTime: '18:00' }] }, // Sexta
      { dayOfWeek: 6, isOpen: true, slots: [{ startTime: '09:00', endTime: '13:00' }] }, // Sábado
    ],
    defaultSessionDuration: 50,
    bufferBetweenSessions: 10,
  });
  SEED_DATA.workingHours.push(clinic1Hours);
  log.success(`Horários criados para: ${SEED_DATA.clinics[0].name}`);

  // Horários para Clínica 2
  const clinic2Hours = await WorkingHours.create({
    entityType: 'clinic',
    entityId: SEED_DATA.clinics[1]._id,
    weeklySchedule: [
      { dayOfWeek: 0, isOpen: false, slots: [] }, // Domingo
      { dayOfWeek: 1, isOpen: true, slots: [{ startTime: '07:00', endTime: '19:00' }] },
      { dayOfWeek: 2, isOpen: true, slots: [{ startTime: '07:00', endTime: '19:00' }] },
      { dayOfWeek: 3, isOpen: true, slots: [{ startTime: '07:00', endTime: '19:00' }] },
      { dayOfWeek: 4, isOpen: true, slots: [{ startTime: '07:00', endTime: '19:00' }] },
      { dayOfWeek: 5, isOpen: true, slots: [{ startTime: '07:00', endTime: '19:00' }] },
      { dayOfWeek: 6, isOpen: false, slots: [] }, // Sábado
    ],
    defaultSessionDuration: 60,
    bufferBetweenSessions: 15,
  });
  SEED_DATA.workingHours.push(clinic2Hours);
  log.success(`Horários criados para: ${SEED_DATA.clinics[1].name}`);

  // Horários para psicólogos independentes
  const psycho3 = SEED_DATA.psychologists[3]; // Dra. Ana
  const psycho3Hours = await WorkingHours.create({
    entityType: 'psychologist',
    entityId: psycho3._id,
    weeklySchedule: [
      { dayOfWeek: 0, isOpen: false, slots: [] },
      { dayOfWeek: 1, isOpen: true, slots: [{ startTime: '14:00', endTime: '20:00' }] },
      { dayOfWeek: 2, isOpen: true, slots: [{ startTime: '14:00', endTime: '20:00' }] },
      { dayOfWeek: 3, isOpen: true, slots: [{ startTime: '14:00', endTime: '20:00' }] },
      { dayOfWeek: 4, isOpen: false, slots: [] },
      { dayOfWeek: 5, isOpen: true, slots: [{ startTime: '14:00', endTime: '20:00' }] },
      { dayOfWeek: 6, isOpen: true, slots: [{ startTime: '09:00', endTime: '13:00' }] },
    ],
    defaultSessionDuration: 50,
    bufferBetweenSessions: 10,
  });
  SEED_DATA.workingHours.push(psycho3Hours);
  log.success(`Horários criados para: ${psycho3.name}`);
}

async function createAppointments() {
  log.title('📅 CRIANDO AGENDAMENTOS');

  const now = new Date();

  // Função auxiliar para criar data futura
  const getFutureDate = (daysFromNow, hour, minute) => {
    const date = new Date(now);
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  const appointmentsData = [
    // Agendamentos da Clínica 1 - Dr. João com seus pacientes
    {
      patientId: SEED_DATA.patients[0]._id, // Lucas
      psychologistId: SEED_DATA.psychologists[0]._id, // Dr. João
      clinicId: SEED_DATA.clinics[0]._id,
      roomId: SEED_DATA.rooms[0]._id, // Sala Tranquilidade
      date: getFutureDate(2, 10, 0), // Daqui 2 dias às 10h
      duration: 50,
      status: 'scheduled',
      type: 'in_person',
      sessionValue: 200,
      paymentRequired: true,
    },
    {
      patientId: SEED_DATA.patients[1]._id, // Beatriz
      psychologistId: SEED_DATA.psychologists[0]._id, // Dr. João
      clinicId: SEED_DATA.clinics[0]._id,
      roomId: null,
      date: getFutureDate(3, 14, 0), // Daqui 3 dias às 14h
      duration: 50,
      status: 'confirmed',
      type: 'online',
      sessionValue: 200,
      paymentRequired: true,
    },
    {
      patientId: SEED_DATA.patients[0]._id, // Lucas
      psychologistId: SEED_DATA.psychologists[0]._id, // Dr. João
      clinicId: SEED_DATA.clinics[0]._id,
      roomId: SEED_DATA.rooms[0]._id,
      date: getFutureDate(9, 11, 0), // Daqui 9 dias às 11h
      duration: 50,
      status: 'scheduled',
      type: 'in_person',
      sessionValue: 200,
      paymentRequired: true,
    },
    // Agendamentos da Clínica 1 - Dra. Maria com seus pacientes
    {
      patientId: SEED_DATA.patients[2]._id, // Rafael
      psychologistId: SEED_DATA.psychologists[1]._id, // Dra. Maria
      clinicId: SEED_DATA.clinics[0]._id,
      roomId: SEED_DATA.rooms[1]._id, // Sala Serenidade
      date: getFutureDate(1, 15, 0), // Amanhã às 15h
      duration: 60,
      status: 'confirmed',
      type: 'in_person',
      sessionValue: 250, // Valor próprio da Dra. Maria
      paymentRequired: true,
    },
    {
      patientId: SEED_DATA.patients[3]._id, // Juliana
      psychologistId: SEED_DATA.psychologists[1]._id, // Dra. Maria
      clinicId: SEED_DATA.clinics[0]._id,
      roomId: null,
      date: getFutureDate(5, 16, 0), // Daqui 5 dias às 16h
      duration: 60,
      status: 'scheduled',
      type: 'online',
      sessionValue: 250,
      paymentRequired: true,
    },
    // Agendamentos psicólogo independente - Dra. Ana
    {
      patientId: SEED_DATA.patients[4]._id, // Gabriel
      psychologistId: SEED_DATA.psychologists[3]._id, // Dra. Ana
      clinicId: null,
      roomId: null,
      date: getFutureDate(1, 18, 0), // Amanhã às 18h
      duration: 50,
      status: 'confirmed',
      type: 'online',
      sessionValue: 150,
      paymentRequired: true,
    },
    {
      patientId: SEED_DATA.patients[4]._id, // Gabriel
      psychologistId: SEED_DATA.psychologists[3]._id, // Dra. Ana
      clinicId: null,
      roomId: null,
      date: getFutureDate(7, 19, 0), // Daqui 7 dias às 19h
      duration: 50,
      status: 'scheduled',
      type: 'online',
      sessionValue: 150,
      paymentRequired: true,
    },
    // Agendamento cancelado (exemplo)
    {
      patientId: SEED_DATA.patients[1]._id, // Beatriz
      psychologistId: SEED_DATA.psychologists[0]._id, // Dr. João
      clinicId: SEED_DATA.clinics[0]._id,
      roomId: null,
      date: getFutureDate(4, 10, 0),
      duration: 50,
      status: 'cancelled',
      type: 'online',
      cancelledBy: 'patient',
      cancelledReason: 'Compromisso de trabalho inesperado',
      sessionValue: 200,
      paymentRequired: true,
    },
  ];

  for (const appointmentData of appointmentsData) {
    const appointment = await Appointment.create(appointmentData);
    SEED_DATA.appointments.push(appointment);

    const patient = SEED_DATA.patients.find(p => p._id.equals(appointment.patientId));
    const psychologist = SEED_DATA.psychologists.find(p => p._id.equals(appointment.psychologistId));

    log.success(`Agendamento criado: ${patient.name} com ${psychologist.name} - ${appointment.date.toLocaleString('pt-BR')} (${appointment.status})`);
  }
}

async function createPayments() {
  log.title('💰 CRIANDO PAGAMENTOS');

  // Criar pagamentos para os agendamentos (exceto cancelados)
  const activeAppointments = SEED_DATA.appointments.filter(
    apt => apt.status !== 'cancelled' && apt.paymentRequired
  );

  for (const appointment of activeAppointments) {
    const psychologist = SEED_DATA.psychologists.find(p => p._id.equals(appointment.psychologistId));
    const clinic = appointment.clinicId ? SEED_DATA.clinics.find(c => c._id.equals(appointment.clinicId)) : null;

    let clinicPercentage = 0;
    if (clinic && psychologist.paymentSettings.useClinicValue) {
      clinicPercentage = clinic.paymentSettings.clinicPercentage;
    }

    // Definir status do pagamento baseado no status do agendamento
    let paymentStatus = 'pending';
    let paidAt = null;
    let paymentMethod = null;

    if (appointment.status === 'confirmed') {
      // 50% dos confirmados foram pagos e aguardam confirmação
      if (Math.random() > 0.5) {
        paymentStatus = 'awaiting_confirmation';
        paidAt = new Date();
        paymentMethod = ['pix', 'credit_card', 'cash'][Math.floor(Math.random() * 3)];
      } else {
        // Alguns já foram confirmados pelo psicólogo/clínica
        paymentStatus = 'confirmed';
        paidAt = new Date();
        paymentMethod = ['pix', 'credit_card', 'cash'][Math.floor(Math.random() * 3)];
      }
    }

    const paymentData = {
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      psychologistId: appointment.psychologistId,
      clinicId: appointment.clinicId,
      sessionValue: appointment.sessionValue,
      clinicPercentage: clinicPercentage,
      discount: 0,
      finalValue: appointment.sessionValue,
      status: paymentStatus,
      paymentMethod: paymentMethod,
      paidAt: paidAt,
      dueDate: appointment.date, // Vence no dia da sessão
    };

    const payment = await Payment.create(paymentData);
    SEED_DATA.payments.push(payment);

    // Atualizar appointment com paymentId
    appointment.paymentId = payment._id;
    await appointment.save();

    const patient = SEED_DATA.patients.find(p => p._id.equals(appointment.patientId));

    log.success(`Pagamento criado: ${patient.name} - R$ ${payment.finalValue} (${payment.status})`);
  }
}

async function createInvitations() {
  log.title('✉️ CRIANDO CONVITES DE EXEMPLO');

  const clinic1 = SEED_DATA.clinics[0];
  const psycho1 = SEED_DATA.psychologists[0];

  const invitationsData = [
    {
      email: 'novo.psicologo@test.com',
      role: 'psychologist',
      token: require('crypto').randomBytes(32).toString('hex'),
      status: 'pending',
      preFilledData: {
        name: 'Dr. Novo Psicólogo',
        clinicId: clinic1._id,
      },
      invitedBy: {
        userId: clinic1._id,
        userModel: 'Clinic',
        userName: clinic1.name,
      },
    },
    {
      email: 'novo.paciente@test.com',
      role: 'patient',
      token: require('crypto').randomBytes(32).toString('hex'),
      status: 'pending',
      preFilledData: {
        name: 'Novo Paciente',
        psychologistId: psycho1._id,
      },
      invitedBy: {
        userId: psycho1._id,
        userModel: 'Psychologist',
        userName: psycho1.name,
      },
    },
  ];

  for (const invitationData of invitationsData) {
    const invitation = await Invitation.create(invitationData);
    log.success(`Convite criado: ${invitation.email} (${invitation.role})`);
  }
}

async function displaySummary() {
  log.title('📊 RESUMO DOS DADOS CRIADOS');

  console.log(`${colors.cyan}Clínicas:${colors.reset} ${SEED_DATA.clinics.length}`);
  SEED_DATA.clinics.forEach(clinic => {
    console.log(`  - ${clinic.name} (${clinic.email})`);
  });

  console.log(`\n${colors.cyan}Salas:${colors.reset} ${SEED_DATA.rooms.length}`);
  SEED_DATA.rooms.forEach(room => {
    const clinic = SEED_DATA.clinics.find(c => c._id.equals(room.clinicId));
    console.log(`  - ${room.name} - ${clinic.name}`);
  });

  console.log(`\n${colors.cyan}Psicólogos:${colors.reset} ${SEED_DATA.psychologists.length}`);
  SEED_DATA.psychologists.forEach(psycho => {
    const clinic = psycho.clinicId ? SEED_DATA.clinics.find(c => c._id.equals(psycho.clinicId)) : null;
    console.log(`  - ${psycho.name} (${psycho.email}) ${clinic ? `- ${clinic.name}` : '- Independente'}`);
  });

  console.log(`\n${colors.cyan}Pacientes:${colors.reset} ${SEED_DATA.patients.length}`);
  SEED_DATA.patients.forEach(patient => {
    const psycho = patient.psychologistId ? SEED_DATA.psychologists.find(p => p._id.equals(patient.psychologistId)) : null;
    console.log(`  - ${patient.name} (${patient.email}) ${psycho ? `- ${psycho.name}` : '- Não vinculado'}`);
  });

  console.log(`\n${colors.cyan}Agendamentos:${colors.reset} ${SEED_DATA.appointments.length}`);
  console.log(`  - Agendados: ${SEED_DATA.appointments.filter(a => a.status === 'scheduled').length}`);
  console.log(`  - Confirmados: ${SEED_DATA.appointments.filter(a => a.status === 'confirmed').length}`);
  console.log(`  - Cancelados: ${SEED_DATA.appointments.filter(a => a.status === 'cancelled').length}`);

  console.log(`\n${colors.cyan}Pagamentos:${colors.reset} ${SEED_DATA.payments.length}`);
  console.log(`  - Pendentes: ${SEED_DATA.payments.filter(p => p.status === 'pending').length}`);
  console.log(`  - Aguardando confirmação: ${SEED_DATA.payments.filter(p => p.status === 'awaiting_confirmation').length}`);
  console.log(`  - Confirmados: ${SEED_DATA.payments.filter(p => p.status === 'confirmed').length}`);

  console.log(`\n${colors.bright}${colors.green}CREDENCIAIS DE LOGIN:${colors.reset}\n`);

  console.log(`${colors.yellow}CLÍNICAS:${colors.reset}`);
  SEED_DATA.clinics.forEach(clinic => {
    console.log(`  Email: ${clinic.email}`);
    console.log(`  Senha: senha123\n`);
  });

  console.log(`${colors.yellow}PSICÓLOGOS:${colors.reset}`);
  SEED_DATA.psychologists.forEach(psycho => {
    console.log(`  Email: ${psycho.email}`);
    console.log(`  Senha: senha123\n`);
  });

  console.log(`${colors.yellow}PACIENTES:${colors.reset}`);
  SEED_DATA.patients.forEach(patient => {
    console.log(`  Email: ${patient.email}`);
    console.log(`  Senha: senha123\n`);
  });
}

async function main() {
  try {
    console.log(`${colors.bright}${colors.cyan}`);
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║       SEED DATABASE - HEALTH MIND API                   ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    await connectDatabase();
    await clearDatabase();
    await createClinics();
    await createRooms();
    await createPsychologists();
    await createPatients();
    await createWorkingHours();
    await createAppointments();
    await createPayments();
    await createInvitations();
    await displaySummary();

    log.title('✅ SEED CONCLUÍDO COM SUCESSO!');

  } catch (error) {
    log.error('Erro durante o seed: ' + error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    log.info('Conexão com MongoDB fechada');
  }
}

main();
