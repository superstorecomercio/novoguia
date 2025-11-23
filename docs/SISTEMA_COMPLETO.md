# 🎯 SISTEMA DE ORÇAMENTOS - DOCUMENTAÇÃO COMPLETA

**Projeto:** Guia de Mudanças  
**Data:** 22 de Novembro de 2025  
**Status:** ✅ 100% FUNCIONAL

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Fluxo Completo](#fluxo-completo)
4. [Componentes Principais](#componentes-principais)
5. [Banco de Dados](#banco-de-dados)
6. [Correções Implementadas](#correções-implementadas)
7. [Testes e Validação](#testes-e-validação)
8. [Manutenção](#manutenção)

---

## 🎯 VISÃO GERAL

O sistema permite que usuários solicitem orçamentos de mudança através de uma calculadora interativa. As empresas cadastradas e ativas na região recebem automaticamente a notificação do orçamento.

### Funcionalidades Principais:

- ✅ **Calculadora Interativa**: Formulário em etapas para captura de dados
- ✅ **Cálculo com IA**: OpenAI API para estimar valores e extrair informações
- ✅ **Notificação Automática**: Empresas ativas recebem os orçamentos
- ✅ **Lista de Objetos**: Opcional, para orçamentos mais precisos
- ✅ **Geolocalização Inteligente**: Identifica cidade/estado do usuário
- ✅ **Admin Dashboard**: Painel completo para gestão

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  • InstantCalculatorHybrid.tsx (Formulário)            │
│  • CalculadoraPage (Página principal)                   │
│  • Admin Dashboard (Gestão)                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API ROUTES (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│  • /api/calcular-orcamento (POST)                      │
│    - Chama OpenAI para cálculo                          │
│    - Extrai cidade/estado/origem/destino                │
│    - Chama função de salvamento                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CAMADA DE DADOS (TypeScript)                │
├─────────────────────────────────────────────────────────┤
│  • lib/db/queries/orcamentos.ts                         │
│    - criarOrcamentoENotificar()                         │
│    - Prepara dados para RPC                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            BANCO DE DADOS (PostgreSQL/Supabase)          │
├─────────────────────────────────────────────────────────┤
│  • criar_orcamento_e_notificar() [RPC Function]        │
│    1. Valida dados obrigatórios                         │
│    2. Busca cidade_id                                   │
│    3. Insere orçamento                                  │
│    4. Busca campanhas ativas (cidade ou estado)         │
│    5. Cria vínculos (orcamentos_campanhas)             │
│    6. Atualiza contador (hotsites_notificados)         │
│    7. Retorna IDs para processamento                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO COMPLETO

### 1. USUÁRIO PREENCHE CALCULADORA

```
Etapa 1: Origem (ex: "Moema, São Paulo")
Etapa 2: Destino (ex: "Pinheiros, São Paulo")
Etapa 3: Tipo de Imóvel (ex: "2 quartos")
Etapa 4: Tem elevador? (Sim/Não)
Etapa 5: Precisa embalagem? (Sim/Não)

→ Exibe Preview com estimativa visual
→ Usuário confirma e vai para Captura de Contato
```

### 2. TELA DE CONTATO

```
Campo: Nome
Campo: Email
Campo: WhatsApp
Campo: Data Estimada (opcional)
Campo: Lista de Objetos (opcional) ← NOVO!

→ Usuário clica em "Solicitar Orçamentos"
```

### 3. PROCESSAMENTO BACKEND

```javascript
// 1. Frontend envia POST para /api/calcular-orcamento
const response = await fetch("/api/calcular-orcamento", {
  method: "POST",
  body: JSON.stringify({
    origem: "Moema, São Paulo",
    destino: "Pinheiros, São Paulo",
    tipoImovel: "2_quartos",
    temElevador: true,
    andar: 3,
    precisaEmbalagem: true,
    nome: "João Silva",
    email: "joao@email.com",
    whatsapp: "11987654321",
    dataEstimada: "2025-12-01",
    listaObjetos: "Sofá 3 lugares, Cama queen, Geladeira..."
  })
});

// 2. API chama OpenAI para processar
const resultado = await calcularOrcamentoComIA({
  origem: "Moema, São Paulo",
  destino: "Pinheiros, São Paulo",
  // ... outros campos
});

// OpenAI retorna:
// {
//   precoMin: 850,
//   precoMax: 1200,
//   distanciaKm: 7,
//   mensagemIA: "Mudança dentro de SP...",
//   cidadeOrigem: "São Paulo",
//   estadoOrigem: "SP",
//   cidadeDestino: "São Paulo",
//   estadoDestino: "SP"
// }

// 3. API salva no banco via RPC
const { orcamentoId, hotsitesIds } = await criarOrcamentoENotificar({
  tipo: "mudanca",
  nome_cliente: "João Silva",
  email_cliente: "joao@email.com",
  telefone_cliente: "11987654321",
  whatsapp: "11987654321",
  origem_completo: "Moema, São Paulo",
  destino_completo: "Pinheiros, São Paulo",
  estado_origem: "SP",
  cidade_origem: "São Paulo",
  estado_destino: "SP",
  cidade_destino: "São Paulo",
  tipo_imovel: "2_quartos",
  tem_elevador: true,
  andar: 3,
  precisa_embalagem: true,
  distancia_km: 7,
  preco_min: 850,
  preco_max: 1200,
  mensagem_ia: "Mudança dentro de SP...",
  lista_objetos: "Sofá 3 lugares, Cama queen, Geladeira...",
  data_estimada: "2025-12-01",
  origem_formulario: "calculadora",
  user_agent: "Mozilla/5.0...",
  ip_cliente: "187.123.45.67"
});

// 4. Sistema retorna sucesso para o frontend
return {
  success: true,
  orcamentoId: "uuid...",
  hotsitesNotificados: 10
};
```

### 4. NO BANCO DE DADOS

```sql
-- 1. RPC recebe os dados
SELECT * FROM criar_orcamento_e_notificar(jsonb_build_object(
  'nome_cliente', 'João Silva',
  'email_cliente', 'joao@email.com',
  -- ... todos os campos
));

-- 2. Função busca cidade_id
SELECT id FROM cidades 
WHERE nome = 'São Paulo' AND estado = 'SP';
-- Resultado: v_cidade_id = 'uuid-da-cidade'

-- 3. Insere orçamento
INSERT INTO orcamentos (...) VALUES (...);
-- Resultado: v_orcamento_id = 'uuid-do-orcamento'

-- 4. Busca campanhas ativas
SELECT * FROM buscar_hotsites_ativos_por_cidade('uuid-da-cidade');
-- Retorna: 10 empresas ativas em São Paulo

-- 5. Cria vínculos
INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
VALUES 
  ('uuid-orcamento', 'uuid-campanha-1', 'uuid-hotsite-1'),
  ('uuid-orcamento', 'uuid-campanha-2', 'uuid-hotsite-2'),
  ... (10 registros)

-- 6. Atualiza contador
UPDATE orcamentos 
SET hotsites_notificados = 10 
WHERE id = 'uuid-orcamento';

-- 7. Retorna resultado
RETURN (orcamento_id, 10, ARRAY[campanhas_ids]);
```

---

## 🧩 COMPONENTES PRINCIPAIS

### 1. Frontend - InstantCalculatorHybrid.tsx

```typescript
// Estado principal
const [estado, setEstado] = useState<"formularioInicial" | "preview" | "capturaContato" | "resultadoFinal">("formularioInicial");
const [etapaAtual, setEtapaAtual] = useState(0);
const [formData, setFormData] = useState<FormData>({ origem: "", destino: "", ... });
const [contatoData, setContatoData] = useState<ContatoData>({ nome: "", email: "", whatsapp: "", dataEstimada: "" });
const [listaObjetos, setListaObjetos] = useState<string>(""); // ← Lista opcional

// Fluxo
formularioInicial → preview → capturaContato → resultadoFinal
```

### 2. API Route - /api/calcular-orcamento/route.ts

```typescript
export async function POST(req: Request) {
  const body = await req.json();
  
  // 1. Chamar OpenAI
  const calculoIA = await calcularOrcamentoComIA({
    origem: body.origem,
    destino: body.destino,
    tipoImovel: body.tipoImovel,
    temElevador: body.temElevador,
    andar: body.andar,
    precisaEmbalagem: body.precisaEmbalagem
  });
  
  // 2. Salvar no banco
  const resultado = await criarOrcamentoENotificar({
    ...calculoIA,
    nome_cliente: body.nome,
    email_cliente: body.email,
    telefone_cliente: body.whatsapp,
    whatsapp: body.whatsapp,
    lista_objetos: body.listaObjetos, // ← Lista incluída
    data_estimada: body.dataEstimada,
    // ... outros campos
  });
  
  return NextResponse.json({
    success: true,
    orcamentoId: resultado.orcamentoId,
    hotsitesNotificados: resultado.hotsitesIds?.length || 0
  });
}
```

### 3. Queries - lib/db/queries/orcamentos.ts

```typescript
export async function criarOrcamentoENotificar(dados: CriarOrcamentoInput) {
  const orcamentoData = {
    tipo: dados.tipo || 'mudanca',
    nome_cliente: dados.nomeCliente,
    email_cliente: dados.emailCliente,
    // ... mapear todos os campos de camelCase para snake_case
    lista_objetos: dados.listaObjetos, // ← Mapeado
    data_estimada: dados.dataEstimada && dados.dataEstimada !== '' ? dados.dataEstimada : null,
  };

  const { data, error } = await supabase.rpc('criar_orcamento_e_notificar', orcamentoData);
  
  if (error) throw error;
  
  return {
    orcamentoId: data[0].orcamento_id,
    hotsitesIds: data[0].campanhas_ids,
    hotsitesNotificados: data[0].hotsites_notificados
  };
}
```

### 4. RPC Function - criar_orcamento_e_notificar()

```sql
CREATE OR REPLACE FUNCTION criar_orcamento_e_notificar(p_dados JSONB)
RETURNS TABLE (orcamento_id UUID, hotsites_notificados INTEGER, campanhas_ids UUID[])
AS $$
DECLARE
  v_orcamento_id UUID;
  v_cidade_id UUID;
  v_hotsites_count INTEGER := 0;
  v_campanhas_array UUID[] := '{}';
BEGIN
  -- 1. Validações
  -- 2. Buscar cidade_id
  -- 3. Inserir orçamento
  -- 4. Buscar campanhas ativas
  -- 5. Criar vínculos
  -- 6. Atualizar contador
  -- 7. Retornar resultado
  
  RETURN QUERY SELECT v_orcamento_id, v_hotsites_count, v_campanhas_array;
END;
$$ LANGUAGE plpgsql;
```

---

## 💾 BANCO DE DADOS

### Tabelas Principais

#### `cidades`
```sql
id          UUID PRIMARY KEY
nome        VARCHAR(255)   -- Ex: "São Paulo"
estado      VARCHAR(2)     -- Ex: "SP"
slug        VARCHAR(255)   -- Ex: "sao-paulo-sp"
ativo       BOOLEAN
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

#### `hotsites`
```sql
id              UUID PRIMARY KEY
nome_exibicao   VARCHAR(255)
email           VARCHAR(255)
cidade_id       UUID → cidades(id)  -- ✅ Fonte da verdade
cidade          VARCHAR(255)        -- Campo de texto (sincronizado)
estado          VARCHAR(2)          -- Campo de texto (sincronizado)
ativo           BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `campanhas`
```sql
id                  UUID PRIMARY KEY
hotsite_id          UUID → hotsites(id)
plano_id            UUID → planos(id)
ativo               BOOLEAN
participa_cotacao   BOOLEAN  -- ✅ Define se recebe orçamentos
data_inicio         DATE
data_fim            DATE
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

#### `orcamentos`
```sql
id                      UUID PRIMARY KEY
tipo                    VARCHAR(50)
nome_cliente            VARCHAR(255)
email_cliente           VARCHAR(255)
telefone_cliente        VARCHAR(50)
whatsapp                VARCHAR(50)
origem_completo         TEXT
destino_completo        TEXT
estado_origem           VARCHAR(2)     -- ✅ Parseado pela IA
cidade_origem           VARCHAR(255)   -- ✅ Parseado pela IA
estado_destino          VARCHAR(2)     -- ✅ Parseado pela IA
cidade_destino          VARCHAR(255)   -- ✅ Parseado pela IA
cidade_id               UUID → cidades(id)
tipo_imovel             VARCHAR(50)
tem_elevador            BOOLEAN
andar                   INTEGER
precisa_embalagem       BOOLEAN
distancia_km            NUMERIC
preco_min               NUMERIC
preco_max               NUMERIC
mensagem_ia             TEXT
lista_objetos           TEXT           -- ✅ NOVO
arquivo_lista_url       TEXT
arquivo_lista_nome      VARCHAR(255)
data_estimada           DATE           -- ✅ Aceita NULL
origem_formulario       VARCHAR(50)
user_agent              TEXT
ip_cliente              INET
hotsites_notificados    INTEGER        -- ✅ Atualizado automaticamente
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

#### `orcamentos_campanhas`
```sql
id              UUID PRIMARY KEY
orcamento_id    UUID → orcamentos(id)
campanha_id     UUID → campanhas(id)
hotsite_id      UUID → hotsites(id)
created_at      TIMESTAMP

UNIQUE(orcamento_id, campanha_id)
```

---

## 🔧 CORREÇÕES IMPLEMENTADAS

### 1. Schema do Banco de Dados
- ✅ Padronizado relacionamentos entre tabelas
- ✅ Criado `cidade_id` como FK em `hotsites`
- ✅ Adicionado trigger para sincronizar campos de texto
- ✅ Corrigido constraint `data_estimada NOT NULL` → aceita NULL

### 2. Funções RPC
- ✅ Criado `buscar_hotsites_ativos_por_cidade()`
- ✅ Criado `buscar_hotsites_ativos_por_estado()`
- ✅ Corrigido `criar_orcamento_e_notificar()` para:
  - Priorizar busca por `cidade_id`
  - Salvar `lista_objetos` corretamente
  - Atualizar `hotsites_notificados` corretamente
  - Remover filtro `h.ativo = true` (só verifica `c.ativo`)

### 3. Row Level Security (RLS)
- ✅ Habilitado RLS em `orcamentos` e `orcamentos_campanhas`
- ✅ Criado políticas permissivas para operações CRUD
- ✅ Corrigido problema de "silent rollback"

### 4. Frontend
- ✅ Movido campo "Lista de Objetos" para ANTES do envio
- ✅ Adicionado Optional Chaining (`?.`) para prevenir erros
- ✅ Corrigido reset de `contatoData` (faltava campo `nome`)
- ✅ Melhorado UX com feedback visual

### 5. API Routes
- ✅ Integrado OpenAI para parsing de cidade/estado
- ✅ Corrigido mapeamento de campos (camelCase → snake_case)
- ✅ Adicionado envio de `lista_objetos` e `data_estimada`

### 6. TypeScript Types
- ✅ Atualizado interfaces para refletir schema do banco
- ✅ Corrigido mapeamento de `campanhas_ids` → `hotsitesIds`

---

## ✅ TESTES E VALIDAÇÃO

### Teste 1: Criar Orçamento via SQL

```sql
SELECT * FROM criar_orcamento_e_notificar(
  jsonb_build_object(
    'nome_cliente', 'João Teste',
    'email_cliente', 'joao@teste.com',
    'telefone_cliente', '11999999999',
    'whatsapp', '11999999999',
    'origem_completo', 'São Paulo, SP',
    'destino_completo', 'São Paulo, SP',
    'estado_origem', 'SP',
    'cidade_origem', 'São Paulo',
    'estado_destino', 'SP',
    'cidade_destino', 'São Paulo',
    'tipo_imovel', '2_quartos',
    'tem_elevador', true,
    'andar', 3,
    'precisa_embalagem', true,
    'distancia_km', 12,
    'preco_min', 850,
    'preco_max', 1150,
    'mensagem_ia', 'Teste',
    'lista_objetos', 'Sofá, Cama, Geladeira',
    'origem_formulario', 'teste',
    'user_agent', 'Script',
    'ip_cliente', '127.0.0.1'
  )
);

-- Resultado esperado:
-- orcamento_id | hotsites_notificados | campanhas_ids
-- uuid...      | 10                   | {uuid1, uuid2, ...}
```

### Teste 2: Verificar Dados Salvos

```sql
SELECT 
  nome_cliente,
  hotsites_notificados,
  SUBSTRING(lista_objetos, 1, 50) as lista,
  data_estimada
FROM orcamentos
WHERE nome_cliente = 'João Teste';

-- Resultado esperado:
-- nome_cliente | hotsites_notificados | lista              | data_estimada
-- João Teste   | 10                   | Sofá, Cama, Gela... | NULL ou data
```

### Teste 3: Verificar Vínculos

```sql
SELECT COUNT(*) as vinculos
FROM orcamentos_campanhas
WHERE orcamento_id = (
  SELECT id FROM orcamentos WHERE nome_cliente = 'João Teste' LIMIT 1
);

-- Resultado esperado:
-- vinculos
-- 10
```

---

## 🛠️ MANUTENÇÃO

### Comandos Úteis

#### Verificar Últimos Orçamentos
```sql
SELECT 
  nome_cliente,
  hotsites_notificados,
  created_at
FROM orcamentos
ORDER BY created_at DESC
LIMIT 10;
```

#### Verificar Campanhas Ativas em uma Cidade
```sql
SELECT * FROM buscar_hotsites_ativos_por_cidade(
  (SELECT id FROM cidades WHERE nome = 'São Paulo' AND estado = 'SP' LIMIT 1)
);
```

#### Recriar Funções
```bash
# Executar o arquivo consolidado
# No SQL Editor do Supabase:
```
→ Copie e cole o conteúdo de `scripts/SISTEMA_ORCAMENTOS_COMPLETO.sql`

#### Limpar Dados de Teste
```sql
DELETE FROM orcamentos WHERE nome_cliente LIKE '%Teste%';
DELETE FROM orcamentos WHERE nome_cliente LIKE '%TESTE%';
```

---

## 📦 ARQUIVOS IMPORTANTES

### Scripts SQL
- `scripts/SISTEMA_ORCAMENTOS_COMPLETO.sql` - **Arquivo único consolidado com todas as funções**

### Código Frontend
- `app/components/InstantCalculatorHybrid.tsx` - Formulário da calculadora
- `app/calculadora/page.tsx` - Página da calculadora

### Código Backend
- `app/api/calcular-orcamento/route.ts` - API route principal
- `lib/db/queries/orcamentos.ts` - Funções de acesso ao banco

### Documentação
- `docs/SISTEMA_COMPLETO.md` - **Este arquivo**

---

## 🎯 CHECKLIST DE FUNCIONALIDADES

- ✅ Formulário em etapas funcional
- ✅ Cálculo com IA (OpenAI)
- ✅ Parsing automático de cidade/estado
- ✅ Campo de Lista de Objetos (opcional)
- ✅ Campo de Data Estimada (opcional, aceita NULL)
- ✅ Salvamento correto no banco
- ✅ Notificação de empresas ativas
- ✅ Contador `hotsites_notificados` correto
- ✅ Vínculos `orcamentos_campanhas` criados
- ✅ RLS configurado corretamente
- ✅ Trigger de sincronização funcionando
- ✅ Admin dashboard integrado
- ✅ Sem erros de `undefined` no frontend
- ✅ Testes SQL validados

---

## 🚀 DEPLOY

Para aplicar todas as correções em produção:

1. **Banco de Dados:**
   ```sql
   -- Execute no SQL Editor do Supabase:
   -- Copie todo o conteúdo de scripts/SISTEMA_ORCAMENTOS_COMPLETO.sql
   ```

2. **Frontend/Backend:**
   ```bash
   # Já está no código, só fazer deploy normal
   git push
   # Vercel fará o deploy automaticamente
   ```

3. **Validar:**
   - Testar calculadora manualmente
   - Verificar logs do Supabase
   - Confirmar emails de notificação (se implementado)

---

**Status Final:** ✅ 100% FUNCIONAL  
**Última Atualização:** 22 de Novembro de 2025



