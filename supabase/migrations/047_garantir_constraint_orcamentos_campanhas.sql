-- Migration: Garantir constraint única em orcamentos_campanhas
-- Data: 2025-01-XX
-- Descrição: Garante que a constraint única (orcamento_id, campanha_id) existe
--            para permitir o uso de ON CONFLICT na função criar_orcamento_e_notificar

-- Garantir que a constraint única existe
DO $$
BEGIN
  -- Remover constraint se existir com nome diferente
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'orcamentos_campanhas'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'orcamentos_campanhas'::regclass AND attname = 'orcamento_id')
    AND conkey[2] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'orcamentos_campanhas'::regclass AND attname = 'campanha_id')
    AND conname != 'orcamentos_campanhas_orcamento_campanha_unique'
  ) THEN
    -- Encontrar e remover constraint com nome diferente
    EXECUTE (
      SELECT 'ALTER TABLE orcamentos_campanhas DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conrelid = 'orcamentos_campanhas'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 2
      AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'orcamentos_campanhas'::regclass AND attname = 'orcamento_id')
      AND conkey[2] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'orcamentos_campanhas'::regclass AND attname = 'campanha_id')
      AND conname != 'orcamentos_campanhas_orcamento_campanha_unique'
      LIMIT 1
    );
    RAISE NOTICE '✅ Constraint antiga removida';
  END IF;

  -- Criar constraint se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orcamentos_campanhas_orcamento_campanha_unique'
  ) THEN
    ALTER TABLE orcamentos_campanhas
    ADD CONSTRAINT orcamentos_campanhas_orcamento_campanha_unique 
    UNIQUE(orcamento_id, campanha_id);
    
    RAISE NOTICE '✅ Constraint única criada: orcamentos_campanhas_orcamento_campanha_unique';
  ELSE
    RAISE NOTICE '✅ Constraint única já existe: orcamentos_campanhas_orcamento_campanha_unique';
  END IF;
END $$;

-- Recriar função criar_orcamento_e_notificar para garantir que está usando a constraint correta
DROP FUNCTION IF EXISTS criar_orcamento_e_notificar(JSONB);

CREATE FUNCTION criar_orcamento_e_notificar(p_dados JSONB)
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
  v_estado_destino TEXT;
  v_campanhas RECORD;
  v_hotsites_count INTEGER := 0;
  v_campanhas_array UUID[] := '{}';
