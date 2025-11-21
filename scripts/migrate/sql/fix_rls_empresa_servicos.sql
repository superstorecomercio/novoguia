-- ============================================
-- Corrigir RLS para permitir INSERT em empresa_servicos durante migração
-- ============================================
-- Execute este script no Supabase SQL Editor ANTES de importar tipos de serviço
-- ============================================

-- Remover políticas antigas se existirem (para evitar conflito)
DROP POLICY IF EXISTS "Permitir INSERT em empresa_servicos durante migração" ON empresa_servicos;
DROP POLICY IF EXISTS "Permitir UPDATE em empresa_servicos durante migração" ON empresa_servicos;

-- Criar política que permite INSERT em empresa_servicos
-- Esta política permite inserir tipos de serviço (qualquer um pode inserir durante migração)
CREATE POLICY "Permitir INSERT em empresa_servicos durante migração"
  ON empresa_servicos FOR INSERT
  WITH CHECK (true);

-- Também permitir UPDATE (para atualizar tipos de serviço existentes)
CREATE POLICY "Permitir UPDATE em empresa_servicos durante migração"
  ON empresa_servicos FOR UPDATE
  USING (true);

-- Comentário
COMMENT ON POLICY "Permitir INSERT em empresa_servicos durante migração" ON empresa_servicos IS 
  'Permite inserir tipos de serviço durante a migração de dados. Pode ser removida após a migração.';

