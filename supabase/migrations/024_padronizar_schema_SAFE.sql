-- ============================================
-- MIGRATION 024 SAFE: Padronizar Schema
-- ============================================
-- Versão ultra-segura que ignora planos_publicidade
-- e trabalha apenas com 'planos'
-- ============================================

-- ============================================
-- PARTE 1: GARANTIR TABELA PLANOS EXISTE
-- ============================================

-- Criar tabela planos se não existir (ignora planos_publicidade completamente)
CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir constraint unique em nome
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'planos_nome_key' AND conrelid = 'planos'::regclass
  ) THEN
    ALTER TABLE planos ADD CONSTRAINT planos_nome_key UNIQUE (nome);
  END IF;
END $$;

-- Garantir constraint unique em ordem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'planos_ordem_key' AND conrelid = 'planos'::regclass
  ) THEN
    ALTER TABLE planos ADD CONSTRAINT planos_ordem_key UNIQUE (ordem);
  END IF;
END $$;

-- Adicionar campo preco se não existir
ALTER TABLE planos ADD COLUMN IF NOT EXISTS preco NUMERIC(10,2) DEFAULT 0.00 NOT NULL;

-- Adicionar campo periodicidade se não existir
ALTER TABLE planos ADD COLUMN IF NOT EXISTS periodicidade TEXT DEFAULT 'mensal' NOT NULL;

-- Comentários
COMMENT ON TABLE planos IS 'Planos de publicidade disponíveis para campanhas';
COMMENT ON COLUMN planos.preco IS 'Preço do plano';
COMMENT ON COLUMN planos.periodicidade IS 'Periodicidade de cobrança: mensal, trimestral, anual';

-- ============================================
-- PARTE 2: CAMPANHAS
-- ============================================

-- Adicionar campos novos
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS participa_cotacao BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS limite_orcamentos_mes INTEGER;

-- Adicionar valor_mensal se não existir
ALTER TABLE campanhas ADD COLUMN IF NOT EXISTS valor_mensal NUMERIC(10,2);

-- Renomear valor_total para valor_mensal SE valor_total existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campanhas' AND column_name = 'valor_total'
  ) THEN
    -- Copiar dados de valor_total para valor_mensal (se valor_mensal estiver vazio)
    UPDATE campanhas SET valor_mensal = valor_total WHERE valor_mensal IS NULL;
    -- Dropar coluna antiga
    ALTER TABLE campanhas DROP COLUMN valor_total;
    RAISE NOTICE '✅ Campo valor_total migrado para valor_mensal';
  END IF;
END $$;

-- Garantir data_inicio tem default
ALTER TABLE campanhas ALTER COLUMN data_inicio SET DEFAULT CURRENT_DATE;

-- Popular hotsite_id se necessário
UPDATE campanhas 
SET hotsite_id = (
  SELECT h.id 
  FROM hotsites h 
  WHERE h.empresa_id = campanhas.empresa_id 
  LIMIT 1
)
WHERE hotsite_id IS NULL AND empresa_id IS NOT NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_campanhas_participa_cotacao ON campanhas(participa_cotacao);
CREATE INDEX IF NOT EXISTS idx_campanhas_limite_orcamentos ON campanhas(limite_orcamentos_mes) 
  WHERE limite_orcamentos_mes IS NOT NULL;

-- Comentários
COMMENT ON COLUMN campanhas.hotsite_id IS 'ID do hotsite vinculado à campanha (obrigatório)';
COMMENT ON COLUMN campanhas.participa_cotacao IS 'Se esta campanha participa do sistema de cotação de orçamentos';
COMMENT ON COLUMN campanhas.limite_orcamentos_mes IS 'Limite de orçamentos por mês (NULL = ilimitado)';
COMMENT ON COLUMN campanhas.valor_mensal IS 'Valor mensal da campanha';

-- ============================================
-- PARTE 3: ORCAMENTOS
-- ============================================

-- Adicionar cidade_id
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS cidade_id UUID;

