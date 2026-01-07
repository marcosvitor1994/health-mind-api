# 📦 Guia de Instalação Completo - Health Mind API

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** v18.0.0 ou superior ([Download](https://nodejs.org/))
- **MongoDB** v5.0 ou superior ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))
- **npm** v9.0.0 ou superior (vem com Node.js)

### Verificar Versões

```bash
node --version    # v18.0.0+
npm --version     # v9.0.0+
mongod --version  # v5.0+
```

---

## 🚀 Instalação

### Método 1: Clone do Repositório

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/health-mind-api.git

# 2. Entre na pasta
cd health-mind-api

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env

# 5. Edite o arquivo .env com suas configurações
# (use nano, vim, ou qualquer editor de texto)
nano .env

# 6. Inicie o MongoDB (se local)
mongod

# 7. Em outro terminal, inicie o servidor
npm run dev
```

### Método 2: Criação Manual

Se você está começando do zero:

```bash
# 1. Crie a pasta do projeto
mkdir health-mind-api
cd health-mind-api

# 2. Inicialize o npm
npm init -y

# 3. Instale as dependências
npm install express mongoose bcryptjs jsonwebtoken dotenv cors helmet express-rate-limit multer express-validator passport passport-google-oauth20 express-session morgan sharp

# 4. Instale dependências de desenvolvimento
npm install --save-dev nodemon jest supertest

# 5. Copie os arquivos do projeto para esta pasta

# 6. Configure o .env

# 7. Inicie
npm run dev
```

---

## ⚙️ Configuração Detalhada

### 1. MongoDB

#### Opção A: MongoDB Local (Windows)

```bash
# Instale o MongoDB Community Edition
# Baixe: https://www.mongodb.com/try/download/community

# Inicie o serviço
net start MongoDB

# Ou inicie manualmente
mongod --dbpath C:\data\db
```

#### Opção B: MongoDB Local (Linux/macOS)

```bash
# Inicie o serviço
sudo systemctl start mongod

# Verifique o status
sudo systemctl status mongod

# Ou inicie manualmente
mongod --dbpath /data/db
```

#### Opção C: MongoDB Atlas (Cloud)

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um cluster
4. Obtenha a connection string
5. Adicione ao `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health-mind-db?retryWrites=true&w=majority
```

#### Opção D: MongoDB com Docker

```bash
# Inicie o container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:latest

# Verifique se está rodando
docker ps

# Connection string para .env
MONGODB_URI=mongodb://admin:password123@localhost:27017/health-mind-db?authSource=admin
```

---

### 2. Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto:

```env
# =======================================
# SERVER CONFIGURATION
# =======================================
PORT=5000
NODE_ENV=development

# =======================================
# DATABASE
# =======================================
# Local
MONGODB_URI=mongodb://localhost:27017/health-mind-db

# Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health-mind-db

# Docker
# MONGODB_URI=mongodb://admin:password123@localhost:27017/health-mind-db?authSource=admin

# =======================================
# JWT CONFIGURATION
# =======================================
# IMPORTANTE: Mude estes valores em produção!
# Gere chaves seguras: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_REFRESH_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# =======================================
# GOOGLE OAUTH 2.0
# =======================================
# Obtenha em: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=seu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# =======================================
# FRONTEND
# =======================================
FRONTEND_URL=http://localhost:3000

# =======================================
# FILE UPLOAD LIMITS (bytes)
# =======================================
MAX_IMAGE_SIZE=5242880    # 5MB
MAX_PDF_SIZE=10485760     # 10MB

# =======================================
# RATE LIMITING
# =======================================
RATE_LIMIT_WINDOW_MS=900000      # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100      # 100 requisições

# =======================================
# SESSION
# =======================================
SESSION_SECRET=seu_session_secret_super_seguro_mude_em_producao
```

### 3. Gerar Chaves Seguras

Para gerar chaves JWT seguras:

```bash
# No terminal
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copie o resultado e use como `JWT_SECRET` e `JWT_REFRESH_SECRET`.

---

### 4. Google OAuth 2.0 (Opcional)

#### Passo 1: Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a **Google+ API**

#### Passo 2: Criar Credenciais OAuth

1. Vá em **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth client ID**
3. Escolha **Web application**
4. Configure:
   - **Authorized JavaScript origins**: `http://localhost:5000`
   - **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`

#### Passo 3: Adicionar ao .env

Copie o **Client ID** e **Client Secret** e adicione ao `.env`.

---

## 🧪 Verificação da Instalação

### 1. Testar Conexão com MongoDB

```bash
# No terminal do MongoDB
mongosh
# ou
mongo

# Listar bancos de dados
show dbs

# Usar o banco de dados
use health-mind-db

# Listar collections
show collections
```

### 2. Testar a API

```bash
# Inicie o servidor
npm run dev

# Em outro terminal, teste o health check
curl http://localhost:5000/health
```

Resposta esperada:
```json
{
  "success": true,
  "status": "UP",
  "database": "Connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📜 Scripts npm Disponíveis

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start

# Testes (quando implementado)
npm test

# Testes com coverage
npm run test:coverage

# Lint (quando configurado)
npm run lint
```

---

## 🐳 Docker (Opcional)

### Docker Compose

Crie um arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: health-mind-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongodb_data:/data/db

  api:
    build: .
    container_name: health-mind-api
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password123@mongodb:27017/health-mind-db?authSource=admin
    depends_on:
      - mongodb
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  mongodb_data:
```

### Dockerfile

Crie um arquivo `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Executar com Docker

```bash
# Build e start
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

---

## 🌍 Deploy em Produção

### Railway (Recomendado)

```bash
# 1. Instale a CLI do Railway
npm i -g @railway/cli

# 2. Login
railway login

# 3. Inicialize
railway init

# 4. Adicione MongoDB
railway add

# 5. Deploy
railway up

# 6. Configure variáveis de ambiente no dashboard
```

### Render

1. Conecte seu repositório GitHub
2. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Adicione variáveis de ambiente
4. Deploy automático a cada push

### Heroku

```bash
# 1. Login
heroku login

# 2. Crie o app
heroku create health-mind-api

# 3. Adicione MongoDB
heroku addons:create mongolab:sandbox

# 4. Configure variáveis de ambiente
heroku config:set JWT_SECRET=seu_secret

# 5. Deploy
git push heroku main

# 6. Abra o app
heroku open
```

---

## 🔧 Troubleshooting

### Erro: "EADDRINUSE: address already in use"

**Solução:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:5000 | xargs kill -9
```

### Erro: "Cannot find module"

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "MongoDB connection timeout"

**Solução:**
1. Verifique se o MongoDB está rodando
2. Teste a conexão: `mongosh` ou `mongo`
3. Verifique firewall/antivírus
4. Use `127.0.0.1` em vez de `localhost`

### Erro: "sharp installation failed"

**Solução:**
```bash
npm install --platform=win32 --arch=x64 sharp
# ou
npm rebuild sharp
```

---

## 📚 Recursos Adicionais

### Documentação

- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)
- [Passport.js](http://www.passportjs.org/)

### Ferramentas Úteis

- **Postman**: Teste de APIs
- **MongoDB Compass**: GUI para MongoDB
- **VS Code Extensions**:
  - REST Client
  - MongoDB for VS Code
  - Thunder Client

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado
- [ ] MongoDB instalado e rodando
- [ ] Projeto clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] JWT secrets gerados
- [ ] MongoDB conectado
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Health check testado
- [ ] Google OAuth configurado (opcional)

---

## 🎉 Pronto!

Sua API Health Mind está instalada e configurada!

Próximo passo: [Quick Start Guide](QUICK_START.md)

---

**Dúvidas?** Abra uma issue no GitHub!
