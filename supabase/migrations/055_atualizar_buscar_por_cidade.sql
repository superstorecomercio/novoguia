-- Migration: Atualizar função buscar_hotsites_ativos_por_cidade
-- Data: 2025-11-27
-- Descrição: Simplifica critérios para apenas campanha.ativo = true

-- Remover função antiga
DROP FUNCTION IF EXISTS buscar_hotsites_ativos_por_cidade(UUID);

-- Criar função simplificada
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
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (h.id)
    h.id as hotsite_id,
    c.id as campanha_id,
    h.nome_exibicao as nome,
    h.email,
    COALESCE(ci.nome, h.cidade) as cidade,
    COALESCE(ci.estado, h.estado) as estado,
    COALESCE(p.ordem, 999) as plano_ordem
  FROM hotsites h
  INNER JOIN campanhas c ON c.hotsite_id = h.id
  LEFT JOIN planos p ON c.plano_id = p.id
  LEFT JOIN cidades ci ON h.cidade_id = ci.id
  WHERE 
    h.cidade_id = p_cidade_id
    AND c.ativo = true
    -- ÚNICO CRITÉRIO: campanha deve estar ativa
  ORDER BY h.id, COALESCE(p.ordem, 999) ASC, c.data_inicio DESC;
END;
$$;

-- Comentário
COMMENT ON FUNCTION buscar_hotsites_ativos_por_cidade(UUID) IS 'Busca campanhas por cidade. Único critério: campanha.ativo = true e cidade correspondente.';

