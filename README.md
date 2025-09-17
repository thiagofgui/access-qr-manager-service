# Sistema de Microsserviços para Gerenciamento de QR Codes

## 🎯 Visão Geral

Este projeto implementa um sistema de microsserviços para gerenciamento de QR codes de acesso, demonstrando conceitos de **desacoplamento**, **autonomia de deploy** e **resiliência** através de dois serviços:

- **qr-manager**: API central para criação, validação e revogação de passes JWT
- **turnstile**: Simulador de catraca que verifica QR codes localmente e consulta o qr-manager

## 🏗️ Arquitetura

```
[Recepção/App] --(POST /qrcodes)--> [qr-manager]
                                   |            \
                                   |             \ (publica chave pública)
                                   |              -> [/keys/public]
                                   v
                          (JWT assinado ← RS256)

Visitante → [turnstile] --(token JWT)--> verifica local (assinatura/exp/claims)
                     \--(POST /qrcodes/consume)--> [qr-manager]  -> OK/DENY
                     \--(eventos locais)--> buffer (se precisar)  -> flush depois
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

### Políticas de Degradação
- **Fail-open controlado**: Permite entrada quando qr-manager offline (para maxUses=1)
- **Fail-closed**: Nega entrada quando há risco de fraude
- **Bufferização**: Eventos são armazenados localmente para compensação posterior

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
  "gateId": "GATE-A",
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

#### GET `/keys/public`
Retorna a chave pública para verificação de JWT.

### Turnstile (`/turnstile`)

#### POST `/scan`
Escaneia um QR code e decide se permite entrada.

**Request:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...",
  "gateId": "GATE-A"
}
```

**Response:**
```json
{
  "decision": "ALLOWED",
  "at": "2025-09-16T19:02:33Z"
}
```

#### POST `/flush`
Envia eventos bufferizados para compensação.

## 🧪 Cenários de Teste

### 1. Fluxo Normal
1. Criar passe → QR Manager retorna JWT
2. Escanear QR → Turnstile verifica localmente e consulta QR Manager
3. Entrada permitida

### 2. QR Manager Indisponível
1. Turnstile verifica JWT localmente (válido)
2. Falha ao consultar QR Manager
3. Aplica política de degradação (fail-open controlado)
4. Bufferiza evento para compensação posterior

### 3. Token Expirado
1. Turnstile detecta expiração localmente
2. Nega entrada sem consultar QR Manager
3. Falha rápida e barata

### 4. Uso Duplicado
1. Primeiro uso: sucesso
2. Segundo uso: negado (ALREADY_USED)
3. Prevenção de fraude

### 5. Gate Não Permitido
1. Turnstile verifica gates no JWT
2. Nega entrada localmente
3. Não consulta QR Manager

## 🔧 Configuração

### Variáveis de Ambiente
- `PORT`: Porta do servidor (padrão: 3000)
- `QR_MANAGER_URL`: URL do QR Manager (padrão: http://localhost:3000)

### Banco de Dados
- SQLite para desenvolvimento
- Tabelas criadas automaticamente
- Para produção, configure PostgreSQL/MySQL

## 📊 Métricas e Logs

### QR Manager
- Contagem de revogações
- Taxa de erros 409/410
- Tempo de resposta

### Turnstile
- Decisões ALLOWED/DENIED por motivo
- Tamanho do buffer
- Tentativas de flush

## 🎓 Conceitos Demonstrados

### Desacoplamento
- Serviços independentes com responsabilidades claras
- Comunicação via HTTP/REST
- Estado local vs. estado global

### Autonomia de Deploy
- Cada serviço pode ser deployado independentemente
- Versionamento de APIs
- Rollback independente

### Resiliência
- Verificação local de JWT
- Políticas de degradação
- Compensação eventual

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
│   ├── interfaces/          # Interfaces TypeScript
│   ├── schemas/             # Entidades do banco
│   └── services/            # Serviços compartilhados
├── modules/
│   ├── manager-qrcode/      # Serviço QR Manager
│   └── turnstile/           # Serviço Turnstile
└── scripts/
    ├── demo.js              # Demonstração básica
    └── test-degradation.js  # Testes de degradação
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