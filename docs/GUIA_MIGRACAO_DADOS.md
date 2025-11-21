# Guia Completo de Migração de Dados

## Visão Geral

Este guia explica como migrar dados do banco legado (SQL Server) para o novo banco (PostgreSQL/Supabase).

## Pré-requisitos

1. ✅ Acesso ao banco SQL Server legado
2. ✅ Acesso ao Supabase (PostgreSQL)
3. ✅ Schema novo já criado (executar migrations 001 e 002)
4. ✅ Ferramenta para exportar/importar dados (pgAdmin, DBeaver, ou scripts)

## Estratégia de Migração

### Opção 1: Migração Direta (Recomendada para volumes pequenos/médios)

1. Exportar dados do SQL Server para CSV/JSON
2. Importar para tabelas temporárias no PostgreSQL
3. Executar scripts de migração que fazem transformações
4. Validar dados

### Opção 2: Migração Incremental (Recomendada para volumes grandes)

1. Migrar dados em lotes (batches)
2. Validar cada lote antes de continuar
3. Ajustar scripts conforme necessário

## Processo Passo a Passo

### Fase 1: Preparação

#### 1.1 Criar Tabelas de Mapeamento

Execute no Supabase:
```sql
-- Execute: supabase/migrations/003_migration_mapping.sql
```

Isso cria:
- Tabelas de mapeamento (INT → UUID)
- Funções auxiliares (gerar slugs, converter arrays, etc.)

#### 1.2 Exportar Dados do SQL Server

Para cada tabela, exporte para CSV ou crie queries de exportação:

**Exemplo para Cidades:**
```sql
-- No SQL Server
SELECT codCidade, nomCidade
FROM guiaCidade
ORDER BY codCidade;
```

**Exemplo para Empresas:**
```sql
-- No SQL Server
SELECT 
  codEmpresa,
  nomEmpresa,
  CNPJ,
  Responsavel,
  telefone,
  Email,
  Endereco,
  Complemento,
  codCidade
FROM guiaEmpresa
ORDER BY codEmpresa;
```

### Fase 2: Importar Dados Temporários

#### 2.1 Criar Tabelas Temporárias no PostgreSQL

```sql
-- Cidades
CREATE TABLE temp_guia_cidade (
  codCidade INT PRIMARY KEY,
  nomCidade VARCHAR(255) NOT NULL
);

-- Empresas
CREATE TABLE temp_guia_empresa (
  codEmpresa INT PRIMARY KEY,
  nomEmpresa VARCHAR(255),
  CNPJ VARCHAR(18),
  Responsavel VARCHAR(255),
  telefone VARCHAR(255),
  Email VARCHAR(255),
  Endereco VARCHAR(500),
  Complemento VARCHAR(255),
  codCidade INT
);

-- Hotsites
CREATE TABLE temp_guia_hotsite (
  codHotsite INT PRIMARY KEY,
  codEmpresa INT,
  hotEmpresa VARCHAR(255),
  hotEndereco VARCHAR(500),
  hotCidade VARCHAR(255),
  hotEstado VARCHAR(2),
  hotDescricao TEXT,
  hotLogotipo VARCHAR(500),
  hotFoto1 VARCHAR(500),
  hotFoto2 VARCHAR(500),
  hotFoto3 VARCHAR(500),
  hotServico1 VARCHAR(255),
  hotServico2 VARCHAR(255),
  hotServico3 VARCHAR(255),
  hotServico4 VARCHAR(255),
  hotServico5 VARCHAR(255),
  hotServico6 VARCHAR(255),
  hotServico7 VARCHAR(255),
  hotServico8 VARCHAR(255),
  hotServico9 VARCHAR(255),
  hotServico10 VARCHAR(255),
  hotDesconto1 VARCHAR(255),
  hotDesconto2 VARCHAR(255),
  hotDesconto3 VARCHAR(255),
  hotFormaPagto1 VARCHAR(255),
  hotFormaPagto2 VARCHAR(255),
  hotFormaPagto3 VARCHAR(255),
  hotFormaPagto4 VARCHAR(255),
  hotFormaPagto5 VARCHAR(255)
);

-- Orçamentos
CREATE TABLE temp_web_orcamento (
  codorcamento INT PRIMARY KEY,
  tipo VARCHAR(50),
  nome VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  dataestimada DATE,
  estadoorigem VARCHAR(2),
  cidadeorigem VARCHAR(255),
  enderecoorigem VARCHAR(500),
  bairroorigem VARCHAR(255),
  estadodestino VARCHAR(2),
  cidadedestino VARCHAR(255),
  enderecodestino VARCHAR(500),
  bairrodestino VARCHAR(255),
  descricao TEXT,
  ip VARCHAR(50),
  dataenvio TIMESTAMP
);

-- Planos de Publicidade
CREATE TABLE temp_guia_publicidade (
  codPublicidade INT PRIMARY KEY,
  desPublicidade VARCHAR(255)
);

-- Campanhas/Empresa Planos
CREATE TABLE temp_guia_campanha (
  codCampanha INT PRIMARY KEY,
  codEmpresa INT,
  codPublicidade INT,
  datainicio DATE,
  datafim DATE,
  valortotal DECIMAL(10,2)
);

-- Orçamento Empresas
CREATE TABLE temp_painel_orcamentos (
  codempresa INT,
  codorcamento INT,
  PRIMARY KEY (codempresa, codorcamento)
);
```

