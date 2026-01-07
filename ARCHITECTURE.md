# 🏗️ Arquitetura - Health Mind API

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  (Frontend Web/Mobile, Postman, cURL, etc.)                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS Requests
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                       │
│  • CORS                                                     │
│  • Rate Limiting (100 req/15min)                           │
│  • Helmet (Security Headers)                               │
│  • Body Parser (JSON, max 50MB)                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION LAYER                      │
│  • Passport.js (Google OAuth 2.0)                          │
│  • JWT Verification                                         │
│  • Session Management                                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      ROUTING LAYER                          │
│  ┌────────────┬──────────────┬─────────────┬──────────┐   │
│  │   Auth     │   Clinics    │ Psychologist│ Patients │   │
│  │  Routes    │   Routes     │   Routes    │  Routes  │   │
│  └────────────┴──────────────┴─────────────┴──────────┘   │
│  ┌────────────┬──────────────┬─────────────────────────┐   │
│  │ Documents  │     Chat     │     Appointments        │   │
│  │  Routes    │   Routes     │        Routes           │   │
│  └────────────┴──────────────┴─────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   MIDDLEWARE LAYER                          │
│  • Auth Middleware (protect, optionalAuth)                 │
│  • Role Check (authorize, authorizeOwnerOrAbove)           │
│  • Upload Handler (images, PDFs)                           │
│  • Error Handler (global)                                  │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONTROLLER LAYER                          │
│  ┌────────────┬──────────────┬─────────────┬──────────┐   │
│  │    Auth    │   Clinic     │Psychologist │  Patient │   │
│  │ Controller │ Controller   │ Controller  │Controller│   │
│  └────────────┴──────────────┴─────────────┴──────────┘   │
│  ┌────────────┬──────────────┬─────────────────────────┐   │
│  │  Document  │     Chat     │     Appointment         │   │
│  │ Controller │  Controller  │      Controller         │   │
│  └────────────┴──────────────┴─────────────────────────┘   │
│                                                             │
│  • Business Logic                                          │
│  • Validation                                              │
│  • Response Formatting                                     │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                          │
│  ┌─────────────────────┬──────────────────────────────┐   │
│  │   File Helper       │      Validator               │   │
│  │   • Base64 Convert  │      • CPF/CNPJ              │   │
│  │   • Image Resize    │      • Email                 │   │
│  │   • PDF Process     │      • CRP                   │   │
│  └─────────────────────┴──────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                       MODEL LAYER                           │
│  ┌────────────┬──────────────┬─────────────┬──────────┐   │
│  │   Clinic   │ Psychologist │   Patient   │ Document │   │
│  │   Model    │    Model     │    Model    │  Model   │   │
│  └────────────┴──────────────┴─────────────┴──────────┘   │
│  ┌────────────┬──────────────────────────────────────┐    │
│  │ChatMessage │       Appointment                    │    │
│  │   Model    │          Model                       │    │
│  └────────────┴──────────────────────────────────────┘    │
│                                                             │
│  • Schemas & Validations                                   │
│  • Indexes                                                 │
│  • Methods (instance & static)                             │
│  • Query Helpers                                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
│                    MongoDB + Mongoose                       │
│                                                             │
│  Collections:                                              │
│  • clinics                                                 │
│  • psychologists                                           │
│  • patients                                                │
│  • documents                                               │
│  • chatmessages                                            │
│  • appointments                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Requisição

### Exemplo: Paciente envia mensagem no chat

```
1. Client Request
   ↓
   POST /api/chat
   Headers: { Authorization: Bearer token }
   Body: { patientId, message }

2. API Gateway
   ↓
   • CORS check ✓
   • Rate limit check ✓
   • Body parsing ✓

3. Authentication
   ↓
   • JWT verification ✓
   • User lookup (Patient) ✓
   • Set req.user

4. Routing
   ↓
   • Match route: POST /api/chat
   • Call middleware chain

5. Middleware
   ↓
   • protect middleware ✓
   • authorize(['patient']) ✓

6. Controller
   ↓
   • chatController.sendMessage()
   • Validate input
   • Check patient ownership
   • Analyze sentiment
   • Generate AI response

7. Model
   ↓
   • ChatMessage.create()
   • Save to MongoDB

8. Response
   ↓
   • Format response
   • Return JSON
   • Status 201 Created

9. Client
   ↓
   • Receive response
   • Update UI
```

