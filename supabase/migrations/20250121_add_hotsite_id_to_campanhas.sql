-- Adicionar campo hotsite_id na tabela campanhas
-- Isso permitirá vincular campanhas diretamente aos hotsites
-- sem depender da tabela empresas

-- 1. Adicionar a coluna hotsite_id
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS hotsite_id UUID REFERENCES hotsites(id);

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_campanhas_hotsite_id ON campanhas(hotsite_id);

-- 3. Migrar dados: vincular campanhas aos hotsites baseado no empresa_id
-- Para cada campanha, buscar o primeiro hotsite da empresa
UPDATE campanhas c
SET hotsite_id = (
  SELECT h.id 
  FROM hotsites h 
  WHERE h.empresa_id = c.empresa_id 
  LIMIT 1
)
WHERE c.empresa_id IS NOT NULL AND c.hotsite_id IS NULL;

-- 4. Comentário para futura remoção do empresa_id
COMMENT ON COLUMN campanhas.empresa_id IS 'DEPRECATED: Use hotsite_id ao invés. Será removido em versão futura.';
COMMENT ON COLUMN campanhas.hotsite_id IS 'ID do hotsite vinculado a esta campanha. Substitui o campo empresa_id.';

