# 🗄️ Migrations do Supabase

## 📋 Migrations Ativas

### 1. `001_complete_schema.sql`
**Schema base inicial** do sistema

Cria todas as tabelas principais:
- `cidades` - Cidades do Brasil
- `empresas` - Empresas cadastradas
- `hotsites` - Páginas de empresas por cidade
- `campanhas` - Períodos de publicidade
- `planos` - Planos de publicidade
- `orcamentos` - Solicitações de orçamento
- `orcamentos_campanhas` - Vínculo N:N entre orçamentos e campanhas

**Status**: ✅ Base do sistema

---

### 2. `024_padronizar_schema_SAFE.sql`
**Padronização completa** executada em 2025-11-22

Principais alterações:
- ✅ Padroniza tabela `planos`
- ✅ Adiciona `participa_cotacao` e `limite_orcamentos_mes` em campanhas
- ✅ Adiciona `cidade_id` em orçamentos
- ✅ Cria/atualiza tabela `orcamentos_campanhas` completa
- ✅ Corrige foreign keys órfãs
- ✅ Cria view `vw_orcamentos_resumo`
- ✅ Atualiza RLS policies
- ✅ Recria função `criar_orcamento_e_notificar` (depois corrigida no script CORRIGIR_ORCAMENTOS_COMPLETO.sql)

**Status**: ✅ Última migração aplicada

---

## ⚙️ Funções SQL Ativas

### `criar_orcamento_e_notificar(jsonb)`
Cria orçamento e vincula com campanhas ativas automaticamente.

**Última versão**: Corrigida em `scripts/CORRIGIR_ORCAMENTOS_COMPLETO.sql` (2025-11-22)

**Melhorias:**
- Cast correto de `ip_cliente` (TEXT → INET)
- Inserção individual de vínculos com tratamento de erro
- Logging detalhado via `RAISE NOTICE`

### `buscar_hotsites_ativos_por_estado(estado, tipo)`
Retorna array de `campanha_id` de campanhas ativas em um estado.

### `sync_hotsite_city_fields()`
Função do trigger que sincroniza campos `cidade` e `estado` dos hotsites.

---

## 🔄 Triggers Ativos

### `trg_sync_hotsite_city_fields`
**Tabela**: `hotsites`  
**Execução**: `BEFORE INSERT OR UPDATE OF cidade_id`  
**Função**: Sincroniza campos de texto (`cidade`, `estado`) com dados da tabela `cidades`

**Criado em**: `scripts/SINCRONIZAR_CAMPOS_TEXTO_HOTSITES.sql`

---

## 📊 Views Ativas

### `vw_orcamentos_resumo`
Resumo de orçamentos com contadores de campanhas relacionadas e dados da cidade.

```sql
SELECT 
  o.*,
  c.nome as cidade_nome,
  c.estado as cidade_estado,
  COUNT(oc.id) as total_campanhas_relacionadas,
  COUNT(CASE WHEN oc.status = 'respondido' THEN 1 END) as campanhas_que_responderam
FROM orcamentos o
LEFT JOIN cidades c ON o.cidade_id = c.id
LEFT JOIN orcamentos_campanhas oc ON o.id = oc.orcamento_id
GROUP BY o.id, c.nome, c.estado;
```

---

## 🗑️ Limpeza Realizada (2025-11-22)

**Removidas**: 24 migrations intermediárias/debug  
**Mantidas**: 2 essenciais (schema base + padronização)  
**Motivo**: Simplificar manutenção e evitar confusão

### Migrations Removidas:
- `000_check_existing_tables.sql` - Debug temporário
- `002_` a `017_` - Correções intermediárias aplicadas
- `20250121_*` - Correções temporárias consolidadas na 024

Todas as correções foram consolidadas em `024_padronizar_schema_SAFE.sql`.

---

## ⚠️ Importante

**Ordem de Execução**:
1. `001_complete_schema.sql` - Primeira execução
2. `024_padronizar_schema_SAFE.sql` - Após 001

**Idempotência**: Ambas as migrations usam `IF EXISTS`/`IF NOT EXISTS` e são seguras para re-execução.

**Backup**: Sempre faça backup antes de executar migrations em produção.

---

**Última atualização**: 2025-11-22  
**Status**: ✅ Limpo e organizado










