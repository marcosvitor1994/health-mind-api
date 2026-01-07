# 🚀 Guia de Deploy na Vercel - Health Mind API

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com) (gratuita)
- Conta no [GitHub](https://github.com) (para deploy automático)
- MongoDB Atlas configurado (já temos!)

---

## 🎯 Método 1: Deploy via GitHub (Recomendado)

### Passo 1: Criar Repositório no GitHub

```bash
# 1. Inicialize o Git (se ainda não fez)
git init

# 2. Adicione todos os arquivos
git add .

# 3. Faça o primeiro commit
git commit -m "Initial commit - Health Mind API"

# 4. Crie um repositório no GitHub
# Acesse: https://github.com/new

# 5. Conecte ao repositório remoto
git remote add origin https://github.com/seu-usuario/health-mind-api.git

# 6. Envie o código
git branch -M main
git push -u origin main
```

### Passo 2: Deploy na Vercel

1. **Acesse [Vercel](https://vercel.com)** e faça login

2. **Clique em "Add New Project"**

3. **Importe seu repositório do GitHub**
   - Autorize a Vercel a acessar seus repositórios
   - Selecione `health-mind-api`

4. **Configure o projeto:**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (deixe como está)
   - **Build Command**: (deixe vazio ou `npm install`)
   - **Output Directory**: (deixe vazio)

5. **Configure as variáveis de ambiente** (clique em "Environment Variables"):

```env
NODE_ENV=production
MONGODB_URI=sua_connection_string_do_atlas
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_REFRESH_SECRET=seu_refresh_secret_super_seguro
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=https://seu-projeto.vercel.app/api/auth/google/callback
FRONTEND_URL=https://seu-frontend.vercel.app
MAX_IMAGE_SIZE=5242880
MAX_PDF_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=seu_session_secret
```

6. **Clique em "Deploy"**

7. **Aguarde o deploy** (leva ~2 minutos)

8. **Teste sua API**:
   - Acesse: `https://seu-projeto.vercel.app`
   - Teste: `https://seu-projeto.vercel.app/health`

---

## 🎯 Método 2: Deploy via Vercel CLI

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Login na Vercel

```bash
vercel login
```

### Passo 3: Deploy

```bash
# Na pasta do projeto
cd api-health-mind

# Deploy de preview
vercel

# Deploy de produção
vercel --prod
```

### Passo 4: Configurar Variáveis de Ambiente

```bash
# Adicionar variáveis uma por uma
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add JWT_REFRESH_SECRET production

# Ou edite no dashboard: https://vercel.com/seu-usuario/seu-projeto/settings/environment-variables
```

---

## ⚙️ Configuração das Variáveis de Ambiente na Vercel

### 1. Acesse o Dashboard

- Vá para: https://vercel.com/seu-usuario/health-mind-api
- Clique em **Settings** → **Environment Variables**

### 2. Adicione TODAS as variáveis:

#### Obrigatórias:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Ambiente |
| `MONGODB_URI` | `mongodb+srv://...` | Connection string do Atlas |
| `JWT_SECRET` | (gere um seguro) | Chave JWT |
| `JWT_REFRESH_SECRET` | (gere um seguro) | Chave refresh token |

#### Opcionais (mas recomendadas):

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `JWT_EXPIRES_IN` | `24h` | Expiração do token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Expiração do refresh |
| `GOOGLE_CLIENT_ID` | seu_client_id | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | seu_client_secret | Google OAuth |
| `GOOGLE_CALLBACK_URL` | `https://seu-projeto.vercel.app/api/auth/google/callback` | Callback OAuth |
| `FRONTEND_URL` | `https://seu-frontend.vercel.app` | URL do frontend |
| `SESSION_SECRET` | (gere um seguro) | Secret de sessão |

### 3. Gerar Secrets Seguros

No terminal:

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🔧 Configuração do MongoDB Atlas para Vercel

### 1. Permitir Acesso de Qualquer IP

No MongoDB Atlas:

1. Acesse **Network Access**
2. Clique em **Add IP Address**
3. Escolha **Allow Access from Anywhere** (0.0.0.0/0)
4. Clique em **Confirm**

⚠️ **Importante**: Isso é necessário porque a Vercel usa IPs dinâmicos.

### 2. Verificar Connection String

Certifique-se de que sua string de conexão está correta:

```
mongodb+srv://username:password@cluster.mongodb.net/health-mind-db?retryWrites=true&w=majority
```

---

## 🧪 Testando a API Deployada

### 1. Health Check

```bash
curl https://seu-projeto.vercel.app/health
```

**Resposta esperada:**
```json
{
  "success": true,
  "status": "UP",
  "database": "Connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Registrar Clínica

```bash
curl -X POST https://seu-projeto.vercel.app/api/auth/register/clinic \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clínica Teste",
    "cnpj": "12345678000190",
    "email": "teste@clinica.com",
    "password": "Senha@123"
  }'
```

### 3. Login

```bash
curl -X POST https://seu-projeto.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@clinica.com",
    "password": "Senha@123"
  }'
