-- ============================================
-- EXPORTAR CIDADES DO SQL SERVER
-- ============================================
-- Execute este script no SQL Server Management Studio
-- Ele vai gerar um arquivo CSV ou SQL INSERT
-- ============================================

-- Opção 1: Exportar para CSV (recomendado)
-- No SSMS: Query -> Results -> Results to File
-- Execute a query abaixo e salve como: cidades_export.csv

SELECT 
    codCidade as id_legado,
    nomCidade as nome,
    NULL as estado,  -- Você pode mapear manualmente depois
    NULL as descricao,
    NULL as regiao
FROM guiaCidade
ORDER BY nomCidade;

-- ============================================
-- Opção 2: Gerar SQL INSERT direto
-- ============================================
-- Execute a query abaixo e copie o resultado
-- Cole em um arquivo: cidades_export.sql

SELECT 
    'INSERT INTO cidades (nome, slug, estado, descricao, regiao) VALUES (' +
    '''' + REPLACE(nomCidade, '''', '''''') + ''', ' +
    '''' + LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        nomCidade, 'á', 'a'), 'à', 'a'), 'ã', 'a'), 'â', 'a'), 'é', 'e'), 'ê', 'e'), 
        'í', 'i'), 'ó', 'o'), 'ô', 'o'), 'ú', 'u')) + ''', ' +
    'NULL, ' +  -- estado (você pode mapear depois)
    'NULL, ' +  -- descricao
    'NULL' +    -- regiao
    ');' as sql_insert
FROM guiaCidade
ORDER BY nomCidade;

-- ============================================
-- Opção 3: Exportar para JSON (SQL Server 2016+)
-- ============================================

SELECT 
    codCidade as id_legado,
    nomCidade as nome,
    NULL as estado,
    NULL as descricao,
    NULL as regiao
FROM guiaCidade
ORDER BY nomCidade
FOR JSON PATH;

