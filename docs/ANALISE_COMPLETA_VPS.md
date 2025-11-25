# 🔍 Análise Completa: Sistema VPS WhatsApp Bot

**Data:** 2025-01-23  
**Status:** ✅ Análise completa realizada

---

## 📋 Resumo Executivo

A VPS roda um **servidor Node.js/Express** que:
1. Recebe webhooks do Facebook WhatsApp API
2. Processa conversas com o bot Julia
3. Calcula orçamentos usando OpenAI
4. **Salva DIRETO no Supabase** (não chama API do Next.js!)

**Descoberta importante:** A VPS **NÃO usa** a rota `/api/orcamentos` do Next.js. Ela salva **diretamente no banco** via função SQL.

---

## 🏗️ Arquitetura Completa

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (WhatsApp)                        │
│                  Envia mensagem "oi"                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              FACEBOOK WHATSAPP BUSINESS API                  │
│              (Cloud API v21.0)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTPS POST
                       │ https://mudancas.duckdns.org/webhook
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    VPS UBUNTU                                │
│              (38.242.148.169)                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              NGINX (Porta 443)                       │  │
│  │  • SSL/TLS (Let's Encrypt)                           │  │
│  │  • Proxy reverso para Node.js                        │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│                         │ HTTP localhost:3000                │
│                         ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PM2 (Process Manager)                   │  │
│  │  • Mantém aplicação rodando 24/7                     │  │
│  │  • Auto-restart em caso de erro                      │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│                         ↓                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         NODE.JS APPLICATION                          │  │
│  │                                                       │  │
│  │  server.js (Express)                                 │  │
│  │    ↓                                                  │  │
│  │  message-handler.js (Lógica do bot)                  │  │
│  │    ↓                                                  │  │
│  │  sessions.js (Estado das conversas)                  │  │
│  │  whatsapp.js (Envia mensagens)                       │  │
│  │  openai-service.js (Calcula orçamento)               │  │
│  │  supabase-service.js (Salva no banco)                │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          │ RPC Call
                          │ criar_orcamento_e_notificar()
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)                          │
│  • Salva orçamento                                          │
│  • Busca campanhas ativas                                   │
│  • Cria vínculos                                            │
│  • Atualiza hotsites_notificados                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Descoberta Importante

### ⚠️ A VPS NÃO chama `/api/orcamentos` do Next.js!

**O que a VPS faz:**
- Salva **diretamente no Supabase** via função SQL `criar_orcamento_e_notificar()`
- Usa `SUPABASE_SERVICE_KEY` (chave privilegiada)
- Chama a função SQL diretamente, sem passar pela API do Next.js

**Código relevante (`supabase-service.js`):**
```javascript
// Chama função SQL diretamente
const { data, error } = await supabase.rpc('criar_orcamento_e_notificar', {
  p_orcamento_data: payload
});
```

**Isso significa:**
- ✅ A VPS e o Next.js usam a **mesma função SQL**
- ✅ Ambos salvam no **mesmo banco de dados**
- ⚠️ Mas o **processamento antes** é diferente

---

## 📊 Comparação: VPS vs Next.js

| Aspecto | VPS (WhatsApp Bot) | Next.js (`/api/orcamentos`) |
|---------|-------------------|----------------------------|
| **Como recebe dados** | Webhook do Facebook | POST HTTP direto |
| **Processamento** | Bot conversacional (10 perguntas) | Dados já estruturados |
| **Cálculo de preço** | ✅ Usa OpenAI | ❌ Não calcula |
| **Salvamento** | Direto no Supabase (RPC) | Direto no Supabase (RPC) |
| **Função SQL** | `criar_orcamento_e_notificar()` | `criar_orcamento_e_notificar()` |
| **origem_formulario** | `'whatsapp'` | `'formulario_simples'` |
| **Estado/Cidade** | ✅ Extraído pela IA | ⚠️ Depende do webhook |

---

## 🔄 Fluxo Completo da VPS

### 1. Cliente envia "oi" no WhatsApp

```
Cliente → Facebook → Webhook → VPS
```

### 2. VPS processa mensagem

**Arquivo:** `message-handler.js`

```javascript
// Detecta palavra de ativação
if (ehMensagemAtivacao("oi")) {
  criarSessao(userId);
  enviarMensagem("Olá! Sou a Julia...");
}
```

