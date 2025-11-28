-- Migration: Adicionar coluna status_envio_email na tabela email_tracking
-- Data: 2025-11-27
-- Descrição: Adiciona a coluna status_envio_email na tabela email_tracking para controlar
--            o status de envio dos emails (na_fila, enviando, enviado, erro)

-- Adicionar coluna status_envio_email se não existir
ALTER TABLE email_tracking 
ADD COLUMN IF NOT EXISTS status_envio_email VARCHAR(20) DEFAULT 'na_fila';

-- Adicionar coluna created_at se não existir (para rastreamento de quando foi criado)
ALTER TABLE email_tracking 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Criar índice para busca rápida por status
CREATE INDEX IF NOT EXISTS idx_email_tracking_status_envio 
ON email_tracking(status_envio_email);

-- Criar índice composto para busca por tipo e status
CREATE INDEX IF NOT EXISTS idx_email_tracking_tipo_status 
ON email_tracking(tipo_email, status_envio_email);

-- Atualizar registros existentes que não têm status definido
UPDATE email_tracking 
SET status_envio_email = CASE 
  WHEN enviado_em IS NOT NULL THEN 'enviado'
  WHEN metadata->>'status_envio' = 'na_fila' THEN 'na_fila'
  WHEN metadata->>'status_envio' = 'enviado' THEN 'enviado'
  WHEN metadata->>'status_envio' = 'erro' THEN 'erro'
  ELSE 'na_fila'
END
WHERE status_envio_email IS NULL OR status_envio_email = 'na_fila';

-- Comentário na coluna
COMMENT ON COLUMN email_tracking.status_envio_email IS 'Status do envio de email: na_fila, enviando, enviado, erro';

-- Comentário na coluna created_at
COMMENT ON COLUMN email_tracking.created_at IS 'Data e hora de criação do registro de email_tracking';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Migration 063_adicionar_status_envio_email_tracking.sql aplicada com sucesso!';
  RAISE NOTICE '  - Coluna "status_envio_email" adicionada na tabela "email_tracking"';
  RAISE NOTICE '  - Coluna "created_at" adicionada na tabela "email_tracking"';
  RAISE NOTICE '  - Índices criados para otimização';
  RAISE NOTICE '  - Registros existentes atualizados';
  RAISE NOTICE '================================================';
END $$;

