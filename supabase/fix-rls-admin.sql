-- ============================================
-- FIX RLS PARA ADMIN - Executar no Supabase Studio
-- ============================================
-- Este script adiciona a policy necessária para o service_role
-- acessar todos os orçamentos no dashboard admin
-- ============================================

-- Habilitar RLS na tabela orcamentos se ainda não estiver
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Remover a política antiga se existir
DROP POLICY IF EXISTS "Permitir service_role ler todos os orçamentos" ON orcamentos;

-- Criar política para o service_role
CREATE POLICY "Permitir service_role ler todos os orçamentos"
  ON orcamentos
  FOR SELECT
  TO service_role
  USING (true);

-- Também vamos criar uma policy para o authenticated role (admin)
-- pois o dashboard pode usar authenticated ao invés de service_role
DROP POLICY IF EXISTS "Permitir authenticated ler todos os orçamentos" ON orcamentos;

CREATE POLICY "Permitir authenticated ler todos os orçamentos"
  ON orcamentos
  FOR SELECT
  TO authenticated
  USING (true);

-- Verificar as políticas existentes
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'orcamentos'
ORDER BY policyname;

