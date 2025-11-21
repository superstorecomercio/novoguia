import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

type TipoImovel = 'kitnet' | '1_quarto' | '2_quartos' | '3_mais' | 'comercial';

interface CalculoRequest {
  origem: string;
  destino: string;
  tipoImovel: TipoImovel;
  temElevador: 'sim' | 'nao';
  andar: number;
  precisaEmbalagem: 'sim' | 'nao';
  email: string;
  whatsapp: string;
  dataEstimada?: string;
}

interface CalculoResponse {
  precoMin: number;
  precoMax: number;
  faixaTexto: string;
  distanciaKm?: number;
  mensagemIA?: string;
}

// Todas as funções de cálculo de distância foram removidas.
// A IA agora calcula TUDO, incluindo a distância entre origem e destino.

/**
 * Fallback MUITO básico caso a IA não esteja disponível
 * NÃO RECOMENDADO - Configure a OpenAI API Key para ter resultados precisos
 */
async function calcularOrcamentoFallback(params: CalculoRequest): Promise<CalculoResponse> {
  console.error('❌ OPENAI_API_KEY não configurada! Configure para ter orçamentos precisos.');
  
  const tiposImovelLabels: Record<TipoImovel, string> = {
    kitnet: 'kitnet',
    '1_quarto': 'apartamento de 1 quarto',
    '2_quartos': 'apartamento de 2 quartos',
    '3_mais': 'apartamento de 3+ quartos ou casa',
    comercial: 'mudança comercial',
  };

  // Estimativa MUITO genérica (não confiável!)
  const valorBase = 1500; // Valor médio genérico
  const precoMin = 800;
  const precoMax = 3500;

  const faixaTexto = `Para sua mudança de ${tiposImovelLabels[params.tipoImovel]} de ${params.origem} para ${params.destino}, ` +
    `o valor estimado fica entre R$ ${precoMin.toLocaleString('pt-BR')} e R$ ${precoMax.toLocaleString('pt-BR')}. ` +
    `⚠️ ATENÇÃO: Esta é uma estimativa genérica. Configure a OpenAI API Key para ter orçamentos precisos.`;

  return {
    precoMin,
    precoMax,
    faixaTexto,
  };
}

/**
 * Calcula o orçamento usando IA (OpenAI GPT-4o-mini)
 * A IA analisa TODOS os dados, calcula a distância e retorna uma faixa de preço precisa
 */
async function calcularOrcamentoComIA(params: CalculoRequest): Promise<CalculoResponse | null> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY não configurada.');
    return null;
  }

  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const tiposImovelLabels: Record<TipoImovel, string> = {
      kitnet: 'kitnet',
      '1_quarto': 'apartamento de 1 quarto',
      '2_quartos': 'apartamento de 2 quartos',
      '3_mais': 'apartamento de 3+ quartos ou casa',
      comercial: 'mudança comercial (escritório, loja, etc.)',
    };

    const prompt = `Você é um especialista em orçamentos de mudanças residenciais no Brasil com amplo conhecimento do mercado atual e geografia brasileira.

Analise os dados abaixo e retorne:
1. A distância REAL em km entre origem e destino (use seu conhecimento geográfico)
2. Uma estimativa de preço REALISTA baseada no mercado brasileiro atual

DADOS DA MUDANÇA:
- Origem digitada pelo usuário: "${params.origem}"
- Destino digitado pelo usuário: "${params.destino}"
- Tipo de imóvel: ${tiposImovelLabels[params.tipoImovel]}
- Tem elevador na origem/destino: ${params.temElevador === 'sim' ? 'Sim' : 'Não'}
- Andar: ${params.andar}º
- Precisa de embalagem e desmontagem completa: ${params.precisaEmbalagem === 'sim' ? 'Sim' : 'Não'}

⚠️ INSTRUÇÕES CRÍTICAS PARA INTERPRETAR LOCALIDADES:

1. **CORRIJA ERROS DE DIGITAÇÃO E INTERPRETE O CONTEXTO:**
   - "MOEM" = Moema (bairro de São Paulo, SP)
   - "Santana SP" = Santana (bairro de São Paulo, SP)
   - "SP" = São Paulo, SP (capital)
   - "RJ" = Rio de Janeiro, RJ (capital)
   - "BH" = Belo Horizonte, MG
   - Se ambos têm "SP", provavelmente são da mesma cidade/região
   - Se menciona bairro, procure a cidade correspondente
   - Tolere variações de escrita (acentos, maiúsculas, abreviações)

2. **IDENTIFIQUE O TIPO DE MUDANÇA:**
   - **Mesma cidade (bairros diferentes)**: 5-25 km
     * Ex: Moema → Santana (São Paulo) = ~12 km
     * Ex: Copacabana → Tijuca (Rio de Janeiro) = ~15 km
   - **Mesma região metropolitana**: 30-80 km
     * Ex: São Paulo → Guarulhos = ~25 km
     * Ex: São Paulo → Santo André = ~30 km
   - **Mesmo estado (cidades diferentes)**: 80-400 km
     * Ex: São Paulo → Campinas = ~100 km
     * Ex: São Paulo → Santos = ~80 km
   - **Estados próximos**: 400-800 km
     * Ex: São Paulo → Curitiba = ~400 km
     * Ex: São Paulo → Rio de Janeiro = ~430 km
   - **Interestadual longa distância**: 800+ km
     * Ex: São Paulo → Porto Alegre = ~1.100 km
     * Ex: São Paulo → Salvador = ~1.960 km

3. **CÁLCULO DE PREÇO:**
   - Considere: distância, volume, acesso, embalagem, mão de obra, combustível, pedágios
   - Faixa deve ter mínimo 25% de diferença entre min e max
   - Valores realistas para mercado brasileiro 2024/2025
   - Embalagem profissional: +R$ 500-1.000 dependendo do porte
   - Sem elevador em andares altos: +R$ 200-400
   - Mudanças interestaduais: custos de pedágio, pernoite, logística

4. **EXEMPLOS DE REFERÊNCIA:**
   - Mesma cidade (12 km, kitnet, com elevador): R$ 600 - R$ 850
   - Mesma cidade (12 km, 2 quartos, sem elevador 3º andar): R$ 900 - R$ 1.300
   - Interestadual (430 km, 2 quartos, com elevador, com embalagem): R$ 2.800 - R$ 3.900

Retorne APENAS um JSON válido neste formato exato:
{
  "distanciaKm": 12,
  "precoMin": 800,
  "precoMax": 1200,
  "explicacao": "Explicação clara (máx 3 frases) mencionando: (1) localidades interpretadas, (2) distância calculada, (3) principais fatores de custo."
}

EXEMPLO DE RESPOSTA CORRETA:
{
  "distanciaKm": 12,
  "precoMin": 850,
  "precoMax": 1150,
  "explicacao": "Mudança entre Moema e Santana, ambos bairros de São Paulo (12km). Distância curta dentro da mesma cidade, acesso facilitado com elevador. A faixa considera variação entre empresas mais econômicas e premium."
}`;

    console.log('🤖 Consultando IA para calcular distância e orçamento...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo mais rápido e barato
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em orçamentos de mudanças residenciais e geografia brasileira. Seja inteligente ao interpretar localidades, tolerando erros de digitação, abreviações e variações. Retorne sempre JSON válido.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5, // Temperatura moderada para equilibrar precisão e flexibilidade
      max_tokens: 500, // Mais tokens para raciocinar melhor
      response_format: { type: 'json_object' },
    });

    const resposta = completion.choices[0].message.content;
    if (!resposta) {
      console.error('❌ IA retornou resposta vazia');
      return null;
    }

    const resultado = JSON.parse(resposta);
    console.log('✅ IA calculou orçamento completo:', resultado);

    const distanciaKm = resultado.distanciaKm || 0;
    const distanciaTexto =
      distanciaKm >= 500
        ? `aproximadamente ${distanciaKm} km (mudança interestadual)`
        : distanciaKm >= 100
        ? `aproximadamente ${distanciaKm} km`
        : `${distanciaKm} km`;

    const faixaTexto = `Para sua mudança de ${tiposImovelLabels[params.tipoImovel]} de ${params.origem} para ${params.destino} ` +
      `(${distanciaTexto}), o valor estimado fica entre R$ ${resultado.precoMin.toLocaleString('pt-BR')} e R$ ${resultado.precoMax.toLocaleString('pt-BR')}.`;

    return {
      precoMin: Math.round(resultado.precoMin),
      precoMax: Math.round(resultado.precoMax),
      faixaTexto,
      distanciaKm,
      mensagemIA: resultado.explicacao,
    };
  } catch (error) {
    console.error('❌ Erro ao calcular com IA:', error);
    return null;
  }
}

