-- ============================================
-- Tabela de Mapeamento para Migração
-- ============================================
-- Esta tabela ajuda a mapear IDs legados para novos UUIDs
-- Execute este script ANTES de migrar os dados
-- ============================================

-- Tabela para mapear IDs de cidades
CREATE TABLE IF NOT EXISTS migration_cidades_map (
  id_legado INTEGER PRIMARY KEY,
  id_novo UUID NOT NULL REFERENCES cidades(id),
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_cidades_map_legado ON migration_cidades_map(id_legado);
CREATE INDEX IF NOT EXISTS idx_migration_cidades_map_novo ON migration_cidades_map(id_novo);

-- Tabela para mapear IDs de empresas
CREATE TABLE IF NOT EXISTS migration_empresas_map (
  id_legado INTEGER PRIMARY KEY,
  id_novo UUID NOT NULL REFERENCES empresas(id),
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_empresas_map_legado ON migration_empresas_map(id_legado);
CREATE INDEX IF NOT EXISTS idx_migration_empresas_map_novo ON migration_empresas_map(id_novo);

-- ============================================
-- Função auxiliar para buscar cidade por ID legado
-- ============================================
CREATE OR REPLACE FUNCTION get_cidade_id_by_legado(id_legado INTEGER)
RETURNS UUID AS $$
DECLARE
  cidade_id UUID;
BEGIN
  SELECT id_novo INTO cidade_id
  FROM migration_cidades_map
  WHERE id_legado = get_cidade_id_by_legado.id_legado;
  
  RETURN cidade_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Função auxiliar para buscar empresa por ID legado
-- ============================================
CREATE OR REPLACE FUNCTION get_empresa_id_by_legado(id_legado INTEGER)
RETURNS UUID AS $$
DECLARE
  empresa_id UUID;
BEGIN
  SELECT id_novo INTO empresa_id
  FROM migration_empresas_map
  WHERE id_legado = get_empresa_id_by_legado.id_legado;
  
  RETURN empresa_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comentários
-- ============================================
COMMENT ON TABLE migration_cidades_map IS 'Mapeamento de IDs legados de cidades para novos UUIDs';
COMMENT ON TABLE migration_empresas_map IS 'Mapeamento de IDs legados de empresas para novos UUIDs';

