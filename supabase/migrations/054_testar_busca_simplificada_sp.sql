-- Migration: Testar busca simplificada de campanhas em SP
-- Data: 2025-11-27
-- Descrição: Query de teste após simplificar critérios (apenas campanha.ativo = true)

-- 1. Testar a função buscar_hotsites_ativos_por_estado com 'SP'
SELECT 
  'Total de campanhas encontradas pela função' as teste,
  COUNT(*) as total
FROM buscar_hotsites_ativos_por_estado('SP');

-- 2. Ver detalhes das campanhas encontradas
SELECT 
  hotsite_id,
  campanha_id,
  nome as hotsite_nome,
  email,
  cidade,
  estado,
  plano_ordem
FROM buscar_hotsites_ativos_por_estado('SP')
ORDER BY plano_ordem, nome;

-- 3. Verificação manual - apenas critério: campanha.ativo = true e estado = SP
SELECT 
  h.id as hotsite_id,
  h.nome_exibicao,
  h.estado,
  h.cidade,
  h.ativo as hotsite_ativo,
  c.id as campanha_id,
  c.ativo as campanha_ativa,
  c.participa_cotacao,
  CASE 
    WHEN c.ativo = true AND UPPER(TRIM(h.estado)) = 'SP'
    THEN '✅ ATENDE CRITÉRIO (campanha ativa + estado SP)'
    ELSE '❌ NÃO ATENDE'
  END as status
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE UPPER(TRIM(h.estado)) = 'SP'
ORDER BY c.ativo DESC, h.nome_exibicao;

-- 4. Contar quantas campanhas atendem o critério simplificado
SELECT 
  'Total de campanhas que atendem: campanha.ativo = true AND estado = SP' as criterio,
  COUNT(*) as total
FROM hotsites h
INNER JOIN campanhas c ON c.hotsite_id = h.id
WHERE 
  UPPER(TRIM(h.estado)) = 'SP'
  AND c.ativo = true;

