# ✅ Checklist de Deploy - Vercel

Use este checklist antes de fazer deploy na Vercel.

## 📋 Pré-Deploy

### Arquivos Necessários
- [x] `vercel.json` - Configuração da Vercel
- [x] `api/index.js` - Handler serverless
- [x] `.vercelignore` - Arquivos ignorados
- [x] `package.json` - Dependências e scripts
- [x] `.env.example` - Template de variáveis

### Código
- [ ] Código testado localmente (`npm run dev`)
- [ ] Todas as dependências instaladas (`npm install`)
- [ ] Sem erros no console
- [ ] `.env` está no `.gitignore`

## 🌐 Configuração da Vercel

### 1. Repositório GitHub
- [ ] Código commitado no Git
- [ ] Repositório criado no GitHub
- [ ] Push para `main` branch

### 2. Variáveis de Ambiente

Copie estas variáveis para a Vercel:

```env
✅ NODE_ENV=production
✅ MONGODB_URI=mongodb+srv://...
✅ JWT_SECRET=...
✅ JWT_REFRESH_SECRET=...
✅ JWT_EXPIRES_IN=24h
✅ JWT_REFRESH_EXPIRES_IN=7d
✅ FRONTEND_URL=https://seu-frontend.vercel.app
✅ SESSION_SECRET=...
✅ MAX_IMAGE_SIZE=5242880
✅ MAX_PDF_SIZE=10485760
✅ RATE_LIMIT_WINDOW_MS=900000
✅ RATE_LIMIT_MAX_REQUESTS=100

# Opcional (Google OAuth)
⬜ GOOGLE_CLIENT_ID=...
⬜ GOOGLE_CLIENT_SECRET=...
⬜ GOOGLE_CALLBACK_URL=https://seu-projeto.vercel.app/api/auth/google/callback
```

### 3. MongoDB Atlas

- [ ] Cluster criado
- [ ] Database user criado
- [ ] IP 0.0.0.0/0 permitido (Network Access)
- [ ] Connection string testada

### 4. Configuração do Projeto Vercel

- [ ] Framework Preset: **Other**
- [ ] Root Directory: `./`
- [ ] Build Command: (vazio)
- [ ] Output Directory: (vazio)
- [ ] Install Command: `npm install`

## 🚀 Deploy

### Primeira vez (via GitHub)

1. [ ] Acesse [vercel.com](https://vercel.com)
2. [ ] Clique em "Add New Project"
3. [ ] Importe do GitHub
4. [ ] Configure as variáveis de ambiente
5. [ ] Clique em "Deploy"
6. [ ] Aguarde ~2 minutos

### Via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy produção
vercel --prod
```

## 🧪 Pós-Deploy

### Testes Básicos

```bash
# Health check
curl https://seu-projeto.vercel.app/health

# Registrar clínica
curl -X POST https://seu-projeto.vercel.app/api/auth/register/clinic \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","cnpj":"12345678000190","email":"teste@teste.com","password":"senha123"}'

# Login
curl -X POST https://seu-projeto.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":"senha123"}'
```

### Checklist de Testes

- [ ] `GET /` retorna 200
- [ ] `GET /health` retorna status UP
- [ ] `POST /api/auth/register/clinic` funciona
- [ ] `POST /api/auth/login` retorna token
- [ ] CORS permite frontend
- [ ] Upload de imagem funciona
- [ ] MongoDB conectado

## 🔒 Segurança

### Antes de ir para produção:

- [ ] Secrets gerados aleatoriamente (não use os do exemplo!)
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] HTTPS ativo (automático na Vercel)
- [ ] Variáveis de ambiente não expostas no código

### Gerar Secrets Seguros

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📊 Monitoramento

### Após Deploy

- [ ] Verifique logs na Vercel
- [ ] Configure alertas (opcional)
- [ ] Monitore uso de recursos
- [ ] Teste todos os endpoints principais

### URLs Importantes

- Dashboard Vercel: https://vercel.com/dashboard
- Logs: https://vercel.com/seu-usuario/seu-projeto/logs
- Settings: https://vercel.com/seu-usuario/seu-projeto/settings

## 🐛 Troubleshooting

### Se algo der errado:

1. [ ] Verifique logs na Vercel
2. [ ] Confirme variáveis de ambiente
3. [ ] Teste connection string MongoDB
4. [ ] Verifique IP whitelist no Atlas
5. [ ] Consulte [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)

## 🎉 Deploy Concluído!

Quando todos os itens estiverem marcados:

✅ **API está no ar!**

**URL**: https://seu-projeto.vercel.app

**Próximos passos**:
1. Deploy do frontend
2. Configurar domínio personalizado
3. Integrar IA real
4. Configurar monitoring

---

**Data do Deploy**: _________

**URL da API**: _________

**Observações**: _________
