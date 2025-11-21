-- Atualizar todos os hotsites com tipoempresa NULL ou vazio para 'Empresa de Mudança'
UPDATE hotsites
SET tipoempresa = 'Empresa de Mudança'
WHERE tipoempresa IS NULL OR tipoempresa = '';

-- Verificar quantos registros foram atualizados
-- SELECT COUNT(*) as total_atualizados 
-- FROM hotsites 
-- WHERE tipoempresa = 'Empresa de Mudança';

