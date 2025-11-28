-- ============================================
-- MIGRATION: Adicionar Foreign Key para modelo_id
-- ============================================
-- Descrição: Adiciona FK entre whatsapp_bots e modelos_bots
-- Data: 2025-11-26
-- IMPORTANTE: Execute após as migrations 040, 041

-- Adicionar Foreign Key
DO $$
BEGIN
  -- Verificar se a FK já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'whatsapp_bots_modelo_id_fkey'
  ) THEN
    -- Verificar se a tabela modelos_bots existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'modelos_bots'
    ) THEN
      ALTER TABLE whatsapp_bots
      ADD CONSTRAINT whatsapp_bots_modelo_id_fkey
      FOREIGN KEY (modelo_id) REFERENCES modelos_bots(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'Foreign Key adicionada com sucesso';
    ELSE
      RAISE NOTICE 'Tabela modelos_bots não existe ainda. Execute a migration 041 primeiro.';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign Key já existe';
  END IF;
END $$;

-- ============================================
-- FIM DA MIGRATION
-- ============================================


