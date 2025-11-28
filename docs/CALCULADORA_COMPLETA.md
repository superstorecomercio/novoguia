# 📊 DOCUMENTAÇÃO COMPLETA - CALCULADORA DE ORÇAMENTOS

**Última atualização:** 2025-01-XX  
**Versão:** 1.0  
**Localização:** `app/components/InstantCalculatorHybrid.tsx`

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Fluxo Completo](#fluxo-completo)
3. [Componentes Principais](#componentes-principais)
4. [API Routes](#api-routes)
5. [Funções SQL](#funções-sql)
6. [Estrutura de Dados](#estrutura-de-dados)
7. [Validações](#validações)
8. [Busca de Campanhas](#busca-de-campanhas)
9. [Logs e Debugging](#logs-e-debugging)
10. [Problemas Comuns](#problemas-comuns)

---

## 🎯 VISÃO GERAL

A calculadora de orçamentos é um formulário conversacional que:

1. **Coleta dados da mudança** (origem, destino, tipo de imóvel, etc.)
2. **Calcula estimativa de preço** usando IA (OpenAI GPT-4o-mini)
3. **Salva o orçamento** no banco de dados
4. **Vincula campanhas ativas** do estado de destino automaticamente
5. **Notifica empresas** para que possam enviar propostas

### Arquivos Principais

```
app/
├── components/
│   └── InstantCalculatorHybrid.tsx    # Componente principal da calculadora
├── api/
│   └── calcular-orcamento/
│       └── route.ts                    # API route que processa o cálculo
lib/
└── db/
    └── queries/
        └── orcamentos.ts               # Função que salva no banco

supabase/
└── migrations/
    └── 028_filtrar_campanhas_por_estado.sql  # Função SQL que busca campanhas
```

---

## 🔄 FLUXO COMPLETO

### 1. Frontend - Coleta de Dados

**Arquivo:** `app/components/InstantCalculatorHybrid.tsx`

#### Etapas do Formulário Conversacional

1. **Origem** - Usuário informa cidade de origem
   - Exemplo: "Moema, São Paulo - SP"
   - Campo: `formData.origem`

2. **Destino** - Usuário informa cidade de destino
   - Exemplo: "Guarulhos, SP"
   - Campo: `formData.destino`

3. **Tipo de Imóvel** - Seleção entre:
   - `kitnet` - Kitnet
   - `1_quarto` - Apartamento 1 quarto
   - `2_quartos` - Apartamento 2 quartos
   - `3_mais` - Apartamento 3+ quartos ou Casa
   - `comercial` - Mudança Comercial
   - Campo: `formData.tipoImovel`

4. **Elevador** - Sim/Não
   - Campo: `formData.temElevador` ("sim" | "nao")

5. **Andar** - Número do andar (padrão: 1)
   - Campo: `formData.andar` (string convertida para number)

6. **Embalagem** - Precisa de embalagem? Sim/Não
   - Campo: `formData.precisaEmbalagem` ("sim" | "nao")

#### Preview e Captura de Contato

Após preencher os dados da mudança:

1. **Preview** - Mostra resumo dos dados
2. **Captura de Contato**:
   - Nome (obrigatório)
   - Email (obrigatório)
   - WhatsApp (obrigatório)
   - Data Estimada (opcional)
   - Lista de Objetos (opcional - texto)
   - Arquivo com Lista (opcional - upload)

#### Envio para API

**Função:** `handleSubmitContato()`

```typescript
const dadosParaEnvio = {
  origem: formData.origem.trim(),
  destino: formData.destino.trim(),
  tipoImovel: formData.tipoImovel,
  temElevador: formData.temElevador,
  andar: parseInt(formData.andar) || 1,
  precisaEmbalagem: formData.precisaEmbalagem,
  nome: contatoData.nome.trim(),
  email: contatoData.email.trim(),
  whatsapp: contatoData.whatsapp.trim(),
  dataEstimada: contatoData.dataEstimada?.trim() || undefined,
  listaObjetos: listaObjetos?.trim() || undefined,
  arquivoListaNome: arquivoLista?.name || undefined
}

// POST para /api/calcular-orcamento
const response = await fetch("/api/calcular-orcamento", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(dadosParaEnvio)
})
```

**Validações no Frontend:**
- ✅ Nome não vazio
- ✅ Email não vazio (formato básico)
- ✅ WhatsApp não vazio
- ✅ Origem não vazia
- ✅ Destino não vazio
- ✅ Tipo de imóvel selecionado
- ✅ Elevador informado
- ✅ Embalagem informada

---

### 2. Backend - Processamento

**Arquivo:** `app/api/calcular-orcamento/route.ts`

#### Endpoint: `POST /api/calcular-orcamento`

#### Validações na API

```typescript
// Validação dos dados da mudança
if (!body.origem || !body.destino || !body.tipoImovel || 
    !body.temElevador || typeof body.andar !== 'number' || 
    !body.precisaEmbalagem) {
  return NextResponse.json(
    { error: 'Dados inválidos. Verifique todos os campos.' },
    { status: 400 }
  );
}

// Validação dos dados de contato
if (!body.nome || body.nome.trim() === '') {
  return NextResponse.json(
    { error: 'Nome é obrigatório.' },
    { status: 400 }
  );
}
// ... validações de email e whatsapp
```

#### Cálculo com IA

**Função:** `calcularOrcamentoComIA()`

A IA (OpenAI GPT-4o-mini) recebe todos os dados e:

1. **Extrai cidade e estado** de origem e destino
2. **Calcula distância** entre origem e destino
3. **Calcula faixa de preço** baseado em:
   - Distância
   - Tipo de imóvel
   - Presença de elevador
   - Necessidade de embalagem
   - Andar

**Prompt enviado para IA:**
```
Você é um especialista em cálculo de orçamentos de mudanças.

Dados da mudança:
- Origem: {origem}
- Destino: {destino}
- Tipo de imóvel: {tipoImovel}
- Tem elevador: {temElevador}
- Andar: {andar}
- Precisa embalagem: {precisaEmbalagem}

Calcule:
1. Distância em km entre origem e destino
2. Faixa de preço (precoMin e precoMax)
3. Extraia cidade e estado de origem e destino
4. Explique o cálculo

Retorne JSON com:
- distanciaKm: number
- precoMin: number
- precoMax: number
- cidadeOrigem: string
- estadoOrigem: string (2 letras)
- cidadeDestino: string
- estadoDestino: string (2 letras)
- explicacao: string
```

**Resposta da IA:**
```json
{
  "distanciaKm": 25,
  "precoMin": 1200,
  "precoMax": 1800,
  "cidadeOrigem": "São Paulo",
  "estadoOrigem": "SP",
  "cidadeDestino": "Guarulhos",
  "estadoDestino": "SP",
  "explicacao": "Mudança entre São Paulo e Guarulhos..."
}
```

#### Fallback (sem IA)

Se `OPENAI_API_KEY` não estiver configurada:

**Função:** `calcularOrcamentoFallback()`

- Usa valores genéricos (R$ 800 - R$ 3.500)
- Extrai estado usando regex simples
- Extrai cidade (primeira parte antes da vírgula)
- ⚠️ **NÃO RECOMENDADO** - Configure a API Key para resultados precisos

#### Salvamento no Banco

**Função:** `criarOrcamentoENotificar()`

**Arquivo:** `lib/db/queries/orcamentos.ts`

```typescript
const orcamentoSalvo = await criarOrcamentoENotificar({
  nome: body.nome,
  email: body.email,
  whatsapp: body.whatsapp,
  origem: body.origem,
  destino: body.destino,
  estadoOrigem: resultado.estadoOrigem || undefined,
  cidadeOrigem: resultado.cidadeOrigem || undefined,
  estadoDestino: resultado.estadoDestino || undefined,
  cidadeDestino: resultado.cidadeDestino || undefined,
  tipoImovel: body.tipoImovel,
  temElevador: body.temElevador === 'sim',
  andar: body.andar,
  precisaEmbalagem: body.precisaEmbalagem === 'sim',
  dataEstimada: body.dataEstimada,
  distanciaKm: resultado.distanciaKm,
  precoMin: resultado.precoMin,
  precoMax: resultado.precoMax,
  mensagemIA: resultado.mensagemIA,
  listaObjetos: body.listaObjetos,
  arquivoListaUrl: body.arquivoListaUrl,
  arquivoListaNome: body.arquivoListaNome,
  origemFormulario: 'calculadora',
  userAgent: request.headers.get('user-agent') || undefined,
  ipCliente: request.headers.get('x-forwarded-for') || undefined,
});
```

**Retorno:**
```typescript
{
  orcamentoId: string,
  hotsitesNotificados: number,
  hotsitesIds: string[]
}
```

---

### 3. Banco de Dados - Função SQL

**Arquivo:** `supabase/migrations/028_filtrar_campanhas_por_estado.sql`

#### Função: `criar_orcamento_e_notificar(p_orcamento_data JSONB)`

**O que faz:**

1. **Valida dados obrigatórios:**
   - `nome_cliente` (obrigatório)
   - `email_cliente` (obrigatório)
   - `telefone_cliente` (obrigatório)
   - `estado_destino` (obrigatório)

2. **Busca cidade_id** (opcional):
   ```sql
   SELECT id INTO v_cidade_id
   FROM cidades
   WHERE LOWER(TRIM(nome)) = LOWER(TRIM(cidade_destino))
     AND LOWER(TRIM(estado)) = LOWER(TRIM(estado_destino))
   LIMIT 1;
   ```
   - Se encontrar, salva `cidade_id` no orçamento
   - Se não encontrar, `cidade_id` fica NULL (mas não impede o salvamento)

3. **Insere orçamento** na tabela `orcamentos`:
   ```sql
   INSERT INTO orcamentos (
     tipo, nome_cliente, email_cliente, telefone_cliente, whatsapp,
     origem_completo, destino_completo,
     estado_origem, cidade_origem,
     estado_destino, cidade_destino, cidade_id,
     tipo_imovel, tem_elevador, andar, precisa_embalagem,
     distancia_km, preco_min, preco_max, mensagem_ia,
     lista_objetos, arquivo_lista_url, arquivo_lista_nome,
     data_estimada, origem_formulario, user_agent, ip_cliente,
     hotsites_notificados
   ) VALUES (...)
   RETURNING id INTO v_orcamento_id;
   ```

4. **Busca campanhas ativas do estado:**
   ```sql
   FOR v_campanhas IN
     SELECT * FROM buscar_hotsites_ativos_por_estado(
       estado_destino, 
       'mudanca'
     )
   LOOP
     -- Cria vínculo
   END LOOP;
   ```

5. **Cria vínculos** na tabela `orcamentos_campanhas`:
   ```sql
   INSERT INTO orcamentos_campanhas (
     orcamento_id, 
     campanha_id, 
     hotsite_id
   )
   VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id)
   ON CONFLICT ON CONSTRAINT orcamentos_campanhas_orcamento_campanha_unique 
   DO NOTHING;
   ```

6. **Atualiza contador:**
   ```sql
   UPDATE orcamentos
   SET hotsites_notificados = v_hotsites_count
   WHERE id = v_orcamento_id;
   ```

7. **Retorna resultado:**
   ```sql
   RETURN QUERY
   SELECT 
     v_orcamento_id,
     v_hotsites_count,
     v_campanhas_array;
   ```

---

## 🔍 BUSCA DE CAMPANHAS

### Função: `buscar_hotsites_ativos_por_estado(p_estado TEXT, p_tipo_servico TEXT)`

**Arquivo:** `supabase/migrations/028_filtrar_campanhas_por_estado.sql`

**Comportamento:** SEMPRE busca campanhas pelo **ESTADO**, independente de ter encontrado a cidade.

**Query:**
```sql
SELECT
  h.id as hotsite_id,
  c.id as campanha_id,
  h.nome_exibicao as nome,
  h.email,
  h.cidade,
  h.estado,
  COALESCE(p.ordem, 999) as plano_ordem
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
LEFT JOIN planos p ON c.plano_id = p.id
WHERE 
  UPPER(TRIM(h.estado)) = UPPER(TRIM(p_estado))
  AND c.ativo = true
  AND c.participa_cotacao = true
  AND h.nome_exibicao IS NOT NULL
ORDER BY COALESCE(p.ordem, 999) ASC, c.data_inicio DESC, h.id;
```

**Filtros aplicados:**
- ✅ Estado normalizado (UPPER/TRIM) para evitar problemas de case sensitivity
- ✅ Campanha ativa (`c.ativo = true`)
- ✅ Campanha participa de cotação (`c.participa_cotacao = true`)
- ✅ Hotsite tem nome de exibição (`h.nome_exibicao IS NOT NULL`)
- ❌ **NÃO filtra por `h.ativo`** - Importa apenas se a campanha está ativa

**Ordenação:**
1. Ordem do plano (menor = melhor)
2. Data de início da campanha (mais recente primeiro)
3. ID do hotsite (para consistência)

**Retorno:**
- Todas as campanhas ativas do estado
- 1 campanha = 1 hotsite (relação 1:1)
- Se há 10 campanhas ativas em SP, retorna todas as 10

---

## 📊 ESTRUTURA DE DADOS

### Tabela: `orcamentos`

```sql
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY,
  tipo VARCHAR(50) DEFAULT 'mudanca',
  nome_cliente VARCHAR(255) NOT NULL,
  email_cliente VARCHAR(255) NOT NULL,
  telefone_cliente VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50),
  origem_completo TEXT,
  destino_completo TEXT,
  estado_origem VARCHAR(2),
  cidade_origem VARCHAR(255),
  estado_destino VARCHAR(2) NOT NULL,
  cidade_destino VARCHAR(255),
  cidade_id UUID,  -- FK para cidades (opcional)
  tipo_imovel VARCHAR(50),
  tem_elevador BOOLEAN,
  andar INTEGER DEFAULT 1,
  precisa_embalagem BOOLEAN,
  distancia_km NUMERIC,
  preco_min NUMERIC,
  preco_max NUMERIC,
  mensagem_ia TEXT,
  lista_objetos TEXT,
  arquivo_lista_url TEXT,
  arquivo_lista_nome VARCHAR(255),
  data_estimada DATE,
  origem_formulario VARCHAR(50) DEFAULT 'calculadora',
  user_agent TEXT,
  ip_cliente INET,
  hotsites_notificados INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `orcamentos_campanhas`

```sql
CREATE TABLE orcamentos_campanhas (
  id UUID PRIMARY KEY,
  orcamento_id UUID NOT NULL,  -- FK para orcamentos
  campanha_id UUID NOT NULL,   -- FK para campanhas
  hotsite_id UUID NOT NULL,    -- FK para hotsites (denormalizado)
  status TEXT DEFAULT 'pendente',
  respondido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT orcamentos_campanhas_orcamento_campanha_unique 
    UNIQUE(orcamento_id, campanha_id)
);
```

### Tabela: `campanhas`

```sql
CREATE TABLE campanhas (
  id UUID PRIMARY KEY,
  hotsite_id UUID NOT NULL,  -- FK para hotsites
  plano_id UUID,             -- FK para planos
  ativo BOOLEAN DEFAULT true,
  participa_cotacao BOOLEAN DEFAULT true,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `hotsites`

```sql
CREATE TABLE hotsites (
  id UUID PRIMARY KEY,
  empresa_id UUID,
  cidade_id UUID,           -- FK para cidades
  nome_exibicao VARCHAR(255),
  cidade VARCHAR(255),      -- Campo texto (sincronizado)
  estado VARCHAR(2),        -- Campo texto (sincronizado)
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ VALIDAÇÕES

### Frontend (`InstantCalculatorHybrid.tsx`)

**Antes de enviar:**
- ✅ Nome não vazio
- ✅ Email não vazio
- ✅ WhatsApp não vazio
- ✅ Origem não vazia
- ✅ Destino não vazio
- ✅ Tipo de imóvel selecionado
- ✅ Elevador informado
- ✅ Embalagem informada

### Backend (`/api/calcular-orcamento`)

**Validações:**
- ✅ Todos os campos obrigatórios presentes
- ✅ Tipos corretos (andar é number)
- ✅ Email e WhatsApp não vazios

### Banco de Dados (`criar_orcamento_e_notificar`)

**Validações:**
- ✅ `nome_cliente` obrigatório
- ✅ `email_cliente` obrigatório
- ✅ `telefone_cliente` obrigatório
- ✅ `estado_destino` obrigatório

**Se alguma validação falhar:**
- Retorna `RAISE EXCEPTION` com mensagem de erro
- O orçamento NÃO é salvo
- A API retorna erro 500

---

## 📝 LOGS E DEBUGGING

### Logs no Frontend

**Console do navegador (F12):**

```javascript
// Antes de enviar
📤 [Frontend] Enviando dados para API: { ... }

// Resposta da API
📥 [Frontend] Resposta da API: 200 OK
✅ [Frontend] Dados recebidos da API: { ... }

// Erro
❌ [Frontend] Erro ao calcular orçamento: { ... }
```

### Logs no Backend

**Terminal do servidor:**

```javascript
// Salvando orçamento
💾 [API] Salvando orçamento no banco...
📋 [API] Dados a serem salvos: { ... }

// Sucesso
✅ [API] Orçamento salvo com sucesso!
   ID: xxx
   Hotsites notificados: 10
   Campanhas vinculadas: 10

// Erro
❌ [API] ERRO ao salvar orçamento no banco:
   Erro: { message, stack, name }
```

### Logs no Banco de Dados

**Função SQL (`criar_orcamento_e_notificar`):**

```sql
-- Logs via console.log no TypeScript
🔍 Criando orçamento. Estados: SP → SP
📋 Dados recebidos: { ... }
📤 Enviando dados para RPC criar_orcamento_e_notificar: { ... }
✅ Orçamento criado! ID: xxx
📊 Hotsites notificados: 10
📋 Campanhas IDs: [ ... ]
```

---

## 🐛 PROBLEMAS COMUNS

### 1. Orçamento não está sendo salvo

**Sintomas:**
- API retorna 200, mas orçamento não aparece no banco
- Logs mostram erro ao salvar

**Causas possíveis:**
- `estado_destino` não foi extraído pela IA
- Validação no banco falhou
- Erro na função RPC

**Solução:**
1. Verificar logs do terminal: `❌ [API] ERRO ao salvar orçamento`
2. Verificar se `estado_destino` está sendo enviado
3. Verificar se a função SQL está correta

### 2. Apenas algumas campanhas são vinculadas

**Sintomas:**
- Esperava 10 campanhas, mas apenas 3 foram vinculadas

**Causas possíveis:**
- Filtros muito restritivos na função `buscar_hotsites_ativos_por_estado`
- Campanhas não atendem aos critérios:
  - `c.ativo = false`
  - `c.participa_cotacao = false`
  - `h.nome_exibicao IS NULL`

**Solução:**
1. Executar script de diagnóstico: `scripts/diagnostico-campanhas-sp.sql`
2. Verificar quais campanhas estão sendo excluídas
3. Ajustar filtros se necessário

### 3. Estado não está sendo extraído

**Sintomas:**
- `estado_destino` vem como `undefined`
- Erro: "Estado de destino é obrigatório"

**Causas possíveis:**
- IA não conseguiu extrair estado do texto
- Formato do texto de destino está incorreto

**Solução:**
1. Verificar se `OPENAI_API_KEY` está configurada
2. Verificar formato do texto de destino
3. Melhorar prompt da IA se necessário

### 4. Constraint violation ao salvar

**Sintomas:**
- Erro: `there is no unique or exclusion constraint matching the ON CONFLICT specification`

**Causa:**
- Constraint única não existe na tabela `orcamentos_campanhas`

**Solução:**
1. Aplicar migration 027: `027_corrigir_constraint_orcamentos_campanhas.sql`
2. Verificar se constraint existe:
   ```sql
   SELECT conname 
   FROM pg_constraint 
   WHERE conname = 'orcamentos_campanhas_orcamento_campanha_unique';
   ```

---

## 🔧 SCRIPTS ÚTEIS

### Testar função de busca de campanhas

**Arquivo:** `scripts/testar-funcao-estado.sql`

```sql
-- Testa quantas campanhas retorna para SP
SELECT COUNT(*) 
FROM buscar_hotsites_ativos_por_estado('SP', 'mudanca');
```

### Diagnosticar campanhas excluídas

**Arquivo:** `scripts/diagnostico-campanhas-sp.sql`

```sql
-- Mostra tabela com etapas de filtragem
-- Identifica quais campanhas estão sendo excluídas e por quê
```

### Verificar orçamento no banco

**Arquivo:** `scripts/verificar-orcamento-banco.ts`

```typescript
// Verifica se orçamento foi salvo
// Verifica campanhas vinculadas
```

---

## 📌 NOTAS IMPORTANTES

1. **Estado é obrigatório:** A função SQL exige `estado_destino`. Se a IA não extrair, o orçamento não será salvo.

2. **Busca sempre por estado:** Independente de ter encontrado a cidade, sempre busca campanhas pelo estado.

3. **1 campanha = 1 hotsite:** Cada campanha está vinculada a um único hotsite.

4. **Filtro de hotsite ativo removido:** A função não filtra por `h.ativo`. O que importa é a campanha estar ativa.

5. **Sem verificação de datas:** A função não verifica `data_inicio` ou `data_fim`. Apenas o campo `ativo` importa.

6. **Constraint única:** A tabela `orcamentos_campanhas` tem constraint única em `(orcamento_id, campanha_id)` para evitar duplicatas.

---

## 🔄 PRÓXIMAS ALTERAÇÕES

**Antes de fazer alterações:**

1. ✅ Leia esta documentação completa
2. ✅ Entenda o fluxo atual
3. ✅ Verifique impactos em cada camada (frontend → backend → banco)
4. ✅ Teste com scripts de diagnóstico
5. ✅ Verifique logs em todas as etapas

**Ao fazer alterações:**

1. ✅ Mantenha esta documentação atualizada
2. ✅ Adicione logs detalhados
3. ✅ Teste todos os cenários
4. ✅ Verifique compatibilidade com dados existentes

---

**Fim da documentação**









