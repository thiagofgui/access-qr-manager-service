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

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

async function runTest(testName, testFn) {
  testResults.total++;
  try {
    log(`\n🧪 ${testName}...`, 'blue');
    await testFn();
    log(`✅ ${testName} - PASSOU`, 'green');
    testResults.passed++;
  } catch (error) {
    log(`❌ ${testName} - FALHOU: ${error.message}`, 'red');
    testResults.failed++;
  }
}

// Teste 1: Obter chave pública
async function testGetPublicKey() {
  const response = await axios.get(`${BASE_URL}/qrcodes/keys/public`);
  if (!response.data.kid || !response.data.key) {
    throw new Error('Chave pública não retornada corretamente');
  }
  log(`   KID: ${response.data.kid}`, 'green');
}

// Teste 2: Criar QR Code válido
async function testCreateValidQrcode() {
  const qrcodeData = {
    visitId: 'VIS-001',
    visitName: 'João Silva',
    allowedBuilding: 'GATE-A',
    windowStart: new Date(Date.now() + 60000).toISOString(),
    windowEnd: new Date(Date.now() + 3600000).toISOString(),
    maxUses: 1
  };

  const response = await axios.post(`${BASE_URL}/qrcodes`, qrcodeData);
  if (!response.data.token || !response.data.jti) {
    throw new Error('QR Code não criado corretamente');
  }
  
  // Salvar para testes subsequentes
  global.testToken = response.data.token;
  global.testJti = response.data.jti;
  
  log(`   JTI: ${response.data.jti}`, 'green');
  log(`   Token: ${response.data.token.substring(0, 50)}...`, 'green');
}

// Teste 3: Escanear QR Code com sucesso
async function testScanQrcodeSuccess() {
  const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
    token: global.testToken,
    gateId: 'GATE-A'
  });
  
  if (response.data.decision !== 'ALLOWED') {
    throw new Error(`Decisão esperada: ALLOWED, recebida: ${response.data.decision}`);
  }
  log(`   Decisão: ${response.data.decision}`, 'green');
}

// Teste 4: Testar uso duplicado
async function testDuplicateUse() {
  const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
    token: global.testToken,
    gateId: 'GATE-A'
  });
  
  if (response.data.decision !== 'DENIED' || response.data.reason !== 'ALREADY_USED') {
    throw new Error(`Esperado: DENIED/ALREADY_USED, recebido: ${response.data.decision}/${response.data.reason}`);
  }
  log(`   Decisão: ${response.data.decision} (${response.data.reason})`, 'green');
}

// Teste 5: Testar gate não permitido
async function testWrongGate() {
  const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
    token: global.testToken,
    gateId: 'GATE-C'
  });
  
  if (response.data.decision !== 'DENIED' || response.data.reason !== 'GATE_NOT_ALLOWED') {
    throw new Error(`Esperado: DENIED/GATE_NOT_ALLOWED, recebido: ${response.data.decision}/${response.data.reason}`);
  }
  log(`   Decisão: ${response.data.decision} (${response.data.reason})`, 'green');
}

// Teste 6: Criar e testar token expirado
async function testExpiredToken() {
  // Criar token expirado
  const expiredQrcodeData = {
    visitId: 'VIS-EXPIRED',
    visitName: 'Maria Santos',
    allowedBuilding: 'GATE-A',
    windowStart: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
    windowEnd: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
    maxUses: 1
  };

  const createResponse = await axios.post(`${BASE_URL}/qrcodes`, expiredQrcodeData);
  global.expiredToken = createResponse.data.token;

  // Tentar usar token expirado
  const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
    token: global.expiredToken,
    gateId: 'GATE-A'
  });
  
  if (response.data.decision !== 'DENIED' || response.data.reason !== 'EXPIRED') {
    throw new Error(`Esperado: DENIED/EXPIRED, recebido: ${response.data.decision}/${response.data.reason}`);
  }
  log(`   Decisão: ${response.data.decision} (${response.data.reason})`, 'green');
}

// Teste 7: Revogar QR Code
async function testRevokeQrcode() {
  const response = await axios.delete(`${BASE_URL}/qrcodes/${global.testJti}`);
  if (!response.data.ok) {
    throw new Error('QR Code não foi revogado corretamente');
  }
  log(`   Revogado: ${response.data.ok}`, 'green');
}

// Teste 8: Testar token revogado
async function testRevokedToken() {
  const response = await axios.post(`${BASE_URL}/turnstile/scan`, {
    token: global.testToken,
    gateId: 'GATE-A'
  });
  
  if (response.data.decision !== 'DENIED' || response.data.reason !== 'REVOKED') {
    throw new Error(`Esperado: DENIED/REVOKED, recebido: ${response.data.decision}/${response.data.reason}`);
  }
  log(`   Decisão: ${response.data.decision} (${response.data.reason})`, 'green');
}

