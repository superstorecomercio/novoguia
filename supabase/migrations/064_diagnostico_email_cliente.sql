-- Migration: Diagnóstico - Verificar criação de emails para clientes
-- Data: 2025-11-27
-- Descrição: Script de diagnóstico para verificar se emails de clientes estão sendo criados

-- 1. Verificar se há emails do tipo orcamento_cliente
SELECT 
  'Total de emails de clientes' as tipo,
  COUNT(*) as quantidade
FROM email_tracking
WHERE tipo_email = 'orcamento_cliente';

-- 2. Verificar os últimos 10 orçamentos criados
SELECT 
  id,
  codigo_orcamento,
  nome_cliente,
  email_cliente,
  created_at
FROM orcamentos
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar se há emails de clientes para esses orçamentos
SELECT 
  o.id as orcamento_id,
  o.codigo_orcamento,
  o.email_cliente,
  et.id as email_tracking_id,
  et.tipo_email,
  et.status_envio_email,
  et.enviado_em as email_enviado_em
FROM orcamentos o
LEFT JOIN email_tracking et ON et.orcamento_id = o.id AND et.tipo_email = 'orcamento_cliente'
ORDER BY o.created_at DESC
LIMIT 10;

-- 4. Verificar a função criar_orcamento_e_notificar
SELECT 
  proname as nome_funcao,
  CASE 
    WHEN prosrc LIKE '%orcamento_cliente%' THEN '✅ Contém criação de email para cliente'
    ELSE '❌ NÃO contém criação de email para cliente'
  END as status_email_cliente,
  CASE 
    WHEN prosrc LIKE '%status_envio_email%' THEN '✅ Usa status_envio_email'
    ELSE '❌ NÃO usa status_envio_email'
  END as status_campo_status
FROM pg_proc
WHERE proname = 'criar_orcamento_e_notificar';

-- 5. Testar a função manualmente (substitua os valores pelos de um orçamento real)
-- Descomente e ajuste os valores para testar:
/*
SELECT * FROM criar_orcamento_e_notificar('{
  "nome_cliente": "Teste Cliente",
  "email_cliente": "teste@exemplo.com",
  "telefone_cliente": "11999999999",
  "whatsapp": "11999999999",
  "origem_completo": "São Paulo, SP",
  "destino_completo": "Rio de Janeiro, RJ",
  "estado_origem": "SP",
  "cidade_origem": "São Paulo",
  "estado_destino": "RJ",
  "cidade_destino": "Rio de Janeiro",
  "tipo_imovel": "apartamento",
  "tem_elevador": false,
  "andar": 1,
  "precisa_embalagem": false,
  "distancia_km": 430,
  "preco_min": 2500,
  "preco_max": 5500,
  "mensagem_ia": "Teste",
  "origem_formulario": "teste"
}'::JSONB);
*/

