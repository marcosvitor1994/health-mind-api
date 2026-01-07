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
MONGODB_URI=mongodb://localhost:27017/health-mind-db

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_mude_em_producao
JWT_REFRESH_SECRET=seu_refresh_secret_super_seguro_mude_em_producao
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth 2.0
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:3000

# Upload Limits (bytes)
MAX_IMAGE_SIZE=5242880
MAX_PDF_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET=seu_session_secret_super_seguro
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

---

## 🔐 Endpoints de Autenticação

### Registrar Clínica

```http
POST /api/auth/register/clinic
```

**Body:**
```json
{
  "name": "Clínica Exemplo",
  "cnpj": "12345678000190",
  "email": "clinica@exemplo.com",
  "password": "senha123",
  "phone": "(11) 98765-4321",
  "address": {
    "street": "Rua Exemplo",
    "number": "123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Clínica registrada com sucesso",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Registrar Psicólogo

```http
POST /api/auth/register/psychologist
```

**Body:**
```json
{
  "clinicId": "60d5ec49f1b2c72b8c8e4f1a",
  "name": "Dr. João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "crp": "06/123456",
  "phone": "(11) 98765-4321",
  "specialties": ["TCC", "Ansiedade", "Depressão"]
}
```

---

### Registrar Paciente

```http
POST /api/auth/register/patient
```

**Body:**
```json
{
  "psychologistId": "60d5ec49f1b2c72b8c8e4f1b",
  "name": "Maria Santos",
  "email": "maria@exemplo.com",
  "password": "senha123",
  "phone": "(11) 98765-4321",
  "birthDate": "1990-05-15",
  "cpf": "12345678901",
  "emergencyContact": {
    "name": "José Santos",
    "phone": "(11) 99999-9999",
    "relationship": "Pai"
  }
}
```

---

### Login

```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "name": "Dr. João Silva",
      "email": "joao@exemplo.com",
      "role": "psychologist"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Refresh Token

