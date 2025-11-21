-- ============================================
-- Corrigir RLS para permitir INSERT em hotsites durante migração
-- ============================================
-- Execute este script no Supabase SQL Editor ANTES de importar hotsites
-- ============================================

-- Remover políticas antigas se existirem (para evitar conflito)
DROP POLICY IF EXISTS "Permitir INSERT em hotsites durante migração" ON hotsites;
DROP POLICY IF EXISTS "Permitir UPDATE em hotsites durante migração" ON hotsites;

-- Criar política que permite INSERT em hotsites
-- Esta política permite inserir hotsites (qualquer um pode inserir durante migração)
CREATE POLICY "Permitir INSERT em hotsites durante migração"
  ON hotsites FOR INSERT
  WITH CHECK (true);

-- Também permitir UPDATE (para atualizar hotsites existentes)
CREATE POLICY "Permitir UPDATE em hotsites durante migração"
  ON hotsites FOR UPDATE
  USING (true);

-- Comentário
COMMENT ON POLICY "Permitir INSERT em hotsites durante migração" ON hotsites IS 
  'Permite inserir hotsites durante a migração de dados. Pode ser removida após a migração.';

