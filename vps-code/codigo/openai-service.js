const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function calcularOrcamentoComIA(dados) {
  try {
    const prompt = `
Você é um especialista em mudanças residenciais e comerciais no Brasil.

Dados da mudança (EXATAMENTE como o usuário informou):
- Origem informada pelo usuário: "${dados.origem}"
- Destino informado pelo usuário: "${dados.destino}"

⚠️ ATENÇÃO CRÍTICA - REGRAS DE EXTRAÇÃO:
1. Use APENAS as informações que o usuário forneceu explicitamente
2. NÃO invente, NÃO adicione, NÃO assuma informações que não foram mencionadas
3. Se o usuário informou apenas "rua das flores" (sem cidade), NÃO adicione cidade ou estado
4. Se o usuário informou apenas "São Paulo" (sem estado), use APENAS "São Paulo" como cidade, NÃO adicione "SP"
5. Se o usuário informou "São Paulo, SP", aí sim use cidade="São Paulo" e estado="SP"
6. Para calcular distância: você PRECISA identificar AMBAS as cidades com certeza. Se não conseguir identificar uma das cidades, a distância deve ser 0km ou muito pequena
7. Se origem="rua das flores" e destino="São Paulo", você NÃO consegue calcular distância correta (falta cidade da origem), então use distanciaKm=0
- Tipo de imóvel: ${dados.tipo_imovel}
- Metragem: ${dados.metragem || 'Não informado'}
- Tem elevador: ${dados.tem_elevador ? 'Sim' : 'Não'}
${!dados.tem_elevador ? `- Andar: ${dados.andar}º` : ''}
- Precisa embalagem: ${dados.precisa_embalagem ? 'Sim' : 'Não'}
${dados.lista_objetos ? `- Lista de objetos: ${dados.lista_objetos}` : ''}

REGRAS DE PRECIFICAÇÃO (mercado brasileiro real):

IMPORTANTE: SEMPRE retorne apenas UMA faixa estimada completa que já inclua TODOS os custos (base + distância + adicionais). NÃO retorne duas faixas separadas.

1. BASE POR TIPO DE IMÓVEL E METRAGEM (já inclui custos básicos):
   - Casa:
     * Até 50m²: R$ 1.200 - R$ 2.500
     * 50-150m²: R$ 2.000 - R$ 5.000
     * 150-300m²: R$ 3.500 - R$ 7.500
     * Acima de 300m²: R$ 5.500 - R$ 12.000
   - Apartamento:
     * Até 50m²: R$ 900 - R$ 2.200
     * 50-150m²: R$ 1.600 - R$ 4.500
     * 150-300m²: R$ 2.800 - R$ 7.000
     * Acima de 300m²: R$ 4.500 - R$ 11.000
   - Empresa:
     * Até 50m²: R$ 1.500 - R$ 3.200
     * 50-150m²: R$ 2.800 - R$ 6.500
     * 150-300m²: R$ 4.800 - R$ 10.000
     * Acima de 300m²: R$ 8.000 - R$ 18.000

2. ADICIONAL POR DISTÂNCIA (já aplicado na faixa acima):
   - Até 50km: já incluído na base
   - 51-200km: adicione R$ 8-12 por km adicional à faixa
   - 201-500km: adicione R$ 10-15 por km adicional à faixa
   - 501km+: adicione R$ 12-18 por km adicional à faixa

3. AJUSTES (já aplicados na faixa final):
   - SEM elevador: adicione 20-30% à faixa
   - COM embalagem profissional: adicione R$ 400-1.000 à faixa
   - Lista de objetos grande: adicione 10-25% à faixa

4. LIMITES REALISTAS:
   - Mínimo absoluto: R$ 800
   - Máximo para residencial: R$ 18.000
   - Máximo para comercial: R$ 25.000

5. CÁLCULO FINAL:
   - Comece com a BASE (tipo + metragem)
   - Adicione o custo de DISTÂNCIA
   - Adicione os AJUSTES (elevador, embalagem, objetos)
   - Retorne apenas UMA faixa final: precoMin e precoMax já com TODOS os custos incluídos
   - NÃO retorne duas faixas separadas (uma base e outra com adicionais)
   - A faixa retornada deve ser a MAIOR/MAIS COMPLETA possível

IMPORTANTE - REGRAS CRÍTICAS PARA EXTRAÇÃO DE CIDADE, ESTADO E ENDEREÇO:
1. SEMPRE extraia cidade e estado, mesmo de informações parciais
2. Se o usuário informou endereço completo (ex: "Rua das Flores, 123, São Paulo, SP"):
   - cidadeOrigem: "São Paulo"
   - estadoOrigem: "SP"
   - enderecoOrigem: "Rua das Flores, 123" (apenas o endereço, sem cidade/estado)
3. Se o usuário informou apenas cidade (ex: "São Paulo"):
   - cidadeOrigem: "São Paulo"
   - estadoOrigem: "SP" (identifique o estado)
   - enderecoOrigem: null (não há endereço)
4. Se o usuário informou apenas endereço sem cidade (ex: "rua das flores"):
   - cidadeOrigem: tente identificar a cidade ou use o texto como fallback
   - estadoOrigem: tente identificar ou null
   - enderecoOrigem: "rua das flores" (o texto informado)
5. Se o usuário informou "rua das flores sp" ou similar:
   - cidadeOrigem: "São Paulo" (identifique a cidade do estado)
   - estadoOrigem: "SP"
   - enderecoOrigem: "rua das flores" (apenas o endereço)
6. NUNCA retorne null para cidadeOrigem ou cidadeDestino - sempre tente identificar ou use o texto informado como fallback
7. enderecoOrigem e enderecoDestino devem conter APENAS o endereço (rua, número), SEM cidade e estado
8. Para calcular distância: use as cidades identificadas. Se não conseguir identificar ambas, use 0km

IMPORTANT: Retorne APENAS um JSON válido, sem texto adicional, markdown ou código. O JSON deve ter exatamente esta estrutura:

{
  "distanciaKm": número (distância em km entre origem e destino - CALCULE CORRETAMENTE baseado APENAS nas cidades identificadas, se não conseguir identificar ambas as cidades, use 0),
  "precoMin": número (preço mínimo REALISTA em reais - SEMPRE use a faixa MAIOR/mais completa),
  "precoMax": número (preço máximo REALISTA em reais - SEMPRE use a faixa MAIOR/mais completa),
  "explicacao": "string (máximo 3 frases explicando o cálculo de forma clara)",
  "cidadeOrigem": "string (nome da cidade de origem - SEMPRE preencha, extraia do texto informado ou use o texto como fallback)",
  "estadoOrigem": "string (sigla do estado - SEMPRE tente identificar, use conhecimento geográfico se necessário)",
  "enderecoOrigem": "string (endereço completo de origem se houver - ex: Rua das Flores, 123 - ou null se não houver)",
  "cidadeDestino": "string (nome da cidade de destino - SEMPRE preencha, extraia do texto informado ou use o texto como fallback)",
  "estadoDestino": "string (sigla do estado - SEMPRE tente identificar, use conhecimento geográfico se necessário)",
  "enderecoDestino": "string (endereço completo de destino se houver - ex: Avenida Paulista, 1000 - ou null se não houver)"
}

EXEMPLOS DE EXTRAÇÃO CORRETA:
- Origem: "rua das flores" → cidadeOrigem: "Rua das Flores", estadoOrigem: null, enderecoOrigem: "rua das flores"
- Origem: "rua das flores sp" → cidadeOrigem: "São Paulo", estadoOrigem: "SP", enderecoOrigem: "rua das flores"
- Origem: "São Paulo" → cidadeOrigem: "São Paulo", estadoOrigem: "SP", enderecoOrigem: null
- Origem: "São Paulo, SP" → cidadeOrigem: "São Paulo", estadoOrigem: "SP", enderecoOrigem: null
- Origem: "Rua das Flores, 123, São Paulo, SP" → cidadeOrigem: "São Paulo", estadoOrigem: "SP", enderecoOrigem: "Rua das Flores, 123"
- Destino: "Rio de Janeiro" → cidadeDestino: "Rio de Janeiro", estadoDestino: "RJ", enderecoDestino: null
- Destino: "Rio de Janeiro, RJ" → cidadeDestino: "Rio de Janeiro", estadoDestino: "RJ", enderecoDestino: null
- Destino: "Teodoro sampaio" → cidadeDestino: "Teodoro Sampaio", estadoDestino: "SP", enderecoDestino: null
- Destino: "Avenida Paulista, 1000, São Paulo, SP" → cidadeDestino: "São Paulo", estadoDestino: "SP", enderecoDestino: "Avenida Paulista, 1000"

EXEMPLO DE CÁLCULO DE DISTÂNCIA:
- Origem: "rua das flores sp", Destino: "São Paulo" → distanciaKm: 0 (mesma cidade/região)
- Origem: "São Paulo", Destino: "Rio de Janeiro" → distanciaKm: 430 (distância real entre as cidades)
- Origem: "São Paulo, SP", Destino: "São Paulo, SP" → distanciaKm: 0 (mesma cidade)

CALCULE valores REALISTAS baseados nas regras acima. 

IMPORTANTE - Siga estes passos na ordem:

1. Identifique a BASE (tipo + metragem):
   - Casa com 50-150m² → base: R$ 2.000 - R$ 5.000
   - Apartamento com até 50m² → base: R$ 900 - R$ 2.200
   - Empresa com acima de 300m² → base: R$ 8.000 - R$ 18.000

2. Calcule o ADICIONAL DE DISTÂNCIA:
   - Se 100km: adicione R$ 400-600 (50km × R$ 8-12)
   - Se 300km: adicione R$ 2.500-3.750 (250km × R$ 10-15)
   - Se 600km: adicione R$ 6.000-9.000 (550km × R$ 12-18)

3. Aplique os AJUSTES:
   - Sem elevador: multiplique por 1.20-1.30
   - Com embalagem: adicione R$ 400-1.000
   - Lista grande: multiplique por 1.10-1.25

4. CALCULE A FAIXA FINAL (soma tudo):
   - precoMin = (baseMin + distânciaMin) × ajustes + embalagemMin
   - precoMax = (baseMax + distânciaMax) × ajustes + embalagemMax

5. RETORNE APENAS UMA FAIXA:
   - precoMin e precoMax já com TODOS os custos incluídos
   - NÃO retorne duas faixas separadas
   - A faixa deve ser a MAIOR/MAIS COMPLETA possível

EXEMPLO CORRETO:
- Casa 50-150m², 100km, sem elevador, com embalagem
- Base: R$ 2.000 - R$ 5.000
- Distância (100km): +R$ 400-600
- Subtotal: R$ 2.400 - R$ 5.600
- Sem elevador (×1.25): R$ 3.000 - R$ 7.000
- Com embalagem (+R$ 600): R$ 3.600 - R$ 7.600
- RESULTADO: precoMin = 3.600, precoMax = 7.600 (UMA faixa completa)
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em calcular orçamentos de mudanças no Brasil. Retorne APENAS JSON válido, sem formatação markdown. Use valores realistas do mercado brasileiro.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    let resultado = completion.choices[0].message.content.trim();
    
    // Remover markdown se houver
    resultado = resultado.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const json = JSON.parse(resultado);
    
    console.log('Resultado da IA:', json);
    return json;
    
  } catch (error) {
    console.error('Erro ao calcular com IA:', error);
    throw error;
  }
}

module.exports = {
  calcularOrcamentoComIA
};
