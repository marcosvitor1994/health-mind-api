require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/oauth');
const connectDB = require('./config/database');

// Inicializar Express
const app = express();

// Conectar ao MongoDB
connectDB();

// Configuração de CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares globais
app.use(helmet()); // Segurança HTTP headers
app.use(cors(corsOptions)); // CORS
app.use(express.json({ limit: '50mb' })); // Parse JSON (limite para Base64)
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parse URL-encoded
app.use(morgan('dev')); // Logging de requisições

// Configuração de sessão para Google OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'seu_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Muitas requisições deste IP, por favor tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting em todas as rotas
app.use('/api/', limiter);

// Rota de health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Health Mind API está rodando! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    database: 'Connected',
    timestamp: new Date().toISOString(),
  });
});

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const clinicRoutes = require('./routes/clinic.routes');
const psychologistRoutes = require('./routes/psychologist.routes');
const patientRoutes = require('./routes/patient.routes');
const documentRoutes = require('./routes/document.routes');
const chatRoutes = require('./routes/chat.routes');
const appointmentRoutes = require('./routes/appointment.routes');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/psychologists', psychologistRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/appointments', appointmentRoutes);

// Rota 404 - Não encontrado
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
  });
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors,
    });
  }

  // Erro de cast do Mongoose (ObjectId inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido',
    });
  }

  // Erro de duplicação de chave única
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} já está em uso`,
    });
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
    });
  }

  // Erro genérico
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Iniciar servidor (apenas se não estiver rodando na Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            🧠 HEALTH MIND API 🧠                          ║
║                                                           ║
║  Servidor rodando em: http://localhost:${PORT}             ║
║  Ambiente: ${process.env.NODE_ENV || 'development'}                              ║
║  Documentação: /api                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor graciosamente...');
    server.close(() => {
      console.log('Servidor encerrado');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT recebido. Encerrando servidor graciosamente...');
    server.close(() => {
      console.log('Servidor encerrado');
      process.exit(0);
    });
  });

  // Tratamento de promessas não tratadas
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => {
      process.exit(1);
    });
  });
}

// Exportar o app para Vercel
module.exports = app;
