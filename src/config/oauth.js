const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Clinic = require('../models/Clinic');
const Psychologist = require('../models/Psychologist');
const Patient = require('../models/Patient');

// Verificar se as credenciais do Google OAuth estão configuradas
const isGoogleOAuthConfigured = !!(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
);

// Serializar usuário na sessão
passport.serializeUser((user, done) => {
  done(null, { id: user._id, role: user.role });
});

// Deserializar usuário da sessão
passport.deserializeUser(async (data, done) => {
  try {
    let user;

    switch (data.role) {
      case 'clinic':
        user = await Clinic.findById(data.id);
        break;
      case 'psychologist':
        user = await Psychologist.findById(data.id);
        break;
      case 'patient':
        user = await Patient.findById(data.id);
        break;
      default:
        return done(new Error('Role inválido'), null);
    }

    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Estratégia do Google OAuth (apenas se configurado)
if (isGoogleOAuthConfigured) {
  console.log('✅ Google OAuth configurado');
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;
        const avatar = profile.photos[0]?.value;

        // O tipo de usuário deve ser passado na query string (role=clinic|psychologist|patient)
        const role = req.query.state || 'patient'; // Default para paciente

        let user;

        // Buscar usuário existente por googleId ou email
        switch (role) {
          case 'clinic':
            user = await Clinic.findOne({ $or: [{ googleId }, { email }] });
            if (!user) {
              // Criar nova clínica (requer dados adicionais - este é um registro parcial)
              user = await Clinic.create({
                name,
                email,
                googleId,
                password: Math.random().toString(36).slice(-8), // Senha temporária
                role: 'clinic',
              });
            } else if (!user.googleId) {
              user.googleId = googleId;
              await user.save();
            }
            break;

          case 'psychologist':
            user = await Psychologist.findOne({ $or: [{ googleId }, { email }] });
            if (!user) {
              // Criar novo psicólogo (requer clinicId - este é um registro parcial)
              // Em produção, você deve pedir o clinicId antes
              return done(null, false, { message: 'Psicólogo precisa de clinicId para registro via Google' });
            } else if (!user.googleId) {
              user.googleId = googleId;
              await user.save();
            }
            break;

          case 'patient':
            user = await Patient.findOne({ $or: [{ googleId }, { email }] });
            if (!user) {
              // Criar novo paciente (requer psychologistId)
              return done(null, false, { message: 'Paciente precisa de psychologistId para registro via Google' });
            } else if (!user.googleId) {
              user.googleId = googleId;
              await user.save();
            }
            break;

          default:
            return done(new Error('Role inválido'), null);
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
    )
  );
} else {
  console.log('⚠️  Google OAuth não configurado - rotas OAuth desabilitadas');
}

// Exportar passport e flag de configuração
passport.isGoogleOAuthConfigured = isGoogleOAuthConfigured;

module.exports = passport;
