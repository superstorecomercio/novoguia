-- ============================================
-- MIGRATION 070: Criar Tabela de Admins
-- ============================================
-- Sistema de autenticação para dashboard admin
-- Inclui verificação por email e controle de primeiro login
-- ============================================

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL, -- bcrypt hash
  nome VARCHAR(255) NOT NULL,
  primeiro_login BOOLEAN DEFAULT true NOT NULL, -- Força mudança de senha no primeiro login
  ativo BOOLEAN DEFAULT true NOT NULL,
  ultimo_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de códigos de verificação por email
CREATE TABLE IF NOT EXISTS admin_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL, -- Código de 6 dígitos
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Expira em 10 minutos
  used BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões admin
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL, -- Token único para a sessão
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Expira em 24 horas
  ip_address VARCHAR(45), -- IPv4 ou IPv6
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_ativo ON admins(ativo);
CREATE INDEX IF NOT EXISTS idx_admin_verification_codes_admin_id ON admin_verification_codes(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_verification_codes_code ON admin_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_admin_verification_codes_expires_at ON admin_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_admins_updated_at();

-- Função para limpar códigos de verificação expirados
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_verification_codes
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE admins IS 'Administradores do sistema com acesso ao dashboard';
COMMENT ON COLUMN admins.primeiro_login IS 'Se true, força mudança de senha no próximo login';
COMMENT ON TABLE admin_verification_codes IS 'Códigos de verificação por email para login seguro';
COMMENT ON TABLE admin_sessions IS 'Sessões ativas de administradores logados';

-- RLS (Row Level Security) - Desabilitado para admins (acesso via service_role)
-- As rotas de API usarão createAdminClient() que bypassa RLS

-- ============================================
-- DADOS INICIAIS: Criar 2 usuários admin
-- ============================================
-- Senhas padrão: "Admin123!" (será hash bcrypt)
-- IMPORTANTE: As senhas serão hashadas no código da aplicação
-- Este script apenas cria os registros, o hash será feito na primeira execução

-- Admin 1
INSERT INTO admins (email, senha_hash, nome, primeiro_login, ativo)
VALUES (
  'junior@guiademudancas.com.br',
  '$2b$10$placeholder_hash_will_be_updated', -- Placeholder, será atualizado no código
  'Junior',
  true,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Admin 2
INSERT INTO admins (email, senha_hash, nome, primeiro_login, ativo)
VALUES (
  'mauricio@guiademudancas.com.br',
  '$2b$10$placeholder_hash_will_be_updated', -- Placeholder, será atualizado no código
  'Mauricio',
  true,
  true
)
ON CONFLICT (email) DO NOTHING;