---

## 🗂️ Estrutura de Diretórios Detalhada

```
api-health-mind/
│
├── src/                                    # Código fonte
│   │
│   ├── config/                             # Configurações
│   │   ├── database.js                     # MongoDB connection
│   │   ├── oauth.js                        # Google OAuth setup
│   │   └── multer.js                       # File upload config
│   │
│   ├── models/                             # Mongoose Models
│   │   ├── Clinic.js                       # 3 roles ↓
│   │   ├── Psychologist.js                 # Hierarquia
│   │   ├── Patient.js                      # ↑
│   │   ├── Document.js                     # Documentos clínicos
│   │   ├── ChatMessage.js                  # Chat com IA
│   │   └── Appointment.js                  # Agendamentos
│   │
│   ├── controllers/                        # Business Logic
│   │   ├── authController.js               # Register, Login, OAuth
│   │   ├── clinicController.js             # CRUD + Stats
│   │   ├── psychologistController.js       # CRUD + Patients
│   │   ├── patientController.js            # CRUD + Docs
│   │   ├── documentController.js           # CRUD + PDF
│   │   ├── chatController.js               # Chat + Sentiment
│   │   └── appointmentController.js        # CRUD + Conflicts
│   │
│   ├── middleware/                         # Middleware Functions
│   │   ├── auth.js                         # JWT verification
│   │   ├── roleCheck.js                    # Authorization
│   │   └── uploadHandler.js                # File processing
│   │
│   ├── routes/                             # API Routes
│   │   ├── auth.routes.js                  # /api/auth/*
│   │   ├── clinic.routes.js                # /api/clinics/*
│   │   ├── psychologist.routes.js          # /api/psychologists/*
│   │   ├── patient.routes.js               # /api/patients/*
│   │   ├── document.routes.js              # /api/documents/*
│   │   ├── chat.routes.js                  # /api/chat/*
│   │   └── appointment.routes.js           # /api/appointments/*
│   │
│   ├── utils/                              # Utility Functions
│   │   ├── fileHelper.js                   # Base64, resize, optimize
│   │   └── validator.js                    # CPF, CNPJ, CRP, email
│   │
│   └── server.js                           # Entry Point
│
├── .env                                    # Environment Variables
├── .env.example                            # Template
├── .gitignore                              # Git ignore rules
├── package.json                            # Dependencies
│
└── docs/                                   # Documentation
    ├── README.md                           # Main documentation
    ├── INSTALLATION.md                     # Setup guide
    ├── QUICK_START.md                      # Quick start
    ├── API_EXAMPLES.md                     # Request examples
    ├── PROJECT_SUMMARY.md                  # Project overview
    └── ARCHITECTURE.md                     # This file
```

---

## 🔐 Hierarquia de Roles e Permissões

