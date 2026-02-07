const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envia uma push notification via Expo Push API
 */
async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    return null;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const response = await axios.post(EXPO_PUSH_URL, message, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar push notification:', error.message);
    return null;
  }
}

/**
 * Envia múltiplas push notifications em batch
 */
async function sendBatchPushNotifications(messages) {
  const validMessages = messages.filter(
    (m) => m.to && m.to.startsWith('ExponentPushToken')
  );

  if (validMessages.length === 0) return [];

  // Expo aceita arrays de até 100 mensagens
  const chunks = [];
  for (let i = 0; i < validMessages.length; i += 100) {
    chunks.push(validMessages.slice(i, i + 100));
  }

  const results = [];
  for (const chunk of chunks) {
    try {
      const response = await axios.post(EXPO_PUSH_URL, chunk, {
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      });
      results.push(response.data);
    } catch (error) {
      console.error('Erro ao enviar batch push:', error.message);
    }
  }

  return results;
}

/**
 * Notifica paciente e psicólogo quando um novo agendamento é criado
 */
async function notifyNewAppointment(appointment) {
  const date = new Date(appointment.date);
  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const patientName = appointment.patientId?.name || 'Paciente';
  const psychologistName = appointment.psychologistId?.name || 'Psicólogo';
  const patientToken = appointment.patientId?.expoPushToken;
  const psychologistToken = appointment.psychologistId?.expoPushToken;

  const promises = [];

  // Notificar paciente
  if (patientToken) {
    promises.push(
      sendPushNotification(
        patientToken,
        'Nova Consulta Agendada',
        `Consulta com ${psychologistName} em ${dateStr} às ${timeStr}. Confirme sua presença.`,
        { type: 'new_appointment', appointmentId: appointment._id.toString() }
      )
    );
  }

  // Notificar psicólogo
  if (psychologistToken) {
    promises.push(
      sendPushNotification(
        psychologistToken,
        'Nova Consulta Agendada',
        `Consulta com ${patientName} em ${dateStr} às ${timeStr}.`,
        { type: 'new_appointment', appointmentId: appointment._id.toString() }
      )
    );
  }

  return Promise.all(promises);
}

/**
 * Notifica quando alguém solicita reagendamento
 */
async function notifyRescheduleRequest(appointment, requestedBy) {
  const date = new Date(appointment.date);
  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (requestedBy === 'patient') {
    // Paciente pediu reagendamento -> notificar psicólogo
    const psychologistToken = appointment.psychologistId?.expoPushToken;
    const patientName = appointment.patientId?.name || 'Paciente';

    if (psychologistToken) {
      return sendPushNotification(
        psychologistToken,
        'Solicitação de Reagendamento',
        `${patientName} solicitou reagendamento da consulta de ${dateStr} às ${timeStr}.`,
        { type: 'reschedule_request', appointmentId: appointment._id.toString() }
      );
    }
  } else if (requestedBy === 'psychologist') {
    // Psicólogo pediu reagendamento -> notificar paciente
    const patientToken = appointment.patientId?.expoPushToken;
    const psychologistName = appointment.psychologistId?.name || 'Psicólogo';

    if (patientToken) {
      return sendPushNotification(
        patientToken,
        'Solicitação de Reagendamento',
        `${psychologistName} solicitou reagendamento da consulta de ${dateStr} às ${timeStr}.`,
        { type: 'reschedule_request', appointmentId: appointment._id.toString() }
      );
    }
  }

  return null;
}

/**
 * Envia lembrete de consulta para o paciente (1 dia antes)
 */
async function sendAppointmentReminder(appointment) {
  const date = new Date(appointment.date);
  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const psychologistName = appointment.psychologistId?.name || 'seu psicólogo';
  const patientToken = appointment.patientId?.expoPushToken;

  if (patientToken) {
    return sendPushNotification(
      patientToken,
      'Lembrete de Consulta',
      `Sua consulta com ${psychologistName} é amanhã às ${timeStr}. Não se esqueça!`,
      { type: 'appointment_reminder', appointmentId: appointment._id.toString() }
    );
  }

  return null;
}

module.exports = {
  sendPushNotification,
  sendBatchPushNotifications,
  notifyNewAppointment,
  notifyRescheduleRequest,
  sendAppointmentReminder,
};
