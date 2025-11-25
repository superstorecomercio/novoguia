-- ============================================
-- COMPARAÇÃO: Orçamentos Web vs WhatsApp
-- ============================================
-- Este script compara os últimos orçamentos criados
-- pela calculadora web vs pela API do WhatsApp
-- para identificar diferenças que causam hotsites_notificados = 0

-- ============================================
-- 1. Últimos orçamentos da calculadora web
-- ============================================
SELECT 
  'CALCULADORA WEB' as origem,
  id,
  nome_cliente,
  estado_origem,
  estado_destino,
  cidade_origem,
  cidade_destino,
  origem_completo,
  destino_completo,
  hotsites_notificados,
  origem_formulario,
  created_at
FROM orcamentos
WHERE origem_formulario = 'calculadora'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 2. Últimos orçamentos do WhatsApp
-- ============================================
SELECT 
  'WHATSAPP' as origem,
  id,
  nome_cliente,
  estado_origem,
  estado_destino,
  cidade_origem,
  cidade_destino,
  origem_completo,
  destino_completo,
  hotsites_notificados,
  origem_formulario,
  created_at
FROM orcamentos
WHERE origem_formulario = 'formulario_simples'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 3. Comparar formato do estado_destino
-- ============================================
SELECT 
  origem_formulario,
  estado_destino,
  LENGTH(estado_destino) as tamanho,
  UPPER(TRIM(estado_destino)) as estado_normalizado,
  hotsites_notificados,
  COUNT(*) as quantidade
FROM orcamentos
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY origem_formulario, estado_destino, hotsites_notificados
ORDER BY created_at DESC;

-- ============================================
-- 4. Testar função com estado do último orçamento WhatsApp
-- ============================================
SELECT 
  'TESTE FUNÇÃO' as tipo,
  o.id as orcamento_id,
  o.estado_destino,
  COUNT(h.id) as campanhas_encontradas,
  o.hotsites_notificados as hotsites_salvos
FROM orcamentos o
LEFT JOIN buscar_hotsites_ativos_por_estado(o.estado_destino, 'mudanca') h ON true
WHERE o.origem_formulario = 'formulario_simples'
  AND o.created_at > NOW() - INTERVAL '1 day'
GROUP BY o.id, o.estado_destino, o.hotsites_notificados
ORDER BY o.created_at DESC
LIMIT 5;

-- ============================================
-- 5. Verificar se estado_destino está NULL ou vazio
-- ============================================
SELECT 
  origem_formulario,
  COUNT(*) as total,
  COUNT(CASE WHEN estado_destino IS NULL THEN 1 END) as estado_null,
  COUNT(CASE WHEN estado_destino = '' THEN 1 END) as estado_vazio,
  COUNT(CASE WHEN TRIM(estado_destino) = '' THEN 1 END) as estado_apenas_espacos,
  COUNT(CASE WHEN hotsites_notificados = 0 THEN 1 END) as sem_notificacoes
FROM orcamentos
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY origem_formulario;

-- ============================================
-- 6. Detalhes do último orçamento WhatsApp com problema
-- ============================================
SELECT 
  id,
  nome_cliente,
  estado_destino,
  cidade_destino,
  destino_completo,
  origem_completo,
  hotsites_notificados,
  created_at,
  -- Testar se a função encontra campanhas
  (SELECT COUNT(*) 
   FROM buscar_hotsites_ativos_por_estado(estado_destino, 'mudanca')
  ) as campanhas_que_deveriam_ser_encontradas
FROM orcamentos
WHERE origem_formulario = 'formulario_simples'
  AND hotsites_notificados = 0
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- 7. Comparar dados enviados vs dados salvos
-- ============================================
-- Execute esta query e compare com o que está sendo enviado pela API do WhatsApp
SELECT 
  id,
  origem_formulario,
  estado_destino as "Estado Destino (salvo)",
  cidade_destino as "Cidade Destino (salva)",
  destino_completo as "Destino Completo (salvo)",
  hotsites_notificados,
  created_at
FROM orcamentos
WHERE origem_formulario = 'formulario_simples'
ORDER BY created_at DESC
LIMIT 3;

