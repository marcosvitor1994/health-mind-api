# Seed Database - Health Mind API

Script para limpar e popular o banco de dados com dados de teste completos.

## Como executar

```bash
npm run seed
```

## O que o script faz

1. **Limpa todas as coleções** do banco de dados
2. **Cria clínicas** com configurações completas de pagamento e endereço
3. **Cria salas** vinculadas às clínicas
4. **Cria psicólogos** (vinculados a clínicas e independentes)
5. **Cria pacientes** (vinculados a psicólogos e não vinculados)
6. **Cria horários de trabalho** para clínicas e psicólogos
7. **Cria agendamentos** com diferentes status
8. **Cria pagamentos** vinculados aos agendamentos
9. **Cria convites** de exemplo

## Dados criados

### 🏥 Clínicas (2)

#### Clínica 1: Clínica Mente Saudável
- **Email:** clinica1@test.com
- **Senha:** senha123
- **CNPJ:** 12345678000190
- **Telefone:** (11) 98765-4321
- **Endereço:** Rua das Flores, 123 - São Paulo/SP
- **Valor da sessão:** R$ 200,00
- **Porcentagem da clínica:** 30%
- **Aceita plano de saúde:** Sim (Unimed, Amil)
- **Salas:** 3 (Tranquilidade, Serenidade, Harmonia)
- **Horário:** Seg-Sex 08:00-18:00, Sáb 09:00-13:00

#### Clínica 2: Centro de Psicologia Harmonia
- **Email:** clinica2@test.com
- **Senha:** senha123
- **CNPJ:** 98765432000110
- **Telefone:** (11) 87654-3210
- **Endereço:** Av. Principal, 456 - São Paulo/SP
- **Valor da sessão:** R$ 180,00
- **Porcentagem da clínica:** 25%
- **Aceita plano de saúde:** Não
- **Salas:** 2 (Consultório A, Consultório B)
- **Horário:** Seg-Sex 07:00-19:00

### 👨‍⚕️ Psicólogos (5)

#### 1. Dr. João Silva (Clínica Mente Saudável)
- **Email:** joao.silva@test.com
- **Senha:** senha123
- **CRP:** 06/123456
- **Especialidades:** TCC, Ansiedade, Depressão
- **Duração da sessão:** 50 minutos
- **Valor:** R$ 200,00 (usa valor da clínica)
- **Sala preferida:** Sala Tranquilidade
- **Aceita:** Online e Presencial

#### 2. Dra. Maria Santos (Clínica Mente Saudável)
- **Email:** maria.santos@test.com
- **Senha:** senha123
- **CRP:** 06/234567
- **Especialidades:** Psicanálise, Terapia de Casal, Trauma
- **Duração da sessão:** 60 minutos
- **Valor:** R$ 250,00 (valor próprio)
- **Sala preferida:** Sala Serenidade
- **Aceita:** Online e Presencial

#### 3. Dr. Pedro Oliveira (Centro Harmonia)
- **Email:** pedro.oliveira@test.com
- **Senha:** senha123
- **CRP:** 06/345678
- **Especialidades:** Neuropsicologia, TDAH, Avaliação Neuropsicológica
- **Duração da sessão:** 60 minutos
- **Valor:** R$ 180,00 (usa valor da clínica)
- **Sala preferida:** Consultório A
- **Aceita:** Online e Presencial

#### 4. Dra. Ana Costa (Independente)
- **Email:** ana.costa@test.com
- **Senha:** senha123
- **CRP:** 06/456789
- **Especialidades:** Terapia Familiar, Adolescentes, Orientação Vocacional
- **Duração da sessão:** 50 minutos
- **Valor:** R$ 150,00
- **Aceita:** Apenas Online
- **Horário:** Seg, Ter, Qua, Sex 14:00-20:00, Sáb 09:00-13:00

#### 5. Dr. Carlos Mendes (Independente)
- **Email:** carlos.mendes@test.com
- **Senha:** senha123
- **CRP:** 06/567890
- **Especialidades:** Psicologia Positiva, Coaching, Desenvolvimento Pessoal
- **Duração da sessão:** 45 minutos
- **Valor:** R$ 120,00
- **Aceita:** Apenas Online

### 👤 Pacientes (7)

#### Vinculados ao Dr. João Silva:
1. **Lucas Ferreira**
   - Email: lucas.ferreira@test.com
   - Senha: senha123
   - CPF: 123.456.789-01
   - Idade: 31 anos
   - Contato de emergência: Rita Ferreira (Mãe)

2. **Beatriz Lima**
   - Email: beatriz.lima@test.com
   - Senha: senha123
   - CPF: 234.567.890-12
   - Idade: 37 anos

#### Vinculados à Dra. Maria Santos:
3. **Rafael Souza**
   - Email: rafael.souza@test.com
   - Senha: senha123
   - CPF: 345.678.901-23
   - Idade: 33 anos

4. **Juliana Alves**
   - Email: juliana.alves@test.com
   - Senha: senha123
   - CPF: 456.789.012-34
   - Idade: 35 anos

