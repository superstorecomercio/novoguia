-- ============================================
-- EXPORTAR CAMPANHAS DO SQL SERVER (VERSÃO SIMPLES)
-- ============================================
-- IMPORTANTE: Campanhas controlam o status ativo/inativo,
-- vencimentos, valores e planos de publicidade das empresas
-- ============================================
-- INSTRUÇÕES:
-- 1. Execute APENAS esta query abaixo
-- 2. No SSMS: Query -> Results -> Results to File
-- 3. Execute novamente (F5)
-- 4. Salve como: data/campanhas_export.csv
-- ============================================

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

