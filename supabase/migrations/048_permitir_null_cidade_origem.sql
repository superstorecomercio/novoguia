-- Ajustar constraints: cidade_origem e cidade_destino devem ter valores padrão, não NULL
-- A IA sempre deve extrair ou usar fallback, mas permitimos NULL temporariamente para estados

-- Manter NOT NULL em cidade_origem e cidade_destino (a IA sempre deve preencher)
-- Permitir NULL apenas em estado_origem e estado_destino (podem não ser identificados)

ALTER TABLE orcamentos 
  ALTER COLUMN estado_origem DROP NOT NULL,
  ALTER COLUMN estado_destino DROP NOT NULL;

-- Garantir que cidade_origem e cidade_destino tenham valores padrão se NULL
ALTER TABLE orcamentos 
  ALTER COLUMN cidade_origem SET DEFAULT 'Não informado',
  ALTER COLUMN cidade_destino SET DEFAULT 'Não informado';

-- Comentário explicativo
COMMENT ON COLUMN orcamentos.cidade_origem IS 'Cidade de origem (sempre preenchida pela IA ou fallback)';
COMMENT ON COLUMN orcamentos.estado_origem IS 'Estado de origem (pode ser NULL se não identificado pela IA)';
COMMENT ON COLUMN orcamentos.cidade_destino IS 'Cidade de destino (sempre preenchida pela IA ou fallback)';
COMMENT ON COLUMN orcamentos.estado_destino IS 'Estado de destino (pode ser NULL se não identificado pela IA)';

