-- ============================================
-- MIGRATION: Adicionar tipo e modelo aos bots
-- ============================================
-- Descrição: Adiciona campos para diferenciar bots internos de clientes
--            e suporte a modelos/templates de bots
-- Data: 2025-11-26

-- Adicionar campo tipo (interno/cliente)
ALTER TABLE whatsapp_bots 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'interno' NOT NULL 
CHECK (tipo IN ('interno', 'cliente'));

-- Adicionar campo modelo_id (referência ao modelo usado)
-- A FK será criada após a tabela modelos_bots ser criada
ALTER TABLE whatsapp_bots 
ADD COLUMN IF NOT EXISTS modelo_id UUID;

-- Adicionar campo email_notificacao (para notificar empresa quando receber contato)
ALTER TABLE whatsapp_bots 
ADD COLUMN IF NOT EXISTS email_notificacao TEXT;

-- Adicionar campo notificar_whatsapp (se deve notificar via WhatsApp também)
ALTER TABLE whatsapp_bots 
ADD COLUMN IF NOT EXISTS notificar_whatsapp BOOLEAN DEFAULT false;

-- Adicionar campo whatsapp_notificacao (número para notificar via WhatsApp)
ALTER TABLE whatsapp_bots 
ADD COLUMN IF NOT EXISTS whatsapp_notificacao VARCHAR(20);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_bots_tipo ON whatsapp_bots(tipo);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bots_modelo_id ON whatsapp_bots(modelo_id);

-- Comentários
COMMENT ON COLUMN whatsapp_bots.tipo IS 'Tipo do bot: interno (nossos bots) ou cliente (bots de empresas clientes)';
COMMENT ON COLUMN whatsapp_bots.modelo_id IS 'ID do modelo/template usado para criar este bot';
COMMENT ON COLUMN whatsapp_bots.email_notificacao IS 'Email para notificar quando o bot receber um contato/orçamento';
COMMENT ON COLUMN whatsapp_bots.notificar_whatsapp IS 'Se deve notificar também via WhatsApp quando receber contato';
COMMENT ON COLUMN whatsapp_bots.whatsapp_notificacao IS 'Número do WhatsApp para enviar notificações';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