#### 2.2 Importar Dados

Use pgAdmin, DBeaver ou `COPY` command:

```sql
-- Exemplo usando COPY (ajuste o caminho)
COPY temp_guia_cidade FROM '/caminho/para/cidades.csv' WITH CSV HEADER;
```

### Fase 3: Executar Migrações

#### 3.1 Migrar Cidades

```sql
-- Execute: supabase/migrations/004_migrate_cidades.sql
```

**Ajustes necessários:**
- Preencher campo `estado` manualmente ou via lookup
- Preencher campo `regiao` baseado no estado

#### 3.2 Migrar Planos de Publicidade

```sql
-- Execute: supabase/migrations/005_migrate_planos.sql (será criado)
```

#### 3.3 Migrar Empresas

```sql
-- Execute: supabase/migrations/006_migrate_empresas.sql (será criado)
```

#### 3.4 Migrar Hotsites

```sql
-- Execute: supabase/migrations/007_migrate_hotsites.sql (será criado)
```

#### 3.5 Migrar Orçamentos

```sql
-- Execute: supabase/migrations/008_migrate_orcamentos.sql (será criado)
```

#### 3.6 Migrar Relacionamentos

```sql
-- Execute: supabase/migrations/009_migrate_relacionamentos.sql (será criado)
```

### Fase 4: Validação

#### 4.1 Verificar Contagens

```sql
-- Comparar contagens
SELECT 
  'Cidades' as tabela,
  (SELECT COUNT(*) FROM temp_guia_cidade) as antigo,
  (SELECT COUNT(*) FROM cidades) as novo;

SELECT 
  'Empresas' as tabela,
  (SELECT COUNT(*) FROM temp_guia_empresa) as antigo,
  (SELECT COUNT(*) FROM empresas) as novo;
```

#### 4.2 Verificar Integridade Referencial

```sql
-- Empresas sem cidade válida
SELECT COUNT(*) 
FROM empresas e
LEFT JOIN cidades c ON e.cidade_id = c.id
WHERE e.cidade_id IS NOT NULL AND c.id IS NULL;

-- Orçamentos sem empresa válida (quando empresa_id não é NULL)
SELECT COUNT(*)
FROM orcamentos o
LEFT JOIN empresas e ON o.empresa_id = e.id
WHERE o.empresa_id IS NOT NULL AND e.id IS NULL;
```

#### 4.3 Verificar Dados Críticos