-- Adicionar FK se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orcamentos_cidade_id_fkey'
  ) THEN
    ALTER TABLE orcamentos 
    ADD CONSTRAINT orcamentos_cidade_id_fkey 
    FOREIGN KEY (cidade_id) REFERENCES cidades(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Popular cidade_id
UPDATE orcamentos o
SET cidade_id = (
  SELECT c.id FROM cidades c
  WHERE c.estado = o.estado_destino
  AND (
    c.nome ILIKE o.cidade_destino
    OR c.slug = lower(regexp_replace(o.cidade_destino, '[^a-zA-Z0-9]+', '-', 'g'))
  )
  LIMIT 1
)
WHERE o.cidade_id IS NULL 
  AND o.estado_destino IS NOT NULL 
  AND o.cidade_destino IS NOT NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_orcamentos_cidade_id ON orcamentos(cidade_id);

-- Garantir defaults
ALTER TABLE orcamentos ALTER COLUMN data_estimada SET DEFAULT CURRENT_DATE;

COMMENT ON COLUMN orcamentos.cidade_id IS 'Cidade de destino do orçamento (referência FK)';

-- ============================================
-- PARTE 4: ORCAMENTOS_CAMPANHAS
-- ============================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS orcamentos_campanhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orcamento_id UUID NOT NULL,
  hotsite_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar FKs se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orcamentos_campanhas_orcamento_id_fkey'
  ) THEN
    ALTER TABLE orcamentos_campanhas 
    ADD CONSTRAINT orcamentos_campanhas_orcamento_id_fkey 
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orcamentos_campanhas_hotsite_id_fkey'
  ) THEN
    ALTER TABLE orcamentos_campanhas 
    ADD CONSTRAINT orcamentos_campanhas_hotsite_id_fkey 
    FOREIGN KEY (hotsite_id) REFERENCES hotsites(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar campanha_id
ALTER TABLE orcamentos_campanhas ADD COLUMN IF NOT EXISTS campanha_id UUID;

-- Adicionar FK campanha_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orcamentos_campanhas_campanha_id_fkey'
  ) THEN
    ALTER TABLE orcamentos_campanhas 
    ADD CONSTRAINT orcamentos_campanhas_campanha_id_fkey 
    FOREIGN KEY (campanha_id) REFERENCES campanhas(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Popular campanha_id
UPDATE orcamentos_campanhas oc
SET campanha_id = (
  SELECT c.id FROM campanhas c
  WHERE c.hotsite_id = oc.hotsite_id
    AND c.ativo = true
    AND (c.data_fim IS NULL OR c.data_fim >= CURRENT_DATE)
  ORDER BY c.data_inicio DESC
  LIMIT 1
)
WHERE oc.campanha_id IS NULL AND oc.hotsite_id IS NOT NULL;

-- Adicionar status
ALTER TABLE orcamentos_campanhas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' NOT NULL;

-- Adicionar respondido_em para compatibilidade
ALTER TABLE orcamentos_campanhas ADD COLUMN IF NOT EXISTS respondido_em TIMESTAMPTZ;

-- Adicionar constraint UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orcamentos_campanhas_orcamento_campanha_unique'
  ) THEN
    ALTER TABLE orcamentos_campanhas
    ADD CONSTRAINT orcamentos_campanhas_orcamento_campanha_unique 
    UNIQUE(orcamento_id, campanha_id);
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_orcamentos_campanhas_orcamento ON orcamentos_campanhas(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_campanhas_campanha ON orcamentos_campanhas(campanha_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_campanhas_hotsite ON orcamentos_campanhas(hotsite_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_campanhas_status ON orcamentos_campanhas(status);

-- Comentários
COMMENT ON TABLE orcamentos_campanhas IS 'Tabela de junção entre orçamentos e campanhas (N:N)';
COMMENT ON COLUMN orcamentos_campanhas.orcamento_id IS 'ID do orçamento';
COMMENT ON COLUMN orcamentos_campanhas.campanha_id IS 'ID da campanha vinculada';
COMMENT ON COLUMN orcamentos_campanhas.hotsite_id IS 'ID do hotsite (denormalizado)';
COMMENT ON COLUMN orcamentos_campanhas.status IS 'Status: pendente, visualizado, respondido, fechado';

-- ============================================
-- PARTE 5: LIMPAR DADOS ÓRFÃOS E ATUALIZAR FOREIGN KEYS
-- ============================================

-- Primeiro: Limpar plano_id órfãos em campanhas (que não existem em planos)
UPDATE campanhas
SET plano_id = NULL
WHERE plano_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM planos WHERE id = campanhas.plano_id);

-- Campanhas → planos
DO $$
BEGIN
  -- Dropar FK antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'campanhas_plano_id_fkey'
  ) THEN
    ALTER TABLE campanhas DROP CONSTRAINT campanhas_plano_id_fkey;
  END IF;
  
  -- Criar nova FK
  ALTER TABLE campanhas
  ADD CONSTRAINT campanhas_plano_id_fkey 
  FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE SET NULL;
END $$;

-- Limpar plano_id órfãos em hotsites (se a coluna existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hotsites' AND column_name = 'plano_id'
  ) THEN
    UPDATE hotsites
    SET plano_id = NULL
    WHERE plano_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM planos WHERE id = hotsites.plano_id);
  END IF;
