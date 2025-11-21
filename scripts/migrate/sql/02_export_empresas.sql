-- ============================================
-- EXPORTAR EMPRESAS DO SQL SERVER
-- ============================================
-- Execute este script no SQL Server Management Studio
-- ============================================

-- Opção 1: Exportar para CSV
-- No SSMS: Query -> Results -> Results to File
-- Salve como: empresas_export.csv

SELECT 
    e.codEmpresa as id_legado,
    e.nomEmpresa as nome,
    e.CNPJ as cnpj,
    e.Responsavel as responsavel,
    e.Email as email,
    e.telefone,
    NULL as telefone2,
    NULL as telefone3,
    NULL as website,
    e.Endereco as endereco,
    e.Complemento as complemento,
    e.codCidade as cidade_id_legado,
    c.nomCidade as cidade_nome,
    NULL as estado,
    NULL as descricao,
    1 as ativo  -- Padrão: todas as empresas exportadas são consideradas ativas (status será controlado pelas campanhas)
FROM guiaEmpresa e
LEFT JOIN guiaCidade c ON e.codCidade = c.codCidade
ORDER BY e.nomEmpresa;

-- ============================================
-- Opção 2: Gerar SQL INSERT (formato PostgreSQL)
-- ============================================
-- Nota: Você precisará ajustar os IDs de cidade depois

SELECT 
    '-- Empresa: ' + e.nomEmpresa + CHAR(13) + CHAR(10) +
    'INSERT INTO empresas (nome, slug, cnpj, responsavel, email, telefones, endereco, complemento, cidade_id, estado, descricao, ativo) VALUES (' +
    '''' + REPLACE(e.nomEmpresa, '''', '''''') + ''', ' +
    '''' + LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        REPLACE(e.nomEmpresa, ' ', '-'), 'á', 'a'), 'à', 'a'), 'ã', 'a'), 'â', 'a'), 'é', 'e'), 'ê', 'e'), 
        'í', 'i'), 'ó', 'o'), 'ô', 'o'), 'ú', 'u')) + ''', ' +
    ISNULL('''' + REPLACE(e.CNPJ, '''', '''''') + '''', 'NULL') + ', ' +
    ISNULL('''' + REPLACE(e.Responsavel, '''', '''''') + '''', 'NULL') + ', ' +
    ISNULL('''' + REPLACE(e.Email, '''', '''''') + '''', 'NULL') + ', ' +
    'ARRAY[''' + REPLACE(ISNULL(e.telefone, ''), ',', ''',''') + ''']::TEXT[], ' +
    ISNULL('''' + REPLACE(e.Endereco, '''', '''''') + '''', 'NULL') + ', ' +
    ISNULL('''' + REPLACE(e.Complemento, '''', '''''') + '''', 'NULL') + ', ' +
    '(SELECT id FROM cidades WHERE nome = ''' + REPLACE(ISNULL(c.nomCidade, ''), '''', '''''') + ''' LIMIT 1), ' +
    'NULL, ' +  -- estado
    'NULL, ' +  -- descricao
    'true' +  -- Padrão: todas as empresas exportadas são consideradas ativas
    ');' as sql_insert
FROM guiaEmpresa e
LEFT JOIN guiaCidade c ON e.codCidade = c.codCidade
ORDER BY e.nomEmpresa;

-- ============================================
-- Opção 3: Exportar para JSON
-- ============================================

SELECT 
    e.codEmpresa as id_legado,
    e.nomEmpresa as nome,
    e.CNPJ as cnpj,
    e.Responsavel as responsavel,
    e.Email as email,
    e.telefone,
    e.Endereco as endereco,
    e.Complemento as complemento,
    e.codCidade as cidade_id_legado,
    c.nomCidade as cidade_nome,
    1 as ativo  -- Padrão: todas as empresas exportadas são consideradas ativas
FROM guiaEmpresa e
LEFT JOIN guiaCidade c ON e.codCidade = c.codCidade
ORDER BY e.nomEmpresa
FOR JSON PATH;

