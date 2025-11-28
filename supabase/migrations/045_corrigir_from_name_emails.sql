-- Migration: Corrigir from_name de emails de "contato" para "MudaTech"
-- Data: 2025-01-XX
-- Descrição: Atualiza o campo from_name na configuração de emails para garantir que seja "MudaTech" ao invés de "contato"

-- Atualizar configuração de email se from_name for "contato" ou vazio
UPDATE configuracoes
SET valor = jsonb_set(
  COALESCE(valor, '{}'::jsonb),
  '{from_name}',
  '"MudaTech"',
  true
),
updated_at = NOW()
WHERE chave = 'email_config'
  AND (
    COALESCE(valor->>'from_name', '') = '' 
    OR LOWER(COALESCE(valor->>'from_name', '')) = 'contato'
    OR valor->>'from_name' IS NULL
  );

-- Comentário
COMMENT ON COLUMN configuracoes.valor IS 'Valor JSONB da configuração. Para email_config, deve ter from_name = "MudaTech"';

