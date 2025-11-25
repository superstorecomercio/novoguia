-- ============================================
-- MUDATECH - SCHEMA COMPLETO
-- ============================================
-- Execute este arquivo completo no Supabase SQL Editor
-- Contém: Schema + Dados Iniciais + Funções Auxiliares
-- ============================================

-- ============================================
-- EXTENSÕES
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- CIDADE
CREATE TABLE cidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  estado VARCHAR(2) NOT NULL,
  descricao TEXT,
  regiao VARCHAR(50), -- 'sudeste' | 'sul' | 'nordeste' | 'norte' | 'centro-oeste'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLANOS DE PUBLICIDADE
CREATE TABLE planos_publicidade (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL UNIQUE, -- 'top' | 'quality' | 'standard' | 'intermediario'
  descricao TEXT,
  ordem INTEGER NOT NULL UNIQUE, -- Para ordenação (menor número = maior prioridade)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMPRESA
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  cnpj VARCHAR(18),
  responsavel VARCHAR(255),
  email VARCHAR(255),
  telefones TEXT[], -- Array de telefones
  website VARCHAR(500),
  endereco VARCHAR(500),
  complemento VARCHAR(255),
  cidade_id UUID REFERENCES cidades(id) ON DELETE SET NULL,
  estado VARCHAR(2),
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HOTSITE (Detalhes Expandidos da Empresa)
CREATE TABLE hotsites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE UNIQUE,
  nome_exibicao VARCHAR(255),
  descricao TEXT,
  endereco VARCHAR(500),
  cidade VARCHAR(255),
  estado VARCHAR(2),
  
  -- Imagens
  logo_url TEXT,
  foto1_url TEXT,
  foto2_url TEXT,
  foto3_url TEXT,
  
  -- Serviços, Descontos e Formas de Pagamento (JSONB para flexibilidade)
  servicos JSONB, -- Array de strings: ["Mudança Residencial", "Carreto", etc.]
  descontos JSONB, -- Array de strings: ["10% para mudanças agendadas", etc.]
  formas_pagamento JSONB, -- Array de strings: ["Dinheiro", "Cartão", "PIX", etc.]
  highlights JSONB, -- Array de strings: ["Atendimento 24h", "Equipe especializada", etc.]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EMPRESA PLANOS (Relacionamento empresa ↔ plano de publicidade)
CREATE TABLE empresa_planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos_publicidade(id) ON DELETE CASCADE,
  cidade_id UUID REFERENCES cidades(id) ON DELETE SET NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  valor DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CAMPANHAS
CREATE TABLE campanhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos_publicidade(id) ON DELETE SET NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  valor_total DECIMAL(10,2),
  data_cobranca DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORÇAMENTOS
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tipo de serviço
  tipo VARCHAR(50) NOT NULL, -- 'mudanca' | 'carreto' | 'guardamoveis' | 'transportadora' | 'montador'
  
  -- Dados do Cliente
  nome_cliente VARCHAR(255) NOT NULL,
  email_cliente VARCHAR(255) NOT NULL,
  telefone_cliente VARCHAR(20),
  preferencia_contato JSONB, -- Array: ['whatsapp', 'email', 'telefone']
  
  -- Origem
  estado_origem VARCHAR(2),
  cidade_origem VARCHAR(255) NOT NULL,
  endereco_origem VARCHAR(500),
  bairro_origem VARCHAR(255),
  tipo_origem VARCHAR(50), -- 'casa' | 'apartamento' | 'comercial'
  
  -- Destino
  estado_destino VARCHAR(2),
  cidade_destino VARCHAR(255) NOT NULL,
  endereco_destino VARCHAR(500),
  bairro_destino VARCHAR(255),
  tipo_destino VARCHAR(50),
  
  -- Detalhes do Serviço
  descricao TEXT,
  
  -- Campos específicos para Mudança
  comodos INTEGER,
  estilo_vida VARCHAR(50), -- 'minimalista' | 'padrao' | 'luxo' | 'comercial'
  
  -- Campos específicos para Carreto
  pecas INTEGER,
  
  -- Campos específicos para Guarda-Móveis
  tempo_armazenamento VARCHAR(255),
  o_que_precisa TEXT,
  
  -- Data e Metadados
  data_estimada DATE NOT NULL,
  ip_cliente INET,
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente' | 'enviado' | 'respondido'
  
  -- Empresa específica (opcional - se for orçamento direto para uma empresa)
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORÇAMENTO EMPRESAS (Relacionamento N:N entre orçamentos e empresas)
CREATE TABLE orcamento_empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  enviado_em TIMESTAMP WITH TIME ZONE,
  respondido_em TIMESTAMP WITH TIME ZONE,
  UNIQUE(orcamento_id, empresa_id)
);

