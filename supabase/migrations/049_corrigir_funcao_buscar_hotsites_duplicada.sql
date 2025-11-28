-- Migration: Corrigir função buscar_hotsites_ativos_por_estado duplicada
-- Data: 2025-11-27
-- Descrição: Remove todas as versões duplicadas da função e cria uma única versão com assinatura correta

-- Remover TODAS as versões da função (com diferentes assinaturas)
DROP FUNCTION IF EXISTS buscar_hotsites_ativos_por_estado(TEXT, TEXT);
DROP FUNCTION IF EXISTS buscar_hotsites_ativos_por_estado(TEXT);

-- Criar uma única versão da função com assinatura (TEXT) - apenas estado
CREATE OR REPLACE FUNCTION buscar_hotsites_ativos_por_estado(
  p_estado TEXT
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
LANGUAGE plpgsql
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
    UPPER(TRIM(h.estado)) = UPPER(TRIM(p_estado))
    AND c.ativo = true
    -- ÚNICO CRITÉRIO: campanha deve estar ativa
  ORDER BY h.id, COALESCE(p.ordem, 999) ASC, c.data_inicio DESC;
END;
$$;

-- Comentário
COMMENT ON FUNCTION buscar_hotsites_ativos_por_estado(TEXT) IS 'Busca campanhas por estado. Único critério: campanha.ativo = true e estado correspondente.';

