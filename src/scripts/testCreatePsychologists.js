/**
 * Script de teste: Criar 2 psicólogos simulados via API
 *
 * Uso: node src/scripts/testCreatePsychologists.js
 *
 * Requisitos:
 * - Servidor rodando (local ou produção)
 * - Uma clínica já cadastrada no sistema
 *
 * O script vai:
 * 1. Fazer login como clínica
 * 2. Criar convites para 2 psicólogos
 * 3. Gerar system prompts via IA para cada um
 * 4. Completar o cadastro de cada psicólogo
 */

require('dotenv').config();

const API_BASE = process.env.API_BASE_URL || 'https://health-mind-app.vercel.app/api';

// Credenciais da clínica (ajuste conforme necessário)
const CLINIC_EMAIL = process.env.TEST_CLINIC_EMAIL || '';
const CLINIC_PASSWORD = process.env.TEST_CLINIC_PASSWORD || '';

// Dados dos 2 psicólogos de teste
const PSYCHOLOGISTS = [
  {
    // Psicóloga 1: Gestalt-terapeuta especializada em LGBTQIA+ e violência de gênero
    invitation: {
      email: `psi.catarina.teste${Date.now()}@teste.com`,
      name: 'Dra. Catarina Souza',
      crp: '01/12345',
      specialties: ['Gestalt-terapia', 'LGBTQIA+', 'Violência de Gênero'],
    },
    wizardData: {
      password: 'Teste@123456',
      phone: '(61) 99999-0001',
      formacaoAcademica: 'Centro Universitário de Brasília (UniCEUB)',
      posGraduacao: 'Pós-graduada em Gestalt-terapia pelo Instituto de Gestalt de Brasília',
      abordagemPrincipal: 'Gestalt-terapia',
      descricaoTrabalho: 'Trabalho com escuta atenta e acolhedora, focando no aqui e agora. Meu objetivo é facilitar o autoconhecimento e a expressão emocional.',
      publicosEspecificos: ['LGBTQIA+', 'Mulheres em situação de violência', 'Jovens e Adolescentes'],
      temasEspecializados: ['Violência de Gênero', 'Violência Doméstica', 'Identidade de Gênero', 'Orientação Sexual', 'Ansiedade', 'Depressão'],
      tonsComunicacao: ['Acolhedor', 'Empático', 'Firme', 'Profissional'],
      tecnicasFavoritas: [
        'O que você está sentindo agora?',
        'Onde no seu corpo você sente isso?',
        'Como seria colocar isso em palavras?',
        'O que mais você percebe sobre essa situação?',
      ],
      restricoesTematicas: '',
      diferenciais: 'Escuta profundamente presente e acolhedora',
      experienciaViolencia: 'Atuo há 5 anos com mulheres em situação de violência doméstica e familiar. Trabalho com ciclos de violência de Walker e violentômetro.',
      situacoesLimite: 'Priorizo a segurança do paciente, aciono o protocolo de emergência com CVV (188), SAMU (192) e PM (190). Comunico a rede de apoio.',
      linguagemPreferida: 'Linguagem neutra e inclusiva, respeitando a identidade expressa pelo paciente.',
      exemploAcolhimento: 'Sinto que foi um dia pesado. Estou aqui para te ouvir. O que tornou esse dia tão difícil para você?',
      exemploLimiteEtico: 'Essa é uma avaliação que apenas eu posso fazer durante as sessões ou por um neuropsicólogo. O que posso fazer é acolher o que você está sentindo agora.',
    },
  },
  {
    // Psicólogo 2: TCC especializado em ansiedade e TOC
    invitation: {
      email: `psi.ricardo.teste${Date.now()}@teste.com`,
      name: 'Dr. Ricardo Mendes',
      crp: '06/54321',
      specialties: ['TCC', 'Ansiedade', 'TOC'],
    },
    wizardData: {
      password: 'Teste@123456',
      phone: '(11) 98888-0002',
      formacaoAcademica: 'Universidade de São Paulo (USP)',
      posGraduacao: 'Especialização em Terapia Cognitivo-Comportamental pelo Instituto Beck (SP)',
      abordagemPrincipal: 'Terapia Cognitivo-Comportamental (TCC)',
      descricaoTrabalho: 'Utilizo técnicas baseadas em evidências para ajudar pacientes a identificar e reestruturar padrões de pensamento disfuncionais.',
      publicosEspecificos: ['Adultos', 'Jovens e Adolescentes'],
      temasEspecializados: ['Ansiedade', 'Depressão', 'TOC', 'Fobias', 'Estresse', 'Carreira e Propósito'],
      tonsComunicacao: ['Profissional', 'Direto', 'Acolhedor', 'Gentil'],
      tecnicasFavoritas: [
        'Qual pensamento passou pela sua cabeça naquele momento?',
        'Que evidências você tem a favor e contra esse pensamento?',
        'Como você se sentiria se pensasse de outra forma sobre isso?',
        'O que você diria para um amigo na mesma situação?',
        'Vamos registrar esse pensamento no diário?',
      ],
      restricoesTematicas: 'Não atendo casos de dependência química grave sem acompanhamento psiquiátrico.',
      diferenciais: 'Abordagem prática e baseada em evidências científicas',
      experienciaViolencia: '',
      situacoesLimite: 'Avalio o risco de forma objetiva, utilizo escalas de ideação suicida e aciono o protocolo com orientações claras para o paciente.',
      linguagemPreferida: 'Linguagem clara, direta e acessível. Evito jargões técnicos.',
      exemploAcolhimento: 'Entendo que essa situação está sendo muito difícil. Vamos juntos tentar entender o que está acontecendo e encontrar formas de lidar com isso.',
      exemploLimiteEtico: 'Realizar um diagnóstico requer uma avaliação mais aprofundada que faremos ao longo das sessões. Por enquanto, vamos focar em entender melhor o que você está vivendo.',
    },
  },
];

