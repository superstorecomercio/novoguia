-- Migration: Verificar campanhas ativas em SP
-- Data: 2025-11-27
-- Descrição: Query de diagnóstico para verificar campanhas ativas em SP

-- Verificar campanhas ativas em SP
SELECT 
  h.id as hotsite_id,
  h.nome_exibicao,
  h.estado,
  h.cidade,
  h.ativo as hotsite_ativo,
  c.id as campanha_id,
  c.ativo as campanha_ativa,
  c.participa_cotacao,
  c.data_fim,
  p.nome as plano_nome
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
LEFT JOIN planos p ON c.plano_id = p.id
WHERE 
  UPPER(TRIM(h.estado)) = 'SP'
ORDER BY h.nome_exibicao, c.data_inicio DESC;

-- Contar campanhas que atendem aos critérios
SELECT 
  COUNT(*) as total_campanhas_sp,
  COUNT(CASE WHEN h.ativo = true AND c.ativo = true AND c.participa_cotacao = true THEN 1 END) as campanhas_ativas_participam
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE 
  UPPER(TRIM(h.estado)) = 'SP';

-- Testar a função buscar_hotsites_ativos_por_estado
SELECT * FROM buscar_hotsites_ativos_por_estado('SP');

