# 🔐 Credenciais de Teste - Health Mind API

## 📋 Resumo Rápido

**Todas as senhas:** `senha123`

---

## 🏥 CLÍNICAS (2)

### Clínica Mente Saudável
- **Email:** `clinica1@test.com`
- **Senha:** `senha123`
- **Psicólogos:** Dr. João Silva, Dra. Maria Santos
- **Salas:** 3 (Tranquilidade, Serenidade, Harmonia)
- **Valor sessão:** R$ 200,00
- **% Clínica:** 30%

### Centro de Psicologia Harmonia
- **Email:** `clinica2@test.com`
- **Senha:** `senha123`
- **Psicólogos:** Dr. Pedro Oliveira
- **Salas:** 2 (Consultório A, B)
- **Valor sessão:** R$ 180,00
- **% Clínica:** 25%

---

## 👨‍⚕️ PSICÓLOGOS (5)

### 🏥 Vinculados à Clínica 1

#### Dr. João Silva
- **Email:** `joao.silva@test.com`
- **Senha:** `senha123`
- **CRP:** 06/123456
- **Especialidades:** TCC, Ansiedade, Depressão
- **Valor:** R$ 200,00 (usa valor da clínica)
- **Pacientes:** Lucas Ferreira, Beatriz Lima

#### Dra. Maria Santos
- **Email:** `maria.santos@test.com`
- **Senha:** `senha123`
- **CRP:** 06/234567
- **Especialidades:** Psicanálise, Terapia de Casal, Trauma
- **Valor:** R$ 250,00 (valor próprio)
- **Pacientes:** Rafael Souza, Juliana Alves

### 🏥 Vinculados à Clínica 2

#### Dr. Pedro Oliveira
- **Email:** `pedro.oliveira@test.com`
- **Senha:** `senha123`
- **CRP:** 06/345678
- **Especialidades:** Neuropsicologia, TDAH
- **Valor:** R$ 180,00 (usa valor da clínica)
- **Pacientes:** Nenhum ainda

### 💼 Psicólogos Independentes

#### Dra. Ana Costa
- **Email:** `ana.costa@test.com`
- **Senha:** `senha123`
- **CRP:** 06/456789
- **Especialidades:** Terapia Familiar, Adolescentes
- **Valor:** R$ 150,00
- **Atende:** Apenas Online
- **Pacientes:** Gabriel Rocha

#### Dr. Carlos Mendes
- **Email:** `carlos.mendes@test.com`
- **Senha:** `senha123`
- **CRP:** 06/567890
- **Especialidades:** Psicologia Positiva, Coaching
- **Valor:** R$ 120,00
- **Atende:** Apenas Online
- **Pacientes:** Nenhum ainda

---

## 👤 PACIENTES (7)

### Vinculados ao Dr. João Silva (Clínica 1)

#### Lucas Ferreira
- **Email:** `lucas.ferreira@test.com`
- **Senha:** `senha123`
- **CPF:** 123.456.789-01
- **Agendamentos:** 2 (1 agendado, 1 futuro)

#### Beatriz Lima
- **Email:** `beatriz.lima@test.com`
- **Senha:** `senha123`
- **CPF:** 234.567.890-12
- **Agendamentos:** 2 (1 confirmado, 1 cancelado)

### Vinculados à Dra. Maria Santos (Clínica 1)

#### Rafael Souza
- **Email:** `rafael.souza@test.com`
- **Senha:** `senha123`
- **CPF:** 345.678.901-23
- **Agendamentos:** 1 (confirmado, amanhã)

#### Juliana Alves
- **Email:** `juliana.alves@test.com`
- **Senha:** `senha123`
- **CPF:** 456.789.012-34
- **Agendamentos:** 1 (agendado)

### Vinculados à Dra. Ana Costa (Independente)

#### Gabriel Rocha
- **Email:** `gabriel.rocha@test.com`
- **Senha:** `senha123`
- **CPF:** 567.890.123-45
- **Agendamentos:** 2 (1 confirmado, 1 agendado)

### Pacientes Não Vinculados

#### Camila Martins
- **Email:** `camila.martins@test.com`
- **Senha:** `senha123`
- **CPF:** 678.901.234-56
- **Agendamentos:** Nenhum
- **Status:** Pode buscar psicólogos

#### Felipe Barbosa
- **Email:** `felipe.barbosa@test.com`
- **Senha:** `senha123`
- **CPF:** 789.012.345-67
- **Agendamentos:** Nenhum
- **Status:** Pode buscar psicólogos

---

## 📊 Estatísticas do Banco

- **Clínicas:** 2
- **Psicólogos:** 5 (3 vinculados, 2 independentes)
- **Pacientes:** 7 (5 vinculados, 2 não vinculados)
- **Salas:** 5
- **Agendamentos:** 8 (4 agendados, 3 confirmados, 1 cancelado)
- **Pagamentos:** 7 (4 pendentes, 3 aguardando confirmação)

---

## 🧪 Sugestões de Testes por Tipo de Usuário

### Como Clínica

**Login:** `clinica1@test.com` ou `clinica2@test.com`

✅ Visualizar psicólogos vinculados
✅ Gerenciar salas
✅ Ver agendamentos da clínica
✅ Confirmar pagamentos
✅ Configurar horários de funcionamento
✅ Convidar novos psicólogos

### Como Psicólogo Vinculado

**Login:** `joao.silva@test.com`, `maria.santos@test.com` ou `pedro.oliveira@test.com`

✅ Ver agenda de atendimentos
✅ Gerenciar pacientes vinculados
✅ Criar novos agendamentos
✅ Confirmar pagamentos recebidos
✅ Escolher salas para atendimento presencial
✅ Convidar pacientes

### Como Psicólogo Independente

**Login:** `ana.costa@test.com` ou `carlos.mendes@test.com`

✅ Ver agenda de atendimentos
✅ Gerenciar pacientes
✅ Criar agendamentos online
✅ Gerenciar pagamentos diretos (100% do valor)
✅ Configurar horários personalizados

### Como Paciente Vinculado

**Login:** Qualquer paciente exceto Camila e Felipe

✅ Ver próximos agendamentos
✅ Realizar pagamentos
✅ Ver histórico de consultas
✅ Cancelar agendamentos
✅ Ver informações do psicólogo

### Como Paciente Não Vinculado

**Login:** `camila.martins@test.com` ou `felipe.barbosa@test.com`

✅ Buscar psicólogos disponíveis
✅ Filtrar por especialidade
✅ Solicitar vinculação
✅ Agendar primeira consulta

---

## 🔄 Para Repopular o Banco

```bash
npm run seed
```

Este comando irá:
1. Limpar todas as coleções
2. Criar todos os dados novamente
3. Gerar novos IDs para todas as entidades

---

## ⚠️ IMPORTANTE

- Estes dados são **APENAS PARA DESENVOLVIMENTO/TESTES**
- **NUNCA** use em produção
- As senhas são simples e previsíveis
- Os dados são completamente fictícios
