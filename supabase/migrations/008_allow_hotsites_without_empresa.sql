-- ============================================
-- Permitir hotsites sem empresa vinculada
-- ============================================
-- Este script permite que hotsites existam sem empresa_id
-- Útil para casos onde o hotsite precisa existir antes da empresa
-- ============================================

-- 1. Remover constraint UNIQUE de empresa_id (se existir)
-- Isso permite múltiplos hotsites por empresa e hotsites sem empresa
ALTER TABLE hotsites DROP CONSTRAINT IF EXISTS hotsites_empresa_id_key;
ALTER TABLE hotsites DROP CONSTRAINT IF EXISTS hotsites_empresa_id_unique;

-- Remover constraint UNIQUE de (empresa_id, cidade_id) se existir
-- Isso permite hotsites sem empresa vinculada
ALTER TABLE hotsites DROP CONSTRAINT IF EXISTS hotsites_empresa_cidade_unique;

-- 2. Tornar empresa_id opcional (remover NOT NULL se existir)
-- Na verdade, já deve ser opcional por padrão, mas vamos garantir
ALTER TABLE hotsites ALTER COLUMN empresa_id DROP NOT NULL;

-- 3. Manter a foreign key, mas permitir NULL
-- A constraint de foreign key já permite NULL por padrão
-- Se não existir, vamos criar uma que permita NULL
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'hotsites_empresa_id_fkey'
  ) THEN
    ALTER TABLE hotsites 
    ADD CONSTRAINT hotsites_empresa_id_fkey 
    FOREIGN KEY (empresa_id) 
    REFERENCES empresas(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Criar índice para busca por empresa_id (incluindo NULL)
CREATE INDEX IF NOT EXISTS idx_hotsites_empresa_id ON hotsites(empresa_id);

-- 5. Criar índice para busca por cidade e estado (para hotsites sem empresa)
CREATE INDEX IF NOT EXISTS idx_hotsites_cidade_estado ON hotsites(cidade, estado) 
WHERE cidade IS NOT NULL AND estado IS NOT NULL;

-- 6. Comentário explicativo
COMMENT ON COLUMN hotsites.empresa_id IS 'ID da empresa vinculada. Pode ser NULL para hotsites independentes.';

