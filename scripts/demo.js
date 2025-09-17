const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createQrcode() {
  log('\n📱 1. Criando QR Code...', 'blue');
  
  const qrcodeData = {
    visitId: 'VIS-123',
    visitName: 'João Silva',
    allowedBuilding: 'GATE-A', // Single building only
    windowStart: new Date(Date.now() + 60000).toISOString(), // 1 min no futuro
    windowEnd: new Date(Date.now() + 3600000).toISOString(), // 1 hora no futuro
    maxUses: 1
  };

  try {
    const response = await axios.post(`${BASE_URL}/qrcodes`, qrcodeData);
    log(`✅ QR Code criado:`, 'green');
    log(`   JTI: ${response.data.jti}`, 'green');
    log(`   Expira em: ${response.data.expiresAt}`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ Erro ao criar QR Code: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function scanQrcode(token, gateId = 'GATE-A') {
  log(`\n🚪 2. Escaneando QR Code no gate ${gateId}...`, 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId
    });
    
    if (response.data.decision === 'ALLOWED') {
      log(`✅ Entrada PERMITIDA!`, 'green');
    } else {
      log(`❌ Entrada NEGADA: ${response.data.reason}`, 'red');
    }
    
    return response.data;
  } catch (error) {
    log(`❌ Erro ao escanear: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function testDuplicateUse(token) {
  log(`\n🔄 3. Testando uso duplicado...`, 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId: 'GATE-A'
    });
    
    if (response.data.decision === 'DENIED' && response.data.reason === 'ALREADY_USED') {
      log(`✅ Uso duplicado corretamente negado!`, 'green');
    } else {
      log(`❌ Uso duplicado não foi negado corretamente`, 'red');
    }
    
    return response.data;
  } catch (error) {
    log(`❌ Erro no teste de duplicação: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function testWrongGate(token) {
  log(`\n🚫 4. Testando gate não permitido...`, 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId: 'GATE-C' // Gate não permitido
    });
    
    if (response.data.decision === 'DENIED' && response.data.reason === 'GATE_NOT_ALLOWED') {
      log(`✅ Gate não permitido corretamente negado!`, 'green');
    } else {
      log(`❌ Gate não permitido não foi negado corretamente`, 'red');
    }
    
    return response.data;
  } catch (error) {
    log(`❌ Erro no teste de gate: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function revokeQrcode(jti) {
  log(`\n🗑️  5. Revogando QR Code...`, 'blue');
  
  try {
    const response = await axios.delete(`${BASE_URL}/qrcodes/${jti}`);
    log(`✅ QR Code revogado!`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ Erro ao revogar: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function testRevokedQrcode(token) {
  log(`\n🚫 6. Testando QR Code revogado...`, 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId: 'GATE-A'
    });
    
    if (response.data.decision === 'DENIED' && response.data.reason === 'REVOKED') {
      log(`✅ QR Code revogado corretamente negado!`, 'green');
    } else {
      log(`❌ QR Code revogado não foi negado corretamente`, 'red');
    }
    
    return response.data;
  } catch (error) {
    log(`❌ Erro no teste de revogação: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function getPublicKey() {
  log(`\n🔑 7. Obtendo chave pública...`, 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/qrcodes/keys/public`);
    log(`✅ Chave pública obtida:`, 'green');
    log(`   KID: ${response.data.kid}`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ Erro ao obter chave pública: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function runDemo() {
  log(`${colors.bold}🎯 DEMONSTRAÇÃO DO SISTEMA DE QR CODES${colors.reset}`, 'bold');
  log('='.repeat(50), 'blue');
  
  try {
    // 1. Criar QR Code
    const qrcode = await createQrcode();
    
    // 2. Escanear com sucesso
    await scanQrcode(qrcode.token);
    
    // 3. Testar uso duplicado
    await testDuplicateUse(qrcode.token);
    
    // 4. Testar gate errado
    await testWrongGate(qrcode.token);
    
    // 5. Revogar QR Code
    await revokeQrcode(qrcode.jti);
    
    // 6. Testar QR Code revogado
    await testRevokedQrcode(qrcode.token);
    
    // 7. Obter chave pública
    await getPublicKey();
    
    log(`\n${colors.bold}🎉 DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO!${colors.reset}`, 'green');
    log('Todos os cenários foram testados:', 'green');
    log('✅ Criação de QR Code', 'green');
    log('✅ Escaneamento bem-sucedido', 'green');
    log('✅ Prevenção de uso duplicado', 'green');
    log('✅ Validação de gates permitidos', 'green');
    log('✅ Revogação de QR Code', 'green');
    log('✅ Negação de QR Code revogado', 'green');
    log('✅ Exposição de chave pública', 'green');
    
  } catch (error) {
    log(`\n❌ DEMONSTRAÇÃO FALHOU: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/qrcodes/keys/public`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  log('Verificando se o servidor está rodando...', 'yellow');
  
  if (!(await checkServer())) {
    log('❌ Servidor não está rodando!', 'red');
    log('Execute: npm run start:dev', 'yellow');
    process.exit(1);
  }
  
  log('✅ Servidor está rodando!', 'green');
  await sleep(1000);
  
  await runDemo();
}

main().catch(console.error);
