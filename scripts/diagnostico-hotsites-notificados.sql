-- ============================================
-- DIAGNÓSTICO: Por que hotsites_notificados = 0?
-- ============================================
-- Execute esta query substituindo 'SP' pelo estado do seu orçamento
-- para diagnosticar por que nenhuma campanha está sendo vinculada

-- ============================================
-- PASSO 1: Verificar se há campanhas ativas no estado
-- ============================================
SELECT 
  '1. Total de campanhas ativas no estado' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = UPPER(TRIM('SP'))  -- ⚠️ SUBSTITUA 'SP' pelo estado do seu orçamento
  AND c.ativo = true;

-- ============================================
-- PASSO 2: Verificar campanhas que participam de cotação
-- ============================================
SELECT 
  '2. Campanhas que participam de cotação' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = UPPER(TRIM('SP'))
  AND c.ativo = true
  AND c.participa_cotacao = true;

-- ============================================
-- PASSO 3: Verificar campanhas com nome_exibicao preenchido
-- ============================================
SELECT 
  '3. Campanhas com nome_exibicao preenchido' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = UPPER(TRIM('SP'))
  AND c.ativo = true
  AND c.participa_cotacao = true
  AND h.nome_exibicao IS NOT NULL;

-- ============================================
-- PASSO 4: Resultado final (igual à função buscar_hotsites_ativos_por_estado)
-- ============================================
SELECT 
  '4. RESULTADO FINAL (retornado pela função)' as etapa,
  COUNT(*)::TEXT as total,
  STRING_AGG(h.nome_exibicao, ', ' ORDER BY COALESCE(p.ordem, 999) ASC, c.data_inicio DESC) as detalhes
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
LEFT JOIN planos p ON c.plano_id = p.id
WHERE 
  UPPER(TRIM(h.estado)) = UPPER(TRIM('SP'))
  AND c.ativo = true
  AND c.participa_cotacao = true
  AND h.nome_exibicao IS NOT NULL;

-- ============================================
-- PASSO 5: Verificar formato do estado no último orçamento criado
-- ============================================
SELECT 
  '5. Último orçamento criado' as etapa,
  id::TEXT as total,
  CONCAT('Estado destino: "', estado_destino, '" (', LENGTH(estado_destino), ' caracteres)') as detalhes
FROM orcamentos
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- PASSO 6: Testar função diretamente com o estado do último orçamento
-- ============================================
SELECT 
  '6. Teste da função com estado do último orçamento' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM buscar_hotsites_ativos_por_estado(
  (SELECT estado_destino FROM orcamentos ORDER BY created_at DESC LIMIT 1),
  'mudanca'
);

-- ============================================
-- PASSO 7: Listar campanhas excluídas e motivo
-- ============================================
SELECT 
  '7. Campanhas EXCLUÍDAS e motivo' as etapa,
  COUNT(*)::TEXT as total,
  STRING_AGG(
    CASE 
      WHEN h.nome_exibicao IS NULL THEN 'nome_exibicao NULL'
      WHEN c.participa_cotacao = false THEN 'não participa cotação'
      WHEN c.ativo = false THEN 'campanha inativa'
      ELSE 'outro motivo'
    END, 
    ', '
  ) as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = UPPER(TRIM('SP'))
  AND (
    c.ativo = false 
    OR c.participa_cotacao = false 
    OR h.nome_exibicao IS NULL
  );

-- ============================================
-- PASSO 8: Detalhes completos das campanhas que DEVERIAM ser retornadas
-- ============================================
SELECT 
  h.id as hotsite_id,
  h.nome_exibicao,
  h.estado,
  h.cidade,
  c.id as campanha_id,
  c.ativo as campanha_ativo,
  c.participa_cotacao,
  p.nome as plano_nome,
  p.ordem as plano_ordem,
  CASE 
    WHEN h.nome_exibicao IS NULL THEN '❌ nome_exibicao NULL'
    WHEN c.participa_cotacao = false THEN '❌ não participa cotação'
    WHEN c.ativo = false THEN '❌ campanha inativa'
    ELSE '✅ DEVERIA SER RETORNADA'
  END as status
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
LEFT JOIN planos p ON c.plano_id = p.id
WHERE UPPER(TRIM(h.estado)) = UPPER(TRIM('SP'))
ORDER BY 
  CASE 
    WHEN h.nome_exibicao IS NULL THEN 1
    WHEN c.participa_cotacao = false THEN 2
    WHEN c.ativo = false THEN 3
    ELSE 0
  END,
  COALESCE(p.ordem, 999) ASC,
  c.data_inicio DESC;

-- ============================================
-- PASSO 9: Verificar se há problemas de normalização de estado
-- ============================================
SELECT 
  '9. Estados únicos na tabela hotsites' as etapa,
  COUNT(DISTINCT estado)::TEXT as total,
  STRING_AGG(DISTINCT estado, ', ' ORDER BY estado) as detalhes
FROM hotsites
WHERE estado IS NOT NULL;

-- ============================================
-- PASSO 10: Comparar formato do estado no orçamento vs hotsites
-- ============================================
SELECT 
  '10. Comparação de formato' as etapa,
  'Orçamento' as total,
  CONCAT('Estado: "', estado_destino, '" | Tamanho: ', LENGTH(estado_destino), ' | Upper: "', UPPER(TRIM(estado_destino)), '"') as detalhes
FROM orcamentos
ORDER BY created_at DESC
LIMIT 1

UNION ALL

SELECT 
  '10. Comparação de formato' as etapa,
  'Hotsites' as total,
  CONCAT('Estados únicos: ', STRING_AGG(DISTINCT CONCAT('"', estado, '"'), ', ')) as detalhes
FROM hotsites
WHERE estado IS NOT NULL;



