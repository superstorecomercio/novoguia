-- ============================================
-- Adicionar campos importantes da tabela hotsites
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar campos novos
ALTER TABLE hotsites 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS sms_numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS regiao VARCHAR(255),
ADD COLUMN IF NOT EXISTS tipoempresa VARCHAR(50), -- 'mudanca' | 'carreto' | 'guardamoveis'
ADD COLUMN IF NOT EXISTS slugbairro VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefone1 VARCHAR(20),
ADD COLUMN IF NOT EXISTS telefone2 VARCHAR(20),
ADD COLUMN IF NOT EXISTS telefone3 VARCHAR(20);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hotsites_email ON hotsites(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hotsites_tipoempresa ON hotsites(tipoempresa) WHERE tipoempresa IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hotsites_regiao ON hotsites(regiao) WHERE regiao IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hotsites_slugbairro ON hotsites(slugbairro) WHERE slugbairro IS NOT NULL;

-- Comentários
COMMENT ON COLUMN hotsites.email IS 'Email do hotsite (hotemail)';
COMMENT ON COLUMN hotsites.sms_numero IS 'Número para SMS';
COMMENT ON COLUMN hotsites.regiao IS 'Região onde o hotsite é exibido (hotregiao)';
COMMENT ON COLUMN hotsites.tipoempresa IS 'Tipo de empresa: mudança, carreto ou guarda-móveis';
COMMENT ON COLUMN hotsites.slugbairro IS 'Slug do bairro';
COMMENT ON COLUMN hotsites.telefone1 IS 'Telefone 1 (hottelefone1)';
COMMENT ON COLUMN hotsites.telefone2 IS 'Telefone 2 (hottelefone2)';
COMMENT ON COLUMN hotsites.telefone3 IS 'Telefone 3 (hottelefone3)';

