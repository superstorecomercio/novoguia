-- ============================================
-- MIGRATION: Ajustar RLS para permitir inserção de cidades
-- ============================================
-- O RLS estava bloqueando inserções via anon key
-- ============================================

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

-- Migração 004_fix_rls_cidades.sql concluída com sucesso.

