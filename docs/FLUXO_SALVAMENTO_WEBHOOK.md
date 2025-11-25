# 📊 Fluxo de Salvamento e Dados para Webhook WhatsApp

## 🔄 Fluxo Completo

```
Frontend (calculadora)
    ↓
POST /api/calcular-orcamento
    ↓
1. Validações (rate limit, duplicatas)
    ↓
2. Chama OpenAI API
    ↓
3. Recebe resposta da IA
    ↓
4. Salva no banco via função SQL
    ↓
5. Retorna resultado para frontend
```

---

## 🤖 O que a API da OpenAI Retorna

A função `calcularOrcamentoComIA()` retorna um objeto JSON com:

```typescript
{
  distanciaKm: number,           // Distância calculada em km
  precoMin: number,              // Preço mínimo estimado
  precoMax: number,              // Preço máximo estimado
  explicacao: string,            // Explicação da IA (máx 3 frases)
  cidadeOrigem: string,          // Cidade extraída/corrigida (ex: "São Paulo")
  estadoOrigem: string,          // Estado extraído (ex: "SP")
  cidadeDestino: string,         // Cidade extraída/corrigida (ex: "São Paulo")
  estadoDestino: string          // Estado extraído (ex: "SP")
}
```

**Exemplo de resposta real:**
```json
{
  "distanciaKm": 12,
  "precoMin": 850,
  "precoMax": 1150,
  "explicacao": "Mudança entre Moema e Santana, ambos bairros de São Paulo (12km). Distância curta dentro da mesma cidade, acesso facilitado com elevador. A faixa considera variação entre empresas mais econômicas e premium.",
  "cidadeOrigem": "São Paulo",
  "estadoOrigem": "SP",
  "cidadeDestino": "São Paulo",
  "estadoDestino": "SP"
}
```

---

## 💾 Como é Salvo no Banco de Dados

### 1. Dados Enviados para a Função SQL

A função `criarOrcamentoENotificar()` recebe e salva:

```typescript
{
  // Dados do Cliente (do formulário)
  nome: string,                  // Ex: "João Silva"
  email: string,                 // Ex: "joao@email.com"
  whatsapp: string,              // Ex: "11987654321" (sem máscara)
  dataEstimada?: string,         // Ex: "2025-12-01" ou null
  
  // Origem e Destino (texto original + dados da IA)
  origem: string,                // Texto original: "Moema, São Paulo - SP"
  destino: string,               // Texto original: "Pinheiros, São Paulo - SP"
  estadoOrigem?: string,         // Da IA: "SP"
  cidadeOrigem?: string,         // Da IA: "São Paulo"
  estadoDestino?: string,        // Da IA: "SP"
  cidadeDestino?: string,        // Da IA: "São Paulo"
  
  // Detalhes da Mudança (do formulário)
  tipoImovel: string,            // "kitnet" | "1_quarto" | "2_quartos" | "3_mais" | "comercial"
  temElevador: boolean,          // true | false
  andar: number,                 // Ex: 3
  precisaEmbalagem: boolean,      // true | false
  
  // Resultado do Cálculo (da IA)
  distanciaKm?: number,         // Da IA: 12
  precoMin?: number,             // Da IA: 850
  precoMax?: number,             // Da IA: 1150
  mensagemIA?: string,           // Da IA: "Mudança entre Moema e Santana..."
  
  // Lista de Objetos (opcional, do formulário)
  listaObjetos?: string,         // Ex: "Sofá 3 lugares, Cama queen..."
  arquivoListaUrl?: string,      // URL do arquivo (se enviado)
  arquivoListaNome?: string,     // Nome do arquivo (se enviado)
  
  // Metadados
  origemFormulario?: string,     // "calculadora"
  userAgent?: string,            // User agent do navegador
  ipCliente?: string             // IP do cliente
}
```

### 2. Tabela `orcamentos` - Estrutura Completa

