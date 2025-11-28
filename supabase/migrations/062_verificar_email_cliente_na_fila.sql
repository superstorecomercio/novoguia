-- Migration: Verificar se emails de clientes estão sendo criados
-- Data: 2025-11-27
-- Descrição: Query de teste para verificar se a função está criando emails para clientes

-- Verificar se há emails do tipo orcamento_cliente na fila
SELECT 
  COUNT(*) as total_emails_clientes,
  COUNT(*) FILTER (WHERE metadata->>'status_envio' = 'na_fila') as na_fila,
  COUNT(*) FILTER (WHERE enviado_em IS NULL) as aguardando_envio
FROM email_tracking
WHERE tipo_email = 'orcamento_cliente';

-- Verificar os últimos 5 emails de clientes criados
SELECT 
  id,
  codigo_rastreamento,
  orcamento_id,
  email_destinatario,
  assunto,
  metadata->>'status_envio' as status_envio,
  enviado_em,
  created_at
FROM email_tracking
WHERE tipo_email = 'orcamento_cliente'
ORDER BY created_at DESC
LIMIT 5;

-- Verificar se a função criar_orcamento_e_notificar existe e está atualizada
SELECT 
  proname as nome_funcao,
  prosrc as codigo_funcao
FROM pg_proc
WHERE proname = 'criar_orcamento_e_notificar';