/**
 * Rota POST: /api/calcular-orcamento
 * 
 * Recebe os dados da mudança e retorna a faixa de preço estimada
 */
export async function POST(request: NextRequest) {
  try {
    const body: CalculoRequest = await request.json();

    // Validação básica dos dados
    if (!body.origem || !body.destino || !body.tipoImovel || !body.temElevador || typeof body.andar !== 'number' || !body.precisaEmbalagem) {
      return NextResponse.json(
        { error: 'Dados inválidos. Verifique todos os campos.' },
        { status: 400 }
      );
    }

    // Validação do email e whatsapp
    if (!body.email || body.email.trim() === '') {
      return NextResponse.json(
        { error: 'E-mail é obrigatório.' },
        { status: 400 }
      );
    }

    if (!body.whatsapp || body.whatsapp.trim() === '') {
      return NextResponse.json(
        { error: 'WhatsApp é obrigatório.' },
        { status: 400 }
      );
    }

    // CALCULAR COM IA (calcula distância + orçamento)
    let resultado = await calcularOrcamentoComIA(body);

    // Se a IA não estiver disponível, usar fallback básico
    if (!resultado) {
      console.log('⚠️ IA não disponível. Usando estimativa básica (fallback)');
      resultado = await calcularOrcamentoFallback(body);
    }

    // TODO: Salvar a solicitação no banco de dados (Supabase)
    // - Salvar dados do lead (email, whatsapp, origem, destino, etc.)
    // - Enviar notificação para empresas parceiras
    // - Enviar e-mail/WhatsApp para o usuário confirmando o recebimento
    
    /*
    Exemplo de salvamento no Supabase:
    
    const { data, error } = await supabase
      .from('orcamentos')
      .insert({
        email: body.email,
        whatsapp: body.whatsapp,
        origem: body.origem,
        destino: body.destino,
        tipo_imovel: body.tipoImovel,
        tem_elevador: body.temElevador === 'sim',
        andar: body.andar,
        precisa_embalagem: body.precisaEmbalagem === 'sim',
        data_estimada: body.dataEstimada,
        preco_min: resultado.precoMin,
        preco_max: resultado.precoMax,
        distancia_km: resultado.distanciaKm,
        status: 'pendente',
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Erro ao salvar orçamento:', error);
    }
    */

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao processar cálculo de orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar sua solicitação. Por favor, tente novamente.' },
      { status: 500 }
    );
  }
}

