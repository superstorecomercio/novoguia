# Mapeamento de Campos - Migração SQL Server → PostgreSQL

## Visão Geral

Este documento mapeia os campos do banco legado (SQL Server) para o novo schema (PostgreSQL/Supabase).

## Tabelas e Mapeamentos

### 1. CIDADES

#### Banco Antigo: `guiaCidade`
| Campo Antigo | Tipo Antigo | Campo Novo | Tipo Novo | Observações |
|--------------|-------------|------------|-----------|-------------|
| `codCidade` | INT | `id` | UUID | **CONVERSÃO NECESSÁRIA**: Converter INT para UUID |
| `nomCidade` | VARCHAR | `nome` | VARCHAR(255) | Mapeamento direto |

**Campos Novos (não existem no antigo)**:
- `slug` - Gerar a partir do nome (ex: "São Paulo" → "sao-paulo")
- `estado` - Extrair de outras tabelas ou mapear manualmente
- `descricao` - Opcional, pode ficar NULL
- `regiao` - Mapear manualmente por estado
- `created_at` - Usar data atual ou NULL
- `updated_at` - Usar data atual ou NULL

---

### 2. EMPRESAS

#### Banco Antigo: `guiaEmpresa`
| Campo Antigo | Tipo Antigo | Campo Novo | Tipo Novo | Observações |
|--------------|-------------|------------|-----------|-------------|
| `codEmpresa` | INT | `id` | UUID | **CONVERSÃO NECESSÁRIA**: Converter INT para UUID |
| `nomEmpresa` | VARCHAR | `nome` | VARCHAR(255) | Mapeamento direto |
| `CNPJ` | VARCHAR | `cnpj` | VARCHAR(18) | Mapeamento direto |
| `Responsavel` | VARCHAR | `responsavel` | VARCHAR(255) | Mapeamento direto |
| `telefone` | VARCHAR | `telefones` | TEXT[] | **CONVERSÃO**: String → Array |
| `Email` | VARCHAR | `email` | VARCHAR(255) | Mapeamento direto |
| `Endereco` | VARCHAR | `endereco` | VARCHAR(500) | Mapeamento direto |
| `Complemento` | VARCHAR | `complemento` | VARCHAR(255) | Mapeamento direto |
| `codCidade` | INT | `cidade_id` | UUID | **CONVERSÃO**: INT → UUID (via lookup) |

**Campos Novos (não existem no antigo)**:
- `slug` - Gerar a partir do nome (ex: "Mudanças Express" → "mudancas-express")
- `website` - Pode vir do hotsite ou NULL
- `estado` - Extrair de `codCidade` ou NULL
- `descricao` - Pode vir do hotsite ou NULL
- `ativo` - **IMPORTANTE**: Verificar se empresa está ativa no sistema antigo
- `created_at` - Usar data de cadastro ou data atual
- `updated_at` - Usar data atual

**Campos Antigos (não migrados diretamente)**:
- Campos que não têm equivalente direto serão ignorados ou mapeados para outras tabelas

---

### 3. HOTSITES

#### Banco Antigo: `guiaHotsite`
| Campo Antigo | Tipo Antigo | Campo Novo | Tipo Novo | Observações |
|--------------|-------------|------------|-----------|-------------|
| `codHotsite` | INT | `id` | UUID | **CONVERSÃO NECESSÁRIA** |
| `codEmpresa` | INT | `empresa_id` | UUID | **CONVERSÃO**: INT → UUID |
| `hotEmpresa` | VARCHAR | `nome_exibicao` | VARCHAR(255) | Mapeamento direto |
| `hotEndereco` | VARCHAR | `endereco` | VARCHAR(500) | Mapeamento direto |
| `hotCidade` | VARCHAR | `cidade` | VARCHAR(255) | Mapeamento direto |
| `hotEstado` | VARCHAR | `estado` | VARCHAR(2) | Mapeamento direto |
| `hotDescricao` | TEXT | `descricao` | TEXT | Mapeamento direto |
| `hotLogotipo` | VARCHAR | `logo_url` | TEXT | Mapeamento direto |
| `hotFoto1` | VARCHAR | `foto1_url` | TEXT | Mapeamento direto |
| `hotFoto2` | VARCHAR | `foto2_url` | TEXT | Mapeamento direto |
| `hotFoto3` | VARCHAR | `foto3_url` | TEXT | Mapeamento direto |
| `hotServico1-10` | VARCHAR | `servicos` | JSONB | **CONVERSÃO**: 10 campos → Array JSON |
| `hotDesconto1-3` | VARCHAR | `descontos` | JSONB | **CONVERSÃO**: 3 campos → Array JSON |
| `hotFormaPagto1-5` | VARCHAR | `formas_pagamento` | JSONB | **CONVERSÃO**: 5 campos → Array JSON |