```sql
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY,
  
  -- Dados do Cliente
  nome_cliente VARCHAR(255) NOT NULL,
  email_cliente VARCHAR(255) NOT NULL,
  telefone_cliente VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50),
  
  -- Origem e Destino
  origem_completo TEXT,                    -- Texto formatado: "São Paulo, SP"
  destino_completo TEXT,                   -- Texto formatado: "São Paulo, SP"
  estado_origem VARCHAR(2),               -- "SP" (da IA)
  cidade_origem VARCHAR(255),              -- "São Paulo" (da IA)
  estado_destino VARCHAR(2) NOT NULL,      -- "SP" (da IA) - OBRIGATÓRIO
  cidade_destino VARCHAR(255),             -- "São Paulo" (da IA)
  cidade_id UUID,                          -- FK para cidades (opcional)
  
  -- Detalhes da Mudança
  tipo_imovel VARCHAR(50),                 -- "kitnet", "1_quarto", etc.
  tem_elevador BOOLEAN,
  andar INTEGER DEFAULT 1,
  precisa_embalagem BOOLEAN,
  
  -- Resultado do Cálculo (da IA)
  distancia_km NUMERIC,                    -- 12
  preco_min NUMERIC,                       -- 850
  preco_max NUMERIC,                       -- 1150
  mensagem_ia TEXT,                        -- Explicação da IA
  
  -- Lista de Objetos
  lista_objetos TEXT,                      -- Texto da lista
  arquivo_lista_url TEXT,
  arquivo_lista_nome VARCHAR(255),
  
  -- Data e Metadados
  data_estimada DATE,                      -- NULL se não informado
  origem_formulario VARCHAR(50),           -- "calculadora"
  user_agent TEXT,
  ip_cliente INET,
  hotsites_notificados INTEGER DEFAULT 0,  -- Quantidade de empresas notificadas
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Tabela `orcamentos_campanhas` - Vínculo com Empresas

```sql
CREATE TABLE orcamentos_campanhas (
  id UUID PRIMARY KEY,
  orcamento_id UUID NOT NULL,    -- FK para orcamentos
  campanha_id UUID NOT NULL,     -- FK para campanhas
  hotsite_id UUID NOT NULL,      -- FK para hotsites (denormalizado)
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(orcamento_id, campanha_id)
);
```

**Como funciona:**
- A função SQL `criar_orcamento_e_notificar()` busca campanhas ativas do **estado de destino**
- Cria vínculos automáticos em `orcamentos_campanhas`
- Atualiza `hotsites_notificados` com a quantidade

---

## 📤 Dados para Webhook WhatsApp

### Estrutura Completa de Dados Disponíveis

Quando você implementar o webhook, você terá acesso a **TODOS** os dados salvos na tabela `orcamentos`:

```typescript
interface OrcamentoCompleto {
  // ID do orçamento
  id: string;
  
  // Dados do Cliente
  nome_cliente: string;           // "João Silva"
  email_cliente: string;          // "joao@email.com"
  telefone_cliente: string;       // "11987654321"
  whatsapp: string;               // "11987654321"
  data_estimada: string | null;  // "2025-12-01" ou null
  
  // Origem e Destino
  origem_completo: string;        // "São Paulo, SP" (formatado pela IA)
  destino_completo: string;       // "São Paulo, SP" (formatado pela IA)
  estado_origem: string;          // "SP" (extraído pela IA)
  cidade_origem: string;          // "São Paulo" (extraído pela IA)
  estado_destino: string;         // "SP" (extraído pela IA)
  cidade_destino: string;         // "São Paulo" (extraído pela IA)
  
  // Detalhes da Mudança
  tipo_imovel: string;            // "kitnet" | "1_quarto" | "2_quartos" | "3_mais" | "comercial"
  tem_elevador: boolean;          // true | false
  andar: number;                  // 3
  precisa_embalagem: boolean;     // true | false
  
  // Resultado do Cálculo (da IA)
  distancia_km: number;          // 12
  preco_min: number;              // 850
  preco_max: number;              // 1150
  mensagem_ia: string;            // Explicação completa da IA
  
  // Lista de Objetos
  lista_objetos: string | null;   // "Sofá 3 lugares, Cama queen..." ou null
  arquivo_lista_url: string | null;
  arquivo_lista_nome: string | null;
  
  // Metadados
  origem_formulario: string;      // "calculadora"
  hotsites_notificados: number;   // Quantidade de empresas notificadas
  
  // Timestamps
  created_at: string;             // ISO timestamp
  updated_at: string;             // ISO timestamp
}
```

### Exemplo de Query para Webhook

```sql
-- Buscar orçamento completo com dados da IA
SELECT 
  id,
  nome_cliente,
  email_cliente,
  telefone_cliente,
  whatsapp,
  origem_completo,
  destino_completo,
  estado_origem,
  cidade_origem,
  estado_destino,
  cidade_destino,
  tipo_imovel,
  tem_elevador,
  andar,
  precisa_embalagem,
  distancia_km,
  preco_min,
  preco_max,
  mensagem_ia,
  lista_objetos,
  data_estimada,
  hotsites_notificados,
  created_at
