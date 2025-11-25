-- ============================================
-- DIAGNÓSTICO: Por que apenas 3 campanhas de SP?
-- ============================================
-- Execute esta query no Supabase SQL Editor para diagnosticar
-- Retorna tudo em uma única tabela

SELECT 
  '1. Total campanhas ativas em SP' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true

UNION ALL

SELECT 
  '2. Campanhas que participam de cotação' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND c.participa_cotacao = true

UNION ALL

SELECT 
  '3. Campanhas com hotsite ativo' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND c.participa_cotacao = true
  AND h.ativo = true

UNION ALL

SELECT 
  '4. Campanhas com nome_exibicao preenchido' as etapa,
  COUNT(*)::TEXT as total,
  '' as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND c.participa_cotacao = true
  AND h.ativo = true
  AND h.nome_exibicao IS NOT NULL

ORDER BY etapa;

-- 5. Detalhes das campanhas que NÃO passam nos filtros
SELECT 
  '5. Campanhas EXCLUÍDAS' as etapa,
  COUNT(*)::TEXT as total,
  STRING_AGG(
    CASE 
      WHEN h.nome_exibicao IS NULL THEN 'nome_exibicao NULL'
      WHEN h.ativo = false THEN 'hotsite inativo'
      WHEN c.participa_cotacao = false THEN 'não participa cotação'
      ELSE 'outro motivo'
    END, 
    ', '
  ) as detalhes
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND (
    h.ativo = false 
    OR c.participa_cotacao = false 
    OR h.nome_exibicao IS NULL
  );

-- 6. Resultado final (igual à função)
SELECT 
  '6. RESULTADO FINAL (retornado pela função)' as etapa,
  COUNT(*)::TEXT as total,
  STRING_AGG(h.nome_exibicao, ', ' ORDER BY COALESCE(p.ordem, 999) ASC, c.data_inicio DESC) as detalhes
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
LEFT JOIN planos p ON c.plano_id = p.id
WHERE 
  UPPER(TRIM(h.estado)) = 'SP'
  AND h.ativo = true
  AND c.ativo = true
  AND c.participa_cotacao = true
  AND h.nome_exibicao IS NOT NULL;

-- ============================================
-- DETALHES: Lista completa das campanhas excluídas
-- ============================================
SELECT 
  c.id as campanha_id,
  h.id as hotsite_id,
  h.nome_exibicao,
  h.estado,
  h.ativo as hotsite_ativo,
  c.ativo as campanha_ativo,
  c.participa_cotacao,
  CASE 
    WHEN h.nome_exibicao IS NULL THEN '❌ nome_exibicao NULL'
    WHEN h.ativo = false THEN '❌ hotsite inativo'
    WHEN c.participa_cotacao = false THEN '❌ não participa cotação'
    ELSE '✅ OK'
  END as motivo_exclusao
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true
  AND (
    h.ativo = false 
    OR c.participa_cotacao = false 
    OR h.nome_exibicao IS NULL
  )
ORDER BY motivo_exclusao, h.nome_exibicao;

