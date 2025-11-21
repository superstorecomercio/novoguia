-- ============================================
-- Criar Tabelas de Mapeamento para Migração
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Tabela para mapear IDs de empresas
CREATE TABLE IF NOT EXISTS migration_empresas_map (
  id_legado INTEGER PRIMARY KEY,
  id_novo UUID NOT NULL REFERENCES empresas(id),
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_empresas_map_legado ON migration_empresas_map(id_legado);
CREATE INDEX IF NOT EXISTS idx_migration_empresas_map_novo ON migration_empresas_map(id_novo);

-- Tabela para mapear IDs de cidades (caso ainda não exista)
CREATE TABLE IF NOT EXISTS migration_cidades_map (
  id_legado INTEGER PRIMARY KEY,
  id_novo UUID NOT NULL REFERENCES cidades(id),
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_cidades_map_legado ON migration_cidades_map(id_legado);
CREATE INDEX IF NOT EXISTS idx_migration_cidades_map_novo ON migration_cidades_map(id_novo);

-- Comentários
COMMENT ON TABLE migration_empresas_map IS 'Mapeamento de IDs legados de empresas para novos UUIDs';
COMMENT ON TABLE migration_cidades_map IS 'Mapeamento de IDs legados de cidades para novos UUIDs';

