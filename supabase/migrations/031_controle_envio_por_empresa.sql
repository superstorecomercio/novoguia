-- Migration: Adicionar controle de envio de email por empresa
-- Data: 2025-11-26
-- Descrição: Adiciona campos para rastrear o envio de emails individualmente por empresa/hotsite

-- ============================================
-- ADICIONAR CAMPOS DE CONTROLE DE ENVIO
-- ============================================

-- Status de envio de email para esta empresa específica
ALTER TABLE orcamentos_campanhas 
ADD COLUMN IF NOT EXISTS status_envio_email VARCHAR(20) DEFAULT 'na_fila';

-- Número de tentativas de envio para esta empresa
ALTER TABLE orcamentos_campanhas 
ADD COLUMN IF NOT EXISTS tentativas_envio INTEGER DEFAULT 0;

-- Último erro ocorrido ao tentar enviar para esta empresa
ALTER TABLE orcamentos_campanhas 
ADD COLUMN IF NOT EXISTS ultimo_erro_envio TEXT;

-- Data/hora em que o email foi enviado com sucesso
ALTER TABLE orcamentos_campanhas 
ADD COLUMN IF NOT EXISTS email_enviado_em TIMESTAMPTZ;

-- Data/hora da última tentativa de envio
ALTER TABLE orcamentos_campanhas 
ADD COLUMN IF NOT EXISTS ultima_tentativa_envio TIMESTAMPTZ;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON COLUMN orcamentos_campanhas.status_envio_email IS 'Status do envio de email: na_fila, enviando, enviado, erro';
COMMENT ON COLUMN orcamentos_campanhas.tentativas_envio IS 'Número de tentativas de envio para esta empresa';
COMMENT ON COLUMN orcamentos_campanhas.ultimo_erro_envio IS 'Mensagem do último erro ocorrido ao tentar enviar';
COMMENT ON COLUMN orcamentos_campanhas.email_enviado_em IS 'Data/hora em que o email foi enviado com sucesso';
COMMENT ON COLUMN orcamentos_campanhas.ultima_tentativa_envio IS 'Data/hora da última tentativa de envio';

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orcamentos_campanhas_status_envio 
ON orcamentos_campanhas(status_envio_email);

CREATE INDEX IF NOT EXISTS idx_orcamentos_campanhas_tentativas 
ON orcamentos_campanhas(tentativas_envio);

-- ============================================
-- ATUALIZAR DADOS EXISTENTES
-- ============================================

-- Para orçamentos que já foram enviados, marcar como "enviado"
UPDATE orcamentos_campanhas oc
SET status_envio_email = 'enviado',
    email_enviado_em = oc.created_at
WHERE EXISTS (
  SELECT 1 FROM orcamentos o
  WHERE o.id = oc.orcamento_id
    AND o.status_envio_email = 'enviado'
)
AND oc.status_envio_email = 'na_fila';

-- Para orçamentos com erro, marcar como "erro"
UPDATE orcamentos_campanhas oc
SET status_envio_email = 'erro',
    tentativas_envio = COALESCE((
      SELECT o.tentativas_envio FROM orcamentos o
      WHERE o.id = oc.orcamento_id
    ), 0),
    ultimo_erro_envio = (
      SELECT o.ultimo_erro_envio FROM orcamentos o
      WHERE o.id = oc.orcamento_id
    )
WHERE EXISTS (
  SELECT 1 FROM orcamentos o
  WHERE o.id = oc.orcamento_id
    AND o.status_envio_email = 'erro'
)
AND oc.status_envio_email = 'na_fila';

-- ============================================
-- FUNÇÃO AUXILIAR: Obter resumo de envios por orçamento
-- ============================================

CREATE OR REPLACE FUNCTION obter_resumo_envios_orcamento(p_orcamento_id UUID)
RETURNS TABLE (
  total_empresas INTEGER,
  na_fila INTEGER,
  enviando INTEGER,
  enviados INTEGER,
  com_erro INTEGER,
  todas_enviadas BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_empresas,
    COUNT(*) FILTER (WHERE status_envio_email = 'na_fila')::INTEGER as na_fila,
    COUNT(*) FILTER (WHERE status_envio_email = 'enviando')::INTEGER as enviando,
    COUNT(*) FILTER (WHERE status_envio_email = 'enviado')::INTEGER as enviados,
    COUNT(*) FILTER (WHERE status_envio_email = 'erro')::INTEGER as com_erro,
    (COUNT(*) FILTER (WHERE status_envio_email = 'enviado') = COUNT(*))::BOOLEAN as todas_enviadas
  FROM orcamentos_campanhas
  WHERE orcamento_id = p_orcamento_id;
END;
$$;

COMMENT ON FUNCTION obter_resumo_envios_orcamento(UUID) IS 
'Retorna resumo do status de envio de emails para todas as empresas de um orçamento';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Migration 031_controle_envio_por_empresa.sql aplicada com sucesso!';
  RAISE NOTICE '  - Campos de controle de envio adicionados à tabela "orcamentos_campanhas"';
  RAISE NOTICE '  - Função "obter_resumo_envios_orcamento" criada';
  RAISE NOTICE '  - Dados existentes atualizados';
  RAISE NOTICE '================================================';
END $$;



