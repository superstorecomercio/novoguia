-- Migration: Criar tabela de configurações
-- Data: 2025-11-26
-- Descrição: Tabela para armazenar configurações do sistema (emails, etc.)

-- ============================================
-- CRIAR TABELA DE CONFIGURAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave VARCHAR(255) UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);

-- Comentários
COMMENT ON TABLE configuracoes IS 'Armazena configurações do sistema (emails, APIs, etc.)';
COMMENT ON COLUMN configuracoes.chave IS 'Chave única da configuração (ex: email_config)';
COMMENT ON COLUMN configuracoes.valor IS 'Valor da configuração em formato JSON';
COMMENT ON COLUMN configuracoes.descricao IS 'Descrição da configuração';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_configuracoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_configuracoes_updated_at
BEFORE UPDATE ON configuracoes
FOR EACH ROW
EXECUTE FUNCTION update_configuracoes_updated_at();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Política: Apenas autenticados podem ler
CREATE POLICY "Permitir SELECT autenticado" ON configuracoes
FOR SELECT
USING (auth.role() = 'authenticated');

-- Política: Apenas service_role pode escrever
-- (Isso será feito via API com service key)
CREATE POLICY "Permitir INSERT/UPDATE service_role" ON configuracoes
FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- FIM DA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Migration 032_criar_tabela_configuracoes.sql aplicada com sucesso!';
  RAISE NOTICE '  - Tabela "configuracoes" criada';
  RAISE NOTICE '  - RLS habilitado';
  RAISE NOTICE '================================================';
END $$;


