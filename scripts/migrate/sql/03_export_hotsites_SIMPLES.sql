-- ============================================
-- EXPORTAR HOTSITES DO SQL SERVER (VERSÃO SIMPLES)
-- ============================================
-- IMPORTANTE: Hotsites são vinculados a empresas E cidades
-- ============================================
-- INSTRUÇÕES:
-- 1. Execute APENAS esta query abaixo
-- 2. No SSMS: Query -> Results -> Results to File
-- 3. Execute novamente (F5)
-- 4. Salve como: data/hotsites_export.csv
-- ============================================

SELECT 
    ROW_NUMBER() OVER (ORDER BY h.codEmpresa, h.hotCidade) as id_legado,  -- Gerar ID sequencial (a tabela pode não ter codHotsite)
    h.codEmpresa as empresa_id_legado,
    h.hotEmpresa as nome_exibicao,
    h.hotEndereco as endereco,
    h.hotCidade as cidade_nome,  -- ⭐ Cidade onde o hotsite é exibido
    h.hotEstado as estado,        -- ⭐ Estado onde o hotsite é exibido
    h.hotDescricao as descricao,
    h.hotLogotipo as logo_url,
    h.hotFoto1 as foto1_url,
    h.hotFoto2 as foto2_url,
    h.hotFoto3 as foto3_url,
    h.hotServico1,
    h.hotServico2,
    h.hotServico3,
    h.hotServico4,
    h.hotServico5,
    h.hotServico6,
    h.hotServico7,
    h.hotServico8,
    h.hotServico9,
    h.hotServico10,
    h.hotDesconto1,
    h.hotDesconto2,
    h.hotDesconto3,
    h.hotFormaPagto1,
    h.hotFormaPagto2,
    h.hotFormaPagto3,
    h.hotFormaPagto4,
    h.hotFormaPagto5
FROM guiaHotsite h
WHERE h.hotCidade IS NOT NULL  -- Apenas hotsites com cidade definida
ORDER BY h.codEmpresa, h.hotCidade;

