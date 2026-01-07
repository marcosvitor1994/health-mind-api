#!/usr/bin/env node

/**
 * Script para gerar secrets seguros para a API
 *
 * Uso:
 *   node generate-secrets.js
 *
 * Este script gera 3 secrets aleatórios e seguros:
 * - JWT_SECRET
 * - JWT_REFRESH_SECRET
 * - SESSION_SECRET
 */

const crypto = require('crypto');

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║          🔐 Gerador de Secrets - Health Mind API          ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('Gerando secrets seguros...\n');

const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
const sessionSecret = crypto.randomBytes(64).toString('hex');

console.log('✅ Secrets gerados com sucesso!\n');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('Copie e cole estas variáveis no seu .env ou na Vercel:\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('JWT_SECRET=' + jwtSecret);
console.log('\nJWT_REFRESH_SECRET=' + jwtRefreshSecret);
console.log('\nSESSION_SECRET=' + sessionSecret);

console.log('\n═══════════════════════════════════════════════════════════\n');
console.log('💡 Dicas:\n');
console.log('  1. NUNCA compartilhe estes secrets');
console.log('  2. Use secrets diferentes para dev e produção');
console.log('  3. Gere novos secrets periodicamente');
console.log('  4. Adicione ao .env (local) ou Vercel (produção)');
console.log('\n═══════════════════════════════════════════════════════════\n');
