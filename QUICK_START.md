# 🚀 Guia de Início Rápido - Health Mind API

Este guia mostra como configurar e testar a API em poucos minutos.

## ⚡ Início Rápido (5 minutos)

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env` e ajuste conforme necessário:

```bash
# As configurações padrão já funcionam para desenvolvimento local
# Apenas certifique-se de que o MongoDB está rodando
```

### 3. Iniciar MongoDB

**Opção A - MongoDB Local:**
```bash
mongod
```

**Opção B - MongoDB Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Opção C - MongoDB Atlas:**
- Use a connection string no `.env`

### 4. Iniciar o Servidor

```bash
npm run dev
```

Você verá:
```
✅ MongoDB conectado com sucesso

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            🧠 HEALTH MIND API 🧠                          ║
║                                                           ║
║  Servidor rodando em: http://localhost:5000               ║
║  Ambiente: development                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 5. Testar a API

Acesse: http://localhost:5000

Você deve ver:
```json
{
  "success": true,
  "message": "Health Mind API está rodando! 🚀",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧪 Testando Endpoints (Passo a Passo)

### 1️⃣ Registrar uma Clínica

```bash
curl -X POST http://localhost:5000/api/auth/register/clinic \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clínica Mente Saudável",
    "cnpj": "12345678000190",
    "email": "contato@mentesaudavel.com",
    "password": "senha123",
    "phone": "(11) 98765-4321",
    "address": {
      "street": "Rua das Flores",
      "number": "123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    }
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Clínica registrada com sucesso",
  "data": {
    "user": {
      "_id": "65a1234567890abcdef12345",
      "name": "Clínica Mente Saudável",
      "email": "contato@mentesaudavel.com",
      "role": "clinic"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**💾 Salve o `token` e o `_id` da clínica para os próximos passos!**

---

### 2️⃣ Registrar um Psicólogo

Use o `_id` da clínica do passo anterior:

```bash
curl -X POST http://localhost:5000/api/auth/register/psychologist \
  -H "Content-Type: application/json" \
  -d '{
    "clinicId": "65a1234567890abcdef12345",
    "name": "Dr. João Silva",
    "email": "joao.silva@mentesaudavel.com",
    "password": "senha123",
    "crp": "06/123456",
    "phone": "(11) 91234-5678",
    "specialties": ["TCC", "Ansiedade", "Depressão"]
  }'
```

**💾 Salve o `_id` do psicólogo!**

---

### 3️⃣ Registrar um Paciente

Use o `_id` do psicólogo:

```bash
curl -X POST http://localhost:5000/api/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "psychologistId": "65a1234567890abcdef12346",
    "name": "Maria Santos",
    "email": "maria.santos@email.com",
    "password": "senha123",
    "phone": "(11) 99876-5432",
    "birthDate": "1990-05-15",
    "cpf": "12345678901"
  }'
```

**💾 Salve o `_id` e o `token` do paciente!**

---

### 4️⃣ Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria.santos@email.com",
    "password": "senha123"
  }'
```

---

### 5️⃣ Chat com IA (como Paciente)

Use o token do paciente:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_DO_PACIENTE}" \
  -d '{
    "patientId": "65a1234567890abcdef12347",
    "message": "Estou me sentindo muito ansioso ultimamente"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "data": {
    "_id": "65a1234567890abcdef12348",
    "patientId": "65a1234567890abcdef12347",
    "message": "Estou me sentindo muito ansioso ultimamente",
    "response": "Entendo que você está enfrentando ansiedade. É muito importante que você compartilhe isso...",
    "sentiment": "negative",
    "isAI": true,
    "createdAt": "2024-01-15T14:30:00.000Z"
  }
}
```

---

### 6️⃣ Criar Agendamento (como Paciente)

```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_DO_PACIENTE}" \
  -d '{
    "patientId": "65a1234567890abcdef12347",
    "psychologistId": "65a1234567890abcdef12346",
    "date": "2024-02-15T14:00:00.000Z",
    "duration": 50,
    "type": "online",
    "notes": "Primeira consulta"
  }'
```

---

### 7️⃣ Criar Documento (como Psicólogo)

Use o token do psicólogo:

```bash
curl -X POST http://localhost:5000/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_DO_PSICOLOGO}" \
  -d '{
    "patientId": "65a1234567890abcdef12347",
    "psychologistId": "65a1234567890abcdef12346",
    "type": "session_report",
    "title": "Sessão 01 - Anamnese Inicial",
    "content": "Paciente apresentou sintomas de ansiedade...",
    "tags": ["primeira-sessão", "anamnese", "ansiedade"],
    "isPrivate": true
  }'
```

---

### 8️⃣ Listar Pacientes (como Psicólogo)

```bash
curl -X GET "http://localhost:5000/api/psychologists/65a1234567890abcdef12346/patients?page=1&limit=10" \
  -H "Authorization: Bearer {TOKEN_DO_PSICOLOGO}"
```

---

### 9️⃣ Ver Estatísticas (como Clínica)

```bash
curl -X GET "http://localhost:5000/api/clinics/65a1234567890abcdef12345/stats" \
  -H "Authorization: Bearer {TOKEN_DA_CLINICA}"
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalPsychologists": 1,
    "totalPatients": 1,
    "totalAppointments": 1,
    "appointmentsByStatus": {
      "scheduled": 1,
      "confirmed": 0,
      "completed": 0,
      "cancelled": 0
    }
  }
}
```

---

### 🔟 Histórico de Chat (como Paciente)

```bash
curl -X GET "http://localhost:5000/api/chat/patient/65a1234567890abcdef12347?page=1&limit=20" \
  -H "Authorization: Bearer {TOKEN_DO_PACIENTE}"
```

---

## 📱 Testando com Postman/Insomnia

### Configurar Variável de Ambiente

1. Crie uma variável `baseUrl` = `http://localhost:5000/api`
2. Crie uma variável `token` (será preenchida após login)

### Exemplo de Request no Postman

**1. Login:**
- Method: `POST`
- URL: `{{baseUrl}}/auth/login`
- Body (JSON):
```json
{
  "email": "maria.santos@email.com",
  "password": "senha123"
}
```

**2. Copie o token da resposta**

**3. Chat:**
- Method: `POST`
- URL: `{{baseUrl}}/chat`
- Headers:
  - `Authorization`: `Bearer {{token}}`
- Body (JSON):
```json
{
  "patientId": "SEU_PATIENT_ID",
  "message": "Como lidar com ansiedade?"
}
```

---

## 🐛 Troubleshooting

### Erro: "MongoDB connection failed"

**Solução:**
- Verifique se o MongoDB está rodando
- Teste a conexão: `mongosh` ou `mongo`
- Verifique a string de conexão no `.env`

### Erro: "Token inválido"

**Solução:**
- Certifique-se de que está usando o token correto
- Verifique se o token não expirou (24h)
- Use o refresh token para obter um novo

### Erro: "Arquivo muito grande"

**Solução:**
- Imagens: máximo 5MB
- PDFs: máximo 10MB
- Ajuste os limites no `.env`:
  ```
  MAX_IMAGE_SIZE=5242880
  MAX_PDF_SIZE=10485760
  ```

### Erro: "Rate limit exceeded"

**Solução:**
- Aguarde 15 minutos
- Ou ajuste o limite no `.env`:
  ```
  RATE_LIMIT_MAX_REQUESTS=200
  ```

---

## 🔑 Hierarquia de Permissões

```
Clínica (clinic)
  ├── Acessa: Próprios dados, psicólogos, pacientes (via psicólogos)
  └── Pode: Gerenciar clínica, ver estatísticas
      │
      └── Psicólogo (psychologist)
          ├── Acessa: Próprios dados, pacientes, documentos, agendamentos
          └── Pode: Criar documentos, gerenciar agendamentos
              │
              └── Paciente (patient)
                  ├── Acessa: Próprios dados, agendamentos, documentos, chat
                  └── Pode: Agendar consultas, conversar com IA
```

---

## 📊 Fluxo Completo de Uso

### Cenário: Clínica registra psicólogo e psicólogo atende paciente

1. **Clínica** se registra
2. **Clínica** registra **Psicólogo**
3. **Psicólogo** registra **Paciente**
4. **Paciente** faz login
5. **Paciente** conversa com IA no chat
6. **Paciente** agenda consulta
7. **Psicólogo** cria documento após consulta
8. **Clínica** visualiza estatísticas

---

## 🎯 Próximos Passos

1. **Integrar IA real**: Substituir placeholder por OpenAI/Claude API
2. **Notificações**: Email/SMS para lembretes de consulta
3. **Videochamada**: Integração com Zoom/Google Meet
4. **Relatórios**: Geração de PDFs automáticos
5. **Dashboard**: Interface web para clínicas

---

## 📞 Suporte

Problemas? Abra uma issue no GitHub ou entre em contato!

**Happy coding! 🚀**