```sql
-- Empresas sem nome
SELECT COUNT(*) FROM empresas WHERE nome IS NULL OR nome = '';

-- Cidades sem slug
SELECT COUNT(*) FROM cidades WHERE slug IS NULL OR slug = '';

-- Orçamentos sem email
SELECT COUNT(*) FROM orcamentos WHERE email_cliente IS NULL OR email_cliente = '';
```

### Fase 5: Limpeza

#### 5.1 Remover Tabelas Temporárias

```sql
DROP TABLE IF EXISTS temp_guia_cidade;
DROP TABLE IF EXISTS temp_guia_empresa;
DROP TABLE IF EXISTS temp_guia_hotsite;
DROP TABLE IF EXISTS temp_web_orcamento;
DROP TABLE IF EXISTS temp_guia_publicidade;
DROP TABLE IF EXISTS temp_guia_campanha;
DROP TABLE IF EXISTS temp_painel_orcamentos;
```

#### 5.2 Manter Tabelas de Mapeamento (Opcional)

As tabelas de mapeamento podem ser úteis para referência futura. Você pode:
- Manter por um período (ex: 30 dias)
- Exportar para backup
- Remover após validação completa

## Tratamento de Campos Diferentes

### Campos que Não Existem no Antigo

**Estratégia**: Preencher com valores padrão ou NULL

Exemplos:
- `slug` → Gerar automaticamente
- `ativo` → TRUE por padrão (ou verificar lógica no sistema antigo)
- `regiao` → Mapear manualmente por estado
- `preferencia_contato` → NULL ou padrão

### Campos que Não Existem no Novo

**Estratégia**: Ignorar ou mapear para campos equivalentes

Exemplos:
- Campos de auditoria antigos → Não migrados
- Campos deprecados → Ignorados

### Conversões Necessárias

1. **INT → UUID**: Via tabelas de mapeamento
2. **VARCHAR → TEXT[]**: Via função `telefone_to_array()`
3. **Múltiplos campos → JSONB**: Via funções auxiliares
4. **VARCHAR → INET**: Conversão direta (validar formato)

## Scripts de Migração Disponíveis

1. ✅ `003_migration_mapping.sql` - Tabelas e funções auxiliares
2. ✅ `004_migrate_cidades.sql` - Migração de cidades
3. ⏳ `005_migrate_planos.sql` - Migração de planos (a criar)
4. ⏳ `006_migrate_empresas.sql` - Migração de empresas (a criar)
5. ⏳ `007_migrate_hotsites.sql` - Migração de hotsites (a criar)
6. ⏳ `008_migrate_orcamentos.sql` - Migração de orçamentos (a criar)
7. ⏳ `009_migrate_relacionamentos.sql` - Relacionamentos (a criar)

## Checklist de Migração

- [ ] Schema novo criado e validado
- [ ] Tabelas de mapeamento criadas
- [ ] Dados exportados do SQL Server
- [ ] Dados importados para tabelas temporárias
- [ ] Cidades migradas e validadas
- [ ] Planos migrados e validados
- [ ] Empresas migradas e validadas
- [ ] Hotsites migrados e validados
- [ ] Orçamentos migrados e validados
- [ ] Relacionamentos migrados e validados
- [ ] Validação completa realizada
- [ ] Tabelas temporárias removidas
- [ ] Backup criado

## Troubleshooting

### Erro: "duplicate key value violates unique constraint"

**Causa**: Slug duplicado ou ID já existe

**Solução**: 
- Verificar função `generate_slug()` 
- Usar `ON CONFLICT DO UPDATE` ou `ON CONFLICT DO NOTHING`

### Erro: "foreign key constraint fails"

**Causa**: Referência a registro que não existe

**Solução**: 
- Verificar ordem de migração (cidades antes de empresas)
- Verificar tabelas de mapeamento

### Erro: "invalid input syntax for type uuid"

**Causa**: Tentando inserir INT onde espera UUID

**Solução**: 
- Usar tabela de mapeamento para converter
- Verificar JOINs nas queries de migração

---

**Última atualização**: 2024-11-20

