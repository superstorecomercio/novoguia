-- ============================================
-- MODIFICAR FUNÇÃO SQL PARA RETORNAR LISTA DE EMPRESAS
-- ============================================

CREATE OR REPLACE FUNCTION criar_orcamento_e_notificar(p_orcamento_data JSONB)
RETURNS TABLE (
  orcamento_id UUID,
  hotsites_notificados INTEGER,
  campanhas_ids UUID[],
  empresas_notificadas JSONB  -- ✅ NOVO: Dados completos das empresas
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
  v_vinculo_existe BOOLEAN;
  v_empresas_array JSONB := '[]'::JSONB;  -- ✅ NOVO: Array de empresas
  v_empresa_info JSONB;
BEGIN
  -- ============================================
  -- VALIDAÇÕES OBRIGATÓRIAS
  -- ============================================

  IF p_orcamento_data->>'nome_cliente' IS NULL OR (p_orcamento_data->>'nome_cliente')::TEXT = '' THEN
    RAISE EXCEPTION 'Nome do cliente é obrigatório';
  END IF;

  IF p_orcamento_data->>'email_cliente' IS NULL OR (p_orcamento_data->>'email_cliente')::TEXT = '' THEN
    RAISE EXCEPTION 'Email do cliente é obrigatório';
  END IF;

  IF p_orcamento_data->>'telefone_cliente' IS NULL OR (p_orcamento_data->>'telefone_cliente')::TEXT = '' THEN
    RAISE EXCEPTION 'Telefone do cliente é obrigatório';
  END IF;

  IF p_orcamento_data->>'estado_destino' IS NULL OR (p_orcamento_data->>'estado_destino')::TEXT = '' THEN
    RAISE EXCEPTION 'Estado de destino é obrigatório';
  END IF;

  -- ============================================
  -- 1. TENTAR BUSCAR CIDADE_ID
  -- ============================================

  SELECT id INTO v_cidade_id
  FROM cidades
  WHERE LOWER(TRIM(nome)) = LOWER(TRIM(p_orcamento_data->>'cidade_destino'))
    AND LOWER(TRIM(estado)) = LOWER(TRIM(p_orcamento_data->>'estado_destino'))
  LIMIT 1;

  -- ============================================
  -- 2. INSERIR O ORÇAMENTO
  -- ============================================

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

  -- ============================================
  -- 3. BUSCAR CAMPANHAS ATIVAS E CRIAR VÍNCULOS
  -- (COM COLETA DE DADOS DAS EMPRESAS)
  -- ============================================

  IF v_cidade_id IS NOT NULL THEN
    -- Buscar por CIDADE específica (mais preciso)
    FOR v_campanhas IN
      SELECT * FROM buscar_hotsites_ativos_por_cidade(v_cidade_id)
    LOOP
      -- Verificar se já existe antes de inserir
      SELECT EXISTS(
        SELECT 1 FROM orcamentos_campanhas
        WHERE orcamento_id = v_orcamento_id
          AND campanha_id = v_campanhas.campanha_id
      ) INTO v_vinculo_existe;

      IF NOT v_vinculo_existe THEN
        INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
        VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id);

        v_hotsites_count := v_hotsites_count + 1;
        v_campanhas_array := array_append(v_campanhas_array, v_campanhas.campanha_id);

        -- ✅ NOVO: Coletar dados da empresa
        v_empresa_info := jsonb_build_object(
          'id', v_campanhas.hotsite_id,
          'nome', v_campanhas.nome,
          'whatsapp', v_campanhas.email, -- Vamos pegar o telefone correto depois
          'cidade', v_campanhas.cidade,
          'estado', v_campanhas.estado
        );
        v_empresas_array := v_empresas_array || v_empresa_info;
      END IF;
    END LOOP;
  ELSE
    -- Buscar por ESTADO (mais amplo)
    FOR v_campanhas IN
      SELECT * FROM buscar_hotsites_ativos_por_estado((p_orcamento_data->>'estado_destino')::TEXT)
    LOOP
      -- Verificar se já existe antes de inserir
      SELECT EXISTS(
        SELECT 1 FROM orcamentos_campanhas
        WHERE orcamento_id = v_orcamento_id
          AND campanha_id = v_campanhas.campanha_id
      ) INTO v_vinculo_existe;

      IF NOT v_vinculo_existe THEN
        INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
        VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id);

        v_hotsites_count := v_hotsites_count + 1;
        v_campanhas_array := array_append(v_campanhas_array, v_campanhas.campanha_id);

        -- ✅ NOVO: Coletar dados da empresa
        v_empresa_info := jsonb_build_object(
          'id', v_campanhas.hotsite_id,
          'nome', v_campanhas.nome,
          'whatsapp', v_campanhas.email, -- Vamos pegar o telefone correto depois
          'cidade', v_campanhas.cidade,
          'estado', v_campanhas.estado
        );
        v_empresas_array := v_empresas_array || v_empresa_info;
      END IF;
    END LOOP;
  END IF;

  -- ============================================
  -- 4. ATUALIZAR CONTADOR
  -- ============================================

  UPDATE orcamentos
  SET hotsites_notificados = v_hotsites_count
  WHERE id = v_orcamento_id;

  -- ============================================
  -- 5. RETORNAR RESULTADO COM LISTA DE EMPRESAS
  -- ============================================

  RETURN QUERY
  SELECT
    v_orcamento_id,
    v_hotsites_count,
    v_campanhas_array,
    v_empresas_array;  -- ✅ NOVO: Retorna dados das empresas
