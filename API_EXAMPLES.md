# 📮 Exemplos de Requisições - Health Mind API

Esta documentação contém exemplos práticos de todas as requisições da API.

## 📌 Informações Importantes

- **Base URL**: `http://localhost:5000/api`
- **Formato**: JSON
- **Autenticação**: Bearer Token (exceto rotas públicas)
- **Header Padrão**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {token}"
  }
  ```

---

## 🔐 Autenticação

### 1. Registrar Clínica

```http
POST /api/auth/register/clinic
Content-Type: application/json

{
  "name": "Clínica Mente Saudável",
  "cnpj": "12345678000190",
  "email": "contato@mentesaudavel.com",
  "password": "Senha@123",
  "phone": "(11) 98765-4321",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  }
}
```

### 2. Registrar Psicólogo

```http
POST /api/auth/register/psychologist
Content-Type: application/json

{
  "clinicId": "65a1234567890abcdef12345",
  "name": "Dr. João Silva",
  "email": "joao.silva@mentesaudavel.com",
  "password": "Senha@123",
  "crp": "06/123456",
  "phone": "(11) 91234-5678",
  "specialties": ["TCC", "Ansiedade", "Depressão", "Terapia de Casal"]
}
```

### 3. Registrar Paciente

```http
POST /api/auth/register/patient
Content-Type: application/json

{
  "psychologistId": "65a1234567890abcdef12346",
  "name": "Maria Santos",
  "email": "maria.santos@email.com",
  "password": "Senha@123",
  "phone": "(11) 99876-5432",
  "birthDate": "1990-05-15",
  "cpf": "12345678901",
  "emergencyContact": {
    "name": "José Santos",
    "phone": "(11) 99999-9999",
    "relationship": "Pai"
  }
}
```

### 4. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "maria.santos@email.com",
  "password": "Senha@123"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "_id": "65a1234567890abcdef12347",
      "name": "Maria Santos",
      "email": "maria.santos@email.com",
      "role": "patient",
      "psychologistId": "65a1234567890abcdef12346",
      "createdAt": "2024-01-15T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YTEyMzQ1Njc4OTBhYmNkZWYxMjM0NyIsInJvbGUiOiJwYXRpZW50IiwiaWF0IjoxNzA1MzE2NDAwLCJleHAiOjE3MDU0MDI4MDB9.abc123def456ghi789",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YTEyMzQ1Njc4OTBhYmNkZWYxMjM0NyIsInJvbGUiOiJwYXRpZW50IiwiaWF0IjoxNzA1MzE2NDAwLCJleHAiOjE3MDU5MjEyMDB9.xyz987uvw654rst321"
  }
}
```

### 5. Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 6. Obter Usuário Logado

```http
GET /api/auth/me
Authorization: Bearer {token}
```

### 7. Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

---

## 🏥 Clínicas

### 1. Obter Dados da Clínica

```http
GET /api/clinics/65a1234567890abcdef12345
Authorization: Bearer {token_da_clinica}
```

### 2. Atualizar Clínica

```http
PUT /api/clinics/65a1234567890abcdef12345
Authorization: Bearer {token_da_clinica}
Content-Type: application/json

{
  "name": "Clínica Mente Saudável - Unidade Centro",
  "phone": "(11) 91111-2222",
  "address": {
    "street": "Av. Paulista",
    "number": "1000",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  }
}
```

### 3. Upload de Logo

```http
POST /api/clinics/65a1234567890abcdef12345/logo
Authorization: Bearer {token_da_clinica}
Content-Type: multipart/form-data

logo: [arquivo de imagem PNG/JPG, max 5MB]
```

### 4. Listar Psicólogos

```http
GET /api/clinics/65a1234567890abcdef12345/psychologists?page=1&limit=10&search=João
Authorization: Bearer {token_da_clinica}
```

**Query Parameters:**
- `page` (opcional): Número da página (default: 1)
- `limit` (opcional): Itens por página (default: 10)
- `search` (opcional): Busca por nome ou email

### 5. Estatísticas

