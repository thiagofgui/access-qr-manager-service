# 🧪 Guia de Testes - Sistema QR Manager

## 📋 Visão Geral

Este documento contém todos os comandos e cenários de teste para o sistema de QR Manager, incluindo comandos cURL para Insomnia e scripts automatizados.

## 🚀 Como Executar os Testes

### 1. Preparação do Ambiente

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Gerar chaves RSA
npm run generate-keys

# 3. Iniciar MongoDB (necessário)
# Instale MongoDB e execute: mongod

# 4. Iniciar o servidor
npm run start:dev
```

### 2. Testes Automatizados

```bash
# Executar todos os cenários de teste
npm run test:all

# Demonstração básica
npm run demo

# Testes de degradação
npm run demo:degradation
```

## 📁 Arquivos de Teste

- `insomnia-tests.md` - Comandos cURL detalhados
- `insomnia-collection.json` - Coleção para importar no Insomnia
- `scripts/test-all-scenarios.js` - Script de teste automatizado
- `scripts/demo.js` - Demonstração básica
- `scripts/test-degradation.js` - Testes de degradação

## 🔧 Configuração do Insomnia

### Importar Coleção

1. Abra o Insomnia
2. Clique em "Import" → "From File"
3. Selecione `insomnia-collection.json`
4. Configure o Environment:
   - `base_url`: `http://localhost:3000`
   - `token`: (será preenchido automaticamente)
   - `jti`: (será preenchido automaticamente)

### Environment Variables

```json
{
  "base_url": "http://localhost:3000",
  "token": "",
  "jti": "",
  "expired_token": "",
  "revoked_token": "",
  "multiple_token": ""
}
```

## 🧪 Cenários de Teste

### 1. **Fluxo Normal**
- ✅ Criar QR Code
- ✅ Escanear com sucesso
- ✅ Verificar chave pública

### 2. **Prevenção de Fraude**
- ✅ Uso duplicado
- ✅ Gate não permitido
- ✅ Token expirado
- ✅ Token revogado

### 3. **Controle de Usos**
- ✅ Múltiplos usos permitidos
- ✅ Limite de usos respeitado
- ✅ Contagem de usos restantes

### 4. **Validação de Dados**
- ✅ Campos obrigatórios
- ✅ Formato de datas
- ✅ Valores numéricos
- ✅ Janela de tempo válida

### 5. **Resiliência**
- ✅ Verificação local de JWT
- ✅ Políticas de degradação
- ✅ Bufferização de eventos
- ✅ Compensação eventual

## 📊 Comandos cURL Principais

### Obter Chave Pública
```bash
curl -X GET http://localhost:3000/qrcodes/keys/public
```

### Criar QR Code
```bash
curl -X POST http://localhost:3000/qrcodes \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": "VIS-001",
    "visitName": "João Silva",
    "allowedBuildings": "GATE-A,GATE-B",
    "windowStart": "2025-09-16T21:00:00Z",
    "windowEnd": "2025-09-16T23:00:00Z",
    "maxUses": 1
  }'
```

### Escanear QR Code
```bash
curl -X POST http://localhost:3000/turnstile/scan \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_AQUI",
    "gateId": "GATE-A"
  }'
```

### Revogar QR Code
```bash
curl -X DELETE http://localhost:3000/qrcodes/JTI_AQUI
```

### Consumir QR Code (Direto)
```bash
curl -X POST http://localhost:3000/qrcodes/consume \
  -H "Content-Type: application/json" \
  -d '{
    "jti": "JTI_AQUI",
    "gateId": "GATE-A",
    "at": "2025-09-16T21:30:00Z"
  }'
```

### Flush Eventos
```bash
curl -X POST http://localhost:3000/turnstile/flush
```

## 🎯 Sequência de Teste Recomendada

### Para Insomnia:
1. **Obter chave pública** - Verificar se o serviço está funcionando
2. **Criar QR Code** - Gerar token válido
3. **Escanear com sucesso** - Testar fluxo normal
4. **Testar uso duplicado** - Verificar prevenção de fraude
5. **Testar gate errado** - Verificar validação de escopo
6. **Criar e testar token expirado** - Verificar validação de tempo
7. **Revogar e testar** - Verificar controle de estado
8. **Testar múltiplos usos** - Verificar limite de usos
9. **Testar flush** - Verificar compensação
10. **Testar validações** - Verificar DTOs

### Para Scripts Automatizados:
```bash
# Executar todos os testes
npm run test:all

# Ver apenas demonstração
npm run demo

# Testar cenários de degradação
npm run demo:degradation
```

## 🔍 Verificações Importantes

### JWT
- ✅ Assinatura válida (RS256)
- ✅ Claims corretos (sub, name, gates, max, jti, nbf, exp)
- ✅ Verificação de chave pública
- ✅ Validação de expiração

### Banco de Dados
- ✅ Conexão com MongoDB
- ✅ Criação de documentos
- ✅ Atualização de contadores
- ✅ Consultas por JTI

### APIs
- ✅ Endpoints respondendo
- ✅ Códigos de status corretos
- ✅ Validação de DTOs
- ✅ Tratamento de erros

### Resiliência
- ✅ Verificação local de JWT
- ✅ Políticas de degradação
- ✅ Bufferização de eventos
- ✅ Compensação eventual

## 🐛 Troubleshooting

### Servidor não inicia
- Verifique se o MongoDB está rodando
- Verifique se as chaves JWT estão configuradas
- Verifique se a porta 3000 está livre

### Testes falham
- Verifique se o servidor está rodando
- Verifique se o MongoDB está acessível
- Verifique os logs do servidor

### JWT inválido
- Verifique se as chaves foram geradas corretamente
- Verifique se o arquivo .env está configurado
- Verifique se as chaves são válidas

## 📈 Métricas de Sucesso

- **Taxa de Sucesso**: 100% dos testes devem passar
- **Tempo de Resposta**: < 500ms para operações normais
- **Disponibilidade**: Servidor deve estar sempre acessível
- **Consistência**: Dados devem ser consistentes entre serviços

## 🎉 Conclusão

O sistema está configurado para demonstrar todos os conceitos de microsserviços:
- **Desacoplamento**: Serviços independentes
- **Autonomia**: Deploy independente
- **Resiliência**: Funcionamento offline
- **Segurança**: JWT com chaves RSA
- **Escalabilidade**: MongoDB para persistência
