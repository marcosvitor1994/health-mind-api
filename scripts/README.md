# 🛠️ Scripts Administrativos

Scripts de linha de comando para gerenciar a plataforma Health Mind.

---

## 📋 Scripts Disponíveis

### 1. Criar Convite para Clínica

Cria um convite para uma nova clínica se cadastrar.

**Uso:**
```bash
npm run invite:clinic
```

**O que faz:**
- ✅ Solicita e-mail, nome e CNPJ da clínica
- ✅ Verifica se e-mail já está cadastrado
- ✅ Verifica se já existe convite pendente
- ✅ Cria o convite no banco
- ✅ Tenta enviar e-mail (se configurado)
- ✅ Mostra o link de convite

**Exemplo de uso:**
```bash
$ npm run invite:clinic

╔══════════════════════════════════════════════════╗
║                                                  ║
║     🏥 CRIAR CONVITE PARA CLÍNICA 🏥            ║
║                                                  ║
╚══════════════════════════════════════════════════╝

✅ MongoDB conectado

📧 E-mail da clínica: clinica@example.com
🏢 Nome da clínica: Clínica Saúde Mental
📄 CNPJ (opcional, pressione Enter para pular): 12.345.678/0001-90

📝 Confirmação dos dados:
   E-mail: clinica@example.com
   Nome: Clínica Saúde Mental
   CNPJ: 12.345.678/0001-90

Confirma os dados? (s/n): s

🔄 Criando convite...
✅ Convite criado com sucesso!

📧 Enviando e-mail...
✅ E-mail enviado com sucesso!

╔══════════════════════════════════════════════════════════════════════╗
║                     CONVITE CRIADO COM SUCESSO!                      ║
╚══════════════════════════════════════════════════════════════════════╝

📋 Informações do Convite:

   ID: 65abc123def456...
   E-mail: clinica@example.com
   Nome: Clínica Saúde Mental
   Status: pending
   Expira em: 16/01/2024, 10:30:00

🔗 Link de Convite:
   http://localhost:3000/auth/complete-registration/abc123...

💡 Envie este link para a clínica finalizar o cadastro!
```

---

### 2. Listar Convites

Lista todos os convites criados (últimos 50).

**Uso:**
```bash
npm run invites:list
```

**O que mostra:**
- ✅ Resumo com total de convites por status
- ✅ Lista completa com detalhes
- ✅ Links dos convites pendentes
- ✅ Data de criação e expiração

**Exemplo de saída:**
```bash
$ npm run invites:list

╔══════════════════════════════════════════════════╗
║                                                  ║
║          📨 LISTA DE CONVITES 📨                ║
║                                                  ║
╚══════════════════════════════════════════════════╝

✅ MongoDB conectado

📊 Resumo:
   ⏳ Pendentes: 3
   ✅ Aceitos: 5
   ❌ Expirados: 2
   📝 Total: 10

═══════════════════════════════════════════════════════════════════════════════════

1. ⏳ 🏥 Clínica Saúde Mental
   E-mail: clinica@example.com
   Tipo: clinic
   Status: pending
   Criado em: 09/01/2024, 14:30:00
   Expira em: 16/01/2024, 14:30:00
   🔗 Link: http://localhost:3000/auth/complete-registration/abc123...

2. ✅ 👨‍⚕️ Dr. João Silva
   E-mail: joao@clinica.com
   Tipo: psychologist
   Status: accepted
   Criado em: 08/01/2024, 10:00:00
   Expira em: 15/01/2024, 10:00:00
   Aceito em: 08/01/2024, 15:30:00

═══════════════════════════════════════════════════════════════════════════════════
```

---

### 3. Cancelar Convite

Cancela um convite pendente.

**Uso:**
```bash
npm run invite:cancel <email_ou_id>
```

**Exemplos:**
```bash
# Por e-mail
npm run invite:cancel clinica@example.com

# Por ID
npm run invite:cancel 65abc123def456...
```

**Exemplo de uso:**
```bash
$ npm run invite:cancel clinica@example.com

╔══════════════════════════════════════════════════╗
║                                                  ║
║           🚫 CANCELAR CONVITE 🚫                ║
║                                                  ║
╚══════════════════════════════════════════════════╝

✅ MongoDB conectado

📋 Convite encontrado:
   ID: 65abc123def456...
   E-mail: clinica@example.com
   Nome: Clínica Saúde Mental
   Tipo: clinic
   Status: pending

✅ Convite cancelado com sucesso!
```

---

## 🔧 Requisitos

1. **Banco de dados configurado**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/health-mind-db
   ```

2. **E-mail configurado** (opcional):
   ```env
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASSWORD=sua_senha_de_app
   ```

   Se não configurar e-mail, o script funcionará normalmente e mostrará o link no console.

---

## 💡 Fluxo Completo

### Cadastrar Nova Clínica:

1. **Criar convite:**
   ```bash
   npm run invite:clinic
   ```

2. **Verificar se foi criado:**
   ```bash
   npm run invites:list
   ```

3. **Enviar o link para a clínica**
   - Se e-mail configurado: automático
   - Se não: copie o link do console

4. **Clínica acessa o link e finaliza cadastro**

5. **Verificar se foi aceito:**
   ```bash
   npm run invites:list
   ```

---

## 🚨 Troubleshooting

### Erro: "MongoDB não conectado"
- Verifique se o MongoDB está rodando
- Verifique a variável `MONGODB_URI` no `.env`

### Erro: "E-mail já cadastrado"
- Este e-mail já tem uma clínica cadastrada
- Use outro e-mail ou faça login com o existente

### Convite não aparece na lista
- Verifique se o banco de dados está correto
- Execute `npm run invites:list` novamente

### E-mail não enviado
- Normal se não configurou `EMAIL_USER` e `EMAIL_PASSWORD`
- Copie o link do console e envie manualmente
- Configure o e-mail seguindo: [EMAIL_SETUP_GUIDE.md](../EMAIL_SETUP_GUIDE.md)

---

## 🎯 Dicas

1. **Teste primeiro sem e-mail**: Deixe as variáveis de e-mail vazias e use o link do console

2. **Guarde os links**: Se não enviou por e-mail, copie o link antes de fechar o terminal

3. **Liste regularmente**: Use `npm run invites:list` para acompanhar os convites

4. **Convites expiram em 7 dias**: Crie novos se necessário

---

## 📚 Mais Informações

- 📨 [INVITATION_SYSTEM_GUIDE.md](../INVITATION_SYSTEM_GUIDE.md) - Sistema completo de convites
- 📧 [EMAIL_SETUP_GUIDE.md](../EMAIL_SETUP_GUIDE.md) - Configurar envio de e-mails
- 🚀 [INVITATION_QUICK_START.md](../INVITATION_QUICK_START.md) - Quick start
