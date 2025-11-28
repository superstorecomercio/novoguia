-- Migration: Verificar empresas relacionadas a um orçamento pelo código
-- Data: 2025-11-27
-- Descrição: Query para verificar empresas relacionadas a um orçamento usando o código do orçamento

-- Substitua 'MD-1047-6D9E' pelo código do orçamento que você quer verificar
-- Exemplo de uso:
-- 1. Primeiro, encontre o ID do orçamento pelo código:
SELECT 
  id,
  codigo_orcamento,
  nome_cliente,
  cidade_destino,
  estado_destino,
  created_at
FROM orcamentos
WHERE codigo_orcamento = 'MD-1047-6D9E';

-- 2. Depois, use o ID retornado para buscar as empresas:
-- (Substitua 'ID_DO_ORCAMENTO' pelo ID retornado acima)
/*
SELECT 
  oc.orcamento_id,
  oc.hotsite_id,
  oc.campanha_id,
  h.nome_exibicao,
  h.email,
  h.telefone1,
  h.cidade,
  h.estado,
  c.ativo as campanha_ativa
FROM orcamentos_campanhas oc
INNER JOIN hotsites h ON h.id = oc.hotsite_id
INNER JOIN campanhas c ON c.id = oc.campanha_id
WHERE oc.orcamento_id = 'ID_DO_ORCAMENTO'
ORDER BY h.nome_exibicao;
*/

-- 3. Query completa que busca tudo de uma vez (usando código do orçamento):
SELECT 
  o.id as orcamento_id,
  o.codigo_orcamento,
  o.nome_cliente,
  o.cidade_destino,
  o.estado_destino,
  oc.hotsite_id,
  oc.campanha_id,
  h.nome_exibicao,
  h.email,
  h.telefone1,
  h.telefone2,
  h.telefone3,
  h.cidade,
  h.estado,
  c.ativo as campanha_ativa,
  c.participa_cotacao
FROM orcamentos o
LEFT JOIN orcamentos_campanhas oc ON oc.orcamento_id = o.id
LEFT JOIN hotsites h ON h.id = oc.hotsite_id
LEFT JOIN campanhas c ON c.id = oc.campanha_id
WHERE o.codigo_orcamento = 'MD-1047-6D9E'
ORDER BY h.nome_exibicao;

-- 4. Contar quantas empresas foram encontradas:
SELECT 
  o.codigo_orcamento,
  COUNT(DISTINCT oc.hotsite_id) as total_empresas,
  COUNT(DISTINCT CASE WHEN c.ativo = true THEN oc.hotsite_id END) as empresas_com_campanha_ativa
FROM orcamentos o
LEFT JOIN orcamentos_campanhas oc ON oc.orcamento_id = o.id
LEFT JOIN campanhas c ON c.id = oc.campanha_id
WHERE o.codigo_orcamento = 'MD-1047-6D9E'
GROUP BY o.codigo_orcamento;

