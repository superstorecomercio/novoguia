-- ============================================
-- SISTEMA DE ORÇAMENTOS - GUIA DE MUDANÇAS
-- Versão Final Consolidada
-- Data: 22 de Novembro de 2025
-- ============================================

-- Este arquivo contém todas as funções e correções necessárias
-- para o sistema de orçamentos funcionar 100% corretamente.

-- ============================================
-- 1. FUNÇÃO: BUSCAR HOTSITES ATIVOS POR CIDADE
-- ============================================

CREATE OR REPLACE FUNCTION buscar_hotsites_ativos_por_cidade(
  p_cidade_id UUID
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
  SELECT DISTINCT ON (h.id)
    h.id as hotsite_id,
    c.id as campanha_id,
    h.nome_exibicao as nome,
    h.email,
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
-- 2. FUNÇÃO: BUSCAR HOTSITES ATIVOS POR ESTADO
-- ============================================

CREATE OR REPLACE FUNCTION buscar_hotsites_ativos_por_estado(
  p_estado TEXT
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
  SELECT DISTINCT ON (h.id)
    h.id as hotsite_id,
    c.id as campanha_id,
    h.nome_exibicao as nome,
    h.email,
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

-- ============================================
-- 3. FUNÇÃO PRINCIPAL: CRIAR ORÇAMENTO E NOTIFICAR
-- ============================================

CREATE OR REPLACE FUNCTION criar_orcamento_e_notificar(p_dados JSONB)
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

  -- 3. Buscar campanhas ativas
  IF v_cidade_id IS NOT NULL THEN
    -- Buscar por cidade específica
    FOR v_campanhas IN
      SELECT * FROM buscar_hotsites_ativos_por_cidade(v_cidade_id)
    LOOP
      INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id)
      VALUES (v_orcamento_id, v_campanhas.campanha_id, v_campanhas.hotsite_id)
      ON CONFLICT (orcamento_id, campanha_id) DO NOTHING;
      
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
      ON CONFLICT (orcamento_id, campanha_id) DO NOTHING;
      
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

-- ============================================
-- 4. POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos_campanhas ENABLE ROW LEVEL SECURITY;

-- Política para INSERT em orcamentos
DROP POLICY IF EXISTS "Permitir INSERT autenticado" ON orcamentos;
CREATE POLICY "Permitir INSERT autenticado"
ON orcamentos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para SELECT em orcamentos
DROP POLICY IF EXISTS "Permitir SELECT autenticado" ON orcamentos;
CREATE POLICY "Permitir SELECT autenticado"
ON orcamentos
FOR SELECT
TO authenticated
USING (true);

-- Política para UPDATE em orcamentos
DROP POLICY IF EXISTS "Permitir UPDATE autenticado" ON orcamentos;
CREATE POLICY "Permitir UPDATE autenticado"
ON orcamentos
FOR UPDATE
TO authenticated
USING (true);

-- Política para DELETE em orcamentos
DROP POLICY IF EXISTS "Permitir DELETE autenticado" ON orcamentos;
CREATE POLICY "Permitir DELETE autenticado"
ON orcamentos
FOR DELETE
TO authenticated
USING (true);

-- Política para INSERT em orcamentos_campanhas
DROP POLICY IF EXISTS "Permitir INSERT autenticado" ON orcamentos_campanhas;
CREATE POLICY "Permitir INSERT autenticado"
ON orcamentos_campanhas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para SELECT em orcamentos_campanhas
DROP POLICY IF EXISTS "Permitir SELECT autenticado" ON orcamentos_campanhas;
CREATE POLICY "Permitir SELECT autenticado"
ON orcamentos_campanhas
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 5. TRIGGER: SINCRONIZAR CAMPOS DE TEXTO
-- ============================================

-- Trigger para manter campos 'cidade' e 'estado' em hotsites
-- sincronizados com a tabela 'cidades'

CREATE OR REPLACE FUNCTION sync_hotsite_city_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar campos de texto quando cidade_id mudar
  IF NEW.cidade_id IS NOT NULL THEN
    SELECT nome, estado
    INTO NEW.cidade, NEW.estado
    FROM cidades
    WHERE id = NEW.cidade_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_hotsite_city_fields ON hotsites;
CREATE TRIGGER trg_sync_hotsite_city_fields
  BEFORE INSERT OR UPDATE OF cidade_id ON hotsites
  FOR EACH ROW
  EXECUTE FUNCTION sync_hotsite_city_fields();

-- ============================================
-- 6. SCRIPT DE DIAGNÓSTICO
-- ============================================

-- Use este query para verificar se o sistema está funcionando:
/*

SELECT 
  '🔍 DIAGNÓSTICO DO SISTEMA' as titulo,
  '' as col1,
  '' as col2
UNION ALL SELECT '', '', ''

-- Verificar última campanha criada
UNION ALL SELECT 
  '📊 Últimos 5 orçamentos:',
  '',
  ''
UNION ALL SELECT 
  nome_cliente,
  hotsites_notificados::text || ' empresas',
  CASE 
    WHEN hotsites_notificados > 0 THEN '✅'
    ELSE '❌'
  END
FROM orcamentos
ORDER BY created_at DESC
LIMIT 5;

-- Verificar campanhas ativas
UNION ALL SELECT '', '', ''
UNION ALL SELECT 
  '🏢 Campanhas ativas em SP:',
  COUNT(*)::text,
  ''
FROM campanhas c
INNER JOIN hotsites h ON c.hotsite_id = h.id
INNER JOIN cidades ci ON h.cidade_id = ci.id
WHERE ci.nome = 'São Paulo'
  AND ci.estado = 'SP'
  AND c.ativo = true
  AND c.participa_cotacao = true;

*/

-- ============================================
-- FIM DO ARQUIVO
-- ============================================

-- Para aplicar todas as funções, execute este arquivo no SQL Editor do Supabase.
-- Certifique-se de que as tabelas já existem antes de executar.



