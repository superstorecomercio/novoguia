-- ============================================
-- DIAGNÓSTICO: Por que apenas 3 campanhas de SP?
-- ============================================
-- Execute esta query no Supabase SQL Editor para diagnosticar
-- Retorna tudo em uma única tabela

SELECT 
  '1. Total campanhas ativas em SP' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true

UNION ALL

SELECT 
  '2. Campanhas que participam de cotação' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND c.participa_cotacao = true

UNION ALL

SELECT 
  '3. Campanhas com hotsite ativo' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND c.participa_cotacao = true
  AND h.ativo = true

UNION ALL

SELECT 
  '4. Campanhas com nome_exibicao preenchido' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND c.participa_cotacao = true
  AND h.ativo = true
  AND h.nome_exibicao IS NOT NULL

ORDER BY etapa;

-- 5. Detalhes das campanhas que NÃO passam nos filtros
SELECT 
  '5. Campanhas EXCLUÍDAS' as etapa,
  COUNT(*)::TEXT as total,
  STRING_AGG(
    CASE 
      WHEN h.nome_exibicao IS NULL THEN 'nome_exibicao NULL'
      WHEN h.ativo = false THEN 'hotsite inativo'
      WHEN c.participa_cotacao = false THEN 'não participa cotação'
      ELSE 'outro motivo'
    END, 
    ', '
  ) as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND (
    h.ativo = false 
    OR c.participa_cotacao = false 
    OR h.nome_exibicao IS NULL
  );

-- 6. Resultado final (igual à função)
SELECT 
  '6. RESULTADO FINAL (retornado pela função)' as etapa,
  COUNT(*)::TEXT as total,
  STRING_AGG(h.nome_exibicao, ', ' ORDER BY COALESCE(p.ordem, 999) ASC, c.data_inicio DESC) as detalhes
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
LEFT JOIN planos p ON c.plano_id = p.id
WHERE 
  UPPER(TRIM(h.estado)) = 'SP'
  AND h.ativo = true
  AND c.ativo = true
  AND c.participa_cotacao = true
  AND h.nome_exibicao IS NOT NULL;

-- ============================================
-- DETALHES: Lista completa das campanhas excluídas
-- ============================================
SELECT 
  c.id as campanha_id,
  h.id as hotsite_id,
  h.nome_exibicao,
  h.estado,
  h.ativo as hotsite_ativo,
  c.ativo as campanha_ativo,
  c.participa_cotacao,
  CASE 
    WHEN h.nome_exibicao IS NULL THEN '❌ nome_exibicao NULL'
    WHEN h.ativo = false THEN '❌ hotsite inativo'
    WHEN c.participa_cotacao = false THEN '❌ não participa cotação'
    ELSE '✅ OK'
  END as motivo_exclusao
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND (
    h.ativo = false 
    OR c.participa_cotacao = false 
    OR h.nome_exibicao IS NULL
  )
ORDER BY motivo_exclusao, h.nome_exibicao;

