# 🚀 Deploy Rápido na Vercel

Este guia resume os passos essenciais para fazer deploy da Health Mind API na Vercel.

## ⚡ Deploy em 5 Minutos

### Pré-requisitos ✅

- [x] Conta na [Vercel](https://vercel.com) (gratuita)
- [x] Conta no [GitHub](https://github.com)
- [x] MongoDB Atlas configurado (você já tem!)

---

## 📦 Passo 1: Preparar o Código

```bash
# 1. Inicialize o Git (se ainda não fez)
git init

# 2. Adicione todos os arquivos
git add .

# 3. Commit
git commit -m "Prepare for Vercel deployment"
```

---

## 🌐 Passo 2: GitHub

```bash
# 1. Crie um repositório em: https://github.com/new

# 2. Conecte o repositório
git remote add origin https://github.com/SEU_USUARIO/health-mind-api.git

# 3. Push
git branch -M main
git push -u origin main
```

---

## 🚀 Passo 3: Deploy na Vercel

### Opção A: Via Dashboard (Mais Fácil)

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe seu repositório GitHub
3. Configure:
   - **Framework**: Other
   - **Root Directory**: `./`
4. Adicione as variáveis de ambiente (veja abaixo)
5. Clique em **Deploy**

### Opção B: Via CLI

```bash
# Instale a CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🔐 Passo 4: Variáveis de Ambiente

Na Vercel, adicione estas variáveis:

### Obrigatórias:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:LoIB3iWGTSrCwKHR@cluster0.fz6kt.mongodb.net/?appName=Cluster0
JWT_SECRET=(gere um secret abaixo)
JWT_REFRESH_SECRET=(gere um secret abaixo)
SESSION_SECRET=(gere um secret abaixo)
```

### Gerar Secrets Seguros:

```bash
node generate-secrets.js
```

Ou manualmente:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Opcionais:

```env
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://seu-frontend.vercel.app
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_CALLBACK_URL=https://seu-projeto.vercel.app/api/auth/google/callback
MAX_IMAGE_SIZE=5242880
MAX_PDF_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🧪 Passo 5: Testar

```bash
# Health check
curl https://seu-projeto.vercel.app/health

# Registrar clínica
curl -X POST https://seu-projeto.vercel.app/api/auth/register/clinic \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clínica Teste",
    "cnpj": "12345678000190",
    "email": "teste@clinica.com",
    "password": "Senha@123"
  }'
```

---

## ✅ Checklist Rápido

- [ ] Código no GitHub
- [ ] Vercel conectada ao GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] MongoDB Atlas permite IP 0.0.0.0/0
- [ ] Deploy concluído
- [ ] Health check funciona
- [ ] Teste de registro funciona

---

## 🔧 Configuração do MongoDB Atlas

**IMPORTANTE**: No MongoDB Atlas, vá em **Network Access** e permita:

```
0.0.0.0/0 (Allow access from anywhere)
```

Isso é necessário porque a Vercel usa IPs dinâmicos.

---

## 📊 Estrutura de Arquivos para Vercel

```
api-health-mind/
├── api/
│   └── index.js          ← Handler serverless (criado!)
├── src/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js         ← Adaptado para Vercel!
├── vercel.json           ← Configuração Vercel (criado!)
├── .vercelignore         ← Arquivos ignorados (criado!)
├── package.json          ← Scripts adicionados!
└── .env                  ← NÃO COMMITAR!
```

---

## 🎯 URLs Importantes

Após o deploy, você terá:

- **API**: `https://seu-projeto.vercel.app`
- **Health**: `https://seu-projeto.vercel.app/health`
- **Docs**: `https://seu-projeto.vercel.app/`
- **Endpoints**: `https://seu-projeto.vercel.app/api/*`

---

## 🔄 Atualizações Automáticas

Toda vez que você fizer push para `main`, a Vercel faz deploy automaticamente!

```bash
# Faça alterações
git add .
git commit -m "Nova feature"
git push

# Deploy automático! 🎉
```

---

## 🐛 Problemas Comuns

### 1. MongoDB não conecta

**Solução**: Permita IP 0.0.0.0/0 no MongoDB Atlas Network Access

### 2. "Module not found"

**Solução**:
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### 3. "Function timeout"

**Solução**: A Vercel tem limite de 10s no plano gratuito. Otimize queries.

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) - Guia completo
- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) - Checklist detalhado
- [README.md](README.md) - Documentação principal

---

## 🎉 Pronto!

Sua API está no ar! 🚀

**Próximos passos**:
1. ✅ Deploy do frontend
2. ✅ Configurar domínio personalizado
3. ✅ Integrar IA real (OpenAI/Claude)
4. ✅ Adicionar monitoring

---

## 💡 Dicas Finais

1. **Monitore os logs** na Vercel
2. **Configure alertas** para erros
3. **Use domínio personalizado** para produção
4. **Upgrade para Pro** se precisar de mais recursos

---

**Deploy fácil, rápido e gratuito com Vercel!** ⚡

**Documentação Vercel**: https://vercel.com/docs
