# Guia de Testes - Access QR Manager Service

## 📋 Visão Geral

Este projeto possui uma suíte completa de testes que cobrem:
- **Testes Unitários**: Validam componentes individuais
- **Testes de Integração**: Validam fluxos completos
- **Testes E2E**: Validam a API como um todo

## 🧪 Tipos de Teste

### Testes Unitários
Localização: `src/**/*.spec.ts`

- **ManagerQrcodeService**: Lógica de negócio do serviço
- **ManagerQrcodeController**: Endpoints da API
- **JwtService**: Geração e validação de tokens JWT

### Testes E2E
Localização: `test/**/*.e2e-spec.ts`

- **app.e2e-spec.ts**: Testes básicos dos endpoints
- **qr-flow.e2e-spec.ts**: Testes de fluxo completo

## 🚀 Executando os Testes

### Todos os Testes
```bash
npm run test:all
```

### Apenas Testes Unitários
```bash
npm run test:unit
```

### Apenas Testes E2E
```bash
npm run test:e2e
```

### Testes com Cobertura
```bash
npm run test:cov
```

### Testes em Modo Watch
```bash
npm run test:watch
```

## 📊 Cenários Testados

### Criação de QR Code
- ✅ Criação bem-sucedida
- ✅ Validação de janela de tempo
- ✅ Validação de campos obrigatórios
- ✅ Geração de JWT válido

### Consumo de QR Code
- ✅ Consumo bem-sucedido
- ✅ Validação de gate permitido
- ✅ Controle de limite de usos
- ✅ Validação de janela de tempo
- ✅ Verificação de status (revogado/expirado)

### Revogação de QR Code
- ✅ Revogação bem-sucedida
- ✅ Prevenção de uso após revogação
- ✅ Tratamento de passes inexistentes

### Fluxos Integrados
- ✅ Ciclo completo: criar → consumir → revogar
- ✅ Múltiplos QR codes independentes
- ✅ Validação de janelas de tempo
- ✅ Controle de limites de uso

## 🔧 Configuração de Teste

### Banco de Dados
Os testes E2E utilizam `mongodb-memory-server` para criar uma instância MongoDB em memória, garantindo:
- Isolamento entre testes
- Velocidade de execução
- Não interferência com dados reais

### Variáveis de Ambiente
Arquivo `.env.test` contém configurações específicas para testes:
- Chaves JWT de teste
- Configurações de banco
- Timeouts apropriados

### Mocks e Stubs
- JWT Service mockado nos testes unitários
- MongoDB em memória para testes E2E
- Console mockado para reduzir ruído

## 📈 Cobertura de Código

O projeto visa manter alta cobertura de código:
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

### Visualizar Cobertura
```bash
npm run test:cov
open coverage/lcov-report/index.html
```

## 🐛 Debugging de Testes

### Executar Teste Específico
```bash
npm test -- --testNamePattern="should create a QR code successfully"
```

### Debug Mode
```bash
npm run test:debug
```

### Logs Detalhados
```bash
npm test -- --verbose
```

## 📝 Boas Práticas

### Estrutura de Teste
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Nomenclatura
- Descreva o comportamento esperado
- Use "should" para indicar expectativa
- Seja específico sobre condições

### Isolamento
- Cada teste deve ser independente
- Use mocks para dependências externas
- Limpe estado entre testes

## 🔍 Troubleshooting

### Problemas Comuns

#### Timeout em Testes E2E
```bash
# Aumentar timeout no jest.config.js
testTimeout: 60000
```

#### MongoDB Connection Issues
```bash
# Verificar se mongodb-memory-server está instalado
npm install --save-dev mongodb-memory-server
```

#### JWT Key Issues
```bash
# Verificar se as chaves de teste estão corretas no .env.test
```

### Logs de Debug
Para habilitar logs detalhados durante os testes:
```bash
DEBUG=* npm test
```

## 📚 Recursos Adicionais

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)