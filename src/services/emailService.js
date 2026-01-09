const nodemailer = require('nodemailer');

/**
 * Configuração do transportador de e-mail
 * Para usar Gmail SMTP, você precisa:
 * 1. Ativar "Verificação em duas etapas" na sua conta Google
 * 2. Gerar uma "Senha de app" em: https://myaccount.google.com/apppasswords
 * 3. Usar essa senha no EMAIL_PASSWORD
 */
const createTransporter = () => {
  // Verificar se as credenciais estão configuradas
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  AVISO: Credenciais de e-mail não configuradas. E-mails não serão enviados.');
    return null;
  }

  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Senha de app do Google
    },
  });
};

/**
 * Enviar e-mail genérico
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('📧 [DEV MODE] E-mail que seria enviado:');
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Conteúdo: ${text || 'HTML content'}`);
    return { success: true, dev: true };
  }

  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Health Mind'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback para texto puro
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ E-mail enviado com sucesso:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error.message);
    throw new Error(`Falha ao enviar e-mail: ${error.message}`);
  }
};

/**
 * Enviar convite para clínica
 */
const sendClinicInvitation = async (invitation) => {
  const { email, preFilledData, invitationUrl, invitedBy } = invitation;

  const subject = '🏥 Convite para cadastro na plataforma Health Mind';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 Health Mind</h1>
          <p>Bem-vindo à nossa plataforma!</p>
        </div>
        <div class="content">
          <h2>Olá${preFilledData?.name ? `, ${preFilledData.name}` : ''}! 👋</h2>

          <p>Você foi convidado${invitedBy?.userName ? ` por <strong>${invitedBy.userName}</strong>` : ''} para fazer parte da <strong>Health Mind</strong>, uma plataforma moderna de gestão de clínicas e atendimento psicológico.</p>

          <div class="info-box">
            <strong>📋 Dados pré-cadastrados:</strong><br>
            ${preFilledData?.name ? `Nome: ${preFilledData.name}<br>` : ''}
            ${preFilledData?.cnpj ? `CNPJ: ${preFilledData.cnpj}<br>` : ''}
            E-mail: ${email}
          </div>

          <p>Para completar seu cadastro como <strong>Clínica</strong>, clique no botão abaixo:</p>

          <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">✨ Completar Cadastro</a>
          </div>

          <p style="font-size: 12px; color: #666;">
            Ou copie e cole este link no navegador:<br>
            <a href="${invitationUrl}">${invitationUrl}</a>
          </p>

          <p><strong>⏰ Este convite expira em 7 dias.</strong></p>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <strong>🔒 Dica de Segurança:</strong><br>
            Nunca compartilhe este link com outras pessoas. Ele é único e pessoal.
          </div>
        </div>
        <div class="footer">
          <p>Health Mind - Plataforma de Gestão em Saúde Mental</p>
          <p>Este é um e-mail automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Enviar convite para psicólogo
 */
const sendPsychologistInvitation = async (invitation, clinicName) => {
  const { email, preFilledData, invitationUrl, invitedBy } = invitation;

  const subject = '👨‍⚕️ Convite para cadastro como Psicólogo - Health Mind';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 Health Mind</h1>
          <p>Convite para Psicólogo</p>
        </div>
        <div class="content">
          <h2>Olá, ${preFilledData?.name || 'Profissional'}! 👋</h2>

          <p>Você foi convidado pela <strong>${clinicName || 'clínica'}</strong> para se juntar à plataforma <strong>Health Mind</strong> como psicólogo.</p>

          <div class="info-box">
            <strong>📋 Dados pré-cadastrados:</strong><br>
            ${preFilledData?.name ? `Nome: ${preFilledData.name}<br>` : ''}
            ${preFilledData?.crp ? `CRP: ${preFilledData.crp}<br>` : ''}
            E-mail: ${email}<br>
            ${preFilledData?.specialties?.length ? `Especialidades: ${preFilledData.specialties.join(', ')}<br>` : ''}
          </div>

          <p>Para completar seu cadastro e acessar a plataforma, clique no botão abaixo:</p>

          <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">✨ Completar Cadastro</a>
          </div>

          <p style="font-size: 12px; color: #666;">
            Ou copie e cole este link no navegador:<br>
            <a href="${invitationUrl}">${invitationUrl}</a>
          </p>

          <p><strong>⏰ Este convite expira em 7 dias.</strong></p>

          <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <strong>🎯 Próximos passos:</strong><br>
            1. Complete seu cadastro<br>
            2. Configure seu perfil profissional<br>
            3. Adicione seus pacientes<br>
            4. Comece a gerenciar seus atendimentos
          </div>
        </div>
        <div class="footer">
          <p>Health Mind - Plataforma de Gestão em Saúde Mental</p>
          <p>Este é um e-mail automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Enviar convite para paciente
 */
const sendPatientInvitation = async (invitation, psychologistName) => {
  const { email, preFilledData, invitationUrl } = invitation;

  const subject = '💙 Convite para cadastro - Health Mind';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 Health Mind</h1>
          <p>Bem-vindo!</p>
        </div>
        <div class="content">
          <h2>Olá, ${preFilledData?.name || 'paciente'}! 👋</h2>

          <p>Seu psicólogo, <strong>${psychologistName || 'Dr(a).'}</strong>, convidou você para acessar a plataforma <strong>Health Mind</strong>, onde você poderá:</p>

          <ul>
            <li>📅 Agendar e acompanhar suas consultas</li>
            <li>💬 Conversar com seu psicólogo</li>
            <li>📄 Acessar seus documentos</li>
            <li>📊 Acompanhar sua evolução</li>
          </ul>

          <div class="info-box">
            <strong>📋 Dados pré-cadastrados:</strong><br>
            ${preFilledData?.name ? `Nome: ${preFilledData.name}<br>` : ''}
            E-mail: ${email}
          </div>

          <p>Para completar seu cadastro, clique no botão abaixo:</p>

          <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">✨ Completar Cadastro</a>
          </div>

          <p style="font-size: 12px; color: #666;">
            Ou copie e cole este link no navegador:<br>
            <a href="${invitationUrl}">${invitationUrl}</a>
          </p>

          <p><strong>⏰ Este convite expira em 7 dias.</strong></p>

          <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <strong>🔐 Privacidade garantida:</strong><br>
            Seus dados são protegidos e apenas você e seu psicólogo têm acesso.
          </div>
        </div>
        <div class="footer">
          <p>Health Mind - Plataforma de Gestão em Saúde Mental</p>
          <p>Este é um e-mail automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

/**
 * Enviar e-mail de boas-vindas após cadastro completo
 */
const sendWelcomeEmail = async (user) => {
  const subject = '🎉 Bem-vindo à Health Mind!';

  const roleNames = {
    clinic: 'Clínica',
    psychologist: 'Psicólogo',
    patient: 'Paciente',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Cadastro Completo!</h1>
        </div>
        <div class="content">
          <h2>Olá, ${user.name}! 👋</h2>

          <p>Seu cadastro como <strong>${roleNames[user.role]}</strong> foi concluído com sucesso na <strong>Health Mind</strong>!</p>

          <p>Agora você pode acessar a plataforma e aproveitar todos os recursos disponíveis.</p>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">🚀 Acessar Plataforma</a>
          </div>

          <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <strong>📧 Seus dados de acesso:</strong><br>
            E-mail: ${user.email}<br>
            <em>Use a senha que você cadastrou no formulário de registro.</em>
          </div>

          <p>Se tiver alguma dúvida, estamos aqui para ajudar!</p>
        </div>
        <div class="footer">
          <p>Health Mind - Plataforma de Gestão em Saúde Mental</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: user.email, subject, html });
};

module.exports = {
  sendEmail,
  sendClinicInvitation,
  sendPsychologistInvitation,
  sendPatientInvitation,
  sendWelcomeEmail,
};
