# 01 - Visão Geral e Arquitetura

## 🎯 Objetivo do Sistema

O **Bot Julia** é um assistente automatizado via WhatsApp que:
1. Recebe solicitações de orçamento de mudanças
2. Coleta informações através de conversa natural
3. Calcula preços usando Inteligência Artificial
4. Salva no banco de dados
5. Notifica empresas parceiras automaticamente

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                  │
│                    (WhatsApp App)                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Mensagem
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FACEBOOK/META                                 │
│              (WhatsApp Business API)                             │
│                                                                   │
│  • Recebe mensagens dos usuários                                 │
│  • Envia webhooks para servidor                                  │
│  • Entrega respostas aos usuários                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS POST /webhook
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                         VPS UBUNTU                               │
│                   (38.242.148.169)                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              NGINX (Servidor Web)                         │   │
│  │  • Recebe requisições HTTPS                               │   │
│  │  • SSL/TLS (Let's Encrypt)                                │   │
│  │  • Proxy reverso para Node.js                             │   │
│  │  • Domínio: mudancas.duckdns.org                          │   │
│  └─────────────────────┬────────────────────────────────────┘   │
│                        │                                          │
│                        │ HTTP localhost:3000                      │
│                        ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              PM2 (Process Manager)                        │   │
│  │  • Mantém aplicação rodando 24/7                          │   │
│  │  • Reinicia automaticamente em caso de erro               │   │
│  │  • Gerencia logs                                           │   │
│  └─────────────────────┬────────────────────────────────────┘   │
│                        │                                          │
│                        │                                          │
│                        ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           NODE.JS APPLICATION                             │   │
│  │                                                            │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │
│  │  │  server.js (Servidor Express)                    │     │   │
│  │  │  • Recebe webhooks do Facebook                   │     │   │
│  │  │  • Extrai mensagens dos usuários                 │     │   │
│  │  │  • Roteia para processamento                     │     │   │
│  │  └────────────────────┬─────────────────────────────┘     │   │
│  │                       │                                    │   │
│  │                       ↓                                    │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │
│  │  │  message-handler.js (Lógica do Bot)             │     │   │
│  │  │  • Gerencia fluxo conversacional                │     │   │
│  │  │  • Processa respostas do usuário                │     │   │
│  │  │  • Decide próxima pergunta                      │     │   │
│  │  │  • Valida dados (email, data, etc)              │     │   │
│  │  └────┬────────────────────────────────┬───────────┘     │   │
│  │       │                                 │                 │   │
│  │       │                                 │                 │   │
│  │       ↓                                 ↓                 │   │
│  │  ┌─────────────┐                 ┌──────────────┐       │   │
│  │  │ sessions.js │                 │ whatsapp.js  │       │   │
│  │  │             │                 │              │       │   │
│  │  │ Gerencia    │                 │ Envia msgs   │       │   │
│  │  │ estado das  │                 │ via API      │       │   │
│  │  │ conversas   │                 │ Facebook     │       │   │
│  │  └─────────────┘                 └──────────────┘       │   │
│  │                                                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │                    │
                             │                    │
                  ┌──────────┴──────────┐  ┌──────┴──────────┐
                  ↓                     ↓  ↓                  ↓
         ┌─────────────────┐   ┌─────────────────┐  ┌─────────────────┐
         │   OPENAI API    │   │   SUPABASE      │  │   FACEBOOK      │
         │                 │   │   (PostgreSQL)  │  │   WHATSAPP API  │
         │ • Calcula       │   │                 │  │                 │
         │   distância     │   │ • Salva dados   │  │ • Envia resp.   │
         │ • Estima preços │   │ • Notifica      │  │   ao cliente    │
         │ • Processa IA   │   │   empresas      │  │                 │
         └─────────────────┘   └─────────────────┘  └─────────────────┘
```

---

## 🔄 Fluxo de Dados Completo

### 1️⃣ Cliente Envia "Oi"

```
WhatsApp → Facebook → Webhook → Nginx → Node.js
```

**Payload recebido:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5511999999999",
          "text": { "body": "Oi" }
        }]
      }
    }]
  }]
}
```

### 2️⃣ Bot Processa e Responde

```javascript
// message-handler.js detecta ativação
if (ehMensagemAtivacao("Oi")) {
  criarSessao(userId);
  enviarMensagem(userId, "Olá! Sou a Julia...");
}
```

### 3️⃣ Coleta de Dados (Sequencial)

```
Pergunta 1: Origem → SP
Pergunta 2: Destino → RJ
Pergunta 3: Tipo imóvel → 2 quartos
Pergunta 4: Elevador? → Sim
Pergunta 5: Embalagem? → Sim
Pergunta 6: Nome → João
Pergunta 7: Email → joao@email.com
Pergunta 8: Data → 15/12/2025
Pergunta 9: Lista objetos? → Não
```

### 4️⃣ Processamento Final

```javascript
// 1. Chama OpenAI
const resultado = await calcularOrcamentoComIA({
  origem: "SP",
  destino: "RJ",
  tipo_imovel: "2_quartos",
  tem_elevador: true,
  precisa_embalagem: true
});

// Resultado:
// {
//   distanciaKm: 432,
//   precoMin: 6000,
//   precoMax: 8500,
//   cidadeOrigem: "São Paulo",
//   estadoOrigem: "SP",
//   cidadeDestino: "Rio de Janeiro",
//   estadoDestino: "RJ"
// }

// 2. Salva no Supabase
await salvarOrcamento(dados, resultado);
// - Insere na tabela orcamentos
// - Busca empresas ativas do estado RJ
// - Cria vínculos em orcamentos_campanhas
// - Notifica empresas

// 3. Envia resposta ao cliente
await enviarMensagem(userId, `
✅ ORÇAMENTO CALCULADO!
💰 R$ 6.000 - R$ 8.500
📏 432 km
...
`);

// 4. Limpa sessão
limparSessao(userId);
```

---

## 📦 Componentes do Sistema

### 1. **server.js** - Servidor Principal
- Framework: Express.js
- Porta: 3000 (local), 443 (HTTPS externo via Nginx)
- Rotas:
  - `GET /webhook` - Verificação do Facebook
  - `POST /webhook` - Recebimento de mensagens
  - `GET /` - Health check

### 2. **message-handler.js** - Cérebro do Bot
- Gerencia estado das conversas
- Implementa lógica de perguntas/respostas
- Valida dados do usuário
- Orquestra chamadas para APIs externas

### 3. **sessions.js** - Gerenciador de Estado
- Armazena conversas em memória (Map)
- Controla em qual etapa cada usuário está
- Define ordem das perguntas

### 4. **whatsapp.js** - Cliente WhatsApp API
- Envia mensagens de texto
- Envia botões interativos
- Envia listas de seleção
- Wrapper da API do Facebook

### 5. **openai-service.js** - Integração OpenAI
- Calcula distância entre cidades
- Estima faixa de preço realista
- Extrai/corrige nomes de cidades
- Retorna dados estruturados (JSON)

### 6. **supabase-service.js** - Integração Banco
- Salva orçamento completo
- Chama função SQL que notifica empresas
- Retorna ID do orçamento criado

---

## 🗄️ Estrutura de Dados

### Sessão (em memória)

```javascript
{
  userId: "5511999999999",
  etapaAtual: "email",
  dados: {
    whatsapp: "5511999999999",
    origem: "São Paulo",
    destino: "Rio de Janeiro",
    tipo_imovel: "2_quartos",
    tem_elevador: true,
    precisa_embalagem: true,
    nome: "João",
    email: "joao@email.com"
  },
  criado_em: "2025-11-25T10:00:00Z"
}
```

### Orçamento (Supabase)

```sql
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY,
  nome_cliente VARCHAR(255),
  email_cliente VARCHAR(255),
  telefone_cliente VARCHAR(50),
  whatsapp VARCHAR(50),
  origem_completo TEXT,
  destino_completo TEXT,
  estado_origem VARCHAR(2),
  cidade_origem VARCHAR(255),
  estado_destino VARCHAR(2),
  cidade_destino VARCHAR(255),
  tipo_imovel VARCHAR(50),
  tem_elevador BOOLEAN,
  andar INTEGER,
  precisa_embalagem BOOLEAN,
  distancia_km NUMERIC,
  preco_min NUMERIC,
  preco_max NUMERIC,
  mensagem_ia TEXT,
  lista_objetos TEXT,
  data_estimada DATE,
  origem_formulario VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Segurança

### SSL/TLS
- Certificado: Let's Encrypt
- Renovação automática: Certbot
- Protocolo: TLS 1.2+
- Cipher suites: Modernos e seguros

### Autenticação
- Facebook valida webhook com `VERIFY_TOKEN`
- Tokens de acesso armazenados no `.env`
- Service role key do Supabase para operações privilegiadas

### Firewall
- UFW ativo
- Portas abertas: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Todas as outras portas bloqueadas

---

## 📊 Performance

### Tempos Médios
- Webhook recebido → Primeira resposta: **500ms - 2s**
- Cálculo OpenAI: **2-5 segundos**
- Salvamento Supabase: **200-500ms**
- Resposta total (todo fluxo): **10-15 segundos**

### Capacidade
- Conversas simultâneas: **Ilimitadas** (limitado por RAM)
- Mensagens/segundo: **~10-20** (limitado pela API do Facebook)
- Uptime: **99.9%** (com PM2 auto-restart)

---

## 🌐 Infraestrutura

### VPS
- **Provedor:** Contabo (ou similar)
- **OS:** Ubuntu 24.04 LTS
- **IP:** 38.242.148.169
- **Domínio:** mudancas.duckdns.org (DuckDNS)
- **Recursos:** 2GB RAM mínimo, 1 vCPU

### DNS
- **Provedor:** DuckDNS (gratuito)
- **Tipo:** A Record
- **TTL:** 60 segundos
- **Atualização:** Manual via painel

### Dependências
- Node.js 20.x LTS
- Nginx 1.24+
- Certbot (Let's Encrypt)
- PM2 (global)
- NPM packages: express, axios, openai, @supabase/supabase-js

---

## 📈 Escalabilidade

### Limitações Atuais
- Sessões em memória (perdidas ao reiniciar)
- Único servidor (single point of failure)
- Processamento síncrono

### Melhorias Futuras
- Redis para sessões persistentes
- Load balancer com múltiplos servidores
- Fila de mensagens (Bull/RabbitMQ)
- Cache de respostas da IA
- Métricas e monitoramento (Prometheus/Grafana)

---

**Próximo:** [02-INSTALACAO-SERVIDOR.md](02-INSTALACAO-SERVIDOR.md) - Instalação completa passo a passo
