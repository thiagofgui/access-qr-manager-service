# 🧪 Testes do Sistema QR Manager - Comandos cURL para Insomnia

## 📋 Configuração Base
- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`

---

## 🔑 1. Obter Chave Pública

### GET /qrcodes/keys/public
```bash
GET http://localhost:3000/qrcodes/keys/public
```

**Resposta esperada:**
```json
{
  "kid": "9dc5fea857394ca5",
  "key": "-----BEGIN PUBLIC KEY-----\n..."
}
```

---

## 📱 2. Criar QR Code (Cenário Normal)

### POST /qrcodes
```bash
POST http://localhost:3000/qrcodes
Content-Type: application/json

{
  "visitId": "VIS-001",
  "visitName": "João Silva",
  "allowedBuilding": "GATE-A",
  "windowStart": "2025-09-16T21:00:00Z",
  "windowEnd": "2025-09-16T23:00:00Z",
  "maxUses": 1
}
```

**Resposta esperada:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...",
  "jti": "uuid-gerado",
  "expiresAt": "2025-09-16T23:00:00Z"
}
```

---

## 🚪 3. Escanear QR Code (Sucesso)

### POST /turnstile/scan
```bash
POST http://localhost:3000/turnstile/scan
Content-Type: application/json

{
  "token": "TOKEN_DO_PASSO_ANTERIOR",
  "gate": "GATE-A"
}
```

**Resposta esperada:**
```json
{
  "decision": "ALLOWED",
  "at": "2025-09-16T21:30:00Z"
}
```

---

## 🔄 4. Testar Uso Duplicado

### POST /turnstile/scan (Mesmo token)
```bash
POST http://localhost:3000/turnstile/scan
Content-Type: application/json

{
  "token": "MESMO_TOKEN_DO_PASSO_ANTERIOR",
  "gate": "GATE-A"
}
```

**Resposta esperada:**
```json
{
  "decision": "DENIED",
  "reason": "ALREADY_USED",
  "at": "2025-09-16T21:31:00Z"
}
```

---

## 🚫 5. Testar Gate Não Permitido

### POST /turnstile/scan (Gate errado)
```bash
POST http://localhost:3000/turnstile/scan
Content-Type: application/json

{
  "token": "TOKEN_VALIDO",
  "gate": "GATE-C"
}
```

**Resposta esperada:**
```json
{
  "decision": "DENIED",
  "reason": "GATE_NOT_ALLOWED",
  "at": "2025-09-16T21:32:00Z"
}
```

---

## ⏰ 6. Testar Token Expirado

### POST /qrcodes (Token que já expirou)
```bash
POST http://localhost:3000/qrcodes
Content-Type: application/json

{
  "visitId": "VIS-EXPIRED",
  "visitName": "Maria Santos",
  "allowedBuilding": "GATE-A",
  "windowStart": "2025-09-16T19:00:00Z",
  "windowEnd": "2025-09-16T20:00:00Z",
  "maxUses": 1
}
```

### POST /turnstile/scan (Usar token expirado)
```bash
POST http://localhost:3000/turnstile/scan
Content-Type: application/json

{
  "token": "TOKEN_EXPIRADO",
  "gate": "GATE-A"
}
```

**Resposta esperada:**
```json
{
  "decision": "DENIED",
  "reason": "EXPIRED",
  "at": "2025-09-16T21:33:00Z"
}
```

---

## 🗑️ 7. Revogar QR Code

### DELETE /qrcodes/{jti}
```bash
DELETE http://localhost:3000/qrcodes/uuid-do-token
```

**Resposta esperada:**
```json
{
  "ok": true
}
```

### POST /turnstile/scan (Usar token revogado)
```bash
POST http://localhost:3000/turnstile/scan
Content-Type: application/json

{
  "token": "TOKEN_REVOGADO",
  "gate": "GATE-A"
}
```