```http
GET /api/clinics/65a1234567890abcdef12345/stats
Authorization: Bearer {token_da_clinica}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalPsychologists": 15,
    "totalPatients": 250,
    "totalAppointments": 1500,
    "appointmentsByStatus": {
      "scheduled": 45,
      "confirmed": 30,
      "completed": 1380,
      "cancelled": 45
    }
  }
}
```

---

## 👨‍⚕️ Psicólogos

### 1. Obter Psicólogo

```http
GET /api/psychologists/65a1234567890abcdef12346
Authorization: Bearer {token_do_psicologo_ou_clinica}
```

### 2. Atualizar Psicólogo

```http
PUT /api/psychologists/65a1234567890abcdef12346
Authorization: Bearer {token_do_psicologo}
Content-Type: application/json

{
  "name": "Dr. João Silva Costa",
  "phone": "(11) 98888-7777",
  "specialties": ["TCC", "Ansiedade", "Depressão", "EMDR", "Burnout"]
}
```

### 3. Upload de Avatar

```http
POST /api/psychologists/65a1234567890abcdef12346/avatar
Authorization: Bearer {token_do_psicologo}
Content-Type: multipart/form-data

avatar: [arquivo de imagem, max 5MB]
```

### 4. Listar Pacientes

```http
GET /api/psychologists/65a1234567890abcdef12346/patients?page=1&limit=20&search=Maria
Authorization: Bearer {token_do_psicologo}
```

### 5. Listar Agendamentos

```http
GET /api/psychologists/65a1234567890abcdef12346/appointments?status=scheduled&startDate=2024-01-15&endDate=2024-01-31
Authorization: Bearer {token_do_psicologo}
```

**Query Parameters:**
- `status`: scheduled, confirmed, completed, cancelled
- `startDate`: Data inicial (ISO 8601)
- `endDate`: Data final (ISO 8601)
- `page`, `limit`: Paginação

---

## 👤 Pacientes

### 1. Obter Paciente

```http
GET /api/patients/65a1234567890abcdef12347
Authorization: Bearer {token_do_paciente_ou_psicologo}
```

### 2. Atualizar Paciente

```http
PUT /api/patients/65a1234567890abcdef12347
Authorization: Bearer {token_do_paciente}
Content-Type: application/json

{
  "name": "Maria Santos Silva",
  "phone": "(11) 99999-8888",
  "emergencyContact": {
    "name": "João Santos",
    "phone": "(11) 98888-7777",
    "relationship": "Irmão"
  }
}
```

### 3. Upload de Avatar

```http
POST /api/patients/65a1234567890abcdef12347/avatar
Authorization: Bearer {token_do_paciente}
Content-Type: multipart/form-data

avatar: [arquivo de imagem]
```

### 4. Listar Agendamentos

```http
GET /api/patients/65a1234567890abcdef12347/appointments?status=scheduled
Authorization: Bearer {token_do_paciente}
```

### 5. Listar Documentos

```http
GET /api/patients/65a1234567890abcdef12347/documents?type=session_report&page=1
Authorization: Bearer {token_do_paciente}
```

---

## 📄 Documentos

### 1. Criar Documento

```http
POST /api/documents
Authorization: Bearer {token_do_psicologo}
Content-Type: application/json

{
  "patientId": "65a1234567890abcdef12347",
  "psychologistId": "65a1234567890abcdef12346",
  "type": "session_report",
  "title": "Sessão 05 - Evolução Clínica",
  "content": "Paciente demonstra melhora significativa nos sintomas de ansiedade. Continua engajado no tratamento e aplicando as técnicas de TCC no dia a dia.",
  "tags": ["evolução", "ansiedade", "TCC", "quinta-sessão"],
  "isPrivate": true
}
```

**Tipos de Documento:**
- `anamnesis`: Anamnese
- `session_report`: Relatório de Sessão
- `evaluation`: Avaliação
- `prescription`: Prescrição
- `other`: Outro

### 2. Obter Documento

```http
GET /api/documents/65a1234567890abcdef12348
Authorization: Bearer {token_do_psicologo_ou_paciente}
```

