-- Migration: Remover verificação de data_fim na busca de campanhas ativas
-- Data: 2025-01-XX
-- Descrição: Remove a verificação de data_fim para incluir campanhas na lista de envio de emails.
--            Agora apenas o status 'ativo' será verificado, ignorando a data de vencimento.

-- ============================================
-- 1. Atualizar função buscar_hotsites_ativos_por_estado
-- ============================================
-- Remover a condição: AND (c.data_fim IS NULL OR c.data_fim >= CURRENT_DATE)
DROP FUNCTION IF EXISTS buscar_hotsites_ativos_por_estado(TEXT, TEXT);

CREATE OR REPLACE FUNCTION buscar_hotsites_ativos_por_estado(
  p_estado TEXT,
  p_tipo_servico TEXT DEFAULT 'mudanca'
)
RETURNS TABLE (
  hotsite_id UUID,
  campanha_id UUID,
  nome VARCHAR(255),
  email VARCHAR(255),
  cidade VARCHAR(255),
  estado VARCHAR(2),
  plano_ordem INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (h.id)
    h.id as hotsite_id,
    c.id as campanha_id,
    h.nome_exibicao as nome,
    h.email,
    h.cidade,
    h.estado,
    COALESCE(p.ordem, 999) as plano_ordem
  FROM hotsites h
  INNER JOIN campanhas c ON c.hotsite_id = h.id
  LEFT JOIN planos p ON c.plano_id = p.id
  WHERE 
    h.estado = p_estado
    AND h.ativo = true
    AND c.ativo = true
    AND c.participa_cotacao = true
    -- REMOVIDO: AND (c.data_fim IS NULL OR c.data_fim >= CURRENT_DATE)
    -- Agora apenas verifica se c.ativo = true, ignorando data de vencimento
    AND h.nome_exibicao IS NOT NULL
  ORDER BY h.id, COALESCE(p.ordem, 999) ASC, c.data_inicio DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_hotsites_ativos_por_estado(TEXT, TEXT) IS 
'Busca hotsites ativos por estado. Considera apenas campanhas com status ativo=true, ignorando data de vencimento.';

-- ============================================
-- 2. Atualizar função buscar_hotsites_ativos_por_cidade (se existir)
-- ============================================
DROP FUNCTION IF EXISTS buscar_hotsites_ativos_por_cidade(UUID);

CREATE OR REPLACE FUNCTION buscar_hotsites_ativos_por_cidade(
  p_cidade_id UUID
)
RETURNS TABLE (
  hotsite_id UUID,
  campanha_id UUID,
  nome VARCHAR(255),
  email VARCHAR(255),
  cidade VARCHAR(255),
  estado VARCHAR(2),
  plano_ordem INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (h.id)
    h.id as hotsite_id,
    c.id as campanha_id,
    h.nome_exibicao as nome,
    h.email,
    ci.nome as cidade,
    ci.estado as estado,
    COALESCE(p.ordem, 999) as plano_ordem
  FROM hotsites h
  INNER JOIN campanhas c ON c.hotsite_id = h.id
  INNER JOIN cidades ci ON h.cidade_id = ci.id
  LEFT JOIN planos p ON c.plano_id = p.id
  WHERE 
    h.cidade_id = p_cidade_id
    AND c.ativo = true
    AND c.participa_cotacao = true
    -- REMOVIDO: AND (c.data_fim IS NULL OR c.data_fim >= CURRENT_DATE)
    -- Agora apenas verifica se c.ativo = true, ignorando data de vencimento
    AND h.nome_exibicao IS NOT NULL
  ORDER BY h.id, COALESCE(p.ordem, 999) ASC, c.data_inicio DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_hotsites_ativos_por_cidade(UUID) IS 
'Busca hotsites ativos por cidade. Considera apenas campanhas com status ativo=true, ignorando data de vencimento.';

