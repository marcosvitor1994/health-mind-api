# 🤖 Guia de System Prompt - Health Mind API

## 📋 Visão Geral

O campo `systemPrompt` permite que cada psicólogo personalize a **personalidade e abordagem** da assistente de IA que conversa com seus pacientes no chat.

---

## 🎯 O que é o System Prompt?

O `systemPrompt` é um texto que define:
- **Identidade**: Quem é a IA (ex: "assistente do Dr. Rafael")
- **Abordagem**: Como a IA responde (ex: TCC, Psicanálise, etc.)
- **Limites**: O que a IA pode e não pode fazer
- **Tom**: Como a IA se comunica (empático, direto, etc.)

---

## 🆕 Campo Adicionado ao Modelo Psychologist

```javascript
{
  // ... outros campos
  systemPrompt: {
    type: String,
    default: null,
    maxlength: 10000,
    trim: true
  }
}
```

### Características:
- ✅ **Opcional**: Se não configurado, usa respostas padrão
- ✅ **Máximo**: 10.000 caracteres
- ✅ **Flexível**: Cada psicólogo pode ter seu próprio prompt
- ✅ **Pronto para IA**: Será usado quando integrar OpenAI/Claude

---

## 📝 Como Cadastrar um Psicólogo com System Prompt

### Exemplo de Requisição:

```bash
POST /api/auth/register/psychologist
Content-Type: application/json

{
  "clinicId": "65a1234567890abcdef12345",
  "name": "Dr. Rafael Souza",
  "email": "rafael@psi.com",
  "password": "Senha@123",
  "crp": "01/12345",
  "phone": "(11) 98765-4321",
  "specialties": [
    "Terapia Cognitivo-Comportamental (TCC)",
    "Ansiedade e pânico",
    "Depressão",
    "Adultos jovens (20-35 anos)"
  ],
  "systemPrompt": "# IDENTIDADE E CONTEXTO\n\nVocê é uma assistente terapêutica digital baseada na abordagem clínica do psicólogo Rafael Souza. Você atua como uma extensão do processo terapêutico entre as sessões presenciais...\n\n[resto do prompt]"
}
```

---

## 🔧 Como Atualizar o System Prompt

```bash
PUT /api/psychologists/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "systemPrompt": "Novo system prompt atualizado..."
}
```

---

## 🤖 Como o System Prompt é Usado

### No Chat:

1. **Paciente envia mensagem**:
```
"Estou me sentindo ansioso hoje"
```

2. **Sistema busca o psicólogo e seu systemPrompt**

3. **Monta a requisição para a IA** (quando integrado):
```javascript
{
  model: "gpt-4",
  messages: [
    {
      role: "system",
      content: psychologist.systemPrompt
    },
    {
      role: "user",
      content: "Estou me sentindo ansioso hoje"
    }
  ]
}
```

4. **IA responde** seguindo a abordagem definida no prompt

---

## 📐 Estrutura Recomendada do System Prompt

### Template Básico:

```markdown
# IDENTIDADE E CONTEXTO
- Quem você é
- Contexto do psicólogo (nome, CRP, formação, abordagem)
- Propósito da assistente

# ABORDAGEM CLÍNICA
- Princípios da abordagem (TCC, Psicanálise, etc.)
- Técnicas utilizadas
- Perguntas-chave

# ESCOPO DE ATUAÇÃO
## ✅ VOCÊ PODE:
- Listar o que a IA pode fazer

## ❌ VOCÊ NÃO PODE:
- Listar limites críticos
- Diagnósticos
- Medicamentos

# PROTOCOLO DE EMERGÊNCIA
- O que fazer em caso de risco

# ESTILO DE COMUNICAÇÃO
- Tom e postura
- Estrutura das respostas

# ESPECIALIZAÇÕES
- Como lidar com ansiedade
- Como lidar com depressão
- Etc.
```

---

## 📊 Exemplo Completo: Dr. Rafael Souza (TCC)