### 3. Atualizar Documento

```http
PUT /api/documents/65a1234567890abcdef12348
Authorization: Bearer {token_do_psicologo}
Content-Type: application/json

{
  "title": "Sessão 05 - Evolução Clínica (Atualizado)",
  "content": "Conteúdo atualizado...",
  "tags": ["evolução", "ansiedade", "TCC", "quinta-sessão", "progresso"],
  "isPrivate": false
}
```

### 4. Deletar Documento (Soft Delete)

```http
DELETE /api/documents/65a1234567890abcdef12348
Authorization: Bearer {token_do_psicologo}
```

### 5. Upload de PDF

```http
POST /api/documents/65a1234567890abcdef12348/pdf
Authorization: Bearer {token_do_psicologo}
Content-Type: multipart/form-data

pdf: [arquivo PDF, max 10MB]
```

### 6. Listar Documentos de Paciente

```http
GET /api/documents/patient/65a1234567890abcdef12347?type=session_report&search=ansiedade&page=1&limit=10
Authorization: Bearer {token_do_psicologo_ou_paciente}
```

---

## 💬 Chat com IA

### 1. Enviar Mensagem

```http
POST /api/chat
Authorization: Bearer {token_do_paciente}
Content-Type: application/json

{
  "patientId": "65a1234567890abcdef12347",
  "message": "Estou me sentindo muito ansioso hoje. Como posso lidar com isso?"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "data": {
    "_id": "65a1234567890abcdef12349",
    "patientId": "65a1234567890abcdef12347",
    "message": "Estou me sentindo muito ansioso hoje. Como posso lidar com isso?",
    "response": "Entendo que você está se sentindo ansioso. Aqui estão algumas técnicas que podem ajudar:\n\n1. **Respiração profunda**: Inspire por 4 segundos, segure por 4, expire por 4.\n2. **Exercício físico**: Uma caminhada de 10 minutos pode reduzir a ansiedade.\n3. **Mindfulness**: Tente focar no momento presente.\n4. **Contato social**: Converse com alguém de confiança.\n\nLembre-se: se a ansiedade persistir, converse com seu psicólogo.",
    "sentiment": "negative",
    "isAI": true,
    "createdAt": "2024-01-15T14:30:00.000Z"
  }
}
```

### 2. Histórico de Chat

```http
GET /api/chat/patient/65a1234567890abcdef12347?page=1&limit=20
Authorization: Bearer {token_do_paciente_ou_psicologo}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "65a1234567890abcdef12349",
        "message": "Como posso melhorar meu sono?",
        "response": "Para melhorar seu sono...",
        "sentiment": "neutral",
        "isAI": true,
        "createdAt": "2024-01-15T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    },
    "sentimentStats": {
      "positive": 15,
      "neutral": 20,
      "negative": 10
    }
  }
}
```

### 3. Deletar Mensagem

```http
DELETE /api/chat/65a1234567890abcdef12349
Authorization: Bearer {token_do_paciente}
```

---

## 📅 Agendamentos

### 1. Criar Agendamento

```http
POST /api/appointments
Authorization: Bearer {token_do_paciente_ou_psicologo}
Content-Type: application/json

{
  "patientId": "65a1234567890abcdef12347",
  "psychologistId": "65a1234567890abcdef12346",
  "date": "2024-02-15T14:00:00.000Z",
  "duration": 50,
  "type": "online",
  "notes": "Consulta de acompanhamento"
}
```

**Tipos:**
- `online`: Consulta online
- `in_person`: Consulta presencial

### 2. Obter Agendamento

```http
GET /api/appointments/65a123456789abcdef1234a
Authorization: Bearer {token}
```

### 3. Atualizar Agendamento

```http
PUT /api/appointments/65a123456789abcdef1234a
Authorization: Bearer {token_do_psicologo_ou_paciente}
Content-Type: application/json

{
  "date": "2024-02-15T15:00:00.000Z",
  "duration": 60,
  "notes": "Sessão estendida - discussão de plano terapêutico"
}
```

