-- ============================================
-- MIGRATION 027: Corrigir constraint única em orcamentos_campanhas
-- ============================================
-- Garante que a constraint única (orcamento_id, campanha_id) existe
-- para permitir o uso de ON CONFLICT na função criar_orcamento_e_notificar
-- ============================================

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

-- Verificar se a coluna campanha_id existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orcamentos_campanhas' 
    AND column_name = 'campanha_id'
  ) THEN
    ALTER TABLE orcamentos_campanhas ADD COLUMN campanha_id UUID;
    RAISE NOTICE '✅ Coluna campanha_id adicionada';
  END IF;
END $$;

-- Garantir FK de campanha_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orcamentos_campanhas_campanha_id_fkey'
  ) THEN
    ALTER TABLE orcamentos_campanhas 
    ADD CONSTRAINT orcamentos_campanhas_campanha_id_fkey 
    FOREIGN KEY (campanha_id) REFERENCES campanhas(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ FK campanha_id criada';
  END IF;
END $$;

-- Recriar função criar_orcamento_e_notificar com ON CONFLICT corrigido
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

  -- 3. Buscar campanhas ativas (comportamento original: cidade se encontrada, estado se não)
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
    -- Buscar por estado (quando cidade não é encontrada)
    FOR v_campanhas IN
      SELECT * FROM buscar_hotsites_ativos_por_estado((p_orcamento_data->>'estado_destino')::TEXT, COALESCE((p_orcamento_data->>'tipo')::TEXT, 'mudanca'))
    LOOP
      INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
      VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id)
      ON CONFLICT ON CONSTRAINT orcamentos_campanhas_orcamento_campanha_unique DO NOTHING;
      
      v_hotsites_count := v_hotsites_count + 1;
      v_campanhas_array := array_append(v_campanhas_array, v_campanhas.campanha_id);
    END LOOP;
  END IF;

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

COMMENT ON FUNCTION criar_orcamento_e_notificar(JSONB) IS 
'Cria orçamento e vincula com campanhas ativas. Filtra por cidade se encontrada, caso contrário filtra por estado.';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MIGRATION 027 CONCLUÍDA!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Constraint única verificada/criada:';
  RAISE NOTICE '  - orcamentos_campanhas_orcamento_campanha_unique';
  RAISE NOTICE '  - UNIQUE(orcamento_id, campanha_id)';
  RAISE NOTICE '================================================';
END $$;

