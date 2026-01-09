# 📧 Guia de Configuração de E-mail - Gmail SMTP

Este guia mostra como configurar o envio de e-mails usando Gmail SMTP com Nodemailer.

---

## 🚀 Passo a Passo

### 1️⃣ Ativar Verificação em Duas Etapas

1. Acesse: [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Faça login na sua conta Google
3. Procure por **"Verificação em duas etapas"**
4. Clique em **"Começar"** e siga as instruções
5. Configure um método de verificação (SMS, aplicativo autenticador, etc.)

---

### 2️⃣ Gerar Senha de App

Após ativar a verificação em duas etapas:

1. Acesse: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Faça login novamente se solicitado
3. Em **"Selecionar app"**, escolha **"Outro (nome personalizado)"**
4. Digite: `Health Mind API` ou qualquer nome identificável
5. Clique em **"Gerar"**
6. **COPIE A SENHA GERADA** (16 caracteres, sem espaços)
7. **GUARDE COM SEGURANÇA** - você não poderá vê-la novamente

A senha gerada será algo como: `abcd efgh ijkl mnop` (você deve usar sem espaços: `abcdefghijklmnop`)

---

### 3️⃣ Configurar Variáveis de Ambiente

Edite seu arquivo `.env`:

```env
# Email Configuration
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=Health Mind
```

**Substitua:**
- `seu_email@gmail.com` pelo seu e-mail do Gmail
- `abcdefghijklmnop` pela senha de app gerada no passo 2

---

### 4️⃣ Testar Configuração

Reinicie o servidor e teste enviando um convite:

```bash
npm run dev
```

Faça uma requisição para criar um convite e verifique se o e-mail foi enviado.

---

## 🔍 Verificação

### Como saber se está funcionando?

1. **Console do servidor**: Você verá mensagens como:
   ```
   ✅ E-mail enviado com sucesso: <message-id>
   ```

2. **Caixa de entrada**: O destinatário receberá o e-mail

3. **Modo DEV**: Se as credenciais NÃO estiverem configuradas, verá:
   ```
   📧 [DEV MODE] E-mail que seria enviado:
   Para: exemplo@email.com
   Assunto: Convite para...
   ```

---

## ⚠️ Solução de Problemas

### Erro: "Invalid login"
- ✅ Verifique se a verificação em duas etapas está ativada
- ✅ Confirme que está usando a senha de APP, não a senha normal da conta
- ✅ Certifique-se de que copiou a senha sem espaços

### Erro: "Service unavailable"
- ✅ Verifique sua conexão com a internet
- ✅ Confirme que o Gmail SMTP está acessível (porta 587)
- ✅ Verifique se seu firewall não está bloqueando

### E-mails não estão chegando
- ✅ Verifique a caixa de spam/lixo eletrônico
- ✅ Confirme que o e-mail destinatário está correto
- ✅ Aguarde alguns minutos (pode haver atraso)

### Erro: "Daily user sending quota exceeded"
- ⚠️ Gmail tem limite de ~500 emails/dia para contas gratuitas
- 💡 Considere usar SendGrid/Mailgun para produção

---

## 🎯 Modo Desenvolvimento (Sem E-mail)

Se você NÃO quer configurar e-mail durante o desenvolvimento:

1. **Deixe as variáveis vazias** no `.env`:
   ```env
   EMAIL_USER=
   EMAIL_PASSWORD=
   ```

2. O sistema funcionará em **modo DEV**:
   - Não enviará e-mails reais
   - Mostrará no console o que seria enviado
   - Convites funcionarão normalmente (você pode copiar o link do console)

---

## 🏢 Produção - Alternativas Recomendadas

Para ambiente de produção, considere serviços profissionais:

### **SendGrid** (Recomendado)
- ✅ 100 emails/dia grátis
- ✅ Altamente confiável
- ✅ Analytics e métricas
- 📝 [Cadastro: sendgrid.com](https://sendgrid.com/)

**Configuração no código:**
```javascript
// Em emailService.js, trocar:
service: 'gmail'
// Por:
host: 'smtp.sendgrid.net',
port: 587,
auth: {
  user: 'apikey',
  pass: process.env.SENDGRID_API_KEY
}
```

### **Resend** (Moderna)
- ✅ 100 emails/dia grátis
- ✅ API simples
- ✅ Ótima documentação
- 📝 [Cadastro: resend.com](https://resend.com/)

### **Mailgun**
- ✅ 1000 emails/mês grátis
- ✅ Muito usado em produção
- 📝 [Cadastro: mailgun.com](https://www.mailgun.com/)

---

## 📊 Limites do Gmail SMTP

| Tipo de Conta | Limite Diário |
|---------------|---------------|
| Gmail Gratuito | ~500 emails/dia |
| Google Workspace | 2000 emails/dia |

**Importante**: Esses limites são por conta, não por aplicação.

---

## 🔒 Segurança

### ✅ Boas Práticas

1. **NUNCA** compartilhe sua senha de app
2. **NUNCA** commite o arquivo `.env` no Git
3. Use variáveis de ambiente diferentes para dev/prod
4. Revogue senhas de app que não estão em uso
5. Monitore atividades suspeitas na conta Google

### 🚨 Se a senha vazar:

1. Acesse: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Clique em **"Revogar"** na senha comprometida
3. Gere uma nova senha de app
4. Atualize o `.env` com a nova senha

---

## 🧪 Teste Manual

Você pode testar o envio de e-mail com este script:

```javascript
// test-email.js
require('dotenv').config();
const { sendEmail } = require('./src/services/emailService');

async function test() {
  try {
    await sendEmail({
      to: 'seu_email_teste@gmail.com',
      subject: 'Teste de Email',
      html: '<h1>Funcionou!</h1><p>O envio de e-mail está configurado corretamente.</p>',
    });
    console.log('✅ E-mail enviado com sucesso!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();
```

Execute:
```bash
node test-email.js
```

---

## 📚 Referências

- [Documentação Nodemailer](https://nodemailer.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Verificação em Duas Etapas](https://support.google.com/accounts/answer/185839)

---

## 💡 Dicas

1. **Use um e-mail dedicado**: Crie um Gmail específico para o projeto (ex: `noreply@seudominio.com`)
2. **Monitore o console**: Sempre verifique os logs para debugar problemas
3. **Templates bonitos**: Use HTML/CSS inline nos templates de e-mail
4. **Testes**: Teste com diferentes provedores de e-mail (Gmail, Outlook, Yahoo)

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do servidor
2. Consulte a [documentação do Nodemailer](https://nodemailer.com/usage/)
3. Revise as configurações do Google
4. Verifique se as variáveis de ambiente estão corretas
