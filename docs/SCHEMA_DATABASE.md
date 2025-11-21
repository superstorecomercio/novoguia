# Schema do Banco de Dados - Guia de Mudanças

## Visão Geral

Este documento descreve o schema completo do banco de dados PostgreSQL no Supabase para o Guia de Mudanças.

## Tabelas Principais

### 1. `cidades`
Armazena as cidades atendidas pelo sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `nome` | VARCHAR(255) | Nome da cidade |
| `slug` | VARCHAR(255) | Slug único para URL |
| `estado` | VARCHAR(2) | Sigla do estado (SP, RJ, etc.) |
| `descricao` | TEXT | Descrição opcional |
| `regiao` | VARCHAR(50) | Região do Brasil |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

**Índices:**
- `idx_cidades_slug` - Busca por slug
- `idx_cidades_estado` - Busca por estado
- `idx_cidades_regiao` - Busca por região

---

### 2. `empresas`
Tabela principal de empresas de mudança cadastradas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `nome` | VARCHAR(255) | Nome da empresa |
| `slug` | VARCHAR(255) | Slug único para URL |
| `cnpj` | VARCHAR(18) | CNPJ da empresa |
| `responsavel` | VARCHAR(255) | Nome do responsável |
| `email` | VARCHAR(255) | E-mail de contato |
| `telefones` | TEXT[] | Array de telefones |
| `website` | VARCHAR(500) | Site da empresa |
| `endereco` | VARCHAR(500) | Endereço completo |
| `complemento` | VARCHAR(255) | Complemento do endereço |
| `cidade_id` | UUID | FK para `cidades` |
| `estado` | VARCHAR(2) | Estado da empresa |
| `descricao` | TEXT | Descrição da empresa |
| `ativo` | BOOLEAN | Se a empresa está ativa |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

**Relacionamentos:**
- `cidade_id` → `cidades.id`

**Índices:**
- `idx_empresas_cidade` - Busca por cidade
- `idx_empresas_ativo` - Filtro de empresas ativas
- `idx_empresas_slug` - Busca por slug
- `idx_empresas_estado` - Busca por estado

---

### 3. `hotsites`
Detalhes expandidos e informações de marketing das empresas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `empresa_id` | UUID | FK para `empresas` (UNIQUE) |
| `nome_exibicao` | VARCHAR(255) | Nome para exibição |
| `descricao` | TEXT | Descrição expandida |
| `endereco` | VARCHAR(500) | Endereço do hotsite |
| `cidade` | VARCHAR(255) | Cidade |
| `estado` | VARCHAR(2) | Estado |
| `logo_url` | TEXT | URL do logo |
| `foto1_url` | TEXT | URL da foto 1 |
| `foto2_url` | TEXT | URL da foto 2 |
| `foto3_url` | TEXT | URL da foto 3 |
| `servicos` | JSONB | Array de serviços oferecidos |
| `descontos` | JSONB | Array de descontos |
| `formas_pagamento` | JSONB | Array de formas de pagamento |
| `highlights` | JSONB | Array de diferenciais |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

**Relacionamentos:**
- `empresa_id` → `empresas.id` (1:1)

**Índices:**
- `idx_hotsites_empresa` - Busca por empresa

---

### 4. `planos_publicidade`
Tipos de planos de publicidade disponíveis.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `nome` | VARCHAR(50) | Nome do plano (top, quality, standard, intermediario) |
| `descricao` | TEXT | Descrição do plano |
| `ordem` | INTEGER | Ordem de prioridade (menor = maior prioridade) |
| `created_at` | TIMESTAMP | Data de criação |

**Valores padrão:**
- `top` - ordem 1
- `quality` - ordem 2
- `standard` - ordem 3
- `intermediario` - ordem 4

---

### 5. `empresa_planos`
Relacionamento entre empresas e planos de publicidade.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `empresa_id` | UUID | FK para `empresas` |
| `plano_id` | UUID | FK para `planos_publicidade` |
| `cidade_id` | UUID | FK para `cidades` (opcional) |
| `data_inicio` | DATE | Data de início do plano |
| `data_fim` | DATE | Data de fim do plano (opcional) |
| `valor` | DECIMAL(10,2) | Valor pago pelo plano |
| `ativo` | BOOLEAN | Se o plano está ativo |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

**Relacionamentos:**
- `empresa_id` → `empresas.id`
- `plano_id` → `planos_publicidade.id`
- `cidade_id` → `cidades.id`

**Índices:**
- `idx_empresa_planos_empresa` - Busca por empresa
- `idx_empresa_planos_plano` - Busca por plano
- `idx_empresa_planos_cidade` - Busca por cidade
- `idx_empresa_planos_ativo` - Filtro de planos ativos
- `idx_empresa_planos_data` - Filtro por período

---

### 6. `campanhas`
Histórico de campanhas publicitárias.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `empresa_id` | UUID | FK para `empresas` |
| `plano_id` | UUID | FK para `planos_publicidade` |
| `data_inicio` | DATE | Data de início |
| `data_fim` | DATE | Data de fim |
| `valor_total` | DECIMAL(10,2) | Valor total da campanha |
| `data_cobranca` | DATE | Data de cobrança |
| `created_at` | TIMESTAMP | Data de criação |

**Relacionamentos:**
- `empresa_id` → `empresas.id`
- `plano_id` → `planos_publicidade.id`

---

