-- ============================================
-- MIGRATION: Criar modelo padrão para empresas de mudança
-- ============================================
-- Descrição: Cria o modelo padrão de bot para empresas de mudança
-- Data: 2025-11-26

-- Inserir modelo padrão para mudanças
INSERT INTO modelos_bots (
  nome,
  descricao,
  categoria,
  mensagem_inicial,
  mensagem_final,
  mensagem_erro,
  palavras_ativacao,
  perguntas
) VALUES (
  'Mudanças Residenciais e Comerciais',
  'Modelo padrão para empresas de mudança. Captura origem, destino, tipo de imóvel, metragem, elevador, embalagem, nome, email, data e lista de objetos.',
  'mudancas',
  '👋 Olá! Sou a *Julia*!\n\nVou calcular o valor da sua mudança agora — e o melhor: o preço aparece na hora, em poucos segundos. No final, também te mostro quais empresas estão disponíveis para seu trajeto.\n\n📍 *Para começar, me diga: de onde você está saindo?*',
  '✅ *Perfeito!* Analisando sua rota e o porte da mudança...\n\nSua mudança parece ser de porte médio na região informada.\n\nNormalmente, mudanças desse tipo ficam em uma faixa de preço bem definida, dependendo da distância, dificuldade de acesso e volume transportado.\n\n💬 Para te mostrar a faixa real de preço baseada em centenas de mudanças parecidas e ainda te enviar cotações verificadas de empresas de mudança, me informe um contato rápido.\n\n📝 *Qual é o seu nome?*',
  '❌ Desculpe, ocorreu um erro. Digite *oi* para começar novamente.',
  ARRAY['oi', 'olá', 'ola', 'hey', 'hi', 'hello', 'orçamento', 'orcamento', 'cotação', 'cotacao', 'mudança', 'mudanca', 'mudar', 'iniciar', 'começar', 'comecar', 'start', 'nova cotação', 'nova cotacao', 'novo orçamento', 'novo orcamento'],
  '{
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
      "texto": "Envie a lista de objetos ou informações adicionais sobre sua mudança.",
      "tipo": "texto"
    }
  }'::jsonb
)
ON CONFLICT (nome) DO NOTHING;

-- ============================================
-- FIM DA MIGRATION
-- ============================================


