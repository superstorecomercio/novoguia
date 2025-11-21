-- ============================================
-- REMOVER CONSTRAINT UNIQUE DE EMPRESA_ID
-- ============================================
-- A tabela empresas não será mais usada
-- Remover a constraint UNIQUE para permitir flexibilidade futura
-- ============================================

-- Remover a constraint UNIQUE da coluna empresa_id
ALTER TABLE hotsites DROP CONSTRAINT IF EXISTS hotsites_empresa_id_key;

-- Opcional: Tornar empresa_id nullable (se ainda não for)
ALTER TABLE hotsites ALTER COLUMN empresa_id DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN hotsites.empresa_id IS 'Campo legado - não mais utilizado. Mantido apenas para compatibilidade.';
