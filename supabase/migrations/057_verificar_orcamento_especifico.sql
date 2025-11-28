-- Migration: Verificar orçamento específico MD-D6AA-BE1E
-- Data: 2025-11-27
-- Descrição: Query para verificar os dados salvos de um orçamento específico

-- Buscar orçamento pelo código
SELECT 
  id,
  codigo_orcamento,
  origem_completo,
  destino_completo,
  cidade_origem,
  estado_origem,
  endereco_origem,
  cidade_destino,
  estado_destino,
  endereco_destino,
  created_at
FROM orcamentos
WHERE codigo_orcamento = 'MD-D6AA-BE1E'
   OR id::text LIKE '%d6aa%'
ORDER BY created_at DESC
LIMIT 5;