async function makeRequest(url, method, body, token) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${data.message || JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  console.log('=== Teste: Criar 2 Psicólogos Simulados ===\n');
  console.log(`API Base: ${API_BASE}\n`);

  if (!CLINIC_EMAIL || !CLINIC_PASSWORD) {
    console.error('❌ Configure as variáveis de ambiente:');
    console.error('   TEST_CLINIC_EMAIL=email_da_clinica');
    console.error('   TEST_CLINIC_PASSWORD=senha_da_clinica');
    console.error('\nOu edite as constantes CLINIC_EMAIL e CLINIC_PASSWORD no script.');
    process.exit(1);
  }

  // 1. Login como clínica
  console.log('1️⃣ Fazendo login como clínica...');
  const loginResult = await makeRequest('/auth/login', 'POST', {
    email: CLINIC_EMAIL,
    password: CLINIC_PASSWORD,
  });
  const clinicToken = loginResult.data.token;
  console.log(`   ✅ Logado como: ${loginResult.data.user.name}\n`);

  for (let i = 0; i < PSYCHOLOGISTS.length; i++) {
    const psi = PSYCHOLOGISTS[i];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📋 Psicólogo ${i + 1}: ${psi.invitation.name}`);
    console.log(`${'='.repeat(50)}\n`);

    // 2. Criar convite
    console.log('2️⃣ Criando convite...');
    const inviteResult = await makeRequest('/invitations/psychologist', 'POST', psi.invitation, clinicToken);

    // Extrair token: pode estar em data.token, data.invitation.token, ou na invitationUrl
    let invitationToken = inviteResult.data.token || inviteResult.data.invitation?.token;
    if (!invitationToken && inviteResult.data.invitation?.invitationUrl) {
      // Extrair token da URL: .../complete-registration/{TOKEN}
      const url = inviteResult.data.invitation.invitationUrl;
      invitationToken = url.split('/').pop();
    }
    console.log(`   ✅ Convite criado! Token: ${invitationToken?.substring(0, 20)}...\n`);

    if (!invitationToken) {
      console.error('   ❌ Token do convite não retornado. Response:', JSON.stringify(inviteResult.data, null, 2));
      continue;
    }

    // 3. Gerar system prompt via IA
    console.log('3️⃣ Gerando system prompt via IA (pode levar 15-30s)...');
    try {
      const promptResult = await makeRequest('/ai/generate-system-prompt', 'POST', {
        nomeCompleto: psi.invitation.name,
        crp: psi.invitation.crp,
        formacaoAcademica: psi.wizardData.formacaoAcademica,
        posGraduacao: psi.wizardData.posGraduacao,
        abordagemPrincipal: psi.wizardData.abordagemPrincipal,
        descricaoTrabalho: psi.wizardData.descricaoTrabalho,
        publicosEspecificos: psi.wizardData.publicosEspecificos,
        temasEspecializados: psi.wizardData.temasEspecializados,
        tonsComunicacao: psi.wizardData.tonsComunicacao,
        tecnicasFavoritas: psi.wizardData.tecnicasFavoritas,
        restricoesTematicas: psi.wizardData.restricoesTematicas,
        diferenciais: psi.wizardData.diferenciais,
        experienciaViolencia: psi.wizardData.experienciaViolencia,
        situacoesLimite: psi.wizardData.situacoesLimite,
        linguagemPreferida: psi.wizardData.linguagemPreferida,
        exemploAcolhimento: psi.wizardData.exemploAcolhimento,
        exemploLimiteEtico: psi.wizardData.exemploLimiteEtico,
      });

      const systemPrompt = promptResult.data.systemPrompt;
      console.log(`   ✅ System prompt gerado! (${systemPrompt.length} caracteres)`);

      // Verificar seções obrigatórias
      const checks = [
        { name: 'CVV 188', present: systemPrompt.includes('188') },
        { name: 'SAMU 192', present: systemPrompt.includes('192') },
        { name: 'PM 190', present: systemPrompt.includes('190') },
        { name: 'Sensibilidade Cultural', present: systemPrompt.toLowerCase().includes('sensibilidade cultural') || systemPrompt.toLowerCase().includes('lgbtqia') },
        { name: 'Protocolo de Emergência', present: systemPrompt.toLowerCase().includes('protocolo') || systemPrompt.toLowerCase().includes('emergência') || systemPrompt.toLowerCase().includes('emergencia') },
        { name: 'Nome do Psicólogo', present: systemPrompt.includes(psi.invitation.name.split(' ')[2] || psi.invitation.name.split(' ')[1]) },
      ];

      console.log('\n   📊 Verificação de seções obrigatórias:');
      checks.forEach(c => {
        console.log(`      ${c.present ? '✅' : '❌'} ${c.name}`);
      });

      // 4. Completar cadastro
      console.log('\n4️⃣ Completando cadastro...');
      const registerResult = await makeRequest('/auth/complete-registration/psychologist', 'POST', {
        token: invitationToken,
        password: psi.wizardData.password,
        phone: psi.wizardData.phone,
        formacaoAcademica: psi.wizardData.formacaoAcademica,
        posGraduacao: psi.wizardData.posGraduacao,
        abordagemPrincipal: psi.wizardData.abordagemPrincipal,
        descricaoTrabalho: psi.wizardData.descricaoTrabalho,
        publicosEspecificos: psi.wizardData.publicosEspecificos,
        temasEspecializados: psi.wizardData.temasEspecializados,
        tonsComunicacao: psi.wizardData.tonsComunicacao,
        tecnicasFavoritas: psi.wizardData.tecnicasFavoritas,
        restricoesTematicas: psi.wizardData.restricoesTematicas,
        diferenciais: psi.wizardData.diferenciais,
        experienciaViolencia: psi.wizardData.experienciaViolencia,
        situacoesLimite: psi.wizardData.situacoesLimite,
        linguagemPreferida: psi.wizardData.linguagemPreferida,
        exemploAcolhimento: psi.wizardData.exemploAcolhimento,
        exemploLimiteEtico: psi.wizardData.exemploLimiteEtico,
        systemPrompt: systemPrompt.substring(0, 20000),
      });

      console.log(`   ✅ Cadastro completo!`);
      console.log(`   📧 Email: ${psi.invitation.email}`);
      console.log(`   🔑 Senha: ${psi.wizardData.password}`);
      console.log(`   🆔 ID: ${registerResult.data?.user?._id || 'N/A'}`);

    } catch (aiError) {
      console.log(`   ⚠️ Erro na geração de IA: ${aiError.message}`);
      console.log('   Continuando cadastro sem system prompt...\n');

      // Completar cadastro sem system prompt
      console.log('4️⃣ Completando cadastro sem IA...');
      try {
        const registerResult = await makeRequest('/auth/complete-registration/psychologist', 'POST', {
          token: invitationToken,
          password: psi.wizardData.password,
          phone: psi.wizardData.phone,
          formacaoAcademica: psi.wizardData.formacaoAcademica,
          posGraduacao: psi.wizardData.posGraduacao,
          abordagemPrincipal: psi.wizardData.abordagemPrincipal,
          descricaoTrabalho: psi.wizardData.descricaoTrabalho,
          publicosEspecificos: psi.wizardData.publicosEspecificos,
          temasEspecializados: psi.wizardData.temasEspecializados,
          tonsComunicacao: psi.wizardData.tonsComunicacao,
          tecnicasFavoritas: psi.wizardData.tecnicasFavoritas,
          restricoesTematicas: psi.wizardData.restricoesTematicas,
          diferenciais: psi.wizardData.diferenciais,
          experienciaViolencia: psi.wizardData.experienciaViolencia,
          situacoesLimite: psi.wizardData.situacoesLimite,
          linguagemPreferida: psi.wizardData.linguagemPreferida,
          exemploAcolhimento: psi.wizardData.exemploAcolhimento,
          exemploLimiteEtico: psi.wizardData.exemploLimiteEtico,
        });

        console.log(`   ✅ Cadastro completo (sem IA)!`);
        console.log(`   📧 Email: ${psi.invitation.email}`);
        console.log(`   🔑 Senha: ${psi.wizardData.password}`);
        console.log(`   🆔 ID: ${registerResult.data?.user?._id || 'N/A'}`);
      } catch (regError) {
        console.error(`   ❌ Erro no cadastro: ${regError.message}`);
      }
    }
  }

  console.log(`\n\n${'='.repeat(50)}`);
  console.log('🏁 Teste finalizado!');
  console.log(`${'='.repeat(50)}`);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