END $$;

-- Hotsites → planos
DO $$
BEGIN
  -- Dropar FK antiga se existir
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'hotsites_plano_id_fkey'
  ) THEN
    ALTER TABLE hotsites DROP CONSTRAINT hotsites_plano_id_fkey;
  END IF;
  
  -- Criar nova FK (se coluna existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hotsites' AND column_name = 'plano_id'
  ) THEN
    ALTER TABLE hotsites
    ADD CONSTRAINT hotsites_plano_id_fkey 
    FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- PARTE 6: VIEWS
-- ============================================

DROP VIEW IF EXISTS vw_orcamentos_resumo;

CREATE OR REPLACE VIEW vw_orcamentos_resumo AS
SELECT 
  o.id,
  o.tipo,
  o.nome_cliente,
  o.email_cliente,
  o.telefone_cliente,
  o.cidade_origem,
  o.cidade_destino,
  o.estado_destino,
  o.data_estimada,
  o.status,
  o.created_at,
  c.nome as cidade_nome,
  c.estado as cidade_estado,
  COUNT(oc.id) as total_campanhas_relacionadas,
  COUNT(CASE WHEN oc.status = 'respondido' THEN 1 END) as campanhas_que_responderam
FROM orcamentos o
LEFT JOIN cidades c ON o.cidade_id = c.id
LEFT JOIN orcamentos_campanhas oc ON o.id = oc.orcamento_id
GROUP BY o.id, c.nome, c.estado;

-- ============================================
-- PARTE 7: RLS POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos_campanhas ENABLE ROW LEVEL SECURITY;

-- Políticas planos
DROP POLICY IF EXISTS "Planos são públicos para leitura" ON planos;
CREATE POLICY "Planos são públicos para leitura"
  ON planos FOR SELECT USING (true);

-- Políticas orcamentos_campanhas
DROP POLICY IF EXISTS "Orcamentos campanhas podem ser criados por qualquer um" ON orcamentos_campanhas;
CREATE POLICY "Orcamentos campanhas podem ser criados por qualquer um"
  ON orcamentos_campanhas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Orcamentos campanhas são públicos para leitura" ON orcamentos_campanhas;
CREATE POLICY "Orcamentos campanhas são públicos para leitura"
  ON orcamentos_campanhas FOR SELECT USING (true);

-- ============================================
-- PARTE 8: FUNÇÕES
-- ============================================

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
  SELECT DISTINCT ON (h.id)
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
    h.estado = p_estado
    AND h.ativo = true
    AND c.ativo = true
    AND c.participa_cotacao = true
    AND (c.data_fim IS NULL OR c.data_fim >= CURRENT_DATE)
    AND h.nome_exibicao IS NOT NULL
  ORDER BY h.id, COALESCE(p.ordem, 999) ASC, c.data_inicio DESC;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS criar_orcamento_e_vincular_campanhas(JSONB);