BEGIN
  -- Validações obrigatórias
  IF p_dados->>'nome_cliente' IS NULL OR (p_dados->>'nome_cliente')::TEXT = '' THEN
    RAISE EXCEPTION 'Nome do cliente é obrigatório';
  END IF;
  
  IF p_dados->>'email_cliente' IS NULL OR (p_dados->>'email_cliente')::TEXT = '' THEN
    RAISE EXCEPTION 'Email do cliente é obrigatório';
  END IF;
  
  IF p_dados->>'telefone_cliente' IS NULL OR (p_dados->>'telefone_cliente')::TEXT = '' THEN
    RAISE EXCEPTION 'Telefone do cliente é obrigatório';
  END IF;

  -- Validar destino: precisa ter pelo menos cidade ou estado
  IF (p_dados->>'cidade_destino' IS NULL OR (p_dados->>'cidade_destino')::TEXT = '') 
     AND (p_dados->>'estado_destino' IS NULL OR (p_dados->>'estado_destino')::TEXT = '') THEN
    RAISE EXCEPTION 'Cidade ou estado de destino é obrigatório';
  END IF;

  -- 1. Primeiro, garantir que temos o estado (priorizar o retornado pela IA)
  IF p_dados->>'estado_destino' IS NOT NULL AND (p_dados->>'estado_destino')::TEXT != '' THEN
    -- Normalizar estado para maiúsculas
    v_estado_destino := UPPER(TRIM((p_dados->>'estado_destino')::TEXT));
  END IF;

  -- 2. Tentar buscar cidade_id pelo nome e estado de destino
  IF v_estado_destino IS NOT NULL AND p_dados->>'cidade_destino' IS NOT NULL AND (p_dados->>'cidade_destino')::TEXT != '' THEN
    -- Buscar por cidade e estado (usando estado normalizado)
    SELECT id INTO v_cidade_id
    FROM cidades
    WHERE LOWER(TRIM(nome)) = LOWER(TRIM(p_dados->>'cidade_destino'))
      AND UPPER(TRIM(estado)) = v_estado_destino
    LIMIT 1;
  ELSIF p_dados->>'cidade_destino' IS NOT NULL AND (p_dados->>'cidade_destino')::TEXT != '' THEN
    -- Se não tem estado mas tem cidade, buscar apenas por cidade (pegar a primeira encontrada)
    SELECT id INTO v_cidade_id
    FROM cidades
    WHERE LOWER(TRIM(nome)) = LOWER(TRIM(p_dados->>'cidade_destino'))
    LIMIT 1;
    
    -- Se encontrou a cidade, usar o estado dela (mas só se não tínhamos estado antes)
    IF v_cidade_id IS NOT NULL AND v_estado_destino IS NULL THEN
      SELECT UPPER(TRIM(estado)) INTO v_estado_destino
      FROM cidades
      WHERE id = v_cidade_id;
    END IF;
  END IF;

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
    endereco_origem,
    estado_destino,
    cidade_destino,
    endereco_destino,
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
    COALESCE((p_dados->>'tipo')::TEXT, 'mudanca'),
    (p_dados->>'nome_cliente')::TEXT,
    (p_dados->>'email_cliente')::TEXT,
    (p_dados->>'telefone_cliente')::TEXT,
    (p_dados->>'whatsapp')::TEXT,
    (p_dados->>'origem_completo')::TEXT,
    (p_dados->>'destino_completo')::TEXT,
    (p_dados->>'estado_origem')::TEXT,
    COALESCE((p_dados->>'cidade_origem')::TEXT, 'Não informado'),
    (p_dados->>'endereco_origem')::TEXT,
    COALESCE(v_estado_destino, (p_dados->>'estado_destino')::TEXT),
    COALESCE((p_dados->>'cidade_destino')::TEXT, 'Não informado'),
    (p_dados->>'endereco_destino')::TEXT,
    v_cidade_id,
    (p_dados->>'tipo_imovel')::TEXT,
    COALESCE((p_dados->>'tem_elevador')::BOOLEAN, false),
    COALESCE((p_dados->>'andar')::INTEGER, 1),
    COALESCE((p_dados->>'precisa_embalagem')::BOOLEAN, false),
    (p_dados->>'distancia_km')::NUMERIC,
    (p_dados->>'preco_min')::NUMERIC,
    (p_dados->>'preco_max')::NUMERIC,
    (p_dados->>'mensagem_ia')::TEXT,
    (p_dados->>'lista_objetos')::TEXT,
    (p_dados->>'arquivo_lista_url')::TEXT,
    (p_dados->>'arquivo_lista_nome')::TEXT,
    CASE 
      WHEN (p_dados->>'data_estimada')::TEXT IS NULL OR (p_dados->>'data_estimada')::TEXT = '' 
      THEN NULL 
      ELSE (p_dados->>'data_estimada')::DATE 
    END,
    COALESCE((p_dados->>'origem_formulario')::TEXT, 'calculadora'),
    (p_dados->>'user_agent')::TEXT,
    (p_dados->>'ip_cliente')::INET,
    0
  )
  RETURNING id INTO v_orcamento_id;

  -- 3. Buscar campanhas ativas (apenas no estado de destino, sem fallback)
  IF v_cidade_id IS NOT NULL THEN
    -- Buscar por cidade específica
    FOR v_campanhas IN
      SELECT * FROM buscar_hotsites_ativos_por_cidade(v_cidade_id)
    LOOP
      INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
      VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id)
      ON CONFLICT ON CONSTRAINT orcamentos_campanhas_orcamento_campanha_unique DO NOTHING;
      
      v_hotsites_count := v_hotsites_count + 1;
      v_campanhas_array := array_append(v_campanhas_array, v_campanhas.campanha_id);
    END LOOP;
  ELSE
    -- Buscar por estado (SEMPRE usar o estado retornado pela IA, normalizado)
    IF v_estado_destino IS NOT NULL THEN
      FOR v_campanhas IN
        SELECT * FROM buscar_hotsites_ativos_por_estado(v_estado_destino)
      LOOP
        INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
        VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id)
        ON CONFLICT ON CONSTRAINT orcamentos_campanhas_orcamento_campanha_unique DO NOTHING;
        
        v_hotsites_count := v_hotsites_count + 1;
        v_campanhas_array := array_append(v_campanhas_array, v_campanhas.campanha_id);
      END LOOP;
    END IF;
  END IF;

  -- 4. Atualizar contador de hotsites notificados e status
  IF v_hotsites_count = 0 THEN
    -- Se não há empresas, definir status especial
    UPDATE orcamentos
    SET 
      hotsites_notificados = 0,
      status_envio_email = 'sem_empresas'
    WHERE id = v_orcamento_id;
  ELSE
    -- Se há empresas, definir status normal
    UPDATE orcamentos
    SET 
      hotsites_notificados = v_hotsites_count,
      status_envio_email = 'na_fila'
    WHERE id = v_orcamento_id;
  END IF;

  -- 5. Retornar resultado
  RETURN QUERY
  SELECT 
    v_orcamento_id,
    v_hotsites_count,
    v_campanhas_array;
END;
$$;

COMMENT ON FUNCTION criar_orcamento_e_notificar(JSONB) IS 
'Cria orçamento e notifica empresas. Busca apenas no estado de destino (sem fallback). Orçamento é criado mesmo se não houver empresas disponíveis. Define status_envio_email = "sem_empresas" quando não há empresas.';