```

---

## 🔄 Deploy Automático (CI/CD)

Após o primeiro deploy, toda vez que você fizer push para o GitHub, a Vercel fará deploy automaticamente!

```bash
# Faça suas alterações
git add .
git commit -m "Adiciona nova funcionalidade"
git push origin main

# A Vercel detecta e faz deploy automaticamente! 🚀
```

### Deploy de Preview

Branches e Pull Requests geram deploys de preview:

```bash
# Crie uma branch
git checkout -b feature/nova-funcionalidade

# Faça alterações e push
git add .
git commit -m "Nova funcionalidade"
git push origin feature/nova-funcionalidade

# A Vercel cria um deploy de preview único!
```

---

## 📊 Monitoramento e Logs

### Ver Logs na Vercel

1. Acesse: https://vercel.com/seu-usuario/health-mind-api
2. Clique na aba **Deployments**
3. Clique no deployment mais recente
4. Veja os logs em tempo real

### Logs de Erro

Se algo der errado:

1. Acesse o deployment com erro
2. Clique em **View Function Logs**
3. Veja os erros detalhados

---

## 🛠️ Troubleshooting

### Erro: "MongoDB connection failed"

**Solução:**
1. Verifique se o IP 0.0.0.0/0 está permitido no Atlas
2. Confirme a connection string nas variáveis de ambiente
3. Teste a connection string localmente

### Erro: "Module not found"

**Solução:**
```bash
# Certifique-se de que package.json está correto
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### Erro: "Function execution timeout"

**Solução:**

A Vercel tem limite de 10 segundos para funções no plano gratuito.

- Otimize queries MongoDB
- Use indexes
- Reduza payload de resposta
- Considere upgrade para plano Pro

### Erro: "Rate limit exceeded"

**Solução:**

Ajuste o rate limit nas variáveis de ambiente:

```env
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000
```

---

## 🎨 URLs Personalizadas

### Domínio Personalizado (Opcional)

1. **Compre um domínio** (ex: healthmind.com)
2. No dashboard da Vercel:
   - Vá para **Settings** → **Domains**
   - Clique em **Add Domain**
   - Digite seu domínio
   - Configure os DNS conforme instruções

---

## 🔒 Segurança em Produção

### Checklist de Segurança:

- ✅ Variáveis de ambiente configuradas
- ✅ Secrets gerados aleatoriamente
- ✅ MongoDB Atlas com autenticação
- ✅ CORS configurado corretamente
- ✅ Rate limiting ativo
- ✅ Helmet.js ativo
- ✅ HTTPS automático (Vercel)

### CORS em Produção

Atualize a variável `FRONTEND_URL`:

```env
FRONTEND_URL=https://seu-frontend.vercel.app
```

Se tiver múltiplos frontends:

```javascript
// Edite src/server.js
const corsOptions = {
  origin: [
    'https://seu-frontend.vercel.app',
    'https://app.seu-dominio.com',
    'https://admin.seu-dominio.com'
  ],
  credentials: true
};
```

---

## 📈 Limites do Plano Gratuito

| Recurso | Limite Gratuito |
|---------|-----------------|
| Deploys | Ilimitado |
| Bandwidth | 100 GB/mês |
| Execuções | 100 GB-hrs |
| Function Timeout | 10 segundos |
| Edge Network | Global |

Para mais, considere o plano Pro: $20/mês

---

## 🚀 Após o Deploy

### 1. Atualize o Frontend

Configure a URL da API no seu frontend:

```javascript
// .env do frontend
VITE_API_URL=https://seu-projeto.vercel.app/api
# ou
REACT_APP_API_URL=https://seu-projeto.vercel.app/api
```

### 2. Configure Google OAuth

No Google Cloud Console:

1. Adicione a URL de callback:
   - `https://seu-projeto.vercel.app/api/auth/google/callback`

2. Adicione as origens autorizadas:
   - `https://seu-projeto.vercel.app`
   - `https://seu-frontend.vercel.app`

### 3. Teste Tudo

- ✅ Registros (clínica, psicólogo, paciente)
- ✅ Login/Logout
- ✅ Google OAuth
- ✅ Upload de arquivos
- ✅ Chat
- ✅ Agendamentos
- ✅ Documentos

---

## 📞 Suporte

### Problemas com Vercel?

- Documentação: https://vercel.com/docs
- Suporte: https://vercel.com/support
- Community: https://github.com/vercel/vercel/discussions

### Problemas com a API?

- Abra uma issue no GitHub
- Consulte os logs na Vercel

---

## 🎉 Pronto!

Sua API Health Mind está no ar! 🚀

**URL da API**: `https://seu-projeto.vercel.app`

**Endpoints disponíveis**:
- `GET /` - Home
- `GET /health` - Health check
- `POST /api/auth/register/clinic` - Registrar clínica
- `POST /api/auth/login` - Login
- E mais 35+ endpoints!

---

**Próximos passos:**

1. ✅ Deploy do frontend
2. ✅ Configurar domínio personalizado
3. ✅ Integrar com IA real (OpenAI/Claude)
4. ✅ Adicionar notificações
5. ✅ Analytics e monitoring

---

**Happy Deploying! 🎊**
