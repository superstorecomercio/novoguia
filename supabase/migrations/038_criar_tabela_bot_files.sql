-- ============================================
-- MIGRATION: Criar tabela para armazenar arquivos dos bots
-- ============================================
-- Descrição: Armazena o conteúdo dos arquivos de código de cada bot
-- Data: 2025-11-26

-- Criar tabela bot_files
CREATE TABLE IF NOT EXISTS bot_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES whatsapp_bots(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Ex: "server.js", "message-handler.js", etc.
  file_content TEXT NOT NULL, -- Conteúdo completo do arquivo
  file_type TEXT, -- "javascript", "json", "text", etc.
  description TEXT, -- Descrição do que o arquivo faz
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Garantir que não haja arquivos duplicados por bot
  UNIQUE(bot_id, file_path)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bot_files_bot_id ON bot_files(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_files_file_path ON bot_files(file_path);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_bot_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_bot_files_updated_at ON bot_files;
CREATE TRIGGER trg_update_bot_files_updated_at
  BEFORE UPDATE ON bot_files
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_files_updated_at();

-- RLS (Row Level Security)
ALTER TABLE bot_files ENABLE ROW LEVEL SECURITY;

-- Política: Service role pode gerenciar arquivos
DROP POLICY IF EXISTS "Service role pode gerenciar arquivos do bot" ON bot_files;
CREATE POLICY "Service role pode gerenciar arquivos do bot"
  ON bot_files
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE bot_files IS 'Armazena o conteúdo dos arquivos de código de cada bot WhatsApp';
COMMENT ON COLUMN bot_files.bot_id IS 'ID do bot ao qual o arquivo pertence';
COMMENT ON COLUMN bot_files.file_path IS 'Caminho/nome do arquivo (ex: server.js, message-handler.js)';
COMMENT ON COLUMN bot_files.file_content IS 'Conteúdo completo do arquivo em texto';
COMMENT ON COLUMN bot_files.file_type IS 'Tipo do arquivo (javascript, json, text, etc.)';

-- ============================================
-- FIM DA MIGRATION
-- ============================================