**Campos Novos (não existem no antigo)**:
- `highlights` - Pode ser gerado a partir de outros campos ou NULL

**Conversão de Arrays**:
```sql
-- Exemplo: Converter hotServico1-10 em JSONB array
servicos = jsonb_build_array(
  NULLIF(hotServico1, ''),
  NULLIF(hotServico2, ''),
  ...
  NULLIF(hotServico10, '')
) FILTER (WHERE value IS NOT NULL)
```

---

### 4. ORÇAMENTOS

#### Banco Antigo: `WebOrcamento`
| Campo Antigo | Tipo Antigo | Campo Novo | Tipo Novo | Observações |
|--------------|-------------|------------|-----------|-------------|
| `codorcamento` | INT | `id` | UUID | **CONVERSÃO NECESSÁRIA** |
| `tipo` | VARCHAR | `tipo` | VARCHAR(50) | Mapeamento direto (ajustar valores) |
| `nome` | VARCHAR | `nome_cliente` | VARCHAR(255) | Mapeamento direto |
| `email` | VARCHAR | `email_cliente` | VARCHAR(255) | Mapeamento direto |
| `telefone` | VARCHAR | `telefone_cliente` | VARCHAR(20) | Mapeamento direto |
| `dataestimada` | DATE | `data_estimada` | DATE | Mapeamento direto |
| `estadoorigem` | VARCHAR | `estado_origem` | VARCHAR(2) | Mapeamento direto |
| `cidadeorigem` | VARCHAR | `cidade_origem` | VARCHAR(255) | Mapeamento direto |
| `enderecoorigem` | VARCHAR | `endereco_origem` | VARCHAR(500) | Mapeamento direto |
| `bairroorigem` | VARCHAR | `bairro_origem` | VARCHAR(255) | Mapeamento direto |
| `estadodestino` | VARCHAR | `estado_destino` | VARCHAR(2) | Mapeamento direto |
| `cidadedestino` | VARCHAR | `cidade_destino` | VARCHAR(255) | Mapeamento direto |
| `enderecodestino` | VARCHAR | `endereco_destino` | VARCHAR(500) | Mapeamento direto |
| `bairrodestino` | VARCHAR | `bairro_destino` | VARCHAR(255) | Mapeamento direto |
| `descricao` | TEXT | `descricao` | TEXT | Mapeamento direto |
| `ip` | VARCHAR | `ip_cliente` | INET | **CONVERSÃO**: VARCHAR → INET |
| `dataenvio` | DATETIME | `created_at` | TIMESTAMP | Mapeamento direto |

**Campos Novos (não existem no antigo)**:
- `preferencia_contato` - NULL ou padrão
- `tipo_origem` - NULL ou inferir de outros campos
- `tipo_destino` - NULL ou inferir de outros campos
- `comodos` - NULL (se não existir no antigo)
- `estilo_vida` - NULL (se não existir no antigo)
- `pecas` - NULL (se não existir no antigo)
- `tempo_armazenamento` - NULL (se não existir no antigo)
- `o_que_precisa` - NULL (se não existir no antigo)
- `status` - Padrão: 'pendente' ou inferir de `envios_recebaorcamentos`
- `empresa_id` - NULL (será preenchido via `orcamento_empresas`)

**Campos Antigos (não migrados diretamente)**:
- `empresaorigem`, `emailorigem`, `empresadestino`, `emaildestino` - Migrados para `orcamento_empresas`
- `envios_recebaorcamentos` - Usado para inferir status