```http
POST /api/auth/refresh-token
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Obter Usuário Logado

```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer {token}
```

---

### Login com Google

```http
GET /api/auth/google
```

Redireciona para o fluxo de autenticação do Google.

---

## 🏥 Endpoints de Clínicas

### Obter Clínica

```http
GET /api/clinics/:id
```

---

### Atualizar Clínica

```http
PUT /api/clinics/:id
```

**Body:**
```json
{
  "name": "Clínica Atualizada",
  "phone": "(11) 91234-5678",
  "address": { ... }
}
```

---

### Upload de Logo

```http
POST /api/clinics/:id/logo
```

**Body (multipart/form-data):**
```
logo: [arquivo de imagem]
```

---

### Listar Psicólogos da Clínica

```http
GET /api/clinics/:id/psychologists?page=1&limit=10&search=João
```

---

### Estatísticas da Clínica

```http
GET /api/clinics/:id/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPsychologists": 15,
    "totalPatients": 150,
    "totalAppointments": 450,
    "appointmentsByStatus": {
      "scheduled": 25,
      "confirmed": 30,
      "completed": 380,
      "cancelled": 15
    }
  }
}
```

---

## 👨‍⚕️ Endpoints de Psicólogos

### Obter Psicólogo

```http
GET /api/psychologists/:id
```

---

### Atualizar Psicólogo

```http
PUT /api/psychologists/:id
```

---

### Upload de Avatar

```http
POST /api/psychologists/:id/avatar
```

---

### Listar Pacientes

```http
GET /api/psychologists/:id/patients?page=1&limit=10
```

---

### Listar Agendamentos

```http
GET /api/psychologists/:id/appointments?status=scheduled&startDate=2024-01-01
```

---

## 👤 Endpoints de Pacientes

### Obter Paciente

```http
GET /api/patients/:id
```

---

### Atualizar Paciente

```http
PUT /api/patients/:id
```

---

### Upload de Avatar

```http
POST /api/patients/:id/avatar
```

---

### Listar Agendamentos do Paciente

```http
GET /api/patients/:id/appointments
```

---

### Listar Documentos do Paciente

```http
GET /api/patients/:id/documents?type=session_report
```

---

## 📄 Endpoints de Documentos

### Criar Documento

```http
POST /api/documents
```

**Body:**
```json
{
  "patientId": "60d5ec49f1b2c72b8c8e4f1c",
  "psychologistId": "60d5ec49f1b2c72b8c8e4f1b",
  "type": "session_report",
  "title": "Sessão 01 - Anamnese",
  "content": "Conteúdo do documento...",
  "tags": ["primeira-sessão", "anamnese"],
  "isPrivate": true
}
```

---

### Obter Documento

```http
GET /api/documents/:id
```

---

### Atualizar Documento

```http
PUT /api/documents/:id
```

---

### Deletar Documento

```http
DELETE /api/documents/:id
```

---

### Upload de PDF

```http
POST /api/documents/:id/pdf
```

**Body (multipart/form-data):**
```
pdf: [arquivo PDF]
```

---

## 💬 Endpoints de Chat

### Enviar Mensagem

```http
POST /api/chat
```

**Body:**
```json
{
  "patientId": "60d5ec49f1b2c72b8c8e4f1c",
  "message": "Estou me sentindo ansioso hoje"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1d",
    "patientId": "60d5ec49f1b2c72b8c8e4f1c",
    "message": "Estou me sentindo ansioso hoje",
    "response": "Entendo que você está se sentindo ansioso...",
    "sentiment": "negative",
    "isAI": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Obter Histórico de Chat

```http
GET /api/chat/patient/:patientId?page=1&limit=20
```

---

### Deletar Mensagem

```http
DELETE /api/chat/:id
```

---

## 📅 Endpoints de Agendamentos

### Criar Agendamento

```http
POST /api/appointments
```

**Body:**
```json
{
  "patientId": "60d5ec49f1b2c72b8c8e4f1c",
  "psychologistId": "60d5ec49f1b2c72b8c8e4f1b",
  "date": "2024-02-01T14:00:00.000Z",
  "duration": 50,
  "type": "online",
  "notes": "Primeira consulta"
}
```

---

### Obter Agendamento

```http
GET /api/appointments/:id
```

---

### Atualizar Agendamento

```http
PUT /api/appointments/:id
```

---

### Cancelar Agendamento

```http
DELETE /api/appointments/:id
```

**Body:**
```json
{
  "cancelledBy": "patient",
  "cancelledReason": "Imprevistos pessoais"
}
```

---

### Listar Agendamentos do Psicólogo

```http
GET /api/appointments/psychologist/:psychologistId?status=scheduled
```

---

### Listar Agendamentos do Paciente

```http
GET /api/appointments/patient/:patientId
```

---

## 🔒 Segurança

### Implementações de Segurança

- ✅ **Helmet.js**: Proteção de headers HTTP
- ✅ **CORS**: Controle de origem configurável
- ✅ **Rate Limiting**: 100 requisições por 15 minutos
- ✅ **JWT**: Tokens com expiração (24h access, 7d refresh)
- ✅ **Bcrypt**: Hash de senhas com 10 salt rounds
- ✅ **Validação**: Sanitização de inputs
- ✅ **Soft Delete**: Preservação de dados
- ✅ **HTTPS**: Recomendado em produção
- ✅ **Validação de Arquivos**: Tipo e tamanho

### Hierarquia de Permissões

```
Clínica
  └── Psicólogo (acesso aos dados da clínica)
      └── Paciente (acesso aos dados do psicólogo)
          └── Dados próprios (acesso apenas aos próprios dados)
```

---

## 🧪 Testando a API

### Com cURL

```bash
# Registrar clínica
curl -X POST http://localhost:5000/api/auth/register/clinic \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clínica Teste",
    "cnpj": "12345678000190",
    "email": "teste@clinica.com",
    "password": "senha123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@clinica.com",
    "password": "senha123"
  }'

# Obter usuário (com token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Com Postman

1. Importe a collection disponível em `/docs/postman_collection.json` (se disponível)
2. Configure a variável de ambiente `baseUrl` para `http://localhost:5000/api`
3. Execute as requisições

---

## 🚀 Deploy

### Deploy em Produção

1. **Configure variáveis de ambiente de produção**
2. **Use MongoDB Atlas** para o banco de dados
3. **Configure HTTPS** (Let's Encrypt, Cloudflare)
4. **Use PM2** para gerenciamento de processos:

```bash
npm install -g pm2
pm2 start src/server.js --name health-mind-api
pm2 startup
pm2 save
```

5. **Configure Nginx** como reverse proxy (opcional)

### Plataformas Recomendadas

- **Railway**: Deploy automático via GitHub
- **Render**: Free tier com auto-deploy
- **Heroku**: Fácil configuração
- **DigitalOcean**: VPS com controle total
- **AWS EC2**: Escalável e robusto

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Desenvolvimento

### Estrutura de Commits

```
feat: Nova funcionalidade
fix: Correção de bug
docs: Documentação
style: Formatação
refactor: Refatoração
test: Testes
chore: Tarefas gerais
```

### Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📧 Suporte

Para dúvidas ou suporte:
- Email: suporte@healthmind.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/health-mind-api/issues)

---

## 🙏 Agradecimentos

Desenvolvido com ❤️ para melhorar o acesso à saúde mental.

---

**Health Mind API** - v1.0.0 - 2024
