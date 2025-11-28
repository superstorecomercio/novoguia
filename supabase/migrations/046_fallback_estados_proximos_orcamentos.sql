-- Migration: Garantir criação de orçamento mesmo sem hotsites ativos
-- Data: 2025-01-XX
-- Descrição: Garante que orçamentos sejam criados mesmo quando não há hotsites ativos no estado.
--            Busca apenas no estado de destino (sem fallback para outros estados).
--            Define status 'sem_empresas' quando não há empresas disponíveis.

-- ============================================
-- 1. Garantir que status_envio_email aceita 'sem_empresas'
-- ============================================
-- O campo já existe como VARCHAR, então não precisa alterar estrutura

-- ============================================
-- 2. Atualizar função criar_orcamento_e_notificar
-- ============================================

-- Remover função existente primeiro (necessário para mudar tipo de retorno)
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

  -- Validar destino
  IF p_dados->>'estado_destino' IS NULL OR (p_dados->>'estado_destino')::TEXT = '' THEN
    RAISE EXCEPTION 'Estado de destino é obrigatório';
  END IF;

  -- 1. Tentar buscar cidade_id pelo nome e estado de destino
  SELECT id INTO v_cidade_id
  FROM cidades
  WHERE LOWER(TRIM(nome)) = LOWER(TRIM(p_dados->>'cidade_destino'))
    AND LOWER(TRIM(estado)) = LOWER(TRIM(p_dados->>'estado_destino'))
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
    COALESCE((p_dados->>'tipo')::TEXT, 'mudanca'),
    (p_dados->>'nome_cliente')::TEXT,
    (p_dados->>'email_cliente')::TEXT,
    (p_dados->>'telefone_cliente')::TEXT,
    (p_dados->>'whatsapp')::TEXT,
    (p_dados->>'origem_completo')::TEXT,
    (p_dados->>'destino_completo')::TEXT,
    (p_dados->>'estado_origem')::TEXT,
    (p_dados->>'cidade_origem')::TEXT,
    (p_dados->>'estado_destino')::TEXT,
    (p_dados->>'cidade_destino')::TEXT,
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
    -- Buscar por estado
    FOR v_campanhas IN
      SELECT * FROM buscar_hotsites_ativos_por_estado((p_dados->>'estado_destino')::TEXT)
    LOOP
      INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
      VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id)
      ON CONFLICT ON CONSTRAINT orcamentos_campanhas_orcamento_campanha_unique DO NOTHING;
      
      v_hotsites_count := v_hotsites_count + 1;
      v_campanhas_array := array_append(v_campanhas_array, v_campanhas.campanha_id);
    END LOOP;
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

-- ============================================
-- 3. Função: Relatório de estados sem empresas ativas
-- ============================================

CREATE OR REPLACE FUNCTION relatorio_estados_sem_empresas()
RETURNS TABLE (
  estado VARCHAR(2),
  estado_nome TEXT,
  total_orcamentos INTEGER,
  ultimo_orcamento TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.estado_destino as estado,
    CASE o.estado_destino
      WHEN 'AC' THEN 'Acre'
      WHEN 'AL' THEN 'Alagoas'
      WHEN 'AP' THEN 'Amapá'
      WHEN 'AM' THEN 'Amazonas'
      WHEN 'BA' THEN 'Bahia'
      WHEN 'CE' THEN 'Ceará'
      WHEN 'DF' THEN 'Distrito Federal'
      WHEN 'ES' THEN 'Espírito Santo'
      WHEN 'GO' THEN 'Goiás'
      WHEN 'MA' THEN 'Maranhão'
      WHEN 'MT' THEN 'Mato Grosso'
      WHEN 'MS' THEN 'Mato Grosso do Sul'
      WHEN 'MG' THEN 'Minas Gerais'
      WHEN 'PA' THEN 'Pará'
      WHEN 'PB' THEN 'Paraíba'
      WHEN 'PR' THEN 'Paraná'
      WHEN 'PE' THEN 'Pernambuco'
      WHEN 'PI' THEN 'Piauí'
      WHEN 'RJ' THEN 'Rio de Janeiro'
      WHEN 'RN' THEN 'Rio Grande do Norte'
      WHEN 'RS' THEN 'Rio Grande do Sul'
      WHEN 'RO' THEN 'Rondônia'
      WHEN 'RR' THEN 'Roraima'
      WHEN 'SC' THEN 'Santa Catarina'
      WHEN 'SP' THEN 'São Paulo'
      WHEN 'SE' THEN 'Sergipe'
      WHEN 'TO' THEN 'Tocantins'
      ELSE o.estado_destino
    END as estado_nome,
    COUNT(*)::INTEGER as total_orcamentos,
    MAX(o.created_at) as ultimo_orcamento
  FROM orcamentos o
  WHERE o.status_envio_email = 'sem_empresas'
    AND o.estado_destino IS NOT NULL
  GROUP BY o.estado_destino
  ORDER BY total_orcamentos DESC, ultimo_orcamento DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION relatorio_estados_sem_empresas() IS 
'Retorna relatório de estados que receberam orçamentos mas não têm empresas ativas disponíveis.';