---

### 5. ORÇAMENTO EMPRESAS

#### Banco Antigo: `painelorcamentos`
| Campo Antigo | Tipo Antigo | Campo Novo | Tipo Novo | Observações |
|--------------|-------------|------------|-----------|-------------|
| `codorcamento` | INT | `orcamento_id` | UUID | **CONVERSÃO**: INT → UUID |
| `codempresa` | INT | `empresa_id` | UUID | **CONVERSÃO**: INT → UUID |
| - | - | `enviado_em` | TIMESTAMP | Usar `dataenvio` do orçamento |
| - | - | `respondido_em` | TIMESTAMP | NULL ou inferir de outros campos |

---

### 6. PLANOS DE PUBLICIDADE

#### Banco Antigo: `guiaPublicidade`
| Campo Antigo | Tipo Antigo | Campo Novo | Tipo Novo | Observações |
|--------------|-------------|------------|-----------|-------------|
| `codPublicidade` | INT | `id` | UUID | **CONVERSÃO NECESSÁRIA** |
| `desPublicidade` | VARCHAR | `nome` | VARCHAR(50) | **CONVERSÃO**: Normalizar valores |
| - | - | `ordem` | INTEGER | Mapear manualmente: Top=1, Quality=2, etc. |

**Mapeamento de Valores**:
- "Top" → `nome = 'top'`, `ordem = 1`
- "Quality" → `nome = 'quality'`, `ordem = 2`
- "Standard" → `nome = 'standard'`, `ordem = 3`
- "Intermediário" → `nome = 'intermediario'`, `ordem = 4`

---

### 7. EMPRESA PLANOS

#### Banco Antigo: `guiaCampanha` + `guiaEmpPub`
| Campo Antigo | Tipo Antigo | Campo Novo | Tipo Novo | Observações |
|--------------|-------------|------------|-----------|-------------|
| `codEmpresa` | INT | `empresa_id` | UUID | **CONVERSÃO**: INT → UUID |
| `codPublicidade` | INT | `plano_id` | UUID | **CONVERSÃO**: INT → UUID |
| `datainicio` | DATE | `data_inicio` | DATE | Mapeamento direto |
| `datafim` | DATE | `data_fim` | DATE | Mapeamento direto |
| `valortotal` | DECIMAL | `valor` | DECIMAL(10,2) | Mapeamento direto |
| `codhotsite` | INT | - | - | Não migrado diretamente |

**Campos Novos**:
- `cidade_id` - NULL ou extrair de empresa
- `ativo` - TRUE se `datafim` é NULL ou futuro

---

## Estratégia de Migração

### Fase 1: Preparação
1. Criar tabelas de mapeamento temporárias (INT → UUID)
2. Gerar UUIDs para todos os IDs antigos
3. Criar slugs para cidades e empresas

### Fase 2: Migração de Dados Base
1. Migrar `guiaCidade` → `cidades`
2. Migrar `guiaPublicidade` → `planos_publicidade`
3. Migrar `guiaEmpresa` → `empresas`
4. Migrar `guiaHotsite` → `hotsites`

### Fase 3: Migração de Relacionamentos
1. Migrar `guiaCampanha` + `guiaEmpPub` → `empresa_planos`
2. Migrar `WebOrcamento` → `orcamentos`
3. Migrar `painelorcamentos` → `orcamento_empresas`

### Fase 4: Validação
1. Verificar integridade referencial
2. Verificar contagens de registros
3. Validar dados críticos

---

## Scripts de Migração

Os scripts de migração serão criados em:
- `supabase/migrations/003_migration_mapping.sql` - Tabelas de mapeamento
- `supabase/migrations/004_migrate_cidades.sql` - Migração de cidades
- `supabase/migrations/005_migrate_empresas.sql` - Migração de empresas
- `supabase/migrations/006_migrate_orcamentos.sql` - Migração de orçamentos
- `supabase/migrations/007_migrate_relacionamentos.sql` - Relacionamentos

---

**Última atualização**: 2024-11-20