**Resposta esperada:**
```json
{
  "decision": "DENIED",
  "reason": "REVOKED",
  "at": "2025-09-16T21:34:00Z"
}
```

---

## 🔄 8. Testar Múltiplos Usos

### POST /qrcodes (Max uses = 3)
```bash
POST http://localhost:3000/qrcodes
Content-Type: application/json

{
  "visitId": "VIS-MULTIPLE",
  "visitName": "Pedro Costa",
  "allowedBuilding": "GATE-A",
  "windowStart": "2025-09-16T21:00:00Z",
  "windowEnd": "2025-09-16T23:00:00Z",
  "maxUses": 3
}
```

### POST /turnstile/scan (1º uso)
```bash
POST http://localhost:3000/turnstile/scan
Content-Type: application/json

{
  "token": "TOKEN_MULTIPLE_USES",
  "gate": "GATE-A"
}
```

### POST /turnstile/scan (2º uso)
```bash
POST http://localhost:3000/turnstile/scan
Content-Type: application/json

{
  "token": "MESMO_TOKEN",
  "gate": "GATE-A"
}
```

### POST /turnstile/scan (3º uso)
```bash
POST http://localhost:3000/turnstile/scan
Content-Type: application/json

{
  "token": "MESMO_TOKEN",
  "gate": "GATE-A"
}
```

### POST /turnstile/scan (4º uso - deve falhar)
```bash
POST http://localhost:3000/turnstile/scan
Content-Type: application/json

{
  "token": "MESMO_TOKEN",
  "gate": "GATE-A"
}
```

**Resposta esperada:**
```json
{
  "decision": "DENIED",
  "reason": "ALREADY_USED",
  "at": "2025-09-16T21:35:00Z"
}
```

---

## 🔄 9. Testar Flush de Eventos Bufferizados

### POST /turnstile/flush
```bash
POST http://localhost:3000/turnstile/flush
Content-Type: application/json
```

**Resposta esperada:**
```json
{
  "processed": 0,
  "results": []
}
```

---

## 🧪 10. Teste de Validação de Dados

### POST /qrcodes (Dados inválidos)
```bash
POST http://localhost:3000/qrcodes
Content-Type: application/json

{
  "visitId": "",
  "visitName": "Teste",
  "allowedBuilding": "",
  "windowStart": "2025-09-16T23:00:00Z",
  "windowEnd": "2025-09-16T21:00:00Z",
  "maxUses": 0
}
```

**Resposta esperada:**
```json
{
  "statusCode": 400,
  "message": [
    "visitId should not be empty",
    "allowedBuildings should not be empty",
    "windowEnd must be after windowStart"
  ],
  "error": "Bad Request"
}
```

---

## 📊 11. Teste de Consumo Direto (QR Manager)

### POST /qrcodes/consume
```bash
POST http://localhost:3000/qrcodes/consume
Content-Type: application/json

{
  "jti": "uuid-do-token",
  "gate": "GATE-A",
  "at": "2025-09-16T21:30:00Z"
}
```

**Resposta esperada:**
```json
{
  "ok": true,
  "remaining": 0
}
```

---

## 🎯 Sequência de Teste Recomendada

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
11. **Testar consumo direto** - Verificar API do QR Manager

---

## 🔧 Configuração do Insomnia

1. **Criar Workspace**: "QR Manager Tests"
2. **Criar Environment**: 
   - `base_url`: `http://localhost:3000`
3. **Criar Request Groups**:
   - QR Manager
   - Turnstile
   - Testes de Validação
4. **Configurar Headers padrão**:
   - `Content-Type`: `application/json`

---

## 📝 Notas Importantes

- **MongoDB**: Certifique-se de que o MongoDB está rodando
- **Timestamps**: Ajuste os timestamps conforme necessário
- **Tokens**: Use os tokens retornados nas respostas para testes subsequentes
- **JTI**: Use o JTI retornado para operações de revogação e consumo
- **Gates**: Use apenas "GATE-A", "GATE-B" para testes válidos
