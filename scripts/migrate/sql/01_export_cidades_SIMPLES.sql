-- ============================================
-- EXPORTAR CIDADES DO SQL SERVER (VERSÃO SIMPLES)
-- ============================================
-- INSTRUÇÕES:
-- 1. Execute APENAS esta query abaixo
-- 2. No SSMS: Query -> Results -> Results to File
-- 3. Execute novamente (F5)
-- 4. Salve como: data/cidades_export.csv
-- ============================================

SELECT 
    codCidade as id_legado,
    nomCidade as nome,
    NULL as estado,
    NULL as descricao,
    NULL as regiao
FROM guiaCidade
ORDER BY nomCidade;

