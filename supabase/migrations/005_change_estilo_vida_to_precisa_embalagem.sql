-- ============================================
-- Alterar campo estilo_vida para precisa_embalagem
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Renomear coluna estilo_vida para precisa_embalagem e alterar tipo para BOOLEAN
ALTER TABLE orcamentos 
  RENAME COLUMN estilo_vida TO precisa_embalagem;

ALTER TABLE orcamentos 
  ALTER COLUMN precisa_embalagem TYPE BOOLEAN 
  USING CASE 
    WHEN precisa_embalagem IS NULL THEN NULL
    WHEN precisa_embalagem = 'luxo' THEN TRUE
    WHEN precisa_embalagem = 'comercial' THEN TRUE
    ELSE FALSE
  END;

-- Comentário
COMMENT ON COLUMN orcamentos.precisa_embalagem IS 'Indica se o cliente precisa de serviço de embalagem dos móveis';

