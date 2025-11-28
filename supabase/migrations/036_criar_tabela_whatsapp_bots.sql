-- ============================================
-- MIGRATION 036: Criar Tabela WhatsApp Bots
-- ============================================
-- Tabela para gerenciar configurações dos bots WhatsApp
-- Permite múltiplos números e configurações personalizadas
-- ============================================

-- Criar tabela whatsapp_bots
CREATE TABLE IF NOT EXISTS whatsapp_bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identificação
  nome VARCHAR(255) NOT NULL, -- Ex: "Bot Principal", "Bot de Teste"
  numero_whatsapp VARCHAR(20) NOT NULL UNIQUE, -- Número do WhatsApp (ex: 5511999999999)
  ativo BOOLEAN DEFAULT true NOT NULL,
  
  -- Configurações WhatsApp Business API
  whatsapp_token TEXT, -- Token permanente do Facebook
  whatsapp_phone_id VARCHAR(50), -- Phone ID do Facebook
  verify_token VARCHAR(255), -- Token para verificação do webhook
  
  -- Configurações OpenAI
  openai_api_key TEXT, -- API Key da OpenAI (criptografado se necessário)
  
  -- Configurações Supabase
  supabase_url TEXT, -- URL do Supabase
  supabase_service_key TEXT, -- Service Key do Supabase (criptografado se necessário)
  
  -- Perguntas do Bot (JSONB para flexibilidade)
  perguntas JSONB DEFAULT '{
    "origem": {
      "texto": "De onde você vai mudar?",
      "tipo": "texto"
    },
    "destino": {
      "texto": "E para onde você está se mudando?",
      "tipo": "texto"
    },
    "tipo_imovel": {
      "texto": "Qual o tipo de imóvel na origem?",
      "tipo": "lista",
      "opcoes": [
        {"id": "casa", "titulo": "Casa", "descricao": "Residencial"},
        {"id": "apartamento", "titulo": "Apartamento", "descricao": "Residencial"},
        {"id": "empresa", "titulo": "Empresa", "descricao": "Comercial"}
      ]
    },
    "metragem": {
      "texto": "Qual a metragem aproximada do imóvel na origem?",
      "tipo": "lista",
      "opcoes": [
        {"id": "ate_50", "titulo": "Até 50 m²", "descricao": "Pequeno"},
        {"id": "50_150", "titulo": "50 a 150 m²", "descricao": "Médio"},
        {"id": "150_300", "titulo": "150 a 300 m²", "descricao": "Grande"},
        {"id": "acima_300", "titulo": "Acima de 300 m²", "descricao": "Muito grande"}
      ]
    },
    "elevador": {
      "texto": "O imóvel tem elevador?",
      "tipo": "botoes",
      "opcoes": [
        {"id": "elevador_sim", "titulo": "Sim"},
        {"id": "elevador_nao", "titulo": "Não"}
      ]
    },
    "embalagem": {
      "texto": "Você precisa de embalagem e desmontagem de móveis?",
      "tipo": "botoes",
      "opcoes": [
        {"id": "emb_sim", "titulo": "Sim, completa"},
        {"id": "emb_nao", "titulo": "Não preciso"}
      ]
    },
    "nome": {
      "texto": "Qual é o seu nome?",
      "tipo": "texto"
    },
    "email": {
      "texto": "Qual o seu e-mail?",
      "tipo": "texto"
    },
    "data": {
      "texto": "Qual a data estimada da mudança? _(opcional)_\n\n_(Digite no formato DDMMAAAA, exemplo: 25122025 para 25/12/2025, ou \"pular\" se não souber)_",
      "tipo": "texto"
    },
    "lista_objetos": {
      "texto": "Gostaria de enviar uma lista de objetos ou informações adicionais para um orçamento mais preciso?",
      "tipo": "botoes",
      "opcoes": [
        {"id": "lista_sim", "titulo": "Sim, enviar"},
        {"id": "lista_nao", "titulo": "Pular esta etapa"}
      ]
    },
    "lista_texto": {
      "texto": "Ótimo! Envie a lista de objetos ou informações adicionais sobre sua mudança.\n\n_Ex: Sofá de 3 lugares, mesa de jantar com 6 cadeiras, geladeira, fogão, guarda-roupa..._\n\n_💡 Você também pode incluir informações como: itens frágeis, objetos de grande porte, necessidade de desmontagem, etc._",
      "tipo": "texto"
    }
  }'::JSONB,
  
  -- Mensagens do Bot
  mensagem_inicial TEXT DEFAULT 'Olá! Sou a Julia, assistente virtual da MudaTech. 😊