FROM orcamentos
WHERE id = 'uuid-do-orcamento';
```

### Exemplo de Mensagem para WhatsApp

```typescript
// Formatação de mensagem para WhatsApp
function formatarMensagemWhatsApp(orcamento: OrcamentoCompleto): string {
  const tipoImovelLabels = {
    kitnet: "Kitnet",
    "1_quarto": "Apartamento 1 quarto",
    "2_quartos": "Apartamento 2 quartos",
    "3_mais": "Apartamento 3+ quartos ou Casa",
    comercial: "Mudança Comercial"
  };
  
  return `
📋 *NOVO ORÇAMENTO SOLICITADO*

👤 *Cliente:* ${orcamento.nome_cliente}
📧 *Email:* ${orcamento.email_cliente}
📱 *WhatsApp:* ${orcamento.whatsapp}

📍 *Origem:* ${orcamento.origem_completo}
🎯 *Destino:* ${orcamento.destino_completo}

🏠 *Tipo:* ${tipoImovelLabels[orcamento.tipo_imovel]}
🚪 *Elevador:* ${orcamento.tem_elevador ? "Sim" : "Não"}
${!orcamento.tem_elevador ? `🏢 *Andar:* ${orcamento.andar}º` : ""}
📦 *Embalagem:* ${orcamento.precisa_embalagem ? "Sim, completa" : "Não precisa"}

💰 *Faixa de Preço Estimada:*
R$ ${orcamento.preco_min.toLocaleString("pt-BR")} - R$ ${orcamento.preco_max.toLocaleString("pt-BR")}

📏 *Distância:* ${orcamento.distancia_km} km

${orcamento.mensagem_ia ? `\n🤖 *Análise da IA:*\n${orcamento.mensagem_ia}` : ""}

${orcamento.lista_objetos ? `\n📝 *Lista de Objetos:*\n${orcamento.lista_objetos}` : ""}

${orcamento.data_estimada ? `\n📅 *Data Estimada:* ${new Date(orcamento.data_estimada).toLocaleDateString("pt-BR")}` : ""}

🔗 *ID do Orçamento:* ${orcamento.id}
⏰ *Criado em:* ${new Date(orcamento.created_at).toLocaleString("pt-BR")}
  `.trim();
}
```

---

## 🔍 Pontos Importantes

### ✅ O que VEM da OpenAI (IA)

1. **Distância calculada** (`distanciaKm`)
2. **Preços estimados** (`precoMin`, `precoMax`)
3. **Explicação** (`mensagemIA`)
4. **Cidade e Estado extraídos/corrigidos** (`cidadeOrigem`, `estadoOrigem`, `cidadeDestino`, `estadoDestino`)

### ✅ O que VEM do Formulário

1. **Dados do cliente** (nome, email, whatsapp, data estimada)
2. **Texto original** (origem, destino como digitado)
3. **Detalhes da mudança** (tipo imóvel, elevador, andar, embalagem)
4. **Lista de objetos** (opcional)

### ✅ O que é SALVO no Banco

**TUDO** é salvo na tabela `orcamentos`:
- Dados do formulário
- Dados retornados pela IA
- Metadados (IP, user agent, etc.)

### ✅ Validações Importantes

- `estado_destino` é **OBRIGATÓRIO** - se a IA não extrair, o orçamento não é salvo
- `nome_cliente`, `email_cliente`, `telefone_cliente` são obrigatórios
- `data_estimada` pode ser `NULL` (opcional)
- `lista_objetos` pode ser `NULL` (opcional)

---

## 🚀 Implementação do Webhook

### Opção 1: Trigger no Banco de Dados

Criar um trigger que dispara quando um novo orçamento é inserido:

```sql
CREATE OR REPLACE FUNCTION notificar_webhook_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar webhook externo aqui
  -- Pode usar pg_net ou http extension do Supabase
  PERFORM net.http_post(
    url := 'https://seu-webhook.com/orcamento',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := row_to_json(NEW)::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificar_whatsapp
AFTER INSERT ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION notificar_webhook_whatsapp();
```

### Opção 2: Webhook na API Route

Criar uma rota que escuta eventos do Supabase:

```typescript
// app/api/webhook/orcamento/route.ts
export async function POST(request: Request) {
  const orcamento = await request.json();
  
  // Enviar para WhatsApp
  await enviarParaWhatsApp(orcamento);
  
  return Response.json({ success: true });
}
```

### Opção 3: Polling (menos recomendado)

Consultar periodicamente novos orçamentos:

```sql
SELECT * FROM orcamentos
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

---

## 📝 Resumo Final

**Para o webhook do WhatsApp, você tem acesso a:**

✅ Todos os dados do formulário  
✅ Todos os dados calculados pela IA  
✅ Dados formatados e corrigidos pela IA  
✅ Metadados (IP, user agent, timestamps)  
✅ Quantidade de empresas notificadas  

**Tudo isso está salvo na tabela `orcamentos` e pode ser consultado via SQL ou API.**



