-- Migration: Query de teste - Busca de campanhas no cálculo de orçamento
-- Data: 2025-11-27
-- Descrição: Query exata que é usada quando um orçamento é criado

-- ============================================
-- QUERY USADA NO CÁLCULO DE ORÇAMENTO
-- ============================================
-- Esta é a query exata que a função buscar_hotsites_ativos_por_estado executa
-- quando um orçamento é criado e o estado de destino é retornado pela IA

-- Teste 1: Simular busca por estado SP (como a função faz)
SELECT 
  'Query exata da função buscar_hotsites_ativos_por_estado(''SP'')' as descricao,
  h.id as hotsite_id,
  c.id as campanha_id,
  h.nome_exibicao as nome,
  h.email,
  h.cidade,
  h.estado,
  COALESCE(p.ordem, 999) as plano_ordem,
  h.ativo as hotsite_ativo,
  c.ativo as campanha_ativa
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
LEFT JOIN planos p ON c.plano_id = p.id
WHERE 
  UPPER(TRIM(h.estado)) = UPPER(TRIM('SP'))
  AND c.ativo = true
ORDER BY h.id, COALESCE(p.ordem, 999) ASC, c.data_inicio DESC;

-- Teste 2: Contar quantas campanhas retornam
SELECT 
  'Total de campanhas encontradas' as descricao,
  COUNT(*) as total
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE 
  UPPER(TRIM(h.estado)) = UPPER(TRIM('SP'))
  AND c.ativo = true;

-- Teste 3: Ver todas as campanhas em SP (para comparação)
SELECT 
  'Todas as campanhas em SP (para comparação)' as descricao,
  h.id as hotsite_id,
  c.id as campanha_id,
  h.nome_exibicao,
  h.estado,
  h.ativo as hotsite_ativo,
  c.ativo as campanha_ativa,
  CASE 
    WHEN c.ativo = true AND UPPER(TRIM(h.estado)) = 'SP'
    THEN '✅ SERÁ RETORNADA'
    ELSE '❌ NÃO SERÁ RETORNADA'
  END as status
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
ORDER BY c.ativo DESC, h.nome_exibicao;

-- Teste 4: Usar a função diretamente (como o código faz)
SELECT 
  'Resultado da função buscar_hotsites_ativos_por_estado(''SP'')' as descricao,
  hotsite_id,
  campanha_id,
  nome,
  email,
  cidade,
  estado,
  plano_ordem
FROM buscar_hotsites_ativos_por_estado('SP');

