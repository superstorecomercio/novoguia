-- ============================================
-- MIGRATION 028: Filtrar campanhas sempre por ESTADO
-- ============================================
-- Modifica a função criar_orcamento_e_notificar para SEMPRE buscar
-- campanhas ativas pelo estado de destino, independente de ter encontrado
-- a cidade no banco de dados.
-- 
-- ANTES: Buscava por cidade se encontrada, senão por estado
-- DEPOIS: Sempre busca por estado
-- ============================================

-- Garantir que a função buscar_hotsites_ativos_por_estado existe
DROP FUNCTION IF EXISTS buscar_hotsites_ativos_por_estado(TEXT, TEXT);

CREATE OR REPLACE FUNCTION buscar_hotsites_ativos_por_estado(
  p_estado TEXT,
  p_tipo_servico TEXT DEFAULT 'mudanca'
)
RETURNS TABLE (
  hotsite_id UUID,
  campanha_id UUID,
  nome VARCHAR(255),
  email VARCHAR(255),
  cidade VARCHAR(255),
  estado VARCHAR(2),
  plano_ordem INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id as hotsite_id,
    c.id as campanha_id,
    h.nome_exibicao as nome,
    h.email,
    h.cidade,
    h.estado,
    COALESCE(p.ordem, 999) as plano_ordem
  FROM hotsites h
  INNER JOIN campanhas c ON c.hotsite_id = h.id
  LEFT JOIN planos p ON c.plano_id = p.id
  WHERE 
    UPPER(TRIM(h.estado)) = UPPER(TRIM(p_estado))
    AND c.ativo = true
    AND c.participa_cotacao = true
    AND h.nome_exibicao IS NOT NULL
  ORDER BY COALESCE(p.ordem, 999) ASC, c.data_inicio DESC, h.id;
END;
$$ LANGUAGE plpgsql;

-- Recriar função criar_orcamento_e_notificar com filtro sempre por estado
DROP FUNCTION IF EXISTS criar_orcamento_e_notificar(JSONB);

CREATE FUNCTION criar_orcamento_e_notificar(p_orcamento_data JSONB)
RETURNS TABLE (
  orcamento_id UUID,
  hotsites_notificados INTEGER,
  campanhas_ids UUID[]
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
#variable_conflict use_variable
DECLARE
  v_orcamento_id UUID;
  v_cidade_id UUID;
  v_campanhas RECORD;
  v_hotsites_count INTEGER := 0;
  v_campanhas_array UUID[] := '{}';
BEGIN
  -- Validações obrigatórias
  IF p_orcamento_data->>'nome_cliente' IS NULL OR (p_orcamento_data->>'nome_cliente')::TEXT = '' THEN
    RAISE EXCEPTION 'Nome do cliente é obrigatório';
  END IF;
  
  IF p_orcamento_data->>'email_cliente' IS NULL OR (p_orcamento_data->>'email_cliente')::TEXT = '' THEN
    RAISE EXCEPTION 'Email do cliente é obrigatório';
  END IF;
  
  IF p_orcamento_data->>'telefone_cliente' IS NULL OR (p_orcamento_data->>'telefone_cliente')::TEXT = '' THEN
    RAISE EXCEPTION 'Telefone do cliente é obrigatório';
  END IF;

  -- Validar destino
  IF p_orcamento_data->>'estado_destino' IS NULL OR (p_orcamento_data->>'estado_destino')::TEXT = '' THEN
    RAISE EXCEPTION 'Estado de destino é obrigatório';
  END IF;

  -- 1. Tentar buscar cidade_id pelo nome e estado de destino
  -- (mantido para salvar no orçamento, mas não usado para filtrar campanhas)
  SELECT id INTO v_cidade_id
  FROM cidades
  WHERE LOWER(TRIM(nome)) = LOWER(TRIM(p_orcamento_data->>'cidade_destino'))
    AND LOWER(TRIM(estado)) = LOWER(TRIM(p_orcamento_data->>'estado_destino'))
  LIMIT 1;

  -- 2. Inserir o orçamento
  INSERT INTO orcamentos (
    tipo,
    nome_cliente,
    email_cliente,
    telefone_cliente,
    whatsapp,
    origem_completo,
    destino_completo,
    estado_origem,
    cidade_origem,
    estado_destino,
    cidade_destino,
    cidade_id,
    tipo_imovel,
    tem_elevador,
    andar,
    precisa_embalagem,
    distancia_km,
    preco_min,
    preco_max,
    mensagem_ia,
    lista_objetos,
    arquivo_lista_url,
    arquivo_lista_nome,
    data_estimada,
    origem_formulario,
    user_agent,
    ip_cliente,
    hotsites_notificados
  ) VALUES (
    COALESCE((p_orcamento_data->>'tipo')::TEXT, 'mudanca'),
    (p_orcamento_data->>'nome_cliente')::TEXT,
    (p_orcamento_data->>'email_cliente')::TEXT,
    (p_orcamento_data->>'telefone_cliente')::TEXT,
    (p_orcamento_data->>'whatsapp')::TEXT,
    (p_orcamento_data->>'origem_completo')::TEXT,
    (p_orcamento_data->>'destino_completo')::TEXT,
    (p_orcamento_data->>'estado_origem')::TEXT,
    (p_orcamento_data->>'cidade_origem')::TEXT,
    (p_orcamento_data->>'estado_destino')::TEXT,
    (p_orcamento_data->>'cidade_destino')::TEXT,
    v_cidade_id,
    (p_orcamento_data->>'tipo_imovel')::TEXT,
    COALESCE((p_orcamento_data->>'tem_elevador')::BOOLEAN, false),
    COALESCE((p_orcamento_data->>'andar')::INTEGER, 1),
    COALESCE((p_orcamento_data->>'precisa_embalagem')::BOOLEAN, false),
    (p_orcamento_data->>'distancia_km')::NUMERIC,
    (p_orcamento_data->>'preco_min')::NUMERIC,
    (p_orcamento_data->>'preco_max')::NUMERIC,
    (p_orcamento_data->>'mensagem_ia')::TEXT,
    (p_orcamento_data->>'lista_objetos')::TEXT,
    (p_orcamento_data->>'arquivo_lista_url')::TEXT,
    (p_orcamento_data->>'arquivo_lista_nome')::TEXT,
    CASE 
      WHEN (p_orcamento_data->>'data_estimada')::TEXT IS NULL OR (p_orcamento_data->>'data_estimada')::TEXT = '' 
      THEN NULL 
      ELSE (p_orcamento_data->>'data_estimada')::DATE 
    END,
    COALESCE((p_orcamento_data->>'origem_formulario')::TEXT, 'calculadora'),
    (p_orcamento_data->>'user_agent')::TEXT,
    (p_orcamento_data->>'ip_cliente')::INET,
    0
  )
  RETURNING id INTO v_orcamento_id;

  -- 3. Buscar campanhas ativas SEMPRE por ESTADO
  -- Mudança: Removido IF/ELSE, sempre busca por estado independente de ter encontrado a cidade
  FOR v_campanhas IN
    SELECT * FROM buscar_hotsites_ativos_por_estado(
      (p_orcamento_data->>'estado_destino')::TEXT, 
      COALESCE((p_orcamento_data->>'tipo')::TEXT, 'mudanca')::TEXT
    )
  LOOP
    INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
    VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id)
    ON CONFLICT ON CONSTRAINT orcamentos_campanhas_orcamento_campanha_unique DO NOTHING;
    
    v_hotsites_count := v_hotsites_count + 1;
    v_campanhas_array := array_append(v_campanhas_array, v_campanhas.campanha_id);
  END LOOP;

  -- 4. Atualizar contador de hotsites notificados
  UPDATE orcamentos
  SET hotsites_notificados = v_hotsites_count
  WHERE id = v_orcamento_id;

  -- 5. Retornar resultado
  RETURN QUERY
  SELECT 
    v_orcamento_id,
    v_hotsites_count,
    v_campanhas_array;
END;
$$;

-- Atualizar comentário da função
COMMENT ON FUNCTION criar_orcamento_e_notificar(JSONB) IS 
'Cria orçamento e vincula com campanhas ativas. SEMPRE filtra campanhas pelo estado de destino, independente de ter encontrado a cidade no banco.';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MIGRATION 028 CONCLUÍDA!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Mudança aplicada:';
  RAISE NOTICE '  - Campanhas agora são SEMPRE filtradas por ESTADO';
  RAISE NOTICE '  - Independente de ter encontrado a cidade no banco';
  RAISE NOTICE '  - Mais empresas serão notificadas por orçamento';
  RAISE NOTICE '================================================';
END $$;

