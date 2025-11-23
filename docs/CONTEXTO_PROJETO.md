# 📚 Contexto Completo do Projeto - Guia de Mudanças

**Última atualização:** 2025-01-15

## 🎯 Visão Geral

O **Guia de Mudanças** é uma plataforma Next.js que conecta clientes que precisam de serviços de mudança com empresas especializadas. O sistema permite que empresas anunciem seus serviços e recebam orçamentos qualificados de clientes.

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 16.0.3 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS
- **Backend:** Supabase (PostgreSQL)
- **UI Components:** shadcn/ui (Radix UI)
- **Autenticação:** Supabase Auth
- **Pagamentos:** Stripe (planejado)
- **IA:** OpenAI (para cálculo de orçamentos)

## 📁 Estrutura de Pastas

```
guia-de-mudancas-next/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── calcular-orcamento/   # API de cálculo de orçamentos
│   ├── admin/                    # Área administrativa
│   │   └── hotsites/             # Gerenciamento de hotsites
│   ├── cidades/                  # Páginas públicas de cidades
│   │   └── [slug]/               # Página dinâmica por cidade
│   ├── components/               # Componentes React
│   │   ├── ui/                   # Componentes UI (shadcn)
│   │   └── admin/                # Componentes do admin
│   ├── planos/                   # Página pública de planos
│   └── types.ts                  # Tipos TypeScript
├── lib/
│   ├── db/
│   │   └── queries/              # Queries do banco de dados
│   │       ├── cidades.ts        # Queries de cidades
│   │       ├── hotsites.ts       # Queries de hotsites
│   │       └── orcamentos.ts     # Queries de orçamentos
│   ├── supabase/
│   │   └── server.ts             # Cliente Supabase server-side
│   └── utils/
│       ├── logger.ts             # Sistema de logs
│       └── rateLimiter.ts        # Rate limiting anti-spam
├── supabase/
│   └── migrations/               # Migrations do banco
├── scripts/                      # Scripts utilitários
└── logs/                         # Logs do sistema
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `cidades`
Armazena as cidades atendidas pelo sistema.
```sql
- id (UUID)
- nome (VARCHAR)
- slug (VARCHAR) UNIQUE
- estado (VARCHAR(2))
- descricao (TEXT)
- regiao (VARCHAR)
- created_at, updated_at
```

#### `empresas`
Empresas cadastradas no sistema.
```sql
- id (UUID)
- nome (VARCHAR)
- slug (VARCHAR) UNIQUE
- cnpj (VARCHAR)
- email, telefones
- cidade_id (FK → cidades)
- ativo (BOOLEAN)
- created_at, updated_at
```

#### `hotsites`
Detalhes expandidos das empresas (um por cidade).
```sql
- id (UUID)
- empresa_id (FK → empresas)
- cidade_id (FK → cidades)
- nome_exibicao (VARCHAR)
- descricao (TEXT)
- cidade, estado (TEXT - sincronizados)
- tipoempresa (VARCHAR) -- 'Empresa de Mudança', 'Carretos', 'Guarda-Móveis'
- telefone1, telefone2
- logo_url, foto1_url, foto2_url, foto3_url
- servicos (JSONB) -- Array de strings
- descontos (JSONB)
- formas_pagamento (JSONB)
- highlights (JSONB)
- verificado (BOOLEAN) -- NOVO: indica se empresa foi verificada
- created_at, updated_at
```

#### `planos`
Planos de publicidade disponíveis.
```sql
- id (UUID)
- nome (VARCHAR) UNIQUE -- 'top', 'quality', 'standard', 'intermediario'
- descricao (TEXT)
- ordem (INTEGER) UNIQUE -- Menor = maior prioridade
- preco (NUMERIC(10,2))
- periodicidade (TEXT) -- 'mensal', 'trimestral', 'anual'
- created_at
```

**Planos padrão:**
- `top`: R$ 299,90/mês (ordem 1)
- `quality`: R$ 199,90/mês (ordem 2)
- `standard`: R$ 99,90/mês (ordem 3)
- `intermediario`: R$ 49,90/mês (ordem 4)

#### `campanhas`
Períodos de publicidade das empresas.
```sql
- id (UUID)
- empresa_id (FK → empresas)
- hotsite_id (FK → hotsites)
- plano_id (FK → planos)
- ativo (BOOLEAN)
- participa_cotacao (BOOLEAN) -- Se recebe orçamentos
- data_inicio (DATE)
- data_fim (DATE)
- limite_orcamentos_mes (INTEGER)
- created_at, updated_at
```

#### `orcamentos`
Solicitações de orçamento dos clientes.
```sql
- id (UUID)
- tipo (VARCHAR) -- 'mudanca', 'carreto', 'guardamoveis'
- nome_cliente, email_cliente, telefone_cliente, whatsapp
- origem_completo, destino_completo (TEXT)
- estado_origem, cidade_origem (VARCHAR)
- estado_destino, cidade_destino (VARCHAR)
- cidade_id (FK → cidades)
- tipo_imovel (VARCHAR) -- 'kitnet', '1_quarto', '2_quartos', '3_mais', 'comercial'
- tem_elevador (BOOLEAN)
- andar (INTEGER)
- precisa_embalagem (BOOLEAN)
- distancia_km (NUMERIC)
- preco_min, preco_max (NUMERIC)
- mensagem_ia (TEXT)
- lista_objetos (TEXT)
- arquivo_lista_url, arquivo_lista_nome
- data_estimada (DATE)
- origem_formulario (VARCHAR) -- 'calculadora', etc.
- user_agent, ip_cliente
- hotsites_notificados (INTEGER)
- status (VARCHAR)
- created_at, updated_at
```

#### `orcamentos_campanhas`
Vínculo N:N entre orçamentos e campanhas.
```sql
- id (UUID)
- orcamento_id (FK → orcamentos)
- campanha_id (FK → campanhas)
- hotsite_id (FK → hotsites) -- Denormalizado
- status (VARCHAR) -- 'pendente', 'visualizado', 'respondido', 'fechado'
- created_at, updated_at
```

### Funções SQL Importantes

#### `criar_orcamento_e_notificar(JSONB)`
Cria um orçamento e vincula automaticamente com campanhas ativas do estado de destino.
- **Filtro:** Sempre busca campanhas por **ESTADO** (não por cidade)
- **Critério:** `c.ativo = true` e `c.participa_cotacao = true`
- **Retorna:** `orcamento_id`, `hotsites_notificados`, `campanhas_ids`

#### `buscar_hotsites_ativos_por_estado(TEXT, TEXT)`
Busca hotsites com campanhas ativas em um estado.
- **Parâmetros:** `p_estado`, `p_tipo_servico` (default: 'mudanca')
- **Filtros:** 
  - `UPPER(TRIM(h.estado)) = UPPER(TRIM(p_estado))`
  - `c.ativo = true`
  - `c.participa_cotacao = true`
- **Ordenação:** Por ordem do plano (menor = melhor), depois por data_inicio DESC

## 🔑 Funcionalidades Principais

### 1. Calculadora de Orçamentos (`/calculadora`)
- Formulário conversacional que coleta dados da mudança
- Usa OpenAI para calcular distância e preço estimado
- Extrai cidade/estado de origem e destino automaticamente
- Validações client-side e server-side
- **Anti-spam:**
  - Rate limiting: 5 requisições por 15 minutos (por IP/email)
  - Verificação de duplicatas: bloqueia mesmo email/origem/destino em 5 minutos
- **Máscara de telefone:** Formato brasileiro (DDD) 9XXXX-XXXX
- Salva orçamento e notifica empresas automaticamente

**Arquivos:**
- `app/components/InstantCalculatorHybrid.tsx` - Componente do formulário
- `app/api/calcular-orcamento/route.ts` - API de processamento
- `lib/db/queries/orcamentos.ts` - Queries de orçamentos
- `lib/utils/rateLimiter.ts` - Rate limiting
- `lib/utils/logger.ts` - Sistema de logs

### 2. Páginas de Cidades (`/cidades/[slug]`)
- Página pública por cidade (ex: `/cidades/sao-paulo-sp`)
- Lista empresas com campanhas ativas naquela cidade
- Filtros por tipo de serviço (Mudanças, Carretos, Guarda-Móveis)
- Ordenação por plano (melhor plano primeiro)
- Exibe badge "Verificada" apenas se `hotsite.verificado = true`

**Arquivos:**
- `app/cidades/[slug]/page.tsx` - Página principal
- `app/cidades/[slug]/mudancas/page.tsx` - Filtro por mudanças
- `app/cidades/[slug]/carretos/page.tsx` - Filtro por carretos
- `lib/db/queries/cidades.ts` - `getCidadeBySlug()`
- `lib/db/queries/hotsites.ts` - `getHotsitesByCidadeSlug()`

**Lógica de busca:**
1. Busca cidade pelo `slug` na tabela `cidades`
2. Busca campanhas ativas com JOIN em `hotsites` e `planos`
3. Filtra por `hotsite.cidade_id = cidade.id`
4. Remove duplicatas (mantém melhor plano)
5. Ordena por ordem do plano e nome

### 3. Página de Planos (`/planos`)
- Página pública para empresas verem planos de anúncio
- **Filtro por estado:** Apenas SP, RJ, PR, GO, RS mostram planos
- Outros estados: mensagem para contatar via WhatsApp
- Exibe 1 plano único (R$ 199/mês)
- Seção de FAQs

**Arquivos:**
- `app/planos/page.tsx` - Página de planos

### 4. Área Administrativa (`/admin`)
- Gerenciamento de hotsites
- Edição de dados das empresas
- Campo "verificado" para marcar empresas verificadas

**Arquivos:**
- `app/admin/hotsites/[id]/page.tsx` - Edição de hotsite
- `app/components/admin/HotsiteEditForm.tsx` - Formulário de edição
- `app/api/admin/hotsites/[id]/route.ts` - API de atualização

## 🔐 Segurança e Anti-Spam

### Rate Limiting
- **Limite:** 5 requisições por 15 minutos
- **Identificação:** Por IP ou email
- **Bloqueio:** 30 minutos após exceder limite
- **Armazenamento:** Em memória (Map)
- **Limpeza:** Automática a cada 1 hora

### Verificação de Duplicatas
- Bloqueia mesmo email + origem + destino em 5 minutos
- Consulta tabela `orcamentos`
- Retorna status 409 (Conflict) com `existingId`

### Logs
- Sistema de logs em arquivos diários
- Localização: `logs/`
- Formato: `{tipo}-{data}.log` (ex: `api-calculadora-2025-01-15.log`)
- Limpeza automática: remove logs com mais de 7 dias
- Tipos: `api-calculadora`, `db-orcamentos`, `rate-limiter`

## 📝 Migrations Importantes

### 028 - Filtrar campanhas por estado
- Modifica `criar_orcamento_e_notificar` para sempre filtrar por estado
- Remove `DISTINCT ON` para retornar todas as campanhas
- Remove filtro `h.ativo` (só considera `c.ativo`)

### 029 - Adicionar campo verificado
- Adiciona `verificado BOOLEAN DEFAULT false` em `hotsites`
- Permite marcar empresas como verificadas no admin

## 🎨 Componentes UI Principais

### shadcn/ui
- `Button` - Botões estilizados
- `Card` - Cards de conteúdo
- `Badge` - Badges de status
- `Select` - Dropdowns
- `Input` - Campos de texto

### Componentes Customizados
- `InstantCalculatorHybrid` - Calculadora de orçamentos
- `HotsiteEditForm` - Formulário de edição de hotsite
- `HotsiteListItem` - Item de lista de hotsite

## 🔄 Fluxos Principais

### Fluxo de Orçamento
1. Cliente preenche calculadora (`/calculadora`)
2. Frontend valida dados e envia para `/api/calcular-orcamento`
3. API verifica rate limit e duplicatas
4. API chama OpenAI para calcular distância/preço
5. API chama `criar_orcamento_e_notificar()` no Supabase
6. Função SQL busca campanhas ativas do estado de destino
7. Cria vínculos em `orcamentos_campanhas`
8. Retorna resultado para frontend

### Fluxo de Listagem de Cidades
1. Usuário acessa `/cidades/sao-paulo-sp`
2. `getCidadeBySlug()` busca cidade pelo slug
3. `getHotsitesByCidadeSlug()` busca campanhas ativas
4. Filtra por `cidade_id` e remove duplicatas
5. Ordena por plano e renderiza lista

## ⚙️ Configurações Importantes

### Variáveis de Ambiente
```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
OPENAI_API_KEY=
```

### Rate Limiter Config
```typescript
maxRequests: 5
windowMs: 15 * 60 * 1000 (15 minutos)
blockDurationMs: 30 * 60 * 1000 (30 minutos)
```

## 📊 Estados Disponíveis para Planos

Atualmente, os planos são exibidos apenas para:
- São Paulo (SP)
- Rio de Janeiro (RJ)
- Curitiba (PR)
- Goiânia (GO)
- Porto Alegre (RS)

Outros estados: mensagem para contatar via WhatsApp.

## 🐛 Problemas Conhecidos e Soluções

### Problema: Rate limiting causando erro 500
**Solução:** Importação dinâmica do logger para evitar problemas de inicialização.

### Problema: Campanhas não retornando todas
**Solução:** Removido `DISTINCT ON (h.id)` e filtro `h.ativo = true` da função `buscar_hotsites_ativos_por_estado`.

### Problema: Badge "Verificada" sempre aparecendo
**Solução:** Adicionado campo `verificado` na tabela `hotsites` e condição no frontend.

## 📌 Próximos Passos Sugeridos

1. Integrar página de planos com tabela `planos` do banco
2. Implementar fluxo de cadastro/assinatura de planos
3. Integrar Stripe para pagamentos
4. Adicionar dashboard de analytics para empresas
5. Implementar sistema de avaliações

## 🔗 Links Úteis

- **Logs:** `logs/README.md` - Documentação do sistema de logs
- **Migrations:** `supabase/migrations/README.md` - Documentação das migrations
- **Testes:** `scripts/test-rate-limiting.ts` - Teste de rate limiting

---

**Nota:** Este documento deve ser atualizado sempre que houver mudanças significativas no projeto.


