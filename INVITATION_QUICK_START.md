# 🚀 Quick Start - Sistema de Convites

## ⚡ Configuração Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar E-mail (Opcional para DEV)

Edite o `.env`:
```env
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app
EMAIL_FROM_NAME=Health Mind
```

> **Modo DEV**: Se deixar vazio, os links serão exibidos no console.

📖 **Guia completo**: [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)

### 3. Iniciar Servidor
```bash
npm run dev
```

---

## 🎯 Testar o Sistema

### 1️⃣ Admin convida Clínica

```bash
POST http://localhost:5000/api/invitations/clinic
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "email": "clinica@test.com",
  "name": "Clínica Teste",
  "cnpj": "12345678000190"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "invitation": {
      "invitationUrl": "http://localhost:3000/auth/complete-registration/abc123..."
    }
  }
}
```

### 2️⃣ Clínica completa cadastro

```bash
POST http://localhost:5000/api/auth/complete-registration/clinic
Content-Type: application/json

{
  "token": "abc123...",
  "password": "SenhaForte123!",
  "phone": "(11) 3456-7890",
  "address": {
    "street": "Rua Teste",
    "number": "123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  }
}
```

### 3️⃣ Clínica convida Psicólogo

```bash
POST http://localhost:5000/api/invitations/psychologist
Content-Type: application/json
Authorization: Bearer {clinic_token}

{
  "email": "psicologo@test.com",
  "name": "Dr. João Silva",
  "crp": "06/123456",
  "specialties": ["TCC", "Ansiedade"]
}
```

### 4️⃣ Psicólogo completa cadastro

```bash
POST http://localhost:5000/api/auth/complete-registration/psychologist
Content-Type: application/json

{
  "token": "def456...",
  "password": "SenhaForte123!",
  "phone": "(11) 98765-4321",
  "bio": "Psicólogo especializado em TCC"
}
```

### 5️⃣ Psicólogo convida Paciente

```bash
POST http://localhost:5000/api/invitations/patient
Content-Type: application/json
Authorization: Bearer {psychologist_token}

{
  "email": "paciente@test.com",
  "name": "Maria Santos",
  "phone": "(11) 98765-4321",
  "birthDate": "1990-05-15"
}
```

### 6️⃣ Paciente completa cadastro

```bash
POST http://localhost:5000/api/auth/complete-registration/patient
Content-Type: application/json

{
  "token": "ghi789...",
  "password": "SenhaForte123!",
  "cpf": "12345678900",
  "emergencyContact": {
    "name": "Pedro Santos",
    "phone": "(11) 98765-9999",
    "relationship": "Irmão"
  }
}
```

---

## 📊 Outras Rotas Úteis

### Validar Convite
```bash
GET http://localhost:5000/api/invitations/validate/{token}
```

### Listar Convites (Pendentes)
```bash
GET http://localhost:5000/api/invitations?status=pending
Authorization: Bearer {token}
```

### Reenviar Convite
```bash
POST http://localhost:5000/api/invitations/{id}/resend
Authorization: Bearer {token}
```

### Cancelar Convite
```bash
DELETE http://localhost:5000/api/invitations/{id}
Authorization: Bearer {token}
```

---

## 📧 Como Funciona o E-mail

### Com E-mail Configurado:
1. Sistema envia e-mail automático
2. Destinatário recebe link de convite
3. Clica no link e completa cadastro

### Sem E-mail (Modo DEV):
1. Console mostra: `[DEV MODE] E-mail que seria enviado`
2. Copie o `invitationUrl` do response
3. Use o link diretamente no frontend

---

## 🔑 Validação de Senha

Senha deve ter:
- ✅ Mínimo 8 caracteres
- ✅ Letra maiúscula
- ✅ Letra minúscula
- ✅ Número
- ✅ Caractere especial

**Exemplos válidos:**
- `SenhaForte123!`
- `Abc@1234`
- `Test#2024Pass`

---

## 🎨 Estrutura de Dados

### Convite no Banco
```json
{
  "_id": "65abc123...",
  "email": "user@example.com",
  "role": "psychologist",
  "token": "abc123def456...",
  "status": "pending",
  "expiresAt": "2024-01-16T...",
  "preFilledData": {
    "name": "Dr. João Silva",
    "clinicId": "65xyz789...",
    "crp": "06/123456"
  },
  "invitedBy": {
    "userId": "65xyz789...",
    "userModel": "Clinic",
    "userName": "Clínica Saúde"
  }
}
```

---

## 🚨 Erros Comuns

### "Convite não encontrado"
- Token inválido ou expirado
- Verifique se copiou o token completo

### "Email já cadastrado"
- Usuário já existe no sistema
- Use outro e-mail ou faça login

### "Já existe um convite pendente"
- Há um convite ativo para este e-mail
- Cancele o antigo ou aguarde expirar

### "Invalid login" (e-mail)
- Senha de app incorreta
- Configure corretamente no `.env`
- Veja: [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md)

---

## 📚 Documentação Completa

- 📧 [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) - Configurar Gmail SMTP
- 📨 [INVITATION_SYSTEM_GUIDE.md](INVITATION_SYSTEM_GUIDE.md) - Guia completo da API
- 🎯 [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md) - Integração frontend

---

## 💡 Dicas

1. **Desenvolvimento**: Deixe e-mail vazio e use links do console
2. **Produção**: Configure e-mail e `FRONTEND_URL` corretamente
3. **Testes**: Use ferramentas como Postman ou Insomnia
4. **Depuração**: Monitore o console do servidor para logs

---

## ✅ Checklist de Implementação

- [ ] Instalar dependências (`npm install`)
- [ ] Configurar `.env` (copiar de `.env.example`)
- [ ] Configurar banco MongoDB
- [ ] (Opcional) Configurar e-mail Gmail
- [ ] Iniciar servidor (`npm run dev`)
- [ ] Testar criação de convite
- [ ] Testar finalização de cadastro
- [ ] Implementar no frontend

---

## 🎉 Pronto!

Agora você tem um sistema completo de convites funcionando! 🚀

**Próximo passo**: Implementar as telas no frontend usando os exemplos em [INVITATION_SYSTEM_GUIDE.md](INVITATION_SYSTEM_GUIDE.md)
