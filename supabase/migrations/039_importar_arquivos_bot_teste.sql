-- ============================================
-- MIGRATION: Importar arquivos do bot de teste para o banco
-- ============================================
-- Descrição: Importa os arquivos de código do bot de teste VPS para a tabela bot_files
-- Data: 2025-11-26
-- IMPORTANTE: Esta migration assume que o bot de teste já existe na tabela whatsapp_bots
--             com o número '15551824523'

-- Função auxiliar para escapar strings SQL
-- (PostgreSQL já tem funções nativas, mas vamos usar dollar quoting)

-- Buscar o ID do bot de teste
DO $$
DECLARE
  v_bot_id UUID;
BEGIN
  -- Buscar o bot de teste pelo número
  SELECT id INTO v_bot_id
  FROM whatsapp_bots
  WHERE numero_whatsapp = '15551824523'
  LIMIT 1;
  
  IF v_bot_id IS NULL THEN
    RAISE NOTICE 'Bot de teste não encontrado. Execute a migration 037 primeiro.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Importando arquivos para o bot ID: %', v_bot_id;
  
  -- Inserir arquivos do bot
  -- Nota: Os arquivos serão importados com conteúdo vazio inicialmente
  -- O conteúdo real será preenchido via API ou script separado
  
  -- server.js
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'server.js',
    '// Arquivo server.js - Servidor Express para webhook do WhatsApp',
    'javascript',
    'Servidor principal do bot - gerencia webhook e rotas'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  -- message-handler.js
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'message-handler.js',
    '// Arquivo message-handler.js - Processador de mensagens do bot',
    'javascript',
    'Lógica principal de processamento de mensagens e fluxo conversacional'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  -- sessions.js
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'sessions.js',
    '// Arquivo sessions.js - Gerenciamento de sessões',
    'javascript',
    'Gerencia sessões de conversa e estado do bot'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  -- whatsapp.js
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'whatsapp.js',
    '// Arquivo whatsapp.js - Integração com WhatsApp Business API',
    'javascript',
    'Funções para enviar mensagens, botões e listas via WhatsApp API'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  -- openai-service.js
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'openai-service.js',
    '// Arquivo openai-service.js - Integração com OpenAI',
    'javascript',
    'Serviço para calcular orçamentos usando IA (OpenAI GPT)'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  -- supabase-service.js
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'supabase-service.js',
    '// Arquivo supabase-service.js - Integração com Supabase',
    'javascript',
    'Serviço para salvar orçamentos no banco de dados Supabase'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  -- date-validator.js
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'date-validator.js',
    '// Arquivo date-validator.js - Validador de datas',
    'javascript',
    'Funções para validar e formatar datas em formato brasileiro'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  -- telefone-validator.js
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'telefone-validator.js',
    '// Arquivo telefone-validator.js - Validador de telefones',
    'javascript',
    'Funções para validar e formatar números de telefone para WhatsApp'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  -- url-shortener.js
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'url-shortener.js',
    '// Arquivo url-shortener.js - Encurtador de URLs',
    'javascript',
    'Serviço para encurtar URLs de links do WhatsApp'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  -- package.json
  INSERT INTO bot_files (bot_id, file_path, file_content, file_type, description)
  VALUES (
    v_bot_id,
    'package.json',
    '{}',
    'json',
    'Arquivo de dependências do projeto Node.js'
  )
  ON CONFLICT (bot_id, file_path) DO NOTHING;
  
  RAISE NOTICE 'Arquivos importados com sucesso!';
  RAISE NOTICE 'NOTA: Os arquivos foram criados com conteúdo placeholder.';
  RAISE NOTICE 'Use a API /api/admin/bots-whatsapp/[id]/files para atualizar o conteúdo real.';
  
END $$;

-- ============================================
-- FIM DA MIGRATION
-- ============================================