### 3. Coleta dados (10 perguntas sequenciais)

**Ordem das perguntas:**
1. Origem
2. Destino
3. Tipo de imóvel (lista)
4. Elevador? (botões)
5. Embalagem? (botões)
6. Nome
7. Email
8. Data estimada (opcional)
9. Lista de objetos? (botões)
10. Texto da lista (se sim)

**Estado armazenado em memória:**
```javascript
{
  userId: "5511999999999",
  etapaAtual: "email",
  dados: {
    origem: "São Paulo",
    destino: "Rio de Janeiro",
    tipo_imovel: "2_quartos",
    // ...
  }
}
```

### 4. Finaliza orçamento

**Arquivo:** `message-handler.js` → `finalizarOrcamento()`

```javascript
// 1. Chama OpenAI para calcular
const resultadoIA = await calcularOrcamentoComIA(sessao.dados);

// 2. Salva no Supabase (assíncrono)
salvarOrcamento(sessao.dados, resultadoIA);

// 3. Envia resultado ao cliente
enviarMensagem(resultadoFormatado);

// 4. Limpa sessão
limparSessao(userId);
```

### 5. OpenAI calcula orçamento

**Arquivo:** `openai-service.js`

**O que faz:**
- Calcula distância entre origem e destino
- Estima faixa de preço realista
- Extrai/corrige nomes de cidades
- Extrai estados (estadoOrigem, estadoDestino)

**Retorna:**
```json
{
  "distanciaKm": 432,
  "precoMin": 6000,
  "precoMax": 8500,
  "explicacao": "...",
  "cidadeOrigem": "São Paulo",
  "estadoOrigem": "SP",
  "cidadeDestino": "Rio de Janeiro",
  "estadoDestino": "RJ"
}
```

### 6. Salva no Supabase

**Arquivo:** `supabase-service.js`

**Payload enviado:**
```javascript
{
  nome_cliente: dados.nome,
  email_cliente: dados.email,
  telefone_cliente: dados.whatsapp,
  whatsapp: dados.whatsapp,
  origem_completo: dados.origem,
  destino_completo: dados.destino,
  estado_origem: resultadoIA.estadoOrigem,      // ✅ Da IA
  cidade_origem: resultadoIA.cidadeOrigem,      // ✅ Da IA
  estado_destino: resultadoIA.estadoDestino,    // ✅ Da IA
  cidade_destino: resultadoIA.cidadeDestino,    // ✅ Da IA
  tipo_imovel: dados.tipo_imovel,
  tem_elevador: dados.tem_elevador,
  andar: dados.andar,
  precisa_embalagem: dados.precisa_embalagem,
  distancia_km: resultadoIA.distanciaKm,
  preco_min: resultadoIA.precoMin,
  preco_max: resultadoIA.precoMax,
  mensagem_ia: resultadoIA.explicacao,
  lista_objetos: dados.lista_objetos,
  origem_formulario: 'whatsapp',                // ✅ Identificador
  // ...
}
```

**Chama função SQL:**
```javascript
supabase.rpc('criar_orcamento_e_notificar', {
  p_orcamento_data: payload
});
```

---

## 🔍 Rotas da VPS

### Rotas do Servidor Express

**Arquivo:** `server.js`

| Rota | Método | Propósito |
|------|--------|-----------|
| `/webhook` | GET | Verificação inicial do Facebook |
| `/webhook` | POST | Recebe mensagens dos usuários |
| `/` | GET | Health check |
| `/health` | GET | Status da aplicação |

**NÃO há rotas para:**
- ❌ Criar orçamento via API externa
- ❌ Listar orçamentos
- ❌ Gerenciar dados

**A VPS é apenas um webhook receiver!**

---

## 📝 Estrutura de Arquivos da VPS

```
/home/whatsapp-webhook/
├── server.js              # Servidor Express (rotas /webhook)
├── message-handler.js     # Lógica do bot (10 perguntas)
├── sessions.js            # Gerenciador de sessões (memória)
├── whatsapp.js            # Cliente WhatsApp API (envia msgs)
├── openai-service.js      # Cliente OpenAI (calcula preço)
├── supabase-service.js    # Cliente Supabase (salva no banco)
├── .env                   # Variáveis de ambiente
├── package.json           # Dependências
└── node_modules/          # Pacotes NPM
```

