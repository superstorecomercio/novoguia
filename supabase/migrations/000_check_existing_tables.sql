-- ============================================
-- VERIFICAÇÃO DE TABELAS EXISTENTES
-- ============================================
-- Execute este script para verificar quais tabelas já existem
-- ============================================

-- Verificar tabelas existentes no schema público
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar se tabelas específicas existem
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cidades') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as cidades,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empresas') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as empresas,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hotsites') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as hotsites,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'planos_publicidade') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as planos_publicidade,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empresa_planos') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as empresa_planos,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campanhas') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as campanhas,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orcamentos') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as orcamentos,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orcamento_empresas') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as orcamento_empresas,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empresa_servicos') 
    THEN 'EXISTE' 
    ELSE 'NÃO EXISTE' 
  END as empresa_servicos;

-- Verificar colunas de uma tabela específica (exemplo: empresas)
-- Descomente e ajuste o nome da tabela conforme necessário
/*
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'empresas'
ORDER BY ordinal_position;
*/