-- EMPRESA SERVIÇOS (Relacionamento empresa ↔ tipos de serviço)
CREATE TABLE empresa_servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_servico VARCHAR(50) NOT NULL, -- 'mudanca' | 'carreto' | 'guardamoveis' | etc.
  areas_atendidas TEXT[], -- Array de bairros/cidades atendidas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, tipo_servico)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Cidades
CREATE INDEX idx_cidades_slug ON cidades(slug);
CREATE INDEX idx_cidades_estado ON cidades(estado);
CREATE INDEX idx_cidades_regiao ON cidades(regiao);

-- Empresas
CREATE INDEX idx_empresas_cidade ON empresas(cidade_id);
CREATE INDEX idx_empresas_ativo ON empresas(ativo);
CREATE INDEX idx_empresas_slug ON empresas(slug);
CREATE INDEX idx_empresas_estado ON empresas(estado);

-- Hotsites
CREATE INDEX idx_hotsites_empresa ON hotsites(empresa_id);

-- Empresa Planos
CREATE INDEX idx_empresa_planos_empresa ON empresa_planos(empresa_id);
CREATE INDEX idx_empresa_planos_plano ON empresa_planos(plano_id);
CREATE INDEX idx_empresa_planos_cidade ON empresa_planos(cidade_id);
CREATE INDEX idx_empresa_planos_ativo ON empresa_planos(ativo);
CREATE INDEX idx_empresa_planos_data ON empresa_planos(data_inicio, data_fim);

-- Orçamentos
CREATE INDEX idx_orcamentos_email ON orcamentos(email_cliente);
CREATE INDEX idx_orcamentos_created ON orcamentos(created_at DESC);
CREATE INDEX idx_orcamentos_status ON orcamentos(status);
CREATE INDEX idx_orcamentos_tipo ON orcamentos(tipo);
CREATE INDEX idx_orcamentos_cidade_origem ON orcamentos(cidade_origem);
CREATE INDEX idx_orcamentos_cidade_destino ON orcamentos(cidade_destino);
CREATE INDEX idx_orcamentos_empresa ON orcamentos(empresa_id);

-- Orçamento Empresas
CREATE INDEX idx_orcamento_empresas_orcamento ON orcamento_empresas(orcamento_id);
CREATE INDEX idx_orcamento_empresas_empresa ON orcamento_empresas(empresa_id);

-- Empresa Serviços
CREATE INDEX idx_empresa_servicos_empresa ON empresa_servicos(empresa_id);
CREATE INDEX idx_empresa_servicos_tipo ON empresa_servicos(tipo_servico);

-- Campanhas
CREATE INDEX idx_campanhas_empresa ON campanhas(empresa_id);
CREATE INDEX idx_campanhas_data ON campanhas(data_inicio, data_fim);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cidades_updated_at
  BEFORE UPDATE ON cidades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotsites_updated_at
  BEFORE UPDATE ON hotsites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empresa_planos_updated_at
  BEFORE UPDATE ON empresa_planos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orcamentos_updated_at
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_publicidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_servicos ENABLE ROW LEVEL SECURITY;

-- Políticas para CIDADES (público pode ler)
CREATE POLICY "Cidades são públicas para leitura"
  ON cidades FOR SELECT
  USING (true);

-- Políticas para EMPRESAS (público pode ler empresas ativas)
CREATE POLICY "Empresas ativas são públicas para leitura"
  ON empresas FOR SELECT
  USING (ativo = true);

-- Políticas para HOTSITES (público pode ler hotsites de empresas ativas)
CREATE POLICY "Hotsites são públicos para leitura"
  ON hotsites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM empresas
      WHERE empresas.id = hotsites.empresa_id
      AND empresas.ativo = true
    )
  );