```
┌─────────────────────────────────────────────────────────────┐
│                         CLÍNICA                             │
│  Role: 'clinic'                                             │
│  Permissões:                                                │
│  ✓ Gerenciar própria clínica                               │
│  ✓ Visualizar/criar/editar psicólogos                      │
│  ✓ Visualizar pacientes (via psicólogos)                   │
│  ✓ Ver estatísticas consolidadas                           │
│  ✓ Upload de logo                                          │
└────────────────────────┬────────────────────────────────────┘
                         │ 1:N
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      PSICÓLOGO                              │
│  Role: 'psychologist'                                       │
│  Permissões:                                                │
│  ✓ Gerenciar próprio perfil                                │
│  ✓ Visualizar/criar/editar pacientes                       │
│  ✓ Criar/editar/deletar documentos                         │
│  ✓ Ver chat dos pacientes                                  │
│  ✓ Gerenciar agendamentos                                  │
│  ✓ Upload de avatar                                        │
│  ✗ Não acessa outras clínicas                              │
│  ✗ Não acessa outros psicólogos                            │
└────────────────────────┬────────────────────────────────────┘
                         │ 1:N
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                       PACIENTE                              │
│  Role: 'patient'                                            │
│  Permissões:                                                │
│  ✓ Gerenciar próprio perfil                                │
│  ✓ Chat com IA                                             │
│  ✓ Ver próprios documentos                                 │
│  ✓ Criar/visualizar agendamentos                           │
│  ✓ Upload de avatar                                        │
│  ✗ Não acessa outros pacientes                             │
│  ✗ Não cria/edita documentos                               │
│  ✗ Não vê dados de psicólogos/clínicas                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Dados (ER Diagram)

```
┌──────────────────┐
│     Clinic       │
│──────────────────│
│ _id (PK)         │
│ name             │
│ cnpj (UK)        │
│ email (UK)       │
│ password         │
│ phone            │
│ address          │
│ logo (Base64)    │
│ googleId         │
│ role = 'clinic'  │
└────────┬─────────┘
         │ 1
         │ has
         │ N
         ↓
┌──────────────────┐
│  Psychologist    │
│──────────────────│
│ _id (PK)         │
│ clinicId (FK)    │────┐
│ name             │    │
│ email (UK)       │    │
│ password         │    │
│ crp (UK)         │    │
│ phone            │    │
│ specialties[]    │    │
│ avatar (Base64)  │    │
│ googleId         │    │
│ role='psycholog' │    │
└────────┬─────────┘    │
         │ 1            │
         │ treats       │
         │ N            │
         ↓              │
┌──────────────────┐    │
│     Patient      │    │
│──────────────────│    │
│ _id (PK)         │    │
│ psychologistId(FK)│───┘
│ name             │
│ email (UK)       │
│ password         │
│ phone            │
│ birthDate        │
│ cpf (UK)         │
│ avatar (Base64)  │
│ googleId         │
│ role='patient'   │
│ emergencyContact │
└────────┬─────────┘
         │ 1
         │ has
         │ N
         ↓
┌──────────────────┐         ┌──────────────────┐
│    Document      │         │   ChatMessage    │
│──────────────────│         │──────────────────│
│ _id (PK)         │         │ _id (PK)         │
│ patientId (FK)   │←───┐    │ patientId (FK)   │←──┐
│ psychologistId(FK)│    │    │ message          │   │
│ type             │    │    │ response         │   │
│ title            │    │    │ sentiment        │   │
│ content          │    │    │ isAI             │   │
│ pdfFile (Base64) │    │    │ createdAt        │   │
│ tags[]           │    │    └──────────────────┘   │
│ isPrivate        │    │                           │
│ createdAt        │    │    ┌──────────────────┐   │
└──────────────────┘    └────│   Appointment    │   │
                             │──────────────────│   │
                             │ _id (PK)         │   │
                             │ patientId (FK)   │───┘
                             │ psychologistId(FK)│
                             │ date             │
                             │ duration         │
                             │ status           │
                             │ type             │
                             │ notes            │
                             │ reminderSent     │
                             └──────────────────┘
```

---

## 🔧 Principais Padrões de Design

### 1. **MVC (Model-View-Controller)**
- **Model**: Mongoose schemas (models/)
- **View**: JSON responses
- **Controller**: Business logic (controllers/)

### 2. **Middleware Pattern**
- Autenticação
- Autorização
- Upload de arquivos
- Tratamento de erros

### 3. **Repository Pattern**
- Mongoose models como repositories
- Query helpers para filtros comuns

### 4. **Factory Pattern**
- generateToken, generateRefreshToken
- Geração de respostas padronizadas

### 5. **Soft Delete Pattern**
- Campo `deletedAt` em todos os models
- Query helper `notDeleted()`

### 6. **Singleton Pattern**
- Database connection
- Express app instance

---

## 📈 Performance e Otimizações

### Indexes do MongoDB
```javascript
// Clinic
clinicSchema.index({ email: 1 });
clinicSchema.index({ cnpj: 1 });

