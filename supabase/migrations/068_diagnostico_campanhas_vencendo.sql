-- Migration: Diagnóstico de campanhas vencendo
-- Data: 2025-11-27
-- Descrição: Query de diagnóstico para verificar campanhas que deveriam estar vencendo

-- Query de diagnóstico: Verificar campanhas que vencem hoje ou amanhã
SELECT 
  c.id as campanha_id,
  c.ativo,
  c.data_fim,
  h.email,
  h.nome_exibicao,
  CURRENT_DATE as data_atual_utc,
  (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE as data_atual_sp,
  CASE 
    WHEN c.data_fim = (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE THEN 'VENCE HOJE'
    WHEN c.data_fim = ((CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE + INTERVAL '1 day') THEN 'VENCE AMANHÃ'
    ELSE 'NÃO VENCE HOJE/AMANHÃ'
  END as status_vencimento,
  CASE 
    WHEN c.data_fim = CURRENT_DATE THEN 'VENCE HOJE (UTC)'
    WHEN c.data_fim = CURRENT_DATE + INTERVAL '1 day' THEN 'VENCE AMANHÃ (UTC)'
    ELSE 'NÃO VENCE HOJE/AMANHÃ (UTC)'
  END as status_vencimento_utc
FROM campanhas c
INNER JOIN hotsites h ON h.id = c.hotsite_id
WHERE 
  c.ativo = true
  AND c.data_fim IS NOT NULL
  AND (
    -- Verificar tanto com UTC quanto com timezone de SP
    c.data_fim = CURRENT_DATE
    OR c.data_fim = CURRENT_DATE + INTERVAL '1 day'
    OR c.data_fim = (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE
    OR c.data_fim = ((CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE + INTERVAL '1 day')
  )
ORDER BY c.data_fim;

-- Verificar se já existem emails criados hoje
SELECT 
  et.campanha_id,
  et.tipo_email,
  et.created_at,
  DATE(et.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_criacao_sp,
  (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE as data_atual_sp
FROM email_tracking et
WHERE et.campanha_id IS NOT NULL
  AND et.tipo_email IN ('campanha_vencendo_hoje', 'campanha_vencendo_1dia')
  AND DATE(et.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = (CURRENT_DATE AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::DATE
ORDER BY et.created_at DESC;

