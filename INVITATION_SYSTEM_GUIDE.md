# 📨 Sistema de Convites e Pré-Cadastro - Health Mind

## 📋 Visão Geral

O sistema de convites permite um fluxo de cadastro em duas etapas:

1. **Pré-cadastro**: Administrador/Clínica/Psicólogo cria um convite com dados básicos
2. **Finalização**: O convidado recebe um e-mail e completa o cadastro

---

## 🔄 Fluxos de Cadastro

### Fluxo 1: Admin → Clínica

```
[Admin]
  ↓ POST /api/invitations/clinic
[Sistema envia e-mail]
  ↓
[Clínica recebe e-mail com link]
  ↓ GET /api/invitations/validate/:token
[Clínica preenche formulário]
  ↓ POST /api/auth/complete-registration/clinic
[Cadastro completo] ✅
```

### Fluxo 2: Clínica → Psicólogo

```
[Clínica]
  ↓ POST /api/invitations/psychologist
[Sistema envia e-mail]
  ↓
[Psicólogo recebe e-mail com link]
  ↓ GET /api/invitations/validate/:token
[Psicólogo preenche formulário]
  ↓ POST /api/auth/complete-registration/psychologist
[Cadastro completo] ✅
```

### Fluxo 3: Psicólogo/Clínica → Paciente

```
[Psicólogo/Clínica]
  ↓ POST /api/invitations/patient
[Sistema envia e-mail]
  ↓
[Paciente recebe e-mail com link]
  ↓ GET /api/invitations/validate/:token
[Paciente preenche formulário]
  ↓ POST /api/auth/complete-registration/patient
[Cadastro completo] ✅
```

---

## 🎯 Rotas da API

### 1. [ADMIN] Convidar Clínica