CREATE OR REPLACE FUNCTION criar_orcamento_e_vincular_campanhas(
  p_orcamento_data JSONB
)
RETURNS TABLE (
  orcamento_id UUID,
  campanhas_vinculadas INTEGER,
  campanhas_ids UUID[]
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orcamento_id UUID;
  v_estado_destino VARCHAR(2);
  v_cidade_id UUID;
  v_campanhas_ids UUID[];
  v_count INTEGER;
BEGIN
  v_estado_destino := p_orcamento_data->>'estado_destino';
  
  IF v_estado_destino IS NULL OR v_estado_destino = '' THEN
    RAISE EXCEPTION 'Estado de destino é obrigatório';
  END IF;
  
  SELECT c.id INTO v_cidade_id
  FROM cidades c
  WHERE c.estado = v_estado_destino
  AND (
    c.nome ILIKE p_orcamento_data->>'cidade_destino'
    OR c.slug = lower(regexp_replace(p_orcamento_data->>'cidade_destino', '[^a-zA-Z0-9]+', '-', 'g'))
  )
  LIMIT 1;
  
  INSERT INTO orcamentos (
    tipo, nome_cliente, email_cliente, telefone_cliente, whatsapp,
    estado_origem, cidade_origem, origem_completo,
    estado_destino, cidade_destino, destino_completo, cidade_id,
    tipo_imovel, tem_elevador, andar, precisa_embalagem,
    distancia_km, preco_min, preco_max, mensagem_ia, lista_objetos,
    data_estimada, origem_formulario, status
  ) VALUES (
    COALESCE(p_orcamento_data->>'tipo', 'mudanca'),
    p_orcamento_data->>'nome_cliente',
    p_orcamento_data->>'email_cliente',
    p_orcamento_data->>'telefone_cliente',
    p_orcamento_data->>'whatsapp',
    p_orcamento_data->>'estado_origem',
    p_orcamento_data->>'cidade_origem',
    p_orcamento_data->>'origem_completo',
    v_estado_destino,
    p_orcamento_data->>'cidade_destino',
    p_orcamento_data->>'destino_completo',
    v_cidade_id,
    p_orcamento_data->>'tipo_imovel',
    (p_orcamento_data->>'tem_elevador')::BOOLEAN,
    (p_orcamento_data->>'andar')::INTEGER,
    (p_orcamento_data->>'precisa_embalagem')::BOOLEAN,
    (p_orcamento_data->>'distancia_km')::INTEGER,
    (p_orcamento_data->>'preco_min')::DECIMAL,
    (p_orcamento_data->>'preco_max')::DECIMAL,
    p_orcamento_data->>'mensagem_ia',
    p_orcamento_data->>'lista_objetos',
    (p_orcamento_data->>'data_estimada')::DATE,
    COALESCE(p_orcamento_data->>'origem_formulario', 'calculadora'),
    'novo'
  ) RETURNING id INTO v_orcamento_id;
  
  SELECT ARRAY_AGG(campanha_id) INTO v_campanhas_ids
  FROM buscar_hotsites_ativos_por_estado(v_estado_destino, COALESCE(p_orcamento_data->>'tipo', 'mudanca'));
  
  IF v_campanhas_ids IS NOT NULL THEN
    INSERT INTO orcamentos_campanhas (orcamento_id, campanha_id, hotsite_id, status)
    SELECT v_orcamento_id, c.id, c.hotsite_id, 'pendente'
    FROM campanhas c WHERE c.id = ANY(v_campanhas_ids);
    
    v_count := array_length(v_campanhas_ids, 1);
    
    UPDATE orcamentos
    SET hotsites_notificados = v_count, data_envio_empresas = NOW(), status = 'enviado_empresas'
    WHERE id = v_orcamento_id;
  ELSE
    v_count := 0;
    v_campanhas_ids := ARRAY[]::UUID[];
  END IF;
  
  RETURN QUERY SELECT v_orcamento_id, v_count, v_campanhas_ids;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 9: DADOS INICIAIS
-- ============================================

INSERT INTO planos (nome, descricao, ordem, preco, periodicidade) VALUES
  ('top', 'Plano Top - Máxima visibilidade', 1, 299.90, 'mensal'),
  ('quality', 'Plano Quality - Alta visibilidade', 2, 199.90, 'mensal'),
  ('standard', 'Plano Standard - Visibilidade padrão', 3, 99.90, 'mensal'),
  ('intermediario', 'Plano Intermediário - Básico', 4, 49.90, 'mensal')
ON CONFLICT (nome) DO UPDATE SET
  preco = EXCLUDED.preco,
  periodicidade = EXCLUDED.periodicidade;

-- ============================================
-- FIM - RESUMO
-- ============================================

DO $$
DECLARE
  v_planos_count INTEGER;
  v_campanhas_count INTEGER;
  v_orcamentos_count INTEGER;
  v_orcamentos_campanhas_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_planos_count FROM planos;
  SELECT COUNT(*) INTO v_campanhas_count FROM campanhas;
  SELECT COUNT(*) INTO v_orcamentos_count FROM orcamentos;
  SELECT COUNT(*) INTO v_orcamentos_campanhas_count FROM orcamentos_campanhas;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MIGRATION 024 CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Estatísticas:';
  RAISE NOTICE '  - Planos: % registros', v_planos_count;
  RAISE NOTICE '  - Campanhas: % registros', v_campanhas_count;
  RAISE NOTICE '  - Orçamentos: % registros', v_orcamentos_count;
  RAISE NOTICE '  - Orçamentos-Campanhas: % registros', v_orcamentos_campanhas_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  1. Reiniciar servidor: npm run dev';
  RAISE NOTICE '  2. Testar /admin/campanhas';
  RAISE NOTICE '  3. Testar /admin/orcamentos';
  RAISE NOTICE '================================================';
END $$;