#### Vinculados à Dra. Ana Costa:
5. **Gabriel Rocha**
   - Email: gabriel.rocha@test.com
   - Senha: senha123
   - CPF: 567.890.123-45
   - Idade: 19 anos
   - Contato de emergência: Paula Rocha (Mãe)

#### Não vinculados (podem buscar psicólogos):
6. **Camila Martins**
   - Email: camila.martins@test.com
   - Senha: senha123
   - CPF: 678.901.234-56
   - Idade: 32 anos

7. **Felipe Barbosa**
   - Email: felipe.barbosa@test.com
   - Senha: senha123
   - CPF: 789.012.345-67
   - Idade: 38 anos

### 📅 Agendamentos (8)

O script cria agendamentos com diferentes características:
- **Agendados:** Aguardando confirmação
- **Confirmados:** Paciente confirmou presença
- **Cancelados:** Exemplos de cancelamento
- **Presenciais:** Com sala definida
- **Online:** Sem sala

### 💰 Pagamentos

Os pagamentos são criados automaticamente para agendamentos não cancelados:
- **Pendentes:** Aguardando pagamento do paciente
- **Aguardando confirmação:** Paciente pagou, aguardando confirmação da clínica/psicólogo
- **Confirmados:** Pagamento confirmado

### 🏢 Salas (5)

#### Clínica Mente Saudável:
- Sala Tranquilidade (101) - 2 pessoas
- Sala Serenidade (102) - 3 pessoas
- Sala Harmonia (103) - 2 pessoas

#### Centro Harmonia:
- Consultório A (201) - 2 pessoas (acessível)
- Consultório B (202) - 2 pessoas

## Cenários de teste

### 1. Login como Clínica
```
Email: clinica1@test.com ou clinica2@test.com
Senha: senha123
```
**Testar:**
- Visualizar psicólogos vinculados
- Visualizar salas
- Gerenciar pagamentos
- Configurar horários

### 2. Login como Psicólogo vinculado a clínica
```
Email: joao.silva@test.com ou maria.santos@test.com ou pedro.oliveira@test.com
Senha: senha123
```
**Testar:**
- Visualizar agendamentos
- Gerenciar pacientes
- Processar pagamentos
- Configurar horários

### 3. Login como Psicólogo independente
```
Email: ana.costa@test.com ou carlos.mendes@test.com
Senha: senha123
```
**Testar:**
- Agendamentos online
- Pagamentos diretos (sem divisão com clínica)
- Horários personalizados

### 4. Login como Paciente vinculado
```
Email: lucas.ferreira@test.com (ou outros pacientes vinculados)
Senha: senha123
```
**Testar:**
- Ver agendamentos com seu psicólogo
- Efetuar pagamentos
- Cancelar agendamentos

### 5. Login como Paciente não vinculado
```
Email: camila.martins@test.com ou felipe.barbosa@test.com
Senha: senha123
```
**Testar:**
- Buscar psicólogos disponíveis
- Solicitar vinculação
- Agendar primeira consulta

## Fluxos completos para testar

### Fluxo 1: Agendamento com pagamento (Clínica)
1. Login como paciente (lucas.ferreira@test.com)
2. Ver agendamentos futuros
3. Login como clínica (clinica1@test.com)
4. Confirmar pagamento do paciente

### Fluxo 2: Criar novo agendamento
1. Login como psicólogo (joao.silva@test.com)
2. Criar agendamento para paciente
3. Definir sala e valor
4. Login como paciente
5. Visualizar agendamento
6. Realizar pagamento

### Fluxo 3: Gerenciamento de salas
1. Login como clínica (clinica1@test.com)
2. Visualizar ocupação das salas
3. Criar/editar salas
4. Associar sala a psicólogo

### Fluxo 4: Vincular paciente
1. Login como paciente não vinculado (camila.martins@test.com)
2. Buscar psicólogos
3. Solicitar vinculação ou agendar consulta avulsa

## Observações

- Todas as senhas são: **senha123**
- Os agendamentos são criados para datas futuras (próximos 9 dias)
- Pagamentos têm status variados para testar diferentes cenários
- Alguns psicólogos usam valor da clínica, outros têm valor próprio
- Horários de trabalho são configurados de forma realista

## Segurança

⚠️ **IMPORTANTE:** Este script é apenas para ambiente de desenvolvimento/testes.
- Nunca execute em produção
- As credenciais são simples e previsíveis
- Os dados são fictícios

## Troubleshooting

Se encontrar erros:

1. **Erro de conexão:** Verifique se o MongoDB está rodando e a connection string está correta no `.env`
2. **Erro de validação:** Verifique se todos os modelos estão atualizados
3. **Duplicatas:** O script limpa o banco antes de popular, então não deve haver conflitos

## Limpeza

Para limpar o banco sem popular novamente, você pode usar o MongoDB Compass ou executar:

```javascript
// No MongoDB shell
use your_database_name
db.dropDatabase()
```
