-- ============================================
-- EXPORTAR CAMPANHAS DO SQL SERVER
-- ============================================
-- IMPORTANTE: Campanhas controlam o status ativo/inativo,
-- vencimentos, valores e planos de publicidade das empresas
-- ============================================

-- Opção 1: Exportar para CSV
-- No SSMS: Query -> Results -> Results to File
-- Salve como: data/campanhas_export.csv

SELECT 
    c.codCampanha as id_legado,
    c.codEmpresa as empresa_id_legado,
    c.codPublicidade as plano_id_legado,
    p.desPublicidade as plano_nome,  -- Nome do plano (Top, Quality, etc.)
    c.datainicio as data_inicio,
    c.datafim as data_fim,
    c.valortotal as valor_total,
    c.datacobranca as data_cobranca,
    -- Buscar cidade da empresa (para vincular campanha à cidade)
    e.codCidade as cidade_id_legado,
    ci.nomCidade as cidade_nome,
    -- Buscar hotsite da empresa (se existir)
    h.hotCidade as hotsite_cidade_nome  -- Cidade onde o hotsite é exibido (a tabela não tem codHotsite)
FROM guiaCampanha c
INNER JOIN guiaEmpresa e ON c.codEmpresa = e.codEmpresa
LEFT JOIN guiaCidade ci ON e.codCidade = ci.codCidade
LEFT JOIN guiaPublicidade p ON c.codPublicidade = p.codPublicidade
LEFT JOIN guiaHotsite h ON e.codEmpresa = h.codEmpresa
ORDER BY c.codEmpresa, c.datainicio DESC;

-- ============================================
-- Opção 2: Exportar para JSON
-- ============================================

SELECT 
    c.codCampanha as id_legado,
    c.codEmpresa as empresa_id_legado,
    c.codPublicidade as plano_id_legado,
    p.desPublicidade as plano_nome,
    c.datainicio as data_inicio,
    c.datafim as data_fim,
    c.valortotal as valor_total,
    c.datacobranca as data_cobranca,
    e.codCidade as cidade_id_legado,
    ci.nomCidade as cidade_nome,
    h.codHotsite as hotsite_id_legado,
    h.hotCidade as hotsite_cidade_nome
FROM guiaCampanha c
INNER JOIN guiaEmpresa e ON c.codEmpresa = e.codEmpresa
LEFT JOIN guiaCidade ci ON e.codCidade = ci.codCidade
LEFT JOIN guiaPublicidade p ON c.codPublicidade = p.codPublicidade
LEFT JOIN guiaHotsite h ON e.codEmpresa = h.codEmpresa
ORDER BY c.codEmpresa, c.datainicio DESC
FOR JSON PATH;

-- ============================================
-- Opção 3: Exportar apenas campanhas ativas (não vencidas)
-- ============================================

SELECT 
    c.codCampanha as id_legado,
    c.codEmpresa as empresa_id_legado,
    c.codPublicidade as plano_id_legado,
    p.desPublicidade as plano_nome,
    c.datainicio as data_inicio,
    c.datafim as data_fim,
    c.valortotal as valor_total,
    c.datacobranca as data_cobranca,
    e.codCidade as cidade_id_legado,
    ci.nomCidade as cidade_nome,
    h.codHotsite as hotsite_id_legado,
    h.hotCidade as hotsite_cidade_nome,
    CASE 
        WHEN c.datafim IS NULL THEN 1  -- Sem data fim = ativa
        WHEN c.datafim >= GETDATE() THEN 1  -- Data fim no futuro = ativa
        ELSE 0  -- Data fim no passado = inativa
    END as ativo
FROM guiaCampanha c
INNER JOIN guiaEmpresa e ON c.codEmpresa = e.codEmpresa
LEFT JOIN guiaCidade ci ON e.codCidade = ci.codCidade
LEFT JOIN guiaPublicidade p ON c.codPublicidade = p.codPublicidade
LEFT JOIN guiaHotsite h ON e.codEmpresa = h.codEmpresa
WHERE c.datafim IS NULL OR c.datafim >= GETDATE()  -- Apenas campanhas ativas
ORDER BY c.codEmpresa, c.datainicio DESC;