-- ============================================
-- RESUMO: PERGUNTAS E RESPOSTAS DA CALCULADORA
-- ============================================
-- Componente: InstantCalculatorHybridTeste.tsx
-- Página: /calculadorateste
--
-- FLUXO COMPLETO DE PERGUNTAS E RESPOSTAS:
--
-- 1. MENSAGENS INICIAIS (Automáticas)
--    Bot: "Olá! Sou a Julia 👋"
--    Bot: "Vou calcular o valor da sua mudança agora — e o melhor: (o preço aparece na hora, em poucos segundos.) No final, também te mostro quais empresas estão disponíveis para seu trajeto."
--
-- 2. FORMULÁRIO INICIAL (5 etapas)
--
--    ETAPA 1: ORIGEM
--    Pergunta: "Para começar, me diga: de onde você está saindo?"
--    Tipo: Texto livre
--    Placeholder: "Ex: Rua das Flores, 123, Centro, São Paulo - SP"
--    Resposta do usuário: Texto livre (ex: "Moema, São Paulo - SP")
--
--    ETAPA 2: DESTINO
--    Pergunta: "Ótimo! E para onde você está se mudando?"
--    Tipo: Texto livre
--    Placeholder: "Ex: Av. Paulista, 1000, Bela Vista, São Paulo - SP"
--    Resposta do usuário: Texto livre (ex: "Pinheiros, São Paulo - SP")
--
--    ETAPA 3: TIPO DE IMÓVEL
--    Pergunta: "Qual o tipo do seu imóvel?"
--    Tipo: Seleção (botões)
--    Opções:
--      - "Kitnet" → valor: "kitnet"
--      - "Apartamento 1 quarto" → valor: "1_quarto"
--      - "Apartamento 2 quartos" → valor: "2_quartos"
--      - "Apartamento 3+ quartos ou Casa" → valor: "3_mais"
--      - "Mudança Comercial" → valor: "comercial"
--    Resposta do usuário: Uma das opções acima
--
--    ETAPA 4: ELEVADOR
--    Pergunta: "O imóvel tem elevador?"
--    Tipo: Seleção (botões)
--    Opções:
--      - "Sim" → valor: "sim"
--      - "Não" → valor: "nao"
--    Resposta do usuário: "Sim" ou "Não"
--
--    ETAPA 5: EMBALAGEM
--    Pergunta: "Você precisa de embalagem e desmontagem de móveis?"
--    Tipo: Seleção (botões)
--    Opções:
--      - "Sim, preciso de embalagem completa" → valor: "sim"
--      - "Não, eu mesmo embalo" → valor: "nao"
--    Resposta do usuário: "Sim" ou "Não"
--
-- 3. PREVIEW (Mensagens automáticas após completar formulário)
--    Bot: "Perfeito! ✅ Analisando sua rota e o porte da mudança..."
--    Bot: "Sua mudança parece ser de porte [pequeno/médio/grande/comercial] na região informada."
--    Bot: "Normalmente, mudanças desse tipo ficam em uma faixa de preço bem definida, dependendo da distância, dificuldade de acesso e volume transportado."
--    Bot: "Para te mostrar a faixa real de preço baseada em centenas de mudanças parecidas e ainda te enviar (cotações verificadas de empresas de mudança), me informe um contato rápido."
--
-- 4. CAPTURA DE CONTATO (4 etapas)
--
--    ETAPA 1: NOME
--    Pergunta: "Qual é o seu nome?"
--    Tipo: Texto livre
--    Placeholder: "Como você gostaria de ser chamado?"
--    Validação: Campo obrigatório, não pode estar vazio
--    Resposta do usuário: Texto livre (ex: "João Silva")
--
--    ETAPA 2: E-MAIL
--    Pergunta: "Qual o seu e-mail?"
--    Tipo: Email
--    Placeholder: "seuemail@exemplo.com"
--    Validação: Campo obrigatório, deve conter "@" e "."
--    Resposta do usuário: Email válido (ex: "joao@email.com")
--
--    ETAPA 3: WHATSAPP
--    Pergunta: "Qual o seu WhatsApp?"
--    Tipo: Telefone (com máscara automática)
--    Placeholder: "(11) 98765-4321"
--    Validação: Campo obrigatório, 10 ou 11 dígitos (após remover máscara)
--    Máscara: Aplicada automaticamente no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
--    Resposta do usuário: Telefone formatado (ex: "(11) 98765-4321")
--
--    ETAPA 4: DATA ESTIMADA (Opcional)
--    Pergunta: "Qual a data estimada da mudança? (opcional)"
--    Tipo: Data
--    Placeholder: "Selecione uma data"
--    Validação: Deve ser data futura (se informada)
--    Resposta do usuário: Data no formato YYYY-MM-DD ou vazio
--
-- 5. PERGUNTA SOBRE LISTA DE OBJETOS
--    Bot: "Antes de calcular, você gostaria de enviar uma lista de objetos para um orçamento mais preciso?"
--    Opções (botões):
--      - "Sim, quero enviar" → Abre campo de texto para lista
--      - "Não, pode calcular" → Vai direto para cálculo
--
--    Se escolher "Sim":
--      Bot: "Perfeito! Descreva os objetos que serão transportados. Isso ajudará as empresas a preparar um orçamento mais preciso."
--      Campo: Textarea livre
--      Placeholder: "Ex: Sofá de 3 lugares, mesa de jantar com 6 cadeiras, geladeira, fogão, guarda-roupa, cama de casal..."
--      Resposta do usuário: Texto livre descrevendo objetos
--      Bot: "Lista de objetos recebida! Agora vou calcular o melhor orçamento para você... ⏳"
--
--    Se escolher "Não":
--      Bot: "Perfeito! Calculando o melhor orçamento para você... ⏳"
--
-- 6. CÁLCULO E RESULTADO FINAL
--    Estado: Loading (mostra "Calculando orçamento...")
--    API: POST /api/calcular-orcamento
--    Processamento: IA calcula distância e preço
--    Resultado exibido:
--      - Faixa de preço: "R$ X.XXX - R$ X.XXX"
--      - Distância calculada (se disponível)
--      - Mensagem explicativa da IA
--      - Resumo completo da mudança
--      - Informação sobre empresas que entrarão em contato
--      - Botões: "Fazer nova cotação" e "Voltar para Home"
--
-- VALIDAÇÕES IMPORTANTES:
-- - Todos os campos do formulário inicial são obrigatórios
-- - Nome, e-mail e WhatsApp são obrigatórios na captura de contato
-- - Data estimada é opcional
-- - Lista de objetos é opcional
-- - WhatsApp deve ter 10 ou 11 dígitos (com DDD)
-- - E-mail deve conter "@" e "."
-- - Data deve ser futura (se informada)
--
-- MAPEAMENTO DE PORTE POR TIPO DE IMÓVEL:
-- - kitnet → "pequeno"
-- - 1_quarto → "pequeno a médio"
-- - 2_quartos → "médio"
-- - 3_mais → "grande"
-- - comercial → "comercial"
--

