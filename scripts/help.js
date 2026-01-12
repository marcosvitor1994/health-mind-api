#!/usr/bin/env node

/**
 * Script de ajuda - mostra todos os comandos disponíveis
 */

console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                      ║');
console.log('║             🛠️  SCRIPTS ADMINISTRATIVOS - HEALTH MIND 🛠️            ║');
console.log('║                                                                      ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

console.log('📋 COMANDOS DISPONÍVEIS:\n');

console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 1. Criar Convite para Clínica                                       │');
console.log('│    npm run invite:clinic                                            │');
console.log('│                                                                     │');
console.log('│    Cria um convite para uma nova clínica se cadastrar.             │');
console.log('│    Solicita: e-mail, nome e CNPJ                                    │');
console.log('│    Envia e-mail automático (se configurado)                         │');
console.log('└─────────────────────────────────────────────────────────────────────┘\n');

console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 2. Listar Todos os Convites                                         │');
console.log('│    npm run invites:list                                             │');
console.log('│                                                                     │');
console.log('│    Lista todos os convites criados (últimos 50).                    │');
console.log('│    Mostra: status, e-mail, nome, datas e links                      │');
console.log('└─────────────────────────────────────────────────────────────────────┘\n');

console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 3. Cancelar um Convite                                              │');
console.log('│    npm run invite:cancel <email_ou_id>                              │');
console.log('│                                                                     │');
console.log('│    Cancela um convite pendente.                                     │');
console.log('│                                                                     │');
console.log('│    Exemplos:                                                        │');
console.log('│    npm run invite:cancel clinica@example.com                        │');
console.log('│    npm run invite:cancel 65abc123def456...                          │');
console.log('└─────────────────────────────────────────────────────────────────────┘\n');

console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 4. Iniciar Servidor de Desenvolvimento                              │');
console.log('│    npm run dev                                                      │');
console.log('│                                                                     │');
console.log('│    Inicia o servidor com auto-reload (nodemon)                      │');
console.log('└─────────────────────────────────────────────────────────────────────┘\n');

console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ 5. Iniciar Servidor de Produção                                     │');
console.log('│    npm start                                                        │');
console.log('│                                                                     │');
console.log('│    Inicia o servidor em modo produção                               │');
console.log('└─────────────────────────────────────────────────────────────────────┘\n');

console.log('💡 DICAS:\n');
console.log('  • Configure o arquivo .env antes de usar os scripts');
console.log('  • E-mail é opcional para DEV (links aparecem no console)');
console.log('  • Convites expiram em 7 dias');
console.log('  • Use npm run invites:list para ver todos os convites\n');

console.log('📚 DOCUMENTAÇÃO:\n');
console.log('  • scripts/README.md - Documentação completa dos scripts');
console.log('  • INVITATION_SYSTEM_GUIDE.md - Sistema de convites');
console.log('  • EMAIL_SETUP_GUIDE.md - Configurar e-mail');
console.log('  • INVITATION_QUICK_START.md - Quick start\n');

console.log('═══════════════════════════════════════════════════════════════════════\n');