---

## 🔗 Integração com Sistema Principal

### O que a VPS faz:

1. ✅ Recebe mensagens do WhatsApp
2. ✅ Processa conversa
3. ✅ Calcula com OpenAI
4. ✅ **Salva DIRETO no Supabase** (mesma função SQL do Next.js)

### O que a VPS NÃO faz:

1. ❌ Não chama API do Next.js
2. ❌ Não usa `/api/orcamentos`
3. ❌ Não usa `/api/calcular-orcamento`

### Conclusão:

**A VPS e o Next.js são sistemas PARALELOS que:**
- Usam a mesma função SQL
- Salvam no mesmo banco
- Mas processam dados de forma diferente

---

## ⚠️ Problema Identificado: `hotsites_notificados = 0`

### Por que acontece?

**VPS (WhatsApp Bot):**
1. ✅ Usa OpenAI para calcular
2. ✅ IA extrai `estadoDestino` corretamente
3. ✅ Passa `estadoDestino` para função SQL
4. ✅ Função SQL encontra campanhas
5. ✅ `hotsites_notificados > 0`

**Next.js (`/api/orcamentos`):**
1. ❌ Não usa IA
2. ⚠️ Depende do webhook enviar `estadoDestino`
3. ❌ Se não enviar, função SQL não encontra campanhas
4. ❌ `hotsites_notificados = 0`

### Solução:

**A rota `/api/orcamentos` do Next.js precisa:**
- Extrair `estadoDestino` automaticamente (como a VPS faz)
- Ou garantir que o webhook sempre envie `estadoDestino`

---

## 📊 Mapeamento de Dados

### VPS → Supabase

**Interface da sessão (VPS):**
```javascript
{
  origem: "São Paulo",
  destino: "Rio de Janeiro",
  tipo_imovel: "2_quartos",
  tem_elevador: true,
  precisa_embalagem: true,
  nome: "João",
  email: "joao@email.com",
  whatsapp: "5511999999999",
  data_estimada: "2025-12-01",
  lista_objetos: "Sofá, geladeira..."
}
```

**Após OpenAI:**
```javascript
{
  estadoOrigem: "SP",        // ✅ Extraído pela IA
  cidadeOrigem: "São Paulo", // ✅ Extraído pela IA
  estadoDestino: "RJ",       // ✅ Extraído pela IA
  cidadeDestino: "Rio de Janeiro", // ✅ Extraído pela IA
  distanciaKm: 432,
  precoMin: 6000,
  precoMax: 8500
}
```

**Payload para Supabase:**
```javascript
{
  origem_completo: "São Paulo",
  destino_completo: "Rio de Janeiro",
  estado_origem: "SP",       // ✅ Da IA
  cidade_origem: "São Paulo", // ✅ Da IA
  estado_destino: "RJ",      // ✅ Da IA (CRÍTICO!)
  cidade_destino: "Rio de Janeiro", // ✅ Da IA
  origem_formulario: 'whatsapp',
  // ...
}
```

---

## 🔧 Componentes da VPS

### 1. `server.js` - Servidor Express

**Responsabilidades:**
- Recebe webhooks do Facebook
- Extrai mensagens do payload
- Roteia para `message-handler.js`
- Responde 200 OK imediatamente

**Rotas:**
- `GET /webhook` - Verificação do Facebook
- `POST /webhook` - Recebe mensagens
- `GET /` - Health check

### 2. `message-handler.js` - Cérebro do Bot

**Responsabilidades:**
- Gerencia fluxo conversacional
- Processa respostas do usuário
- Valida dados (email, data)
- Orquestra chamadas para OpenAI e Supabase
- Formata e envia resultado final

**Funções principais:**
- `processarMensagem()` - Processa cada mensagem
- `finalizarOrcamento()` - Calcula e salva
- `validarEmail()` - Valida formato
- `validarData()` - Valida e converte datas

### 3. `sessions.js` - Gerenciador de Estado

**Responsabilidades:**
- Armazena sessões em memória (Map)
- Controla etapa atual de cada conversa
- Define ordem das perguntas

**Funções:**
- `criarSessao()` - Inicia nova conversa
- `getSessao()` - Recupera sessão
- `atualizarSessao()` - Atualiza dados
- `proximaEtapa()` - Avança pergunta
- `limparSessao()` - Remove sessão

