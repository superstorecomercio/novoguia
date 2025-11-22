-- ============================================
-- MIGRATION 025: Filtrar empresas por estado na calculadora
-- ============================================
-- Modifica a função criar_orcamento_e_notificar para SEMPRE
-- buscar empresas do estado de destino, independentemente da cidade
-- ============================================

-- Remover função existente primeiro (necessário para mudar parâmetros)
DROP FUNCTION IF EXISTS criar_orcamento_e_notificar(JSONB);

-- Recriar função criar_orcamento_e_notificar
-- Agora sempre filtra por estado, não por cidade
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
  v_estado_destino TEXT;
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
  v_estado_destino := (p_orcamento_data->>'estado_destino')::TEXT;
  IF v_estado_destino IS NULL OR v_estado_destino = '' THEN
    RAISE EXCEPTION 'Estado de destino é obrigatório';
  END IF;

  -- 1. Tentar buscar cidade_id pelo nome e estado de destino (apenas para salvar no orçamento)
  SELECT id INTO v_cidade_id
  FROM cidades
  WHERE LOWER(TRIM(nome)) = LOWER(TRIM(p_orcamento_data->>'cidade_destino'))
    AND LOWER(TRIM(estado)) = LOWER(TRIM(v_estado_destino))
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
    v_estado_destino,
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

  -- 3. ✅ SEMPRE buscar campanhas ativas por ESTADO (não por cidade)
  -- Qualquer cidade de destino vai buscar empresas do estado de destino
  FOR v_campanhas IN
    SELECT * FROM buscar_hotsites_ativos_por_estado(v_estado_destino, COALESCE((p_orcamento_data->>'tipo')::TEXT, 'mudanca'))
  LOOP
    INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
    VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id)
    ON CONFLICT (orcamento_id, campanha_id) DO NOTHING;
    
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

-- Comentário na função
COMMENT ON FUNCTION criar_orcamento_e_notificar(JSONB) IS 
'Cria orçamento e vincula com campanhas ativas do ESTADO de destino. Sempre filtra por estado, independentemente da cidade.';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MIGRATION 025 CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Alteração:';
  RAISE NOTICE '  - Função criar_orcamento_e_notificar agora SEMPRE filtra por estado';
  RAISE NOTICE '  - Qualquer cidade de destino busca empresas do estado de destino';
  RAISE NOTICE '================================================';
END $$;

