-- ============================================
-- MIGRATION: Criar tabela de modelos de bots
-- ============================================
-- Descrição: Armazena templates/modelos de bots que podem ser reutilizados
-- Data: 2025-11-26

-- Criar tabela modelos_bots
CREATE TABLE IF NOT EXISTS modelos_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE, -- Ex: "Mudanças Residenciais", "Mudanças Comerciais"
  descricao TEXT, -- Descrição do modelo
  categoria VARCHAR(50), -- Ex: "mudancas", "servicos", "vendas"
  
  -- Configurações do modelo (copiadas para novos bots)
  mensagem_inicial TEXT,
  mensagem_final TEXT,
  mensagem_erro TEXT,
  palavras_ativacao TEXT[], -- Array de palavras-chave
  
  -- Perguntas do modelo (JSONB)
  perguntas JSONB DEFAULT '{}'::jsonb,
  
  -- Configurações padrão
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_modelos_bots_categoria ON modelos_bots(categoria);
CREATE INDEX IF NOT EXISTS idx_modelos_bots_ativo ON modelos_bots(ativo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_modelos_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_modelos_bots_updated_at ON modelos_bots;
CREATE TRIGGER trg_update_modelos_bots_updated_at
  BEFORE UPDATE ON modelos_bots
  FOR EACH ROW
  EXECUTE FUNCTION update_modelos_bots_updated_at();

-- RLS (Row Level Security)
ALTER TABLE modelos_bots ENABLE ROW LEVEL SECURITY;

-- Política: Service role pode gerenciar modelos
DROP POLICY IF EXISTS "Service role pode gerenciar modelos de bots" ON modelos_bots;
CREATE POLICY "Service role pode gerenciar modelos de bots"
  ON modelos_bots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE modelos_bots IS 'Modelos/templates de bots que podem ser reutilizados para criar novos bots';
COMMENT ON COLUMN modelos_bots.categoria IS 'Categoria do modelo (ex: mudancas, servicos, vendas)';
COMMENT ON COLUMN modelos_bots.perguntas IS 'Estrutura de perguntas do modelo em JSONB';

-- ============================================
-- FIM DA MIGRATION
-- ============================================


