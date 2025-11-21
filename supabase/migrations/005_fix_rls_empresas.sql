-- ============================================
-- MIGRATION: Ajustar RLS para permitir inserção de empresas
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Empresas públicas são visíveis" ON empresas;
DROP POLICY IF EXISTS "Empresas podem ser criadas" ON empresas;
DROP POLICY IF EXISTS "Empresas podem ser atualizadas" ON empresas;

-- Política: Permitir leitura pública de empresas ativas
CREATE POLICY "Empresas públicas são visíveis"
  ON empresas FOR SELECT
  USING (ativo = true);

-- Política: Permitir inserção de empresas (para migração)
CREATE POLICY "Empresas podem ser criadas"
  ON empresas FOR INSERT
  WITH CHECK (true);

-- Política: Permitir atualização de empresas (para migração)
CREATE POLICY "Empresas podem ser atualizadas"
  ON empresas FOR UPDATE
  USING (true);

-- Migração 005_fix_rls_empresas.sql concluída com sucesso.