-- Políticas para PLANOS DE PUBLICIDADE (público pode ler)
CREATE POLICY "Planos de publicidade são públicos para leitura"
  ON planos_publicidade FOR SELECT
  USING (true);

-- Políticas para EMPRESA PLANOS (público pode ler planos ativos)
CREATE POLICY "Empresa planos ativos são públicos para leitura"
  ON empresa_planos FOR SELECT
  USING (ativo = true);

-- Políticas para ORÇAMENTOS (qualquer um pode criar, mas só admin pode ler todos)
CREATE POLICY "Orçamentos podem ser criados por qualquer um"
  ON orcamentos FOR INSERT
  WITH CHECK (true);

-- Políticas para ORÇAMENTO EMPRESAS (qualquer um pode criar relacionamento)
CREATE POLICY "Orcamento empresas podem ser criados por qualquer um"
  ON orcamento_empresas FOR INSERT
  WITH CHECK (true);

-- Políticas para EMPRESA SERVIÇOS (público pode ler serviços de empresas ativas)
CREATE POLICY "Empresa serviços são públicos para leitura"
  ON empresa_servicos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM empresas
      WHERE empresas.id = empresa_servicos.empresa_id
      AND empresas.ativo = true
    )
  );

-- ============================================
-- DADOS INICIAIS (SEEDS)
-- ============================================

-- PLANOS DE PUBLICIDADE
INSERT INTO planos_publicidade (nome, descricao, ordem) VALUES
  ('top', 'Plano Top - Máxima visibilidade e destaque', 1),
  ('quality', 'Plano Quality - Alta visibilidade', 2),
  ('standard', 'Plano Standard - Visibilidade padrão', 3),
  ('intermediario', 'Plano Intermediário - Visibilidade básica', 4)
ON CONFLICT (nome) DO NOTHING;

-- CIDADES PRINCIPAIS
INSERT INTO cidades (nome, slug, estado, descricao, regiao) VALUES
  ('São Paulo', 'sao-paulo', 'SP', 'Capital do estado de São Paulo, maior cidade do Brasil.', 'sudeste'),
  ('Rio de Janeiro', 'rio-de-janeiro', 'RJ', 'Cidade maravilhosa, capital do estado do Rio de Janeiro.', 'sudeste'),
  ('Belo Horizonte', 'belo-horizonte', 'MG', 'Capital de Minas Gerais, conhecida por sua arquitetura moderna.', 'sudeste'),
  ('Brasília', 'brasilia', 'DF', 'Capital do Brasil, cidade planejada e patrimônio da humanidade.', 'centro-oeste'),
  ('Curitiba', 'curitiba', 'PR', 'Capital do Paraná, conhecida por seu planejamento urbano.', 'sul'),
  ('Porto Alegre', 'porto-alegre', 'RS', 'Capital do Rio Grande do Sul, importante centro econômico do sul.', 'sul'),
  ('Salvador', 'salvador', 'BA', 'Capital da Bahia, primeira capital do Brasil.', 'nordeste'),
  ('Recife', 'recife', 'PE', 'Capital de Pernambuco, conhecida como Veneza brasileira.', 'nordeste'),
  ('Fortaleza', 'fortaleza', 'CE', 'Capital do Ceará, importante destino turístico.', 'nordeste'),
  ('Manaus', 'manaus', 'AM', 'Capital do Amazonas, porta de entrada da Amazônia.', 'norte')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FUNÇÕES AUXILIARES PARA MIGRAÇÃO (OPCIONAL)
-- ============================================
-- Estas funções são úteis caso você precise migrar dados do banco antigo

-- Função para gerar slug
CREATE OR REPLACE FUNCTION generate_slug(texto TEXT)
RETURNS TEXT AS $$
DECLARE
  resultado TEXT;
