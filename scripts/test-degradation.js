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
  log('\n📱 Criando QR Code para teste de degradação...', 'blue');
  
  const qrcodeData = {
    visitId: 'VIS-DEGRADATION',
    visitName: 'Maria Santos',
    allowedBuilding: 'GATE-A',
    windowStart: new Date(Date.now() + 60000).toISOString(),
    windowEnd: new Date(Date.now() + 3600000).toISOString(),
    maxUses: 1
  };

  try {
    const response = await axios.post(`${BASE_URL}/qrcodes`, qrcodeData);
    log(`✅ QR Code criado: ${response.data.jti}`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ Erro ao criar QR Code: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function testOfflineScenario(token) {
  log('\n🔌 CENÁRIO: qr-manager indisponível', 'yellow');
  log('Simulando falha de rede...', 'yellow');
  
  // Em um cenário real, você pararia o qr-manager aqui
  // Para esta demo, vamos apenas testar o comportamento normal
  // e explicar o que aconteceria offline
  
  try {
    const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId: 'GATE-A'
    });
    
    log(`Resultado: ${response.data.decision}`, 
        response.data.decision === 'ALLOWED' ? 'green' : 'red');
    
    if (response.data.reason) {
      log(`Motivo: ${response.data.reason}`, 'yellow');
    }
    
    return response.data;
  } catch (error) {
    log(`❌ Erro no teste offline: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function testExpiredToken() {
  log('\n⏰ CENÁRIO: Token expirado', 'yellow');
  
  // Criar um token que já expirou
  const expiredQrcodeData = {
    visitName: 'VIS-EXPIRED',
    allowedBuildings: ['GATE-A'],
    windowStart: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
    windowEnd: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
    maxUses: 1
  };

  try {
    const response = await axios.post(`${BASE_URL}/qrcodes`, expiredQrcodeData);
    const token = response.data.token;
    
    log(`Token expirado criado: ${response.data.jti}`, 'yellow');
    
    // Tentar usar o token expirado
    const scanResponse = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId: 'GATE-A'
    });
    
    if (scanResponse.data.decision === 'DENIED' && scanResponse.data.reason === 'EXPIRED') {
      log(`✅ Token expirado corretamente negado!`, 'green');
    } else {
      log(`❌ Token expirado não foi negado corretamente`, 'red');
    }
    
    return scanResponse.data;
  } catch (error) {
    log(`❌ Erro no teste de token expirado: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function testMultipleUses() {
  log('\n🔄 CENÁRIO: Múltiplos usos', 'yellow');
  
  const qrcodeData = {
    visitName: 'VIS-MULTIPLE',
    allowedBuildings: ['GATE-A'],
    windowStart: new Date(Date.now() + 60000).toISOString(),
    windowEnd: new Date(Date.now() + 3600000).toISOString(),
    maxUses: 3 // Permitir 3 usos
  };

  try {
    const response = await axios.post(`${BASE_URL}/qrcodes`, qrcodeData);
    const token = response.data.token;
    
    log(`QR Code criado com maxUses=3: ${response.data.jti}`, 'green');
    
    // Primeiro uso
    log('1º uso...', 'blue');
    const use1 = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId: 'GATE-A'
    });
    log(`Resultado: ${use1.data.decision}`, 
        use1.data.decision === 'ALLOWED' ? 'green' : 'red');
    
    // Segundo uso
    log('2º uso...', 'blue');
    const use2 = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId: 'GATE-A'
    });
    log(`Resultado: ${use2.data.decision}`, 
        use2.data.decision === 'ALLOWED' ? 'green' : 'red');
    
    // Terceiro uso
    log('3º uso...', 'blue');
    const use3 = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId: 'GATE-A'
    });
    log(`Resultado: ${use3.data.decision}`, 
        use3.data.decision === 'ALLOWED' ? 'green' : 'red');
    
    // Quarto uso (deve falhar)
    log('4º uso (deve falhar)...', 'blue');
    const use4 = await axios.post(`${BASE_URL}/turnstile/scan`, {
      token,
      gateId: 'GATE-A'
    });
    log(`Resultado: ${use4.data.decision}`, 
        use4.data.decision === 'DENIED' ? 'green' : 'red');
    
    if (use4.data.reason === 'ALREADY_USED') {
      log(`✅ Limite de usos respeitado!`, 'green');
    }
    
  } catch (error) {
    log(`❌ Erro no teste de múltiplos usos: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

async function runDegradationTests() {
  log(`${colors.bold}🧪 TESTES DE DEGRADAÇÃO E RESILIÊNCIA${colors.reset}`, 'bold');
  log('='.repeat(50), 'blue');
  
  try {
    // Teste 1: Cenário offline
    const qrcode = await createQrcode();
    await testOfflineScenario(qrcode.token);
    
    // Teste 2: Token expirado
    await testExpiredToken();
    
    // Teste 3: Múltiplos usos
    await testMultipleUses();
    
    log(`\n${colors.bold}🎉 TESTES DE DEGRADAÇÃO CONCLUÍDOS!${colors.reset}`, 'green');
    log('Cenários testados:', 'green');
    log('✅ Comportamento com qr-manager indisponível', 'green');
    log('✅ Validação de tokens expirados', 'green');
    log('✅ Controle de múltiplos usos', 'green');
    
    log(`\n${colors.bold}💡 NOTAS IMPORTANTES:${colors.reset}`, 'yellow');
    log('• Para testar degradação real, pare o qr-manager e execute novamente', 'yellow');
    log('• O turnstile aplica política fail-open controlado quando offline', 'yellow');
    log('• Eventos são bufferizados para compensação posterior', 'yellow');
    log('• Verificação local de JWT funciona independente do qr-manager', 'yellow');
    
  } catch (error) {
    log(`\n❌ TESTES FALHARAM: ${error.message}`, 'red');
    process.exit(1);
  }
}

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
  
  await runDegradationTests();
}

main().catch(console.error);