### 4. Cancelar Agendamento

```http
DELETE /api/appointments/65a123456789abcdef1234a
Authorization: Bearer {token_do_psicologo_ou_paciente}
Content-Type: application/json

{
  "cancelledBy": "patient",
  "cancelledReason": "Conflito de horário"
}
```

### 5. Listar Agendamentos do Psicólogo

```http
GET /api/appointments/psychologist/65a1234567890abcdef12346?status=scheduled&startDate=2024-02-01
Authorization: Bearer {token_do_psicologo}
```

### 6. Listar Agendamentos do Paciente

```http
GET /api/appointments/patient/65a1234567890abcdef12347?status=confirmed
Authorization: Bearer {token_do_paciente}
```

---

## 🔄 Fluxo Completo de Exemplo

### Cenário: Clínica registra psicólogo que atende paciente

```bash
# 1. Registrar Clínica
POST /api/auth/register/clinic
{
  "name": "Clínica Teste",
  "cnpj": "12345678000190",
  "email": "clinica@teste.com",
  "password": "Senha@123"
}
# Resposta: { token: "TOKEN_CLINICA", clinicId: "ID_CLINICA" }

# 2. Registrar Psicólogo
POST /api/auth/register/psychologist
{
  "clinicId": "ID_CLINICA",
  "name": "Dr. João",
  "email": "joao@teste.com",
  "password": "Senha@123",
  "crp": "06/123456"
}
# Resposta: { token: "TOKEN_PSICOLOGO", psychologistId: "ID_PSICOLOGO" }

# 3. Registrar Paciente
POST /api/auth/register/patient
{
  "psychologistId": "ID_PSICOLOGO",
  "name": "Maria",
  "email": "maria@teste.com",
  "password": "Senha@123"
}
# Resposta: { token: "TOKEN_PACIENTE", patientId: "ID_PACIENTE" }

# 4. Paciente envia mensagem no chat
POST /api/chat
Authorization: Bearer TOKEN_PACIENTE
{
  "patientId": "ID_PACIENTE",
  "message": "Como lidar com ansiedade?"
}

# 5. Paciente agenda consulta
POST /api/appointments
Authorization: Bearer TOKEN_PACIENTE
{
  "patientId": "ID_PACIENTE",
  "psychologistId": "ID_PSICOLOGO",
  "date": "2024-02-15T14:00:00.000Z",
  "duration": 50,
  "type": "online"
}

# 6. Psicólogo cria documento
POST /api/documents
Authorization: Bearer TOKEN_PSICOLOGO
{
  "patientId": "ID_PACIENTE",
  "psychologistId": "ID_PSICOLOGO",
  "type": "session_report",
  "title": "Sessão 01",
  "content": "Anamnese inicial..."
}

# 7. Clínica visualiza estatísticas
GET /api/clinics/ID_CLINICA/stats
Authorization: Bearer TOKEN_CLINICA
```

---

## 📊 Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Não autenticado
- `403 Forbidden`: Sem permissão
- `404 Not Found`: Recurso não encontrado
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Erro no servidor

---

## 🛡️ Tratamento de Erros

Todas as respostas de erro seguem o padrão:

```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": ["Lista de erros detalhados (opcional)"]
}
```

**Exemplos:**

```json
// Email já cadastrado
{
  "success": false,
  "message": "Email já cadastrado"
}

// Token inválido
{
  "success": false,
  "message": "Token inválido"
}

// Validação de campos
{
  "success": false,
  "message": "Erro de validação",
  "errors": [
    "Nome é obrigatório",
    "Email inválido",
    "Senha deve ter no mínimo 6 caracteres"
  ]
}
```

---

## 🎯 Dicas para Testar

1. **Use variáveis de ambiente** no Postman/Insomnia
2. **Salve os tokens** após login/registro
3. **Use Pre-request Scripts** para automatizar autenticação
4. **Organize requisições em pastas** por módulo
5. **Crie testes automatizados** para validar respostas

---

**Happy Testing! 🚀**
