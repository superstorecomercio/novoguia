-- ============================================
-- EXPORTAR EMPRESAS DO SQL SERVER (VERSÃO SIMPLES)
-- ============================================
-- INSTRUÇÕES:
-- 1. Execute APENAS esta query abaixo
-- 2. No SSMS: Query -> Results -> Results to File
-- 3. Execute novamente (F5)
-- 4. Salve como: data/empresas_export.csv
-- ============================================

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

