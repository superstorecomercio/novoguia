-- =====================================================
-- TRIGGER: Criar hotsite automaticamente ao criar empresa
-- =====================================================

-- Função que cria um hotsite automaticamente quando uma empresa é criada
CREATE OR REPLACE FUNCTION auto_criar_hotsite_para_empresa()
RETURNS TRIGGER AS $$
DECLARE
  cidade_nome TEXT;
  estado_sigla TEXT;
  novo_hotsite_id UUID;
BEGIN
  -- Buscar informações da cidade
  SELECT c.nome, c.estado INTO cidade_nome, estado_sigla
  FROM cidades c
  WHERE c.id = NEW.cidade_id;

  -- Definir valores padrão se não encontrar cidade
  IF cidade_nome IS NULL THEN
    cidade_nome := 'Não informado';
    estado_sigla := 'XX';
  END IF;

  -- Criar hotsite para a nova empresa
  INSERT INTO hotsites (
    empresa_id,
    nome_exibicao,
    descricao,
    endereco,
    cidade,
    estado,
    cidade_id,
    telefone1,
    telefone2,
    servicos,
    formas_pagamento
  ) VALUES (
    NEW.id,
    NEW.nome,
    COALESCE(NEW.descricao, 'Empresa de mudanças e transportes em ' || cidade_nome || '/' || estado_sigla),
    NEW.endereco,
    cidade_nome,
    estado_sigla,
    NEW.cidade_id,
    CASE WHEN array_length(NEW.telefones, 1) >= 1 THEN NEW.telefones[1] ELSE NULL END,
    CASE WHEN array_length(NEW.telefones, 1) >= 2 THEN NEW.telefones[2] ELSE NULL END,
    ARRAY['Mudanças', 'Transportes']::text[],
    ARRAY['Dinheiro', 'PIX', 'Cartão']::text[]
  ) RETURNING id INTO novo_hotsite_id;

  -- Log de sucesso
  RAISE NOTICE 'Hotsite criado automaticamente: % para empresa: %', novo_hotsite_id, NEW.nome;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_criar_hotsite ON empresas;

CREATE TRIGGER trigger_auto_criar_hotsite
  AFTER INSERT ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION auto_criar_hotsite_para_empresa();

-- Comentário
COMMENT ON FUNCTION auto_criar_hotsite_para_empresa() IS 
  'Cria automaticamente um hotsite quando uma nova empresa é inserida na tabela empresas';

-- =====================================================
-- FUNÇÃO HELPER: Garantir hotsite_id em campanhas
-- =====================================================

-- Função que garante que uma campanha sempre tenha hotsite_id
CREATE OR REPLACE FUNCTION garantir_hotsite_id_na_campanha()
RETURNS TRIGGER AS $$
DECLARE
  hotsite_existente_id UUID;
BEGIN
  -- Se já tem hotsite_id, retornar
  IF NEW.hotsite_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Se tem empresa_id, buscar/criar hotsite
  IF NEW.empresa_id IS NOT NULL THEN
    -- Tentar encontrar hotsite existente para a empresa
    SELECT id INTO hotsite_existente_id
    FROM hotsites
    WHERE empresa_id = NEW.empresa_id
    LIMIT 1;

    -- Se encontrou, vincular
    IF hotsite_existente_id IS NOT NULL THEN
      NEW.hotsite_id := hotsite_existente_id;
      RAISE NOTICE 'Campanha vinculada ao hotsite existente: %', hotsite_existente_id;
    ELSE
      -- Se não encontrou, o trigger da empresa vai criar
      -- Por enquanto, deixar NULL e será preenchido depois
      RAISE WARNING 'Empresa % não tem hotsite. Crie um hotsite antes de criar a campanha.', NEW.empresa_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_garantir_hotsite_id ON campanhas;

CREATE TRIGGER trigger_garantir_hotsite_id
  BEFORE INSERT OR UPDATE ON campanhas
  FOR EACH ROW
  EXECUTE FUNCTION garantir_hotsite_id_na_campanha();

-- Comentário
COMMENT ON FUNCTION garantir_hotsite_id_na_campanha() IS 
  'Garante que toda campanha tenha um hotsite_id, buscando o hotsite da empresa se necessário';

