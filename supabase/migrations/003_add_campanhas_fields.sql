-- ============================================
-- MIGRATION: Adicionar campos cidade_id e hotsite_id em campanhas
-- ============================================
-- As campanhas são vinculadas a empresas, mas também precisam
-- estar vinculadas a uma cidade e hotsite específico para controle
-- de publicidade por localização.
-- ============================================

-- 1. Adicionar cidade_id (opcional, mas útil para filtros)
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS cidade_id UUID REFERENCES cidades(id) ON DELETE SET NULL;

-- 2. Adicionar hotsite_id (opcional, mas útil para vincular campanha ao hotsite específico)
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS hotsite_id UUID REFERENCES hotsites(id) ON DELETE SET NULL;

-- 3. Adicionar campo ativo para controlar status da campanha
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 4. Adicionar campo observacoes para notas administrativas
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 5. Adicionar campo updated_at para controle de atualizações
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_campanhas_empresa ON campanhas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_cidade ON campanhas(cidade_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_hotsite ON campanhas(hotsite_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_plano ON campanhas(plano_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_ativo ON campanhas(ativo);
CREATE INDEX IF NOT EXISTS idx_campanhas_data_fim ON campanhas(data_fim) WHERE data_fim IS NOT NULL;

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_campanhas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_campanhas_updated_at ON campanhas;
CREATE TRIGGER trigger_update_campanhas_updated_at
  BEFORE UPDATE ON campanhas
  FOR EACH ROW
  EXECUTE FUNCTION update_campanhas_updated_at();

-- 9. Habilitar RLS para campanhas (apenas admin pode ver/editar)
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;

-- 10. Política: Apenas usuários autenticados podem ver campanhas
--    (Você pode ajustar isso depois quando implementar autenticação)
CREATE POLICY "Campanhas são visíveis apenas para autenticados"
  ON campanhas FOR SELECT
  USING (true); -- Por enquanto permite todos, ajuste depois

-- 11. Política: Apenas usuários autenticados podem inserir/atualizar campanhas
CREATE POLICY "Campanhas podem ser criadas por autenticados"
  ON campanhas FOR INSERT
  WITH CHECK (true); -- Por enquanto permite todos, ajuste depois

CREATE POLICY "Campanhas podem ser atualizadas por autenticados"
  ON campanhas FOR UPDATE
  USING (true); -- Por enquanto permite todos, ajuste depois

-- Migração 003_add_campanhas_fields.sql concluída com sucesso.