BEGIN
  resultado := lower(texto);
  resultado := regexp_replace(resultado, '[áàâãä]', 'a', 'gi');
  resultado := regexp_replace(resultado, '[éèêë]', 'e', 'gi');
  resultado := regexp_replace(resultado, '[íìîï]', 'i', 'gi');
  resultado := regexp_replace(resultado, '[óòôõö]', 'o', 'gi');
  resultado := regexp_replace(resultado, '[úùûü]', 'u', 'gi');
  resultado := regexp_replace(resultado, '[ç]', 'c', 'gi');
  resultado := regexp_replace(resultado, '[^a-z0-9]+', '-', 'g');
  resultado := regexp_replace(resultado, '^-+|-+$', '', 'g');
  RETURN resultado;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para converter telefone para array
CREATE OR REPLACE FUNCTION telefone_to_array(telefone TEXT)
RETURNS TEXT[] AS $$
BEGIN
  IF telefone IS NULL OR telefone = '' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  -- Remove espaços e separa por vírgula ou ponto e vírgula
  RETURN string_to_array(
    regexp_replace(telefone, '\s+', '', 'g'),
    ','
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para converter serviços para JSONB
CREATE OR REPLACE FUNCTION servicos_to_jsonb(
  servico1 TEXT, servico2 TEXT, servico3 TEXT, servico4 TEXT, servico5 TEXT,
  servico6 TEXT, servico7 TEXT, servico8 TEXT, servico9 TEXT, servico10 TEXT
)
RETURNS JSONB AS $$
DECLARE
  servicos_array TEXT[];
BEGIN
  servicos_array := ARRAY[
    NULLIF(trim(servico1), ''),
    NULLIF(trim(servico2), ''),
    NULLIF(trim(servico3), ''),
    NULLIF(trim(servico4), ''),
    NULLIF(trim(servico5), ''),
    NULLIF(trim(servico6), ''),
    NULLIF(trim(servico7), ''),
    NULLIF(trim(servico8), ''),
    NULLIF(trim(servico9), ''),
    NULLIF(trim(servico10), '')
  ];
  
  -- Remove NULLs e retorna como JSONB
  RETURN to_jsonb(
    array_remove(servicos_array, NULL)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para converter descontos para JSONB
CREATE OR REPLACE FUNCTION descontos_to_jsonb(
  desconto1 TEXT, desconto2 TEXT, desconto3 TEXT
)
RETURNS JSONB AS $$
DECLARE
  descontos_array TEXT[];
BEGIN
  descontos_array := ARRAY[
    NULLIF(trim(desconto1), ''),
    NULLIF(trim(desconto2), ''),
    NULLIF(trim(desconto3), '')
  ];
  
  RETURN to_jsonb(
    array_remove(descontos_array, NULL)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para converter formas de pagamento para JSONB
CREATE OR REPLACE FUNCTION formas_pagamento_to_jsonb(
  forma1 TEXT, forma2 TEXT, forma3 TEXT, forma4 TEXT, forma5 TEXT
)
RETURNS JSONB AS $$
DECLARE
  formas_array TEXT[];
BEGIN
  formas_array := ARRAY[
    NULLIF(trim(forma1), ''),
    NULLIF(trim(forma2), ''),
    NULLIF(trim(forma3), ''),
    NULLIF(trim(forma4), ''),
    NULLIF(trim(forma5), '')
  ];
  
  RETURN to_jsonb(
    array_remove(formas_array, NULL)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE cidades IS 'Tabela de cidades atendidas pelo sistema';
COMMENT ON TABLE empresas IS 'Tabela principal de empresas de mudança cadastradas';
COMMENT ON TABLE hotsites IS 'Detalhes expandidos e marketing das empresas';
COMMENT ON TABLE planos_publicidade IS 'Tipos de planos de publicidade disponíveis';
COMMENT ON TABLE empresa_planos IS 'Relacionamento entre empresas e planos de publicidade';
COMMENT ON TABLE campanhas IS 'Histórico de campanhas publicitárias';
COMMENT ON TABLE orcamentos IS 'Orçamentos solicitados pelos clientes';
COMMENT ON TABLE orcamento_empresas IS 'Relacionamento N:N entre orçamentos e empresas';
COMMENT ON TABLE empresa_servicos IS 'Tipos de serviço oferecidos por cada empresa';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Schema completo criado com sucesso!
-- Próximos passos:
-- 1. Configurar variáveis de ambiente no .env.local
-- 2. Testar conexão com Supabase
-- 3. Começar a desenvolver as queries no código
-- ============================================

