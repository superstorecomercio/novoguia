-- Migration: Testar busca de campanhas em SP
-- Data: 2025-11-27
-- Descrição: Query de teste para verificar quantas campanhas retornam para estado SP

-- 1. Testar a função buscar_hotsites_ativos_por_estado com 'SP'
SELECT 
  'Resultado da função buscar_hotsites_ativos_por_estado(''SP'')' as teste,
  COUNT(*) as total_campanhas_encontradas
FROM buscar_hotsites_ativos_por_estado('SP');

-- 2. Ver detalhes das campanhas encontradas
SELECT 
  hotsite_id,
  campanha_id,
  nome as hotsite_nome,
  email,
  cidade,
  estado,
  plano_ordem
FROM buscar_hotsites_ativos_por_estado('SP');

-- 3. Verificar critérios manualmente
SELECT 
  'Verificação manual dos critérios' as teste,
  COUNT(*) as total_hotsites_sp,
  COUNT(CASE WHEN h.ativo = true THEN 1 END) as hotsites_ativos,
  COUNT(CASE WHEN c.ativo = true THEN 1 END) as campanhas_ativas,
  COUNT(CASE WHEN c.participa_cotacao = true THEN 1 END) as participa_cotacao,
  COUNT(CASE WHEN h.nome_exibicao IS NOT NULL THEN 1 END) as tem_nome,
  COUNT(CASE 
    WHEN h.ativo = true 
      AND c.ativo = true 
      AND c.participa_cotacao = true 
      AND h.nome_exibicao IS NOT NULL 
      AND UPPER(TRIM(h.estado)) = 'SP'
    THEN 1 
  END) as atendem_todos_criterios
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP';

-- 4. Ver todas as campanhas em SP com seus status
SELECT 
  h.id as hotsite_id,
  h.nome_exibicao,
  h.estado,
  h.cidade,
  h.ativo as hotsite_ativo,
  c.id as campanha_id,
  c.ativo as campanha_ativa,
  c.participa_cotacao,
  CASE 
    WHEN h.ativo = true AND c.ativo = true AND c.participa_cotacao = true AND h.nome_exibicao IS NOT NULL 
    THEN '✅ ATENDE CRITÉRIOS'
    ELSE '❌ NÃO ATENDE'
  END as status
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
ORDER BY status DESC, h.nome_exibicao;