Estou aqui para te ajudar a calcular o orçamento da sua mudança de forma rápida e precisa!

Vou fazer algumas perguntas rápidas para entender melhor sua necessidade. Vamos começar? 🚚

📍 *De onde você vai mudar?*',
  
  mensagem_final TEXT DEFAULT '✅ *Perfeito!* Analisando sua rota e o porte da mudança...

Sua mudança parece ser de porte médio na região informada.

Normalmente, mudanças desse tipo ficam em uma faixa de preço bem definida, dependendo da distância, dificuldade de acesso e volume transportado.

💬 Para te mostrar a faixa real de preço baseada em centenas de mudanças parecidas e ainda te enviar cotações verificadas de empresas de mudança, me informe um contato rápido.',
  
  mensagem_erro TEXT DEFAULT '❌ Desculpe, ocorreu um erro. Digite *oi* para começar novamente.',
  
  -- Palavras de Ativação (array de strings)
  palavras_ativacao TEXT[] DEFAULT ARRAY[
    'oi', 'olá', 'ola', 'hey', 'hi', 'hello',
    'orçamento', 'orcamento', 'cotação', 'cotacao',
    'mudança', 'mudanca', 'mudar',
    'iniciar', 'começar', 'comecar', 'start',
    'nova cotação', 'nova cotacao', 'novo orçamento', 'novo orcamento'
  ],
  
  -- Metadados
  descricao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_bots_ativo ON whatsapp_bots(ativo);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bots_numero ON whatsapp_bots(numero_whatsapp);

-- Comentários
COMMENT ON TABLE whatsapp_bots IS 'Configurações dos bots WhatsApp para gerenciamento via painel admin';
COMMENT ON COLUMN whatsapp_bots.numero_whatsapp IS 'Número do WhatsApp no formato internacional (ex: 5511999999999)';
COMMENT ON COLUMN whatsapp_bots.perguntas IS 'JSONB com todas as perguntas do bot e suas configurações';
COMMENT ON COLUMN whatsapp_bots.palavras_ativacao IS 'Array de palavras que ativam o bot';

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_whatsapp_bots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_whatsapp_bots_updated_at ON whatsapp_bots;
CREATE TRIGGER trg_update_whatsapp_bots_updated_at
  BEFORE UPDATE ON whatsapp_bots
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_bots_updated_at();

-- RLS (Row Level Security)
ALTER TABLE whatsapp_bots ENABLE ROW LEVEL SECURITY;

-- Política: Permitir acesso via service_role (API admin)
-- Como a API usa createAdminClient (service_role), ela bypassa RLS automaticamente
-- Mas precisamos de uma política para permitir leitura/escrita via service_role
DROP POLICY IF EXISTS "Service role pode gerenciar bots WhatsApp" ON whatsapp_bots;
CREATE POLICY "Service role pode gerenciar bots WhatsApp"
  ON whatsapp_bots
  FOR ALL
  USING (true)  -- Service role bypassa RLS, mas a política precisa existir
  WITH CHECK (true);

-- Inserir bot de teste padrão (se não existir)
-- ⚠️ IMPORTANTE: Tokens e chaves NÃO são preenchidos por segurança
-- Configure-os pelo painel admin após criar o bot
INSERT INTO whatsapp_bots (nome, numero_whatsapp, ativo, descricao)
VALUES (
  'Bot de Teste',
  '15551824523',
  true,
  'Bot de teste para desenvolvimento. Configure tokens e chaves pelo painel admin.'
)
ON CONFLICT (numero_whatsapp) DO NOTHING;

-- ============================================
-- FIM DA MIGRATION
-- ============================================

