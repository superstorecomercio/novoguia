-- ============================================
-- TESTE: Verificar função buscar_hotsites_ativos_por_estado
-- ============================================
-- Execute esta query no Supabase SQL Editor para testar
-- antes de preencher o formulário

-- Testar a função diretamente com estado SP
SELECT 
  hotsite_id,
  campanha_id,
  nome,
  cidade,
  estado
FROM buscar_hotsites_ativos_por_estado('SP', 'mudanca')
ORDER BY nome;

-- Contar total retornado
SELECT 
  'Total de campanhas retornadas' as descricao,
  COUNT(*)::TEXT as total
FROM buscar_hotsites_ativos_por_estado('SP', 'mudanca');

-- Resumo em tabela
SELECT 
  'RESULTADO DO TESTE' as tipo,
  COUNT(*)::TEXT as total_campanhas,
  STRING_AGG(nome, ', ' ORDER BY nome) as empresas
FROM buscar_hotsites_ativos_por_estado('SP', 'mudanca');







