-- Migration: Debug - Verificar campanhas em SP
-- Data: 2025-11-27
-- Descrição: Queries de diagnóstico para verificar por que não encontra campanhas em SP

-- 1. Ver todas as campanhas em SP (independente de status)
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
  CASE 
    WHEN c.data_fim IS NOT NULL AND c.data_fim < CURRENT_DATE THEN 'VENCIDA'
    ELSE 'OK'
  END as status_data
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE 
  UPPER(TRIM(h.estado)) = 'SP'
ORDER BY h.nome_exibicao, c.data_inicio DESC;

-- 2. Contar campanhas que atendem aos critérios
SELECT 
  COUNT(*) as total_campanhas_sp,
  COUNT(CASE WHEN h.ativo = true THEN 1 END) as hotsites_ativos,
  COUNT(CASE WHEN c.ativo = true THEN 1 END) as campanhas_ativas,
  COUNT(CASE WHEN c.participa_cotacao = true THEN 1 END) as participa_cotacao,
  COUNT(CASE WHEN h.nome_exibicao IS NOT NULL THEN 1 END) as tem_nome,
  COUNT(CASE 
    WHEN h.ativo = true 
      AND c.ativo = true 
      AND c.participa_cotacao = true 
      AND h.nome_exibicao IS NOT NULL 
    THEN 1 
  END) as atendem_todos_criterios
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE 
  UPPER(TRIM(h.estado)) = 'SP';

-- 3. Testar a função buscar_hotsites_ativos_por_estado com 'SP'
SELECT * FROM buscar_hotsites_ativos_por_estado('SP');

-- 4. Verificar se há problema com case sensitivity
SELECT DISTINCT 
  h.estado,
  UPPER(TRIM(h.estado)) as estado_normalizado,
  COUNT(*) as total
FROM hotsites h
WHERE UPPER(TRIM(h.estado)) = 'SP'
GROUP BY h.estado, UPPER(TRIM(h.estado));

