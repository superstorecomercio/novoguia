-- ============================================
-- Corrigir RLS para permitir INSERT em campanhas durante migração
-- ============================================
-- Execute este script no Supabase SQL Editor ANTES de importar campanhas
-- ============================================

-- Remover políticas antigas se existirem (para evitar conflito)
DROP POLICY IF EXISTS "Permitir INSERT em campanhas durante migração" ON campanhas;
DROP POLICY IF EXISTS "Permitir UPDATE em campanhas durante migração" ON campanhas;

-- Criar política que permite INSERT em campanhas
-- Esta política permite inserir campanhas (qualquer um pode inserir durante migração)
CREATE POLICY "Permitir INSERT em campanhas durante migração"
  ON campanhas FOR INSERT
  WITH CHECK (true);

-- Também permitir UPDATE (para atualizar campanhas existentes)
CREATE POLICY "Permitir UPDATE em campanhas durante migração"
  ON campanhas FOR UPDATE
  USING (true);

-- Comentário
COMMENT ON POLICY "Permitir INSERT em campanhas durante migração" ON campanhas IS 
  'Permite inserir campanhas durante a migração de dados. Pode ser removida após a migração.';

