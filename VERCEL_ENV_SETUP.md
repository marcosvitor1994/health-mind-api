# 🔧 Configurar Variáveis de Ambiente na Vercel

## ❌ Erro Atual

```
❌ Erro ao conectar ao MongoDB: The `uri` parameter to `openUri()` must be a string, got "undefined"
```

**Causa**: A variável `MONGODB_URI` não está configurada na Vercel.

---

## ✅ Solução: Adicionar Variáveis na Vercel

### Passo 1: Acessar Configurações

1. Acesse: https://vercel.com
2. Clique no seu projeto: **health-mind-api**
3. Vá para: **Settings** (no menu superior)
4. Clique em: **Environment Variables** (menu lateral)

### Passo 2: Adicionar MONGODB_URI

Clique em **Add New** e adicione:

```
Name: MONGODB_URI
Value: mongodb+srv://user:LoIB3iWGTSrCwKHR@cluster0.fz6kt.mongodb.net/health-mind-db?retryWrites=true&w=majority
```

**Environments**: Selecione todos:
- ✅ Production
- ✅ Preview
- ✅ Development

Clique em **Save**.

### Passo 3: Adicionar JWT Secrets

Primeiro, **gere os secrets seguros**:

```bash
node generate-secrets.js
```

Copie os 3 secrets gerados e adicione na Vercel:

#### JWT_SECRET
```
Name: JWT_SECRET
Value: (cole o primeiro secret gerado)
Environments: Production, Preview, Development
```

#### JWT_REFRESH_SECRET
```
Name: JWT_REFRESH_SECRET
Value: (cole o segundo secret gerado)
Environments: Production, Preview, Development
```

#### SESSION_SECRET
```
Name: SESSION_SECRET
Value: (cole o terceiro secret gerado)
Environments: Production, Preview, Development
```

### Passo 4: Adicionar Variáveis Opcionais

```
Name: NODE_ENV
Value: production
Environments: Production

Name: JWT_EXPIRES_IN
Value: 24h
Environments: All

Name: JWT_REFRESH_EXPIRES_IN
Value: 7d
Environments: All

Name: FRONTEND_URL
Value: https://seu-frontend.vercel.app
Environments: All

Name: MAX_IMAGE_SIZE
Value: 5242880
Environments: All

Name: MAX_PDF_SIZE
Value: 10485760
Environments: All

Name: RATE_LIMIT_WINDOW_MS
Value: 900000
Environments: All

Name: RATE_LIMIT_MAX_REQUESTS
Value: 100
Environments: All
```

---

## 📋 Checklist de Variáveis

### ✅ Obrigatórias (para funcionar)

- [ ] `MONGODB_URI` - Connection string do Atlas
- [ ] `JWT_SECRET` - Secret do token
- [ ] `JWT_REFRESH_SECRET` - Secret do refresh
- [ ] `SESSION_SECRET` - Secret da sessão

### ⬜ Opcionais (recomendadas)

- [ ] `NODE_ENV=production`
- [ ] `JWT_EXPIRES_IN=24h`
- [ ] `JWT_REFRESH_EXPIRES_IN=7d`
- [ ] `FRONTEND_URL`
- [ ] Limites de upload
- [ ] Rate limiting

### ⬜ Google OAuth (opcional)

- [ ] `GOOGLE_CLIENT_ID` (deixe em branco se não usar)
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_CALLBACK_URL`

---

## 🔄 Passo 5: Redeploy

Após adicionar as variáveis:

### Opção A: Via Dashboard

1. Vá para **Deployments**
2. Clique nos **3 pontinhos** do último deployment
3. Clique em **Redeploy**
4. Aguarde ~2 minutos

### Opção B: Via Git Push

```bash
git add .
git commit -m "Fix: Corrigir indexes duplicados"
git push
```

---

## 🧪 Verificar se Funcionou

Após o redeploy:

```bash
# 1. Health check
curl https://seu-projeto.vercel.app/health

# Resposta esperada (✅ sucesso):
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

# Resposta esperada (✅ sucesso):
{
  "success": true,
  "message": "Clínica registrada com sucesso",
  "data": { ... }
}
```

---

## 📊 Exemplo Visual das Variáveis

Na Vercel, deve ficar assim:

```
MONGODB_URI                     mongodb+srv://user:LoIB3iWG...    [Production, Preview, Development]
JWT_SECRET                      a1b2c3d4e5f6g7h8i9j0k1l2...      [Production, Preview, Development]
JWT_REFRESH_SECRET              z9y8x7w6v5u4t3s2r1q0p9o8...      [Production, Preview, Development]
SESSION_SECRET                  m5n4l3k2j1i0h9g8f7e6d5c4...      [Production, Preview, Development]
NODE_ENV                        production                        [Production]
JWT_EXPIRES_IN                  24h                               [Production, Preview, Development]
JWT_REFRESH_EXPIRES_IN          7d                                [Production, Preview, Development]
FRONTEND_URL                    https://seu-frontend.vercel.app   [Production, Preview, Development]
```

---

## ⚠️ Erros Comuns

### 1. "Variável não encontrada após adicionar"

**Solução**: Aguarde 1-2 minutos e faça redeploy

### 2. "Connection string inválida"

**Solução**:
- Verifique se copiou a string completa
- Substitua `<password>` pela senha real
- Não deixe espaços no início/fim

### 3. "Ainda dá erro de undefined"

**Solução**:
1. Verifique o nome da variável (MONGODB_URI, não MONGO_URI)
2. Certifique-se de selecionar Production/Preview/Development
3. Faça redeploy após adicionar

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA** commite o arquivo `.env` no Git
2. **Sempre** use secrets diferentes para dev/prod
3. **Gere** novos secrets periodicamente
4. **Não compartilhe** os secrets com ninguém

### ✅ Verificar .gitignore:

```bash
# Certifique-se de que .env está no .gitignore
grep -q "^\.env$" .gitignore && echo "✅ OK" || echo "❌ Adicione .env ao .gitignore"
```

---

## 🎯 Depois de Configurar

Uma vez que todas as variáveis estejam configuradas:

1. ✅ API funciona sem erros
2. ✅ MongoDB conecta
3. ✅ Login/registro funcionam
4. ✅ Tokens são gerados
5. ✅ Upload de arquivos funciona

---

## 📞 Suporte

Se ainda tiver problemas:

1. **Verifique os logs** na Vercel
2. **Confirme** que todas as variáveis estão salvas
3. **Teste** a connection string localmente:

```bash
mongosh "sua_connection_string"
```

4. **Abra uma issue** com os logs se nada funcionar

---

## ✅ Resumo Rápido

```bash
# 1. Gere secrets
node generate-secrets.js

# 2. Acesse
https://vercel.com/seu-usuario/seu-projeto/settings/environment-variables

# 3. Adicione as 4 variáveis obrigatórias:
MONGODB_URI
JWT_SECRET
JWT_REFRESH_SECRET
SESSION_SECRET

# 4. Redeploy
# (via dashboard ou git push)

# 5. Teste
curl https://seu-projeto.vercel.app/health
```

---

**Pronto! Sua API vai funcionar! 🚀**