END;
$$;

-- ============================================
-- MELHORAR: Adicionar telefone/WhatsApp na função buscar_hotsites
-- ============================================

-- Atualizar função para retornar também o telefone
CREATE OR REPLACE FUNCTION buscar_hotsites_ativos_por_estado(
  p_estado TEXT
)
RETURNS TABLE (
  hotsite_id UUID,
  campanha_id UUID,
  nome VARCHAR(255),
  email VARCHAR(255),
  whatsapp VARCHAR(20),  -- ✅ NOVO: Campo WhatsApp
  cidade VARCHAR(255),
  estado VARCHAR(2),
  plano_ordem INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (h.id)
    h.id as hotsite_id,
    c.id as campanha_id,
    h.nome_exibicao as nome,
    h.email,
    h.telefone as whatsapp,  -- ✅ NOVO: Retorna telefone
    ci.nome as cidade,
    ci.estado as estado,
    COALESCE(p.ordem, 999) as plano_ordem
  FROM hotsites h
  INNER JOIN campanhas c ON c.hotsite_id = h.id
  INNER JOIN cidades ci ON h.cidade_id = ci.id
  LEFT JOIN planos p ON c.plano_id = p.id
  WHERE
    ci.estado = p_estado
    AND c.ativo = true
    AND c.participa_cotacao = true
    AND (c.data_fim IS NULL OR c.data_fim >= CURRENT_DATE)
    AND h.nome_exibicao IS NOT NULL
  ORDER BY h.id, COALESCE(p.ordem, 999) ASC, c.data_inicio DESC;
END;
$$ LANGUAGE plpgsql;

-- Atualizar função para buscar por cidade também
CREATE OR REPLACE FUNCTION buscar_hotsites_ativos_por_cidade(
  p_cidade_id UUID
)
RETURNS TABLE (
  hotsite_id UUID,
  campanha_id UUID,
  nome VARCHAR(255),
  email VARCHAR(255),
  whatsapp VARCHAR(20),  -- ✅ NOVO: Campo WhatsApp
  cidade VARCHAR(255),
  estado VARCHAR(2),
  plano_ordem INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (h.id)
    h.id as hotsite_id,
    c.id as campanha_id,
    h.nome_exibicao as nome,
    h.email,
    h.telefone as whatsapp,  -- ✅ NOVO: Retorna telefone
    ci.nome as cidade,
    ci.estado as estado,
    COALESCE(p.ordem, 999) as plano_ordem
  FROM hotsites h
  INNER JOIN campanhas c ON c.hotsite_id = h.id
  INNER JOIN cidades ci ON h.cidade_id = ci.id
  LEFT JOIN planos p ON c.plano_id = p.id
  WHERE
    h.cidade_id = p_cidade_id
    AND c.ativo = true
    AND c.participa_cotacao = true
    AND (c.data_fim IS NULL OR c.data_fim >= CURRENT_DATE)
    AND h.nome_exibicao IS NOT NULL
  ORDER BY h.id, COALESCE(p.ordem, 999) ASC, c.data_inicio DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TESTAR A FUNÇÃO
-- ============================================

SELECT * FROM criar_orcamento_e_notificar(
  jsonb_build_object(
    'nome_cliente', 'Teste Lista Empresas',
    'email_cliente', 'teste@empresas.com',
    'telefone_cliente', '11987654321',
    'whatsapp', '11987654321',
    'origem_completo', 'São Paulo, SP',
    'destino_completo', 'Rio de Janeiro, RJ',
    'estado_origem', 'SP',
    'cidade_origem', 'São Paulo',
    'estado_destino', 'SP',
    'cidade_destino', 'São Paulo',
    'tipo_imovel', '2_quartos',
    'origem_formulario', 'calculadora'
  )
);

-- Resultado esperado:
-- orcamento_id | hotsites_notificados | campanhas_ids | empresas_notificadas
-- uuid         | 3                    | {uuid1,uuid2} | [{"id":"...","nome":"Empresa ABC","whatsapp":"11999...","cidade":"São Paulo","estado":"SP"},...]
