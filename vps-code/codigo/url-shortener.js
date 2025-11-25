/**
 * URL Shortener - Cria URLs curtas usando rota própria do Next.js
 * Usa /api/w que redireciona para WhatsApp
 */

const axios = require('axios');

// URL base da API (ajustar conforme necessário)
// Pode ser configurado via variável de ambiente API_BASE_URL
const API_BASE_URL = process.env.API_BASE_URL || 'https://novoguia.vercel.app';

/**
 * Cria URL curta usando rota própria do Next.js
 * @param {string} telefone - Telefone no formato: 5511999999999 (sem caracteres especiais)
 * @param {object} dados - Dados do orçamento para codificar
 * @returns {string} - URL curta
 */
function criarLinkWhatsApp(telefone, dados) {
  // Limpar telefone (remover caracteres não numéricos)
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  // Preparar dados simplificados para codificar
  const dadosSimplificados = {
    nome: dados.nome || '',
    origem: `${dados.cidadeOrigem || ''}, ${dados.estadoOrigem || ''}`.trim(),
    destino: `${dados.cidadeDestino || ''}, ${dados.estadoDestino || ''}`.trim(),
    tipo: dados.tipo_imovel || '',
    distancia: dados.distanciaKm || 0,
    precoMin: dados.precoMin || 0,
    precoMax: dados.precoMax || 0
  };
  
  // Codificar dados em base64
  const dadosJson = JSON.stringify(dadosSimplificados);
  const dadosEncoded = Buffer.from(dadosJson).toString('base64');
  
  // Criar URL curta usando rota própria
  const urlCurta = `${API_BASE_URL}/api/w?t=${telefoneLimpo}&d=${dadosEncoded}`;
  
  console.log('URL curta criada:', urlCurta);
  return urlCurta;
}

module.exports = {
  criarLinkWhatsApp
};

