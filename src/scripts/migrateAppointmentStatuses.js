/**
 * Script de migração: Atualizar status de agendamentos
 *
 * Agendamentos futuros com status 'scheduled' -> 'awaiting_patient'
 * Agendamentos passados ficam como estão (compatibilidade via fallback no frontend)
 *
 * Uso: node src/scripts/migrateAppointmentStatuses.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

async function migrate() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI não configurada');
      process.exit(1);
    }

    console.log('Conectando ao MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Conectado!');

    const now = new Date();

    // Contar agendamentos futuros com status 'scheduled'
    const count = await Appointment.countDocuments({
      status: 'scheduled',
      date: { $gte: now },
    });

    console.log(`Encontrados ${count} agendamentos futuros com status 'scheduled'`);

    if (count === 0) {
      console.log('Nenhum agendamento para migrar.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Atualizar status
    const result = await Appointment.updateMany(
      {
        status: 'scheduled',
        date: { $gte: now },
      },
      {
        $set: { status: 'awaiting_patient' },
      }
    );

    console.log(`Migrados ${result.modifiedCount} agendamentos: 'scheduled' -> 'awaiting_patient'`);

    await mongoose.disconnect();
    console.log('Migração concluída!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

migrate();