### 7. `orcamentos`
Orçamentos solicitados pelos clientes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `tipo` | VARCHAR(50) | Tipo de serviço (mudanca, carreto, guardamoveis, etc.) |
| `nome_cliente` | VARCHAR(255) | Nome do cliente |
| `email_cliente` | VARCHAR(255) | E-mail do cliente |
| `telefone_cliente` | VARCHAR(20) | Telefone do cliente |
| `preferencia_contato` | JSONB | Array de preferências (whatsapp, email, telefone) |
| `estado_origem` | VARCHAR(2) | Estado de origem |
| `cidade_origem` | VARCHAR(255) | Cidade de origem |
| `endereco_origem` | VARCHAR(500) | Endereço de origem |
| `bairro_origem` | VARCHAR(255) | Bairro de origem |
| `tipo_origem` | VARCHAR(50) | Tipo de imóvel origem (casa, apartamento, comercial) |
| `estado_destino` | VARCHAR(2) | Estado de destino |
| `cidade_destino` | VARCHAR(255) | Cidade de destino |
| `endereco_destino` | VARCHAR(500) | Endereço de destino |
| `bairro_destino` | VARCHAR(255) | Bairro de destino |
| `tipo_destino` | VARCHAR(50) | Tipo de imóvel destino |
| `descricao` | TEXT | Descrição geral |
| `comodos` | INTEGER | Número de cômodos (para mudanças) |
| `estilo_vida` | VARCHAR(50) | Estilo de vida (minimalista, padrao, luxo, comercial) |
| `pecas` | INTEGER | Número de peças (para carretos) |
| `tempo_armazenamento` | VARCHAR(255) | Tempo de armazenamento (para guarda-móveis) |
| `o_que_precisa` | TEXT | O que precisa (para guarda-móveis) |
| `data_estimada` | DATE | Data estimada da mudança |
| `ip_cliente` | INET | IP do cliente (para rate limiting) |
| `status` | VARCHAR(50) | Status (pendente, enviado, respondido) |
| `empresa_id` | UUID | FK para `empresas` (se for orçamento específico) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

**Relacionamentos:**
- `empresa_id` → `empresas.id` (opcional)

**Índices:**
- `idx_orcamentos_email` - Busca por e-mail
- `idx_orcamentos_created` - Ordenação por data
- `idx_orcamentos_status` - Filtro por status
- `idx_orcamentos_tipo` - Filtro por tipo
- `idx_orcamentos_cidade_origem` - Busca por cidade origem
- `idx_orcamentos_cidade_destino` - Busca por cidade destino
- `idx_orcamentos_empresa` - Busca por empresa específica

---

### 8. `orcamento_empresas`
Relacionamento N:N entre orçamentos e empresas que receberam o orçamento.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `orcamento_id` | UUID | FK para `orcamentos` |
| `empresa_id` | UUID | FK para `empresas` |
| `enviado_em` | TIMESTAMP | Quando foi enviado para a empresa |
| `respondido_em` | TIMESTAMP | Quando a empresa respondeu |

**Relacionamentos:**
- `orcamento_id` → `orcamentos.id`
- `empresa_id` → `empresas.id`

**Constraint:**
- UNIQUE(`orcamento_id`, `empresa_id`) - Uma empresa só pode receber o mesmo orçamento uma vez

**Índices:**
- `idx_orcamento_empresas_orcamento` - Busca por orçamento
- `idx_orcamento_empresas_empresa` - Busca por empresa

---

### 9. `empresa_servicos`
Tipos de serviço oferecidos por cada empresa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `empresa_id` | UUID | FK para `empresas` |
| `tipo_servico` | VARCHAR(50) | Tipo (mudanca, carreto, guardamoveis, etc.) |
| `areas_atendidas` | TEXT[] | Array de bairros/cidades atendidas |
| `created_at` | TIMESTAMP | Data de criação |

**Relacionamentos:**
- `empresa_id` → `empresas.id`

**Constraint:**
- UNIQUE(`empresa_id`, `tipo_servico`) - Uma empresa só pode ter um registro por tipo de serviço

**Índices:**
- `idx_empresa_servicos_empresa` - Busca por empresa
- `idx_empresa_servicos_tipo` - Busca por tipo de serviço

---

## Row Level Security (RLS)

Todas as tabelas têm RLS habilitado. As políticas básicas são:

### Leitura Pública Permitida:
- `cidades` - Todas
- `empresas` - Apenas empresas ativas (`ativo = true`)
- `hotsites` - Apenas de empresas ativas
- `planos_publicidade` - Todas
- `empresa_planos` - Apenas planos ativos
- `empresa_servicos` - Apenas de empresas ativas

### Escrita Pública Permitida:
- `orcamentos` - Qualquer um pode criar
- `orcamento_empresas` - Qualquer um pode criar relacionamento

### Acesso Administrativo:
Políticas administrativas serão criadas em migration separada quando implementar autenticação.

---

## Triggers

### `update_updated_at_column()`
Função que atualiza automaticamente o campo `updated_at` quando um registro é modificado.

**Aplicado em:**
- `cidades`
- `empresas`
- `hotsites`
- `empresa_planos`
- `orcamentos`

---

## Queries Úteis

### Buscar empresas por cidade ordenadas por plano
```sql
SELECT e.*, pp.nome as plano_nome, pp.ordem as plano_ordem
FROM empresas e
LEFT JOIN empresa_planos ep ON e.id = ep.empresa_id AND ep.ativo = true
LEFT JOIN planos_publicidade pp ON ep.plano_id = pp.id
WHERE e.cidade_id = 'uuid-da-cidade'
  AND e.ativo = true
ORDER BY pp.ordem ASC NULLS LAST, e.created_at DESC;
```

### Buscar empresas que atendem origem OU destino
```sql
SELECT DISTINCT e.*
FROM empresas e
INNER JOIN empresa_servicos es ON e.id = es.empresa_id
WHERE e.ativo = true
  AND (
    e.cidade_id IN (SELECT id FROM cidades WHERE nome = 'Cidade Origem')
    OR 'Cidade Destino' = ANY(es.areas_atendidas)
  );
```

---

**Última atualização**: 2024-11-20

