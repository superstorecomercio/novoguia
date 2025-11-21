-- ============================================
-- CORREÇÃO: Hotsites vinculados a Cidades
-- ============================================
-- IMPORTANTE: Uma empresa pode ter múltiplos hotsites
-- Um hotsite é exibido em uma determinada cidade
-- ============================================

-- Remover constraint UNIQUE de empresa_id (permite múltiplos hotsites por empresa)
ALTER TABLE hotsites DROP CONSTRAINT IF EXISTS hotsites_empresa_id_key;

-- Adicionar cidade_id ao hotsite
ALTER TABLE hotsites ADD COLUMN IF NOT EXISTS cidade_id UUID REFERENCES cidades(id) ON DELETE CASCADE;

-- Criar índice para busca por cidade
CREATE INDEX IF NOT EXISTS idx_hotsites_cidade ON hotsites(cidade_id);

-- Criar constraint UNIQUE para empresa_id + cidade_id (uma empresa só pode ter um hotsite por cidade)
ALTER TABLE hotsites ADD CONSTRAINT hotsites_empresa_cidade_unique UNIQUE (empresa_id, cidade_id);

-- Comentário explicativo
COMMENT ON COLUMN hotsites.cidade_id IS 'Cidade onde este hotsite é exibido. Uma empresa pode ter múltiplos hotsites (um por cidade).';

