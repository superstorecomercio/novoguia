-- ============================================
-- MIGRATION 037: Importar Bot de Teste da VPS
-- ============================================
-- Importa as configurações e perguntas do bot que já está rodando na VPS
-- ============================================

-- Deletar bot de teste padrão se existir
DELETE FROM whatsapp_bots WHERE numero_whatsapp = '5511999999999';

-- Inserir bot de teste com configurações reais da VPS
-- ⚠️ IMPORTANTE: 
-- Tokens e chaves NÃO são preenchidos por segurança - configure pelo painel admin
INSERT INTO whatsapp_bots (
  nome,
  numero_whatsapp,
  ativo,
  descricao,
  palavras_ativacao,
  mensagem_inicial,
  mensagem_final,
  mensagem_erro,
  perguntas,
  whatsapp_token,
  whatsapp_phone_id,
  verify_token,
  openai_api_key,
  supabase_url,
  supabase_service_key
) VALUES (
  'Bot de Teste - VPS',
  '15551824523', -- Número do bot de teste
  true,
  'Bot de teste que está rodando na VPS. Configurações extraídas do código atual. Configure tokens e chaves pelo painel admin.',
  ARRAY[
    'oi', 'olá', 'ola', 'hey', 'hi', 'hello',
    'orçamento', 'orcamento', 'cotação', 'cotacao',
    'mudança', 'mudanca', 'mudar',
    'iniciar', 'começar', 'comecar', 'start',
    'nova cotação', 'nova cotacao', 'novo orçamento', 'novo orcamento'
  ],
  '👋 Olá! Sou a *Julia*!

Vou calcular o valor da sua mudança agora — e o melhor: o preço aparece na hora, em poucos segundos. No final, também te mostro quais empresas estão disponíveis para seu trajeto.

📍 *Para começar, me diga: de onde você está saindo?*',
  '✅ *Perfeito!* Analisando sua rota e o porte da mudança...

Sua mudança parece ser de porte médio na região informada.

Normalmente, mudanças desse tipo ficam em uma faixa de preço bem definida, dependendo da distância, dificuldade de acesso e volume transportado.

💬 Para te mostrar a faixa real de preço baseada em centenas de mudanças parecidas e ainda te enviar cotações verificadas de empresas de mudança, me informe um contato rápido.

📝 *Qual é o seu nome?*',
  '❌ Desculpe, ocorreu um erro. Digite *oi* para começar novamente.',
  '{
    "origem": {
      "texto": "✅ Ótimo!\n\n🎯 *E para onde você está se mudando?*",
      "tipo": "texto"
    },
    "destino": {
      "texto": "🏠 *Qual o tipo de imóvel na origem?*",
      "tipo": "lista",
      "opcoes": [
        {"id": "casa", "titulo": "Casa", "descricao": "Residencial"},
        {"id": "apartamento", "titulo": "Apartamento", "descricao": "Residencial"},
        {"id": "empresa", "titulo": "Empresa", "descricao": "Comercial"}
      ]
    },
    "tipo_imovel": {
      "texto": "📏 *Qual a metragem aproximada do imóvel na origem?*",
      "tipo": "lista",
      "opcoes": [
        {"id": "ate_50", "titulo": "Até 50 m²", "descricao": "Pequeno"},
        {"id": "50_150", "titulo": "50 a 150 m²", "descricao": "Médio"},
        {"id": "150_300", "titulo": "150 a 300 m²", "descricao": "Grande"},
        {"id": "acima_300", "titulo": "Acima de 300 m²", "descricao": "Muito grande"}
      ]
    },
    "metragem": {
      "texto": "🛗 *O imóvel tem elevador?*",
      "tipo": "botoes",
      "opcoes": [
        {"id": "elevador_sim", "titulo": "Sim"},
        {"id": "elevador_nao", "titulo": "Não"}
      ]
    },
    "elevador": {
      "texto": "📦 *Você precisa de embalagem e desmontagem de móveis?*",
      "tipo": "botoes",
      "opcoes": [
        {"id": "emb_sim", "titulo": "Sim, completa"},
        {"id": "emb_nao", "titulo": "Não preciso"}
      ]
    },
    "embalagem": {
      "texto": "✅ *Perfeito!* Analisando sua rota e o porte da mudança...\n\nSua mudança parece ser de porte médio na região informada.\n\nNormalmente, mudanças desse tipo ficam em uma faixa de preço bem definida, dependendo da distância, dificuldade de acesso e volume transportado.\n\n💬 Para te mostrar a faixa real de preço baseada em centenas de mudanças parecidas e ainda te enviar cotações verificadas de empresas de mudança, me informe um contato rápido.\n\n📝 *Qual é o seu nome?*",
      "tipo": "texto"
    },
    "nome": {
      "texto": "Prazer, {nome}! 😊\n\n📧 *Qual o seu e-mail?*",
      "tipo": "texto"
    },
    "email": {
      "texto": "📅 *Qual a data estimada da mudança?* _(opcional)_\n\n_(Digite no formato DDMMAAAA, exemplo: 25122025 para 25/12/2025, ou \"pular\" se não souber)_",
      "tipo": "texto"
    },
    "data": {
      "texto": "📝 *Gostaria de enviar uma lista de objetos ou informações adicionais para um orçamento mais preciso?*",
      "tipo": "botoes",
      "opcoes": [
        {"id": "lista_sim", "titulo": "Sim, enviar"},
        {"id": "lista_nao", "titulo": "Pular esta etapa"}
      ]
    },
    "lista_objetos": {
      "texto": "📝 *Ótimo! Envie a lista de objetos ou informações adicionais sobre sua mudança.*\n\n_Ex: Sofá de 3 lugares, mesa de jantar com 6 cadeiras, geladeira, fogão, guarda-roupa..._\n\n_💡 Você também pode incluir informações como: itens frágeis, objetos de grande porte, necessidade de desmontagem, etc._",
      "tipo": "texto"
    },
    "lista_texto": {
      "texto": "",
      "tipo": "texto"
    }
  }'::JSONB,
  NULL, -- whatsapp_token - Configure pelo painel admin
  NULL, -- whatsapp_phone_id - Configure pelo painel admin
  NULL, -- verify_token - Configure pelo painel admin
  NULL, -- openai_api_key - Configure pelo painel admin
  NULL, -- supabase_url - Configure pelo painel admin
  NULL  -- supabase_service_key - Configure pelo painel admin
)
ON CONFLICT (numero_whatsapp) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  palavras_ativacao = EXCLUDED.palavras_ativacao,
  mensagem_inicial = EXCLUDED.mensagem_inicial,
  mensagem_final = EXCLUDED.mensagem_final,
  mensagem_erro = EXCLUDED.mensagem_erro,
  perguntas = EXCLUDED.perguntas,
  updated_at = NOW();

-- ============================================
-- FIM DA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Bot de teste importado com sucesso!';
  RAISE NOTICE '  - Nome: Bot de Teste - VPS';
  RAISE NOTICE '  - Número: 5511999999999 (substitua pelo número real)';
  RAISE NOTICE '  - Todas as perguntas e configurações importadas';
  RAISE NOTICE '================================================';
END $$;