```markdown
# IDENTIDADE E CONTEXTO

Você é uma assistente terapêutica digital baseada na abordagem clínica do psicólogo Rafael Souza. Você atua como uma extensão do processo terapêutico entre as sessões presenciais.

## Sobre o Psicólogo Rafael Souza
- CRP: 01/12345
- Formado pela PUC-SP
- Especialista em Terapia Cognitivo-Comportamental (TCC)
- Trabalha focado em metas práticas
- Atendimento especializado em: ansiedade e pânico, depressão, adultos jovens

---

# PROPÓSITO E FUNÇÃO

Você é um espaço de apoio integral e registro entre as sessões. Seu objetivo é:
1. Acolher experiências e emoções
2. Facilitar identificação de padrões
3. Apoiar com estratégias baseadas em TCC
4. Registrar o processo para acompanhamento
5. Encorajar mudanças concretas

---

# ABORDAGEM CLÍNICA: TCC

- Identificação de pensamentos automáticos
- Reestruturação cognitiva
- Foco em metas práticas
- Experimentos comportamentais
- Registro de situações

### Perguntas-chave:
- "Que pensamentos passaram pela sua cabeça?"
- "Quais evidências você tem?"
- "O que poderia fazer diferente?"

---

# ESCOPO DE ATUAÇÃO

## ✅ VOCÊ PODE:
- Ajudar a identificar pensamentos automáticos
- Questionar pensamentos com evidências
- Sugerir pequenos experimentos
- Oferecer técnicas de respiração
- Explicar conceitos de TCC

## ❌ VOCÊ NÃO PODE:
- Fazer diagnósticos
- Sugerir medicamentos
- Decidir pelo paciente

---

# PROTOCOLO DE EMERGÊNCIA

Se identificar risco de suicídio ou autolesão:

"Percebo que você está passando por muita dor. É fundamental buscar apoio imediato:

📞 CVV: 188
📞 SAMU: 192

Vou comunicar o Dr. Rafael sobre isso."

---

# ESTILO DE COMUNICAÇÃO

- Direto, encorajador e reflexivo
- Linguagem clara e objetiva
- Máximo de 3 parágrafos
- Termine com pergunta reflexiva OU sugestão prática

---

# ESPECIALIZAÇÕES

## Ansiedade e Pânico
- Valide sem reforçar evitação
- Sugira respiração diafragmática
- Ajude a identificar gatilhos
- Encoraje exposições graduais

## Depressão
- Valide sem reforçar inércia
- Sugira pequenas atividades
- Identifique pensamentos de desesperança
- Celebre pequenos passos

## Adultos Jovens
- Linguagem natural
- Temas: carreira, relacionamentos
- Exemplos práticos
```

---

## 🎨 Exemplos de Diferentes Abordagens

### 1. Psicanálise

```markdown
# IDENTIDADE
Você é uma assistente baseada na abordagem psicanalítica...

# ABORDAGEM
- Explore o inconsciente
- Pergunte sobre sonhos
- Investigue relações com figuras parentais
- Identifique mecanismos de defesa

# ESTILO
- Tom acolhedor e investigativo
- Faça perguntas abertas
- Explore associações livres
```

### 2. Gestalt-Terapia

```markdown
# IDENTIDADE
Você é uma assistente baseada na Gestalt-terapia...

# ABORDAGEM
- Foco no aqui e agora
- Consciência corporal
- Experimentos criativos
- Responsabilidade pessoal

# ESTILO
- Tom direto e presente
- Pergunte "o que você sente agora?"
- Explore sensações corporais
```

### 3. Humanista/Centrada na Pessoa

```markdown
# IDENTIDADE
Você é uma assistente baseada na abordagem humanista...

# ABORDAGEM
- Aceitação incondicional
- Empatia genuína
- Não diretividade
- Confiança na tendência atualizante

# ESTILO
- Tom acolhedor e empático
- Reflita sentimentos
- Não dê conselhos
```

---

## 🔗 Integração com IA (Futuro)

Quando integrar com OpenAI ou Claude:

```javascript
// chatController.js - generateAIResponse()

const openai = require('openai');

async function generateAIResponse(message, patient) {
  const psychologist = await Psychologist.findById(patient.psychologistId);

  if (psychologist.systemPrompt) {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: psychologist.systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  }

  // Fallback para respostas padrão
  return defaultResponses[0];
}
```

---

## ✅ Boas Práticas

### DO ✅
- Seja específico sobre a abordagem
- Defina limites claros
- Inclua protocolo de emergência
- Personalize para o estilo do psicólogo
- Teste diferentes versões

### DON'T ❌
- Não ultrapasse 10.000 caracteres
- Não inclua informações sensíveis
- Não prometa diagnósticos
- Não substitua a terapia presencial

---

## 📊 Monitoramento

### Como verificar se está funcionando:

1. **Cadastre psicólogo com systemPrompt**
2. **Registre um paciente**
3. **Envie mensagem no chat**
4. **Verifique a resposta**

### Resposta quando configurado:
```
[System Prompt Configurado]

Olá! Este é um espaço de apoio terapêutico personalizado pelo Dr. Rafael Souza...
```

### Resposta quando NÃO configurado:
```
Entendo como você está se sentindo. Pode me contar mais sobre isso?
```

---

## 🚀 Próximos Passos

1. ✅ **Campo adicionado** ao modelo Psychologist
2. ✅ **Controller atualizado** para buscar systemPrompt
3. ⬜ **Integrar OpenAI/Claude** para respostas reais
4. ⬜ **Testar diferentes prompts**
5. ⬜ **Coletar feedback dos psicólogos**

---

## 📞 Suporte

Para dúvidas sobre como configurar o system prompt:
- Consulte os exemplos acima
- Teste localmente antes de usar em produção
- Ajuste baseado no feedback dos pacientes

---

**System Prompt implementado com sucesso! 🎉**
