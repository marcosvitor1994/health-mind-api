# 🧠 Health Mind API

API REST completa para o aplicativo de saúde mental **Health Mind App**, que conecta clínicas de psicologia, psicólogos e pacientes.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Documentação da API](#documentação-da-api)
- [Exemplos de Requisições](#exemplos-de-requisições)
- [Segurança](#segurança)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Licença](#licença)

## 🎯 Sobre o Projeto

A **Health Mind API** é uma solução backend completa para gestão de saúde mental, seguindo a hierarquia:

- **Clínicas** cadastram e gerenciam **Psicólogos**
- **Psicólogos** cadastram e atendem **Pacientes**
- **Pacientes** têm acesso a:
  - Chat com IA
  - Agendamentos de consultas
  - Documentos clínicos
  - Histórico de atendimento

## ✨ Funcionalidades

### Autenticação e Autorização
- ✅ Registro e login para Clínicas, Psicólogos e Pacientes
- ✅ Autenticação JWT com refresh tokens
- ✅ Login social via Google OAuth 2.0
- ✅ Sistema de roles e permissões hierárquico
- ✅ Senhas hash com bcrypt (10 salt rounds)

### Gestão de Usuários
- ✅ CRUD completo para Clínicas, Psicólogos e Pacientes
- ✅ Upload de avatar e logo (Base64, max 5MB)
- ✅ Soft delete para todos os recursos
- ✅ Validação de CPF, CNPJ, CRP e email

### Documentos Clínicos
- ✅ Criação e gestão de documentos (anamnese, relatórios, avaliações)
- ✅ Upload de PDFs (Base64, max 10MB)
- ✅ Sistema de tags e busca
- ✅ Controle de privacidade

### Chat com IA
- ✅ Chat inteligente para pacientes
- ✅ Análise automática de sentimento (positivo, neutro, negativo)
- ✅ Histórico de conversas
- ✅ Estatísticas de bem-estar

### Agendamentos
- ✅ Sistema completo de agendamento de consultas
- ✅ Verificação automática de conflitos de horário
- ✅ Status de agendamento (agendado, confirmado, concluído, cancelado)
- ✅ Filtros por data, status e tipo (online/presencial)

### Estatísticas
- ✅ Dashboard para clínicas (total de psicólogos, pacientes, consultas)
- ✅ Relatórios de agendamentos por psicólogo
- ✅ Análise de sentimento do chat

## 🛠️ Tecnologias

### Backend
- **Node.js** v18+
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB

### Autenticação
- **JWT** - JSON Web Tokens
- **Passport.js** - Autenticação Google OAuth 2.0
- **bcryptjs** - Hash de senhas

### Segurança
- **Helmet** - Proteção HTTP headers
- **CORS** - Controle de acesso
- **express-rate-limit** - Rate limiting
- **express-validator** - Validação de dados

### Upload e Processamento
- **Multer** - Upload de arquivos
- **Sharp** - Otimização de imagens
- **Base64** - Armazenamento de imagens e PDFs

### Logs
- **Morgan** - HTTP request logger
- **Winston** - Application logger (opcional)

## 📁 Estrutura do Projeto

```
api-health-mind/
├── src/
│   ├── config/
│   │   ├── database.js          # Conexão MongoDB
│   │   ├── oauth.js             # Google OAuth config
│   │   └── multer.js            # Upload config
│   ├── models/
│   │   ├── Clinic.js            # Schema de Clínica
│   │   ├── Psychologist.js      # Schema de Psicólogo
│   │   ├── Patient.js           # Schema de Paciente
│   │   ├── Document.js          # Schema de Documento
│   │   ├── ChatMessage.js       # Schema de Chat
│   │   └── Appointment.js       # Schema de Agendamento
│   ├── controllers/
│   │   ├── authController.js            # Autenticação
│   │   ├── clinicController.js          # Clínicas
│   │   ├── psychologistController.js    # Psicólogos
│   │   ├── patientController.js         # Pacientes
│   │   ├── documentController.js        # Documentos
│   │   ├── chatController.js            # Chat
│   │   └── appointmentController.js     # Agendamentos
│   ├── middleware/
│   │   ├── auth.js              # Verificação JWT
│   │   ├── roleCheck.js         # Verificação de roles
│   │   └── uploadHandler.js     # Processamento de uploads
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── clinic.routes.js
│   │   ├── psychologist.routes.js
│   │   ├── patient.routes.js
│   │   ├── document.routes.js
│   │   ├── chat.routes.js
│   │   └── appointment.routes.js
│   ├── utils/
│   │   ├── fileHelper.js        # Conversão Base64
│   │   └── validator.js         # Validações customizadas
│   └── server.js                # Arquivo principal
├── .env                         # Variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Instalação

### Pré-requisitos

- **Node.js** v18 ou superior
- **MongoDB** v5 ou superior (local ou Atlas)
- **npm** ou **yarn**

### Passo a passo

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/health-mind-api.git
cd health-mind-api
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz do projeto (veja [Variáveis de Ambiente](#variáveis-de-ambiente))

4. **Configure o MongoDB**

- **Local**: Certifique-se de que o MongoDB está rodando na porta padrão 27017
- **Atlas**: Use a connection string do MongoDB Atlas

5. **Configure o Google OAuth (opcional)**

- Acesse [Google Cloud Console](https://console.cloud.google.com/)
- Crie um projeto e ative a API do Google OAuth 2.0
- Configure as credenciais e adicione ao `.env`

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth 2.0
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=...

# Frontend
FRONTEND_URL=...

# Upload Limits (bytes)
MAX_IMAGE_SIZE=5242880
MAX_PDF_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=...
```

## 🏃 Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:5000`

### Produção

```bash
npm start
```

### Logs

O servidor exibirá logs no console:

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            🧠 HEALTH MIND API 🧠                          ║
║                                                           ║
║  Servidor rodando em: http://localhost:5000               ║
║  Ambiente: development                                    ║
║  Documentação: /api                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## 📚 Documentação da API

### Base URL

```
http://localhost:5000/api
```

### Autenticação

Todas as rotas privadas requerem token JWT no header:

```
Authorization: Bearer {token}
```

## 📧 Suporte

Para dúvidas ou suporte:
- Email: marcosvitor1994@gmail.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/health-mind-api/issues)

---

## 🙏 Agradecimentos

Desenvolvido com ❤️ para melhorar o acesso à saúde mental.

---

**Health Mind API** - v1.0.0 - 2026