**POST** `/api/invitations/clinic`

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "clinica@example.com",
  "name": "Clínica Saúde Mental",
  "cnpj": "12.345.678/0001-90"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Convite enviado com sucesso",
  "data": {
    "invitation": {
      "id": "65abc123...",
      "email": "clinica@example.com",
      "role": "clinic",
      "status": "pending",
      "expiresAt": "2024-01-16T...",
      "invitationUrl": "http://localhost:3000/auth/complete-registration/clinic/abc123..."
    }
  }
}
```

---

### 2. [CLINIC] Convidar Psicólogo

**POST** `/api/invitations/psychologist`

**Headers:**
```
Authorization: Bearer {clinic_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "psicologo@example.com",
  "name": "Dr. João Silva",
  "crp": "06/123456",
  "specialties": ["TCC", "Ansiedade", "Depressão"],
  "phone": "(11) 98765-4321"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Convite enviado com sucesso",
  "data": {
    "invitation": {
      "id": "65def456...",
      "email": "psicologo@example.com",
      "role": "psychologist",
      "status": "pending",
      "expiresAt": "2024-01-16T...",
      "invitationUrl": "http://localhost:3000/auth/complete-registration/psychologist/def456..."
    }
  }
}
```

---

### 3. [PSYCHOLOGIST/CLINIC] Convidar Paciente

**POST** `/api/invitations/patient`

**Headers:**
```
Authorization: Bearer {psychologist_or_clinic_token}
Content-Type: application/json
```

**Body (Psicólogo):**
```json
{
  "email": "paciente@example.com",
  "name": "Maria Santos",
  "phone": "(11) 98765-4321",
  "birthDate": "1990-05-15"
}
```

**Body (Clínica - precisa especificar o psicólogo):**
```json
{
  "email": "paciente@example.com",
  "name": "Maria Santos",
  "phone": "(11) 98765-4321",
  "birthDate": "1990-05-15",
  "psychologistId": "65def456..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Convite enviado com sucesso",
  "data": {
    "invitation": {
      "id": "65ghi789...",
      "email": "paciente@example.com",
      "role": "patient",
      "status": "pending",
      "expiresAt": "2024-01-16T...",
      "invitationUrl": "http://localhost:3000/auth/complete-registration/patient/ghi789..."
    }
  }
}
```

---

### 4. Validar Token de Convite

**GET** `/api/invitations/validate/:token`

**Access:** Public (sem autenticação)

**Response (sucesso):**
```json
{
  "success": true,
  "data": {
    "email": "clinica@example.com",
    "role": "clinic",
    "preFilledData": {
      "name": "Clínica Saúde Mental",
      "cnpj": "12345678000190"
    },
    "expiresAt": "2024-01-16T..."
  }
}
```

**Response (convite expirado):**
```json
{
  "success": false,
  "message": "Este convite expirou"
}
```

**Response (convite já usado):**
```json
{
  "success": false,
  "message": "Convite já foi utilizado"
}
```

---

### 5. Finalizar Cadastro de Clínica

**POST** `/api/auth/complete-registration/clinic`

**Access:** Public (sem autenticação)

**Body:**
```json
{
  "token": "abc123...",
  "password": "SenhaForte123!",
  "phone": "(11) 3456-7890",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "complement": "Sala 4",
    "neighborhood": "Centro",
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
  "message": "Cadastro concluído com sucesso",
  "data": {
    "user": {
      "_id": "65abc123...",
      "name": "Clínica Saúde Mental",
      "email": "clinica@example.com",
      "role": "clinic",
      "cnpj": "12345678000190",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 6. Finalizar Cadastro de Psicólogo

**POST** `/api/auth/complete-registration/psychologist`

**Access:** Public (sem autenticação)

**Body:**
```json
{
  "token": "def456...",
  "password": "SenhaForte123!",
  "phone": "(11) 98765-4321",
  "bio": "Psicólogo com 10 anos de experiência em TCC..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cadastro concluído com sucesso",
  "data": {
    "user": {
      "_id": "65def456...",
      "name": "Dr. João Silva",
      "email": "psicologo@example.com",
      "role": "psychologist",
      "crp": "06/123456",
      "clinicId": "65abc123...",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 7. Finalizar Cadastro de Paciente

**POST** `/api/auth/complete-registration/patient`

**Access:** Public (sem autenticação)

**Body:**
```json
{
  "token": "ghi789...",
  "password": "SenhaForte123!",
  "cpf": "123.456.789-00",
  "emergencyContact": {
    "name": "Pedro Santos",
    "phone": "(11) 98765-9999",
    "relationship": "Irmão"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cadastro concluído com sucesso",
  "data": {
    "user": {
      "_id": "65ghi789...",
      "name": "Maria Santos",
      "email": "paciente@example.com",
      "role": "patient",
      "psychologistId": "65def456...",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 8. Listar Convites Enviados

**GET** `/api/invitations`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (opcional): `pending`, `accepted`, `expired`
- `role` (opcional): `clinic`, `psychologist`, `patient`

**Exemplos:**
```
GET /api/invitations
GET /api/invitations?status=pending
GET /api/invitations?role=psychologist
GET /api/invitations?status=pending&role=patient
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65def456...",
      "email": "psicologo@example.com",
      "role": "psychologist",
      "status": "pending",
      "preFilledData": {
        "name": "Dr. João Silva",
        "crp": "06/123456"
      },
      "expiresAt": "2024-01-16T...",
      "createdAt": "2024-01-09T..."
    },
    {
      "_id": "65ghi789...",
      "email": "paciente@example.com",
      "role": "patient",
      "status": "accepted",
      "acceptedAt": "2024-01-10T...",
      "createdAt": "2024-01-09T..."
    }
  ]
}
```

---

### 9. Cancelar Convite

**DELETE** `/api/invitations/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Convite cancelado com sucesso"
}
```

---

### 10. Reenviar Convite

**POST** `/api/invitations/:id/resend`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Convite reenviado com sucesso"
}
```

---

## 🎨 Implementação no Frontend

### Página de Convite (Clínica convida Psicólogo)

```jsx
import { useState } from 'react';
import api from './api';

function InvitePsychologistForm() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    crp: '',
    specialties: [],
    phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/invitations/psychologist', formData);

      if (response.data.success) {
        alert('Convite enviado! O psicólogo receberá um e-mail.');
        // Mostrar o link de convite (útil para debug)
        console.log('Link:', response.data.data.invitation.invitationUrl);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao enviar convite');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="E-mail"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="Nome completo"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="CRP (ex: 06/123456)"
        value={formData.crp}
        onChange={(e) => setFormData({...formData, crp: e.target.value})}
      />
      <button type="submit">Enviar Convite</button>
    </form>
  );
}
```

---

### Página de Finalização de Cadastro

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';

function CompleteRegistration() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await api.get(`/invitations/validate/${token}`);

      if (response.data.success) {
        setInvitationData(response.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Convite inválido');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    try {
      const endpoint = `/auth/complete-registration/${invitationData.role}`;

      const response = await api.post(endpoint, {
        token,
        password,
        // Adicione outros campos conforme o role
      });

      if (response.data.success) {
        // Salvar tokens
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        alert('Cadastro concluído! Bem-vindo!');
        navigate('/dashboard');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao completar cadastro');
    }
  };

  if (loading) return <div>Validando convite...</div>;

  return (
    <div>
      <h1>Complete seu Cadastro</h1>
      <p>Bem-vindo, <strong>{invitationData.preFilledData.name}</strong>!</p>
      <p>E-mail: {invitationData.email}</p>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Adicione outros campos conforme o role */}

        <button type="submit">Finalizar Cadastro</button>
      </form>
    </div>
  );
}
```

---

### Lista de Convites Enviados

```jsx
import { useState, useEffect } from 'react';
import api from './api';

function InvitationsList() {
  const [invitations, setInvitations] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadInvitations();
  }, [filter]);

  const loadInvitations = async () => {
    try {
      const response = await api.get(`/invitations?status=${filter}`);
      setInvitations(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleResend = async (id) => {
    try {
      await api.post(`/invitations/${id}/resend`);
      alert('Convite reenviado com sucesso!');
    } catch (error) {
      alert('Erro ao reenviar convite');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Deseja cancelar este convite?')) return;

    try {
      await api.delete(`/invitations/${id}`);
      loadInvitations();
      alert('Convite cancelado');
    } catch (error) {
      alert('Erro ao cancelar convite');
    }
  };

  return (
    <div>
      <h2>Convites Enviados</h2>

      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="pending">Pendentes</option>
        <option value="accepted">Aceitos</option>
        <option value="expired">Expirados</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>E-mail</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Status</th>
            <th>Expira em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => (
            <tr key={inv._id}>
              <td>{inv.email}</td>
              <td>{inv.preFilledData.name}</td>
              <td>{inv.role}</td>
              <td>{inv.status}</td>
              <td>{new Date(inv.expiresAt).toLocaleDateString()}</td>
              <td>
                {inv.status === 'pending' && (
                  <>
                    <button onClick={() => handleResend(inv._id)}>
                      Reenviar
                    </button>
                    <button onClick={() => handleCancel(inv._id)}>
                      Cancelar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 📧 Templates de E-mail

Os e-mails enviados são **HTML responsivos** com:

- ✅ Design profissional com gradiente
- ✅ Botão de call-to-action destacado
- ✅ Informações do convite
- ✅ Link alternativo (caso o botão não funcione)
- ✅ Aviso de expiração (7 dias)
- ✅ Dicas de segurança

**Exemplo de e-mail:**

![Email Preview](https://via.placeholder.com/600x400?text=Email+Template+Preview)

---

## ⏱️ Expiração de Convites

- **Validade**: 7 dias a partir do envio
- **Status**: Automaticamente marcado como `expired` após expiração
- **Reenvio**: Apenas convites `pending` podem ser reenviados
- **Cancelamento**: Apenas convites `pending` podem ser cancelados

---

## 🔒 Segurança

### Tokens
- Gerados com `crypto.randomBytes(32)` (64 caracteres hexadecimais)
- Únicos por convite
- Não podem ser reutilizados após aceitar

### Validações
- ✅ E-mail único (não pode convidar e-mail já cadastrado)
- ✅ Convite único por e-mail pendente
- ✅ Verificação de expiração
- ✅ Verificação de clínica/psicólogo existente
- ✅ Validação de senha forte
- ✅ Registro de IP de aceitação

---

## 📊 Estados do Convite

| Estado | Descrição |
|--------|-----------|
| `pending` | Convite enviado, aguardando aceitação |
| `accepted` | Convite aceito e cadastro concluído |
| `expired` | Convite expirou (7 dias) ou foi cancelado |

---

## 🎯 Campos Pré-preenchidos

### Clínica
- ✅ Nome
- ✅ CNPJ (opcional)
- ✅ E-mail

### Psicólogo
- ✅ Nome
- ✅ E-mail
- ✅ CRP (opcional)
- ✅ Especialidades (opcional)
- ✅ Telefone (opcional)
- ✅ clinicId (automático)

### Paciente
- ✅ Nome
- ✅ E-mail
- ✅ Telefone (opcional)
- ✅ Data de nascimento (opcional)
- ✅ psychologistId (automático)

---

## 🚨 Tratamento de Erros

### Convite Inválido
```json
{
  "success": false,
  "message": "Convite não encontrado"
}
```

### Convite Expirado
```json
{
  "success": false,
  "message": "Este convite expirou"
}
```

### E-mail Já Cadastrado
```json
{
  "success": false,
  "message": "Email já cadastrado"
}
```

### Convite Pendente Existente
```json
{
  "success": false,
  "message": "Já existe um convite pendente para este email"
}
```

---

## 💡 Boas Práticas

1. **Validar token antes de mostrar formulário**
2. **Mostrar dados pré-preenchidos (read-only)**
3. **Validar senha no frontend antes de enviar**
4. **Mostrar feedback de expiração**
5. **Permitir reenvio de convites expirados**
6. **Logging de convites enviados para auditoria**

---

## 🔄 Migração das Rotas Antigas

As rotas antigas de registro direto (`/api/auth/register/*`) ainda funcionam, mas são consideradas **legacy** e devem ser usadas apenas para:

- Testes de desenvolvimento
- Casos especiais onde não há sistema de convites
- Backwards compatibility

**Recomendação**: Use sempre o sistema de convites em produção.

---

## 📝 Notas Importantes

1. **Modo DEV**: Se o e-mail não estiver configurado, os links serão exibidos no console
2. **Produção**: Configure corretamente o `FRONTEND_URL` no `.env`
3. **Admin**: A rota de convite de clínica precisa de um middleware de admin (a implementar)
4. **Tokens**: São case-sensitive e devem ser transmitidos exatamente como gerados

---

## 🎉 Resumo do Fluxo Completo

```
1. Admin cria convite para Clínica
   ↓
2. Clínica recebe e-mail e completa cadastro
   ↓
3. Clínica convida Psicólogos
   ↓
4. Psicólogos recebem e-mail e completam cadastro
   ↓
5. Psicólogos convidam Pacientes
   ↓
6. Pacientes recebem e-mail e completam cadastro
   ↓
7. Sistema 100% funcional! 🚀
```
