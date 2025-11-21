# Transição de empresa_id para hotsite_id

## 📋 Objetivo

Remover completamente a dependência da tabela `empresas` e do campo `empresa_id`, fazendo com que **TUDO** funcione baseado apenas em `hotsites`.

## ✅ Status Atual (2025-11-21)

### Implementado

1. **Campo `hotsite_id` na tabela `campanhas`**
   - ✅ Adicionado campo `hotsite_id UUID REFERENCES hotsites(id)`
   - ✅ Criado índice `idx_campanhas_hotsite_id`
   - ✅ 37 campanhas (52.9%) já estão vinculadas via `hotsite_id`
   - ⚠️ 33 campanhas (47.1%) ainda usam apenas `empresa_id`

2. **Queries Atualizadas**
   - ✅ `getHotsitesByCidadeSlug()` - Prioriza `hotsite_id`, fallback para `empresa_id`
   - ✅ `getHotsitesCountByTipo()` - Suporta ambos os campos
   - ✅ `/admin/campanhas/page.tsx` - Exibe hotsites vinculados via `hotsite_id`

3. **Compatibilidade Temporária**
   - ✅ Sistema funciona com AMBOS os campos (`hotsite_id` e `empresa_id`)
   - ✅ Prioriza sempre `hotsite_id` quando disponível
   - ✅ Fallback automático para `empresa_id` se `hotsite_id` for NULL

## 🚧 Próximos Passos

### 1. Vincular Campanhas Restantes
```sql
-- Migrar as 33 campanhas que ainda não têm hotsite_id
UPDATE campanhas c
SET hotsite_id = (
  SELECT h.id 
  FROM hotsites h 
  WHERE h.empresa_id = c.empresa_id 
  LIMIT 1
)
WHERE c.empresa_id IS NOT NULL AND c.hotsite_id IS NULL;
```

### 2. Criar Hotsites Faltantes
Para as empresas com campanha ativa mas SEM hotsite:
- Opção A: Criar hotsites manualmente via `/admin/hotsites/novo`
- Opção B: Importar dados da tabela `empresas` para criar hotsites automaticamente

### 3. Remover `empresa_id` (FASE FINAL)
**⚠️ SOMENTE APÓS 100% das campanhas terem `hotsite_id`:**

```sql
-- 1. Verificar que todas as campanhas têm hotsite_id
SELECT COUNT(*) FROM campanhas WHERE hotsite_id IS NULL;
-- Resultado esperado: 0

-- 2. Remover campo empresa_id de campanhas
ALTER TABLE campanhas DROP COLUMN IF EXISTS empresa_id;

-- 3. Remover campo empresa_id de hotsites
ALTER TABLE hotsites DROP COLUMN IF EXISTS empresa_id;

-- 4. Apagar tabela empresas (OPCIONAL)
DROP TABLE IF EXISTS empresas CASCADE;
```

### 4. Atualizar Código
Após remover `empresa_id`:
- Remover todos os fallbacks de `empresa_id` nas queries
- Remover interface `Company` de `types.ts`
- Remover imports de `empresas.ts` (já está deprecated)
- Atualizar documentação

## 📊 Estatísticas

| Métrica | Valor Atual |
|---------|-------------|
| Total de campanhas | 70 |
| Com `hotsite_id` | 37 (52.9%) |
| SEM `hotsite_id` | 33 (47.1%) |
| Total de hotsites | 1000+ |
| Hotsites com `empresa_id` | 900+ |
| Hotsites SEM `empresa_id` | 1 |

## 🎯 Benefícios da Migração

1. **Simplicidade**: Uma única fonte de verdade (hotsites)
2. **Flexibilidade**: Hotsites não dependem de empresas
3. **Performance**: Menos JOINs nas queries
4. **Manutenção**: Menos tabelas para gerenciar
5. **Escalabilidade**: Mais fácil adicionar novos hotsites

## 📝 Notas

- O sistema está **100% funcional** durante a transição
- Não há perda de funcionalidade
- A transição é **gradual e segura**
- Pode reverter a qualquer momento (durante a transição)

## 🔗 Arquivos Relacionados

- `lib/db/queries/hotsites.ts` - Queries principais
- `app/admin/campanhas/page.tsx` - Admin de campanhas
- `supabase/migrations/20250121_add_hotsite_id_to_campanhas.sql` - Migration
- `app/types.ts` - Interfaces (Company está deprecated)

