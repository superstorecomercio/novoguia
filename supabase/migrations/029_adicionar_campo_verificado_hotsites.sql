-- ============================================
-- MIGRATION 029: Adicionar campo verificado em hotsites
-- ============================================
-- Adiciona campo verificado (BOOLEAN) na tabela hotsites
-- para controlar se a empresa está verificada ou não
-- ============================================

-- Adicionar coluna verificado na tabela hotsites
ALTER TABLE hotsites
ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false;

-- Comentário na coluna
COMMENT ON COLUMN hotsites.verificado IS 'Indica se a empresa foi verificada pelo administrador';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MIGRATION 029 CONCLUÍDA!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Campo verificado adicionado na tabela hotsites.';
  RAISE NOTICE 'Valor padrão: false (não verificado)';
  RAISE NOTICE '================================================';
END $$;

