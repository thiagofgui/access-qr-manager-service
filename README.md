# Access QR Manager Service

## 🎯 Visão Geral

Este projeto implementa um serviço de gerenciamento de QR codes de acesso, fornecendo uma API REST para criação, validação e revogação de passes JWT com segurança robusta.

- **qr-manager**: API central para criação, validação e revogação de passes JWT

## 🏗️ Arquitetura

```
[Recepção/App] --(POST /qrcodes)--> [qr-manager]
                                   |
                                   v
                          (JWT assinado ← RS256)

[Sistema Externo] --(POST /qrcodes/consume)--> [qr-manager] -> OK/DENY
                 \--(DELETE /qrcodes/:jti)--> [qr-manager] -> REVOKED
```

## 🔑 Características Principais

### JWT Auto-contido
- Dados imutáveis: janela de tempo, gates permitidos, JTI, expiração
- Assinatura RSA256 para verificação offline
- Chave pública exposta para verificação independente

### Estado Dinâmico
- Revogação de passes
- Controle de limite de usos
- Contagem global de utilizações

### Segurança
- **JWT Auto-assinado**: Tokens RSA256 para máxima segurança
- **Validação rigorosa**: Controle de tempo, uso e revogação
- **Chave privada protegida**: Sem exposição de chaves públicas

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar o Serviço
```bash
npm run start:dev
```

### 3. Executar Demonstrações
```bash
# Demonstração básica
npm run demo

# Testes de degradação e resiliência
npm run demo:degradation
```

## 📋 Endpoints

### QR Manager (`/qrcodes`)

#### POST `/qrcodes`
Cria um novo passe QR code.

**Request:**
```json
{
  "visitName": "VIS-123",
    "allowedBuilding": "GATE-A",
  "windowStart": "2025-09-16T18:00:00Z",
  "windowEnd": "2025-09-16T22:00:00Z",
  "maxUses": 1
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...",
  "jti": "PSS-7fdc2b",
  "expiresAt": "2025-09-16T22:00:00Z"
}
```

#### POST `/qrcodes/consume`
Registra o uso de um passe (operação atômica).

**Request:**
```json
{
  "jti": "PSS-7fdc2b",
  "gate": "GATE-A",
  "at": "2025-09-16T19:02:33Z"
}
```

**Response:**
```json
{
  "ok": true,
  "remaining": 0
}
```

#### DELETE `/qrcodes/:jti`
Revoga um passe.



## 🧪 Cenários de Teste

### 1. Fluxo Normal
1. Criar passe → QR Manager retorna JWT
2. Escanear QR → Turnstile verifica localmente e consulta QR Manager
3. Entrada permitida

### 2. Token Expirado
1. QR Manager detecta expiração
2. Nega entrada (BAD_REQUEST)
3. Falha rápida

### 3. Uso Duplicado
1. Primeiro uso: sucesso
2. Segundo uso: negado (CONFLICT)
3. Prevenção de fraude

### 4. Gate Não Permitido
1. QR Manager verifica gate no token
2. Nega entrada (BAD_REQUEST)
3. Validação de escopo

## 🔧 Configuração

### Variáveis de Ambiente
- `PORT`: Porta do servidor (padrão: 3000)
- `JWT_PRIVATE_KEY_PEM`: Chave privada RSA para assinatura
- `JWT_PUBLIC_KEY_PEM`: Chave pública RSA para verificação
- `JWT_KEY_ID`: Identificador da chave
- `JWT_ISSUER`: Emissor dos tokens
- `MONGODB_URI`: URI de conexão com MongoDB

### Banco de Dados
- SQLite para desenvolvimento
- Tabelas criadas automaticamente
- Para produção, configure PostgreSQL/MySQL

## 📊 Métricas e Logs

### QR Manager
- Contagem de criações/revogações
- Taxa de erros 409/410/404
- Tempo de resposta
- Validações de segurança

## 🎓 Conceitos Demonstrados

### Segurança
- JWT assinado com RSA256
- Validação rigorosa de claims
- Controle de tempo e escopo
- Prevenção de replay attacks

### Escalabilidade
- API REST stateless
- Banco de dados MongoDB
- Validação eficiente

### Manutenibilidade
- Código TypeScript tipado
- Padrões NestJS
- Validação com class-validator

### Segurança
- JWT assinado com RSA256
- Verificação offline de assinatura
- Anti-replay local
- Controle de escopo (gates)

## 🔍 Estrutura do Projeto

```
src/
├── common/
│   ├── dto/                 # DTOs de validação
│   ├── schemas/             # Entidades do banco
│   └── services/            # Serviços compartilhados
├── config/                  # Configurações
├── modules/
│   └── manager-qrcode/      # Serviço QR Manager
└── main.ts                  # Ponto de entrada
```

## 🚀 Próximos Passos

1. **Containerização**: Docker para cada serviço
2. **Orquestração**: Kubernetes para deploy
3. **Monitoramento**: Prometheus + Grafana
4. **Logs**: ELK Stack
5. **Mensageria**: Redis/RabbitMQ para eventos
6. **Testes**: Testes de integração e E2E

## 📚 Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [Microservices Patterns](https://microservices.io/)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)