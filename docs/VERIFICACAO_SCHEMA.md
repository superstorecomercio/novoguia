# Verificação e Ajuste do Schema

## 📋 Passo a Passo para Verificar e Ajustar

### 1. Verificar Tabelas Existentes

Execute o script `000_check_existing_tables.sql` no SQL Editor do Supabase para ver quais tabelas já existem:

```sql
-- Execute: supabase/migrations/000_check_existing_tables.sql
```

Este script mostrará:
- Lista de todas as tabelas existentes
- Status de cada tabela (EXISTE ou NÃO EXISTE)

### 2. Aplicar Schema Condicional

Após verificar, execute o script `001_initial_schema_conditional.sql`:

```sql
-- Execute: supabase/migrations/001_initial_schema_conditional.sql
```

Este script:
- ✅ Cria apenas tabelas que não existem (`CREATE TABLE IF NOT EXISTS`)
- ✅ Adiciona colunas faltantes nas tabelas existentes
- ✅ Cria índices apenas se não existirem (`CREATE INDEX IF NOT EXISTS`)
- ✅ Remove e recria triggers (para garantir que estão corretos)
- ✅ Remove e recria políticas RLS (para evitar conflitos)

### 3. Verificar Colunas Faltantes

Se algumas tabelas já existem mas estão faltando colunas, o script detecta e adiciona automaticamente usando blocos `DO $$ ... END $$`.

**Colunas que serão adicionadas automaticamente se faltarem:**

#### Tabela `empresas`:
- `cnpj`
- `responsavel`
- `telefones` (array)
- `complemento`
- `estado`
- `ativo`

#### Tabela `cidades`:
- `regiao`
- `descricao`

#### Tabela `orcamentos`:
- `preferencia_contato`
- `estado_origem`
- `endereco_origem`
- `bairro_origem`
- `tipo_origem`
- `estado_destino`
- `endereco_destino`
- `bairro_destino`
- `tipo_destino`
- `comodos`
- `estilo_vida`
- `pecas`
- `tempo_armazenamento`
- `o_que_precisa`
- `ip_cliente`
- `status`

### 4. Aplicar Dados Iniciais

Após garantir que o schema está completo, execute:

```sql
-- Execute: supabase/migrations/002_seed_data.sql
```

Este script adiciona:
- Planos de publicidade (Top, Quality, Standard, Intermediário)
- Cidades principais

**Nota**: Usa `ON CONFLICT DO NOTHING` para não duplicar dados.

## ⚠️ Importante

### O que o script faz:
- ✅ Cria tabelas que não existem
- ✅ Adiciona colunas faltantes
- ✅ Cria índices que não existem
- ✅ Recria triggers e políticas RLS

### O que o script NÃO faz:
- ❌ Não remove tabelas existentes
- ❌ Não remove colunas existentes
- ❌ Não remove dados existentes
- ❌ Não modifica dados existentes

## 🔍 Verificação Manual

Se quiser verificar manualmente quais colunas existem em uma tabela:

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'nome_da_tabela'
ORDER BY ordinal_position;
```

## 📝 Checklist

- [ ] Execute `000_check_existing_tables.sql` para verificar
- [ ] Execute `001_initial_schema_conditional.sql` para ajustar
- [ ] Execute `002_seed_data.sql` para dados iniciais
- [ ] Verifique se todas as tabelas foram criadas
- [ ] Verifique se todas as colunas foram adicionadas
- [ ] Verifique se os índices foram criados
- [ ] Verifique se RLS está habilitado

## 🚨 Problemas Comuns

### Erro: "relation already exists"
- ✅ Normal! O script usa `IF NOT EXISTS`, então não causa erro
- Se ainda assim ocorrer, a tabela pode ter sido criada manualmente com estrutura diferente

### Erro: "column already exists"
- ✅ Normal! O script verifica antes de adicionar
- Se ocorrer, pode ser que a coluna já existe mas com tipo diferente

### Erro: "policy already exists"
- ✅ O script remove e recria políticas, então não deve ocorrer
- Se ocorrer, execute manualmente: `DROP POLICY IF EXISTS "nome" ON tabela;`

---

**Última atualização**: 2024-11-20