**⚠️ Limitação:** Sessões em memória (perdidas ao reiniciar)

### 4. `whatsapp.js` - Cliente WhatsApp API

**Responsabilidades:**
- Envia mensagens via Facebook Graph API
- Envia botões interativos
- Envia listas de seleção

**Funções:**
- `enviarMensagem()` - Texto simples
- `enviarBotoes()` - Até 3 botões
- `enviarLista()` - Lista de opções

### 5. `openai-service.js` - Integração OpenAI

**Responsabilidades:**
- Calcula distância entre cidades
- Estima faixa de preço realista
- Extrai/corrige nomes de cidades
- Extrai estados

**Função:**
- `calcularOrcamentoComIA()` - Calcula tudo com IA

**Modelo:** GPT-4o-mini

### 6. `supabase-service.js` - Integração Banco

**Responsabilidades:**
- Salva orçamento no banco
- Chama função SQL `criar_orcamento_e_notificar()`
- Usa Service Role Key (acesso privilegiado)

**Função:**
- `salvarOrcamento()` - Salva e notifica empresas

---

## 🔐 Variáveis de Ambiente

**Arquivo:** `.env` (na VPS)

```env
# Servidor
PORT=3000
VERIFY_TOKEN=meu_token_secreto_12345

# WhatsApp
WHATSAPP_TOKEN=EAAMQy... (token permanente)
WHATSAPP_PHONE_ID=871455159388695

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG... (não usado)
SUPABASE_SERVICE_KEY=eyJhbG... (usado para salvar)

# OpenAI
OPENAI_API_KEY=sk-proj-...
```

**Importante:**
- ✅ Usa `SUPABASE_SERVICE_KEY` (acesso privilegiado)
- ✅ Não precisa de `SUPABASE_ANON_KEY` (não usa)

---

## 🔄 Fluxo de Dados Detalhado

### Exemplo Completo: Cliente faz orçamento

```
1. Cliente envia "oi"
   ↓
2. Facebook → POST /webhook
   {
     "entry": [{
       "changes": [{
         "value": {
           "messages": [{
             "from": "5511999999999",
             "text": { "body": "oi" }
           }]
         }
       }]
     }]
   }
   ↓
3. server.js extrai mensagem
   from = "5511999999999"
   mensagemTexto = "oi"
   ↓
4. message-handler.js processa
   - Detecta palavra de ativação
   - Cria sessão
   - Envia: "Olá! Sou a Julia..."
   ↓
5. Cliente responde: "São Paulo"
   ↓
6. message-handler.js processa
   - Etapa atual: "origem"
   - Salva: origem = "São Paulo"
   - Próxima etapa: "destino"
   - Envia: "E para onde você está se mudando?"
   ↓
7. [Repete para todas as 10 perguntas]
   ↓
8. Após última resposta:
   - Chama finalizarOrcamento()
   ↓
9. finalizarOrcamento():
   a) Chama OpenAI
      - Calcula distância
      - Estima preço
      - Extrai estado/cidade
   b) Salva no Supabase (assíncrono)
      - Chama criar_orcamento_e_notificar()
      - Função SQL busca campanhas
      - Cria vínculos
      - Atualiza hotsites_notificados
   c) Envia resultado ao cliente
   d) Limpa sessão
   ↓
10. Cliente recebe orçamento completo!
```

---

## 🎯 Diferenças Críticas

### VPS vs Next.js `/api/orcamentos`

| Aspecto | VPS | Next.js `/api/orcamentos` |
|---------|-----|---------------------------|
| **Recebe dados** | Webhook Facebook | POST HTTP direto |
| **Formato dados** | Conversa sequencial | JSON estruturado |
| **Usa IA?** | ✅ Sim (OpenAI) | ❌ Não |
| **Calcula preço?** | ✅ Sim | ❌ Não |
| **Extrai estado?** | ✅ Sim (IA) | ⚠️ Depende do webhook |
| **Salvamento** | Direto Supabase (RPC) | Direto Supabase (RPC) |
| **origem_formulario** | `'whatsapp'` | `'formulario_simples'` |
| **estadoDestino** | ✅ Sempre presente (IA) | ⚠️ Pode estar vazio |

---

