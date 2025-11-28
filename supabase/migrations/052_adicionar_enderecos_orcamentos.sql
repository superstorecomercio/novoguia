-- Migration: Adicionar campos de endereço completo em orcamentos
-- Data: 2025-11-27
-- Descrição: Adiciona campos endereco_origem e endereco_destino para armazenar endereços completos retornados pela IA

-- Adicionar campos de endereço completo
ALTER TABLE orcamentos 
  ADD COLUMN IF NOT EXISTS endereco_origem TEXT,
  ADD COLUMN IF NOT EXISTS endereco_destino TEXT;

-- Comentários
COMMENT ON COLUMN orcamentos.endereco_origem IS 'Endereço completo de origem retornado pela IA (ex: Rua das Flores, 123)';
COMMENT ON COLUMN orcamentos.endereco_destino IS 'Endereço completo de destino retornado pela IA (ex: Avenida Paulista, 1000)';