// Teste 9: Testar múltiplos usos
async function testMultipleUses() {
  // Criar token com múltiplos usos
  const multipleQrcodeData = {
    visitId: 'VIS-MULTIPLE',
    visitName: 'Pedro Costa',
    allowedBuilding: 'GATE-A',
    windowStart: new Date(Date.now() + 60000).toISOString(),
    windowEnd: new Date(Date.now() + 3600000).toISOString(),
    maxUses: 3
  };

  const createResponse = await axios.post(`${BASE_URL}/qrcodes`, multipleQrcodeData);
  global.multipleToken = createResponse.data.token;

  // 1º uso
  let response = await axios.post(`${BASE_URL}/turnstile/scan`, {
    token: global.multipleToken,
    gateId: 'GATE-A'
  });
  if (response.data.decision !== 'ALLOWED') {
    throw new Error(`1º uso falhou: ${response.data.decision}`);
  }
  log(`   1º uso: ${response.data.decision}`, 'green');

  // 2º uso
  response = await axios.post(`${BASE_URL}/turnstile/scan`, {
    token: global.multipleToken,
    gateId: 'GATE-A'
  });
  if (response.data.decision !== 'ALLOWED') {
    throw new Error(`2º uso falhou: ${response.data.decision}`);
  }
  log(`   2º uso: ${response.data.decision}`, 'green');

  // 3º uso
  response = await axios.post(`${BASE_URL}/turnstile/scan`, {
    token: global.multipleToken,
    gateId: 'GATE-A'
  });
  if (response.data.decision !== 'ALLOWED') {
    throw new Error(`3º uso falhou: ${response.data.decision}`);
  }
  log(`   3º uso: ${response.data.decision}`, 'green');

  // 4º uso (deve falhar)
  response = await axios.post(`${BASE_URL}/turnstile/scan`, {
    token: global.multipleToken,
    gateId: 'GATE-A'
  });
  if (response.data.decision !== 'DENIED' || response.data.reason !== 'ALREADY_USED') {
    throw new Error(`4º uso deveria falhar: ${response.data.decision}/${response.data.reason}`);
  }
  log(`   4º uso: ${response.data.decision} (${response.data.reason}) - CORRETO`, 'green');
}

// Teste 10: Testar validação de dados
async function testDataValidation() {
  try {
    await axios.post(`${BASE_URL}/qrcodes`, {
      visitId: '',
      visitName: 'Teste',
      allowedBuilding: '',
      windowStart: '2025-09-16T23:00:00Z',
      windowEnd: '2025-09-16T21:00:00Z',
      maxUses: 0
    });
    throw new Error('Validação deveria ter falhado');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log(`   Validação funcionou: ${error.response.status}`, 'green');
    } else {
      throw error;
    }
  }
}

// Teste 11: Testar consumo direto
async function testDirectConsume() {
  // Criar novo token para teste
  const qrcodeData = {
    visitId: 'VIS-CONSUME',
    visitName: 'Ana Silva',
    allowedBuilding: 'GATE-A',
    windowStart: new Date(Date.now() + 60000).toISOString(),
    windowEnd: new Date(Date.now() + 3600000).toISOString(),
    maxUses: 1
  };

  const createResponse = await axios.post(`${BASE_URL}/qrcodes`, qrcodeData);
  const jti = createResponse.data.jti;

  const response = await axios.post(`${BASE_URL}/qrcodes/consume`, {
    jti: jti,
    gateId: 'GATE-A',
    at: new Date().toISOString()
  });

  if (!response.data.ok) {
    throw new Error('Consumo direto falhou');
  }
  log(`   Consumo: ${response.data.ok}, Restantes: ${response.data.remaining}`, 'green');
}

// Teste 12: Testar flush
async function testFlush() {
  const response = await axios.post(`${BASE_URL}/turnstile/flush`);
  if (typeof response.data.processed !== 'number') {
    throw new Error('Flush não retornou dados corretos');
  }
  log(`   Processados: ${response.data.processed}`, 'green');
}

async function runAllTests() {
  log(`${colors.bold}🧪 EXECUTANDO TODOS OS TESTES DO SISTEMA QR MANAGER${colors.reset}`, 'bold');
  log('='.repeat(60), 'blue');

  // Verificar se o servidor está rodando
  try {
    await axios.get(`${BASE_URL}/qrcodes/keys/public`);
    log('✅ Servidor está rodando!', 'green');
  } catch (error) {
    log('❌ Servidor não está rodando! Execute: npm run start:dev', 'red');
    process.exit(1);
  }

  // Executar todos os testes
  await runTest('1. Obter Chave Pública', testGetPublicKey);
  await runTest('2. Criar QR Code Válido', testCreateValidQrcode);
  await runTest('3. Escanear QR Code (Sucesso)', testScanQrcodeSuccess);
  await runTest('4. Testar Uso Duplicado', testDuplicateUse);
  await runTest('5. Testar Gate Não Permitido', testWrongGate);
  await runTest('6. Testar Token Expirado', testExpiredToken);
  await runTest('7. Revogar QR Code', testRevokeQrcode);
  await runTest('8. Testar Token Revogado', testRevokedToken);
  await runTest('9. Testar Múltiplos Usos', testMultipleUses);
  await runTest('10. Testar Validação de Dados', testDataValidation);
  await runTest('11. Testar Consumo Direto', testDirectConsume);
  await runTest('12. Testar Flush', testFlush);

  // Resultados finais
  log(`\n${colors.bold}📊 RESULTADOS FINAIS:${colors.reset}`, 'bold');
  log('='.repeat(60), 'blue');
  log(`✅ Testes Passou: ${testResults.passed}`, 'green');
  log(`❌ Testes Falharam: ${testResults.failed}`, 'red');
  log(`📈 Total de Testes: ${testResults.total}`, 'blue');
  log(`🎯 Taxa de Sucesso: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 
      testResults.failed === 0 ? 'green' : 'yellow');

  if (testResults.failed === 0) {
    log(`\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente!`, 'green');
  } else {
    log(`\n⚠️  ${testResults.failed} teste(s) falharam. Verifique os logs acima.`, 'yellow');
  }
}

runAllTests().catch(console.error);