## ⚠️ Problema: `hotsites_notificados = 0`

### Por que acontece no Next.js mas não na VPS?

**VPS (funciona):**
```javascript
// 1. IA calcula e extrai estado
const resultadoIA = await calcularOrcamentoComIA(dados);
// resultadoIA.estadoDestino = "SP" ✅

// 2. Passa para função SQL
salvarOrcamento({
  estado_destino: resultadoIA.estadoDestino  // ✅ Sempre presente
});
```

**Next.js `/api/orcamentos` (não funciona):**
```javascript
// 1. Recebe dados do webhook
const formData = body; // { estadoDestino: ??? }

// 2. Se estadoDestino não vier → NULL
salvarOrcamento({
  estado_destino: formData.estadoDestino  // ⚠️ Pode ser undefined
});
```

**Função SQL:**
```sql
-- Busca campanhas do estado
SELECT * FROM buscar_hotsites_ativos_por_estado(
  estado_destino,  -- ⚠️ Se for NULL, não encontra nada!
  'mudanca'
);
```

---

## 🔧 Soluções Possíveis

### Opção 1: Extrair estado automaticamente (Recomendado)

**Modificar `/api/orcamentos` para extrair estado:**
```javascript
// Se estadoDestino não vier, tentar extrair
if (!formData.estadoDestino && formData.cidadeDestino) {
  formData.estadoDestino = extrairEstadoDoTexto(formData.cidadeDestino);
}
```

### Opção 2: Usar IA no Next.js também

**Chamar OpenAI antes de salvar:**
```javascript
// Calcular com IA (como a VPS faz)
const resultadoIA = await calcularOrcamentoComIA({
  origem: formData.cidadeOrigem,
  destino: formData.cidadeDestino,
  // ...
});

// Usar estado da IA
formData.estadoDestino = resultadoIA.estadoDestino;
```

### Opção 3: Garantir que webhook sempre envie

**Modificar código na VPS (se houver outro webhook):**
```javascript
// Garantir que sempre envia estadoDestino
payload.estadoDestino = extrairEstado(destino);
```

---

## 📊 Resumo Técnico

### Tecnologias VPS

- **OS:** Ubuntu 24.04
- **Runtime:** Node.js 20.x
- **Framework:** Express.js
- **Process Manager:** PM2
- **Web Server:** Nginx
- **SSL:** Let's Encrypt
- **WhatsApp API:** Facebook Cloud API v21.0
- **IA:** OpenAI GPT-4o-mini
- **Database:** Supabase (PostgreSQL)

### Funcionalidades

- ✅ Bot conversacional completo
- ✅ 10 perguntas sequenciais
- ✅ Validação de dados
- ✅ Cálculo com IA
- ✅ Salvamento no banco
- ✅ Notificação de empresas
- ✅ Sessões em memória

### Limitações

- ⚠️ Sessões em memória (perdidas ao reiniciar)
- ⚠️ Sem persistência de estado
- ⚠️ Sem fila de mensagens
- ⚠️ Processamento síncrono

---

## 🎯 Conclusões

### O que descobrimos:

1. ✅ **VPS tem rotas próprias** (`/webhook`, `/`, `/health`)
2. ✅ **VPS NÃO chama API do Next.js** - salva direto no banco
3. ✅ **VPS e Next.js usam mesma função SQL** - `criar_orcamento_e_notificar()`
4. ✅ **VPS usa IA** - sempre extrai `estadoDestino` corretamente
5. ⚠️ **Next.js depende do webhook** - pode não ter `estadoDestino`

### Por que funciona na VPS mas não no Next.js:

**VPS:**
- Usa OpenAI → IA extrai `estadoDestino` → ✅ Funciona

**Next.js:**
- Depende do webhook enviar `estadoDestino` → ⚠️ Pode não enviar → ❌ Não funciona

### Recomendação:

**Adicionar extração automática de estado na rota `/api/orcamentos`** (similar ao que a VPS faz com IA).

---

## 📝 Próximos Passos

1. ✅ Entender arquitetura completa
2. ⏳ Analisar se há outro webhook chamando `/api/orcamentos`
3. ⏳ Implementar extração de estado na rota Next.js
4. ⏳ Testar e validar

---

**Documento criado em:** 2025-01-23  
**Última atualização:** 2025-01-23

