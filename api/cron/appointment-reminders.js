const mongoose = require('mongoose');

// Conectar ao MongoDB diretamente (este é um serverless function independente)
async function ensureConnection() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });
}

module.exports = async (req, res) => {
  // Verificar autenticação do cron (Vercel envia CRON_SECRET automaticamente)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await ensureConnection();

    const Appointment = require('../../src/models/Appointment');
    const Patient = require('../../src/models/Patient');
    const Psychologist = require('../../src/models/Psychologist');
    const pushService = require('../../src/services/pushNotificationService');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Buscar agendamentos nas próximas 24h que ainda não receberam lembrete
    const appointments = await Appointment.find({
      date: { $gte: now, $lte: tomorrow },
      status: { $in: ['confirmed', 'awaiting_patient', 'scheduled'] },
      reminderSent: false,
      deletedAt: null,
    })
      .populate('patientId', 'name expoPushToken')
      .populate('psychologistId', 'name');

    let sent = 0;
    for (const apt of appointments) {
      try {
        await pushService.sendAppointmentReminder(apt);
        apt.reminderSent = true;
        await apt.save();
        sent++;
      } catch (err) {
        console.error(`Erro ao enviar lembrete para appointment ${apt._id}:`, err.message);
      }
    }

    console.log(`Cron de lembretes: ${sent}/${appointments.length} lembretes enviados`);

    res.status(200).json({
      success: true,
      message: `${sent} lembretes enviados`,
      total: appointments.length,
      sent,
    });
  } catch (error) {
    console.error('Erro no cron de lembretes:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
