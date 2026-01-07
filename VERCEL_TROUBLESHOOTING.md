# 🔧 Troubleshooting - Vercel Deploy

Este guia resolve os problemas mais comuns ao fazer deploy na Vercel.

## ✅ Problema Resolvido: Google OAuth

### Erro Original:
```
TypeError: OAuth2Strategy requires a clientID option
```

### ✅ Solução Implementada:

O código foi atualizado para tornar o Google OAuth **opcional**. Agora a API funciona perfeitamente **sem** configurar o Google OAuth!

**O que foi feito:**
1. ✅ OAuth só é inicializado se as credenciais existirem
2. ✅ Rotas `/api/auth/google` retornam erro amigável se OAuth não configurado
3. ✅ Warnings de indexes duplicados corrigidos

**Como usar:**

```env
# Opção 1: SEM Google OAuth (funciona agora!)
# Não adicione as variáveis GOOGLE_* na Vercel
# A API vai funcionar normalmente com login por email/senha

# Opção 2: COM Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_CALLBACK_URL=https://seu-projeto.vercel.app/api/auth/google/callback
```

---

## 📋 Checklist de Deploy Atualizado

### 1. Variáveis Obrigatórias na Vercel

```env
✅ NODE_ENV=production
✅ MONGODB_URI=mongodb+srv://...
✅ JWT_SECRET=(gere um secret seguro)
✅ JWT_REFRESH_SECRET=(gere outro secret)
✅ SESSION_SECRET=(gere mais um secret)
```

### 2. Variáveis Opcionais

```env
⬜ JWT_EXPIRES_IN=24h
⬜ JWT_REFRESH_EXPIRES_IN=7d
⬜ FRONTEND_URL=https://seu-frontend.vercel.app
⬜ MAX_IMAGE_SIZE=5242880
⬜ MAX_PDF_SIZE=10485760
⬜ RATE_LIMIT_WINDOW_MS=900000
⬜ RATE_LIMIT_MAX_REQUESTS=100

# Google OAuth (OPCIONAL - pode deixar em branco!)
⬜ GOOGLE_CLIENT_ID=
⬜ GOOGLE_CLIENT_SECRET=
⬜ GOOGLE_CALLBACK_URL=
```

---

## 🚀 Deploy Agora

```bash
# 1. Gere os secrets
node generate-secrets.js

# 2. Commit as mudanças
git add .
git commit -m "Fix OAuth and indexes for Vercel"
git push

# 3. A Vercel vai fazer redeploy automaticamente!
```

---

## 🧪 Teste Após Deploy

```bash
# 1. Health check
curl https://seu-projeto.vercel.app/health

# Resposta esperada:
{
  "success": true,
  "status": "UP",
  "database": "Connected"
}

# 2. Registrar clínica
curl -X POST https://seu-projeto.vercel.app/api/auth/register/clinic \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clínica Teste",
    "cnpj": "12345678000190",
    "email": "teste@clinica.com",
    "password": "Senha@123"
  }'

# Resposta esperada:
{
  "success": true,
  "message": "Clínica registrada com sucesso",
  "data": {
    "user": { ... },
    "token": "...",
    "refreshToken": "..."
  }
}
```

---

## 🐛 Outros Erros Comuns

### 1. MongoDB Connection Failed

**Erro:**
```
MongooseError: Could not connect to any servers
```

**Solução:**
1. No MongoDB Atlas, vá em **Network Access**
2. Adicione IP: `0.0.0.0/0`
3. Aguarde 1-2 minutos para propagar
4. Teste a connection string localmente:

```bash
mongosh "sua_connection_string"
```

---

### 2. "Cannot find module"

**Erro:**
```
Error: Cannot find module 'express'
```

**Solução:**
```bash
# Deletar e reinstalar
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

---

### 3. Function Timeout (10s)

**Erro:**
```
Task timed out after 10.00 seconds
```

**Solução:**
- Plano gratuito tem limite de 10s
- Otimize queries MongoDB (use indexes)
- Reduza tamanho de respostas
- Considere upgrade para Pro ($20/mês = 60s timeout)

---

### 4. Rate Limit Muito Restritivo

**Erro:**
```
429: Too Many Requests
```

**Solução:**

Aumente os limites nas variáveis de ambiente:

```env
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000
```

---

### 5. CORS Error no Frontend

**Erro:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solução:**

Configure o `FRONTEND_URL` na Vercel:

```env
FRONTEND_URL=https://seu-frontend.vercel.app
```

Se tiver múltiplos domínios, edite `src/server.js`:

```javascript
const corsOptions = {
  origin: [
    'https://seu-frontend.vercel.app',
    'https://app.seudominio.com',
    'http://localhost:3000' // dev
  ],
  credentials: true
};
```

---

### 6. Imagens Muito Grandes

**Erro:**
```
Request entity too large
```

**Solução:**

Ajuste os limites:

```env
MAX_IMAGE_SIZE=10485760  # 10MB
MAX_PDF_SIZE=20971520    # 20MB
```

---

## 📊 Verificar Logs na Vercel

1. Acesse: https://vercel.com/seu-usuario/seu-projeto
2. Clique em **Deployments**
3. Clique no deployment mais recente
4. Clique em **View Function Logs**
5. Veja os erros em tempo real

---

## ✅ Checklist Final

Antes de considerar que está funcionando:

- [ ] `GET /health` retorna 200
- [ ] `POST /api/auth/register/clinic` funciona
- [ ] `POST /api/auth/login` retorna token
- [ ] MongoDB conectado (veja nos logs)
- [ ] Sem erros 500 nos logs
- [ ] Tempo de resposta < 1s

---

## 🎯 Status das Correções

| Problema | Status | Solução |
|----------|--------|---------|
| Google OAuth obrigatório | ✅ Corrigido | OAuth agora é opcional |
| Indexes duplicados | ✅ Corrigido | Removidos indexes redundantes |
| MongoDB timeout | ⬜ Verificar | Whitelist IP 0.0.0.0/0 |

---

## 💡 Dicas Finais

1. **Sempre verifique os logs** da Vercel primeiro
2. **Teste localmente** antes de fazer deploy
3. **Use secrets seguros** (nunca use os do exemplo!)
4. **Configure alertas** na Vercel
5. **Monitore uso** de recursos

---

## 🆘 Ainda com Problemas?

Se nada funcionar:

1. **Verifique logs completos** na Vercel
2. **Teste connection string** do MongoDB
3. **Valide todas as variáveis** de ambiente
4. **Delete e recrie** o projeto na Vercel
5. **Abra uma issue** no GitHub com os logs

---

## 📞 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/

---

**✅ Seu projeto agora está pronto para deploy sem erros!**

```bash
git add .
git commit -m "Ready for production deploy"
git push
```

**Deploy vai funcionar! 🚀**