// Psychologist
psychologistSchema.index({ email: 1 });
psychologistSchema.index({ crp: 1 });
psychologistSchema.index({ clinicId: 1 });

// Patient
patientSchema.index({ email: 1 });
patientSchema.index({ cpf: 1 });
patientSchema.index({ psychologistId: 1 });

// Document
documentSchema.index({ patientId: 1, type: 1 });
documentSchema.index({ psychologistId: 1, createdAt: -1 });

// ChatMessage
chatMessageSchema.index({ patientId: 1, createdAt: -1 });

// Appointment
appointmentSchema.index({ psychologistId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });
```

### Otimizações Implementadas
- ✅ Paginação em todas as listas
- ✅ Select fields específicos quando possível
- ✅ Populate apenas quando necessário
- ✅ Indexes compostos para queries frequentes
- ✅ Soft delete com index
- ✅ Connection pooling (MongoDB)

---

## 🔒 Camadas de Segurança

```
Request
   ↓
[1] Rate Limiting
   ↓
[2] CORS
   ↓
[3] Helmet (Headers)
   ↓
[4] Body Parsing (limit 50MB)
   ↓
[5] JWT Verification
   ↓
[6] Role Authorization
   ↓
[7] Resource Ownership Check
   ↓
[8] Input Validation
   ↓
[9] Sanitization
   ↓
Controller
   ↓
Model Validation
   ↓
MongoDB
```

---

## 📦 Dependências

### Production
```json
{
  "express": "Framework web",
  "mongoose": "MongoDB ODM",
  "bcryptjs": "Hash de senhas",
  "jsonwebtoken": "JWT",
  "passport": "Autenticação",
  "passport-google-oauth20": "Google OAuth",
  "helmet": "Segurança",
  "cors": "CORS",
  "express-rate-limit": "Rate limiting",
  "multer": "Upload",
  "sharp": "Processamento de imagens",
  "express-validator": "Validação",
  "morgan": "Logging",
  "dotenv": "Env vars"
}
```

### Development
```json
{
  "nodemon": "Auto-reload",
  "jest": "Testes",
  "supertest": "Testes de API"
}
```

---

## 📊 Métricas do Projeto

```
Linhas de Código:        ~5,077 linhas
Arquivos JS:             29 arquivos
Models:                  6 models
Controllers:             7 controllers
Routes:                  7 route files
Middlewares:             3 middlewares
Utils:                   2 utilities
Endpoints:               38 endpoints
Documentation:           6 arquivos (10,000+ linhas)
```

---

## 🚀 Escalabilidade

### Horizontal Scaling
- ✅ API stateless (exceto sessões)
- ✅ JWT não requer estado no servidor
- ✅ MongoDB sharding-ready
- ✅ Load balancer friendly

### Vertical Scaling
- ✅ Connection pooling
- ✅ Indexes otimizados
- ✅ Paginação implementada
- ✅ Queries otimizadas

### Caching Strategy (Future)
```
Client → CDN → Load Balancer → API → Redis → MongoDB
                                       ↑
                                    Cache Layer
```

---

## 🔮 Roadmap Técnico

### Phase 1 ✅ (Atual)
- ✅ API REST completa
- ✅ Autenticação JWT
- ✅ CRUD de todos os recursos
- ✅ Upload de arquivos
- ✅ Chat básico com IA

### Phase 2 (Próximo)
- [ ] Testes automatizados (Jest + Supertest)
- [ ] Integração real com OpenAI/Claude
- [ ] Sistema de notificações (Email/SMS)
- [ ] WebSockets para chat real-time

### Phase 3 (Futuro)
- [ ] GraphQL API
- [ ] Microservices architecture
- [ ] Redis caching
- [ ] Elasticsearch para busca
- [ ] Docker + Kubernetes
- [ ] CI/CD pipeline

---

## 📚 Recursos e Referências

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MongoDB Performance](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

---

**Health Mind API** - Arquitetura robusta, escalável e segura 🏗️
