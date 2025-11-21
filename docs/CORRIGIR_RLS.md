# 🔒 Corrigir RLS (Row Level Security) para Migração

## ⚠️ Problema

Ao tentar importar dados, você recebeu o erro:
```
new row violates row-level security policy for table "cidades"
```

Isso acontece porque o RLS está bloqueando inserções via `anon key`.

## ✅ Solução

Execute o script SQL abaixo no Supabase SQL Editor:

```sql
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Cidades são públicas" ON cidades;
DROP POLICY IF EXISTS "Cidades podem ser criadas" ON cidades;

-- Política: Permitir leitura pública de cidades
CREATE POLICY "Cidades são públicas"
  ON cidades FOR SELECT
  USING (true);

-- Política: Permitir inserção de cidades (para migração)
CREATE POLICY "Cidades podem ser criadas"
  ON cidades FOR INSERT
  WITH CHECK (true);

-- Política: Permitir atualização de cidades (para migração)
CREATE POLICY "Cidades podem ser atualizadas"
  ON cidades FOR UPDATE
  USING (true);
```

Ou execute o arquivo completo:
- `supabase/migrations/004_fix_rls_cidades.sql`

## 🔄 Depois de Executar

Execute novamente a importação:

```bash
npx tsx scripts/migrate/import/01_import_cidades_csv.ts
```

## 📝 Nota de Segurança

**IMPORTANTE**: Essas políticas permitem inserção pública. Depois da migração, você pode:
1. Remover a política de INSERT
2. Criar uma política mais restritiva que exija autenticação
3. Ou manter assim se quiser permitir inserção pública (não recomendado para produção)

