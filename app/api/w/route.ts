import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para encurtar URLs do WhatsApp
 * GET /api/w?t=TELEFONE&d=DADOS_ENCODED
 * 
 * Redireciona para WhatsApp com mensagem pré-formatada
 * Usa dados codificados em base64 para reduzir tamanho da URL
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telefone = searchParams.get('t');
    const dadosEncoded = searchParams.get('d');

    if (!telefone) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      );
    }

    // Limpar telefone (remover caracteres não numéricos)
    const telefoneLimpo = telefone.replace(/\D/g, '');

    // Se não tem dados codificados, apenas redireciona para WhatsApp sem mensagem
    if (!dadosEncoded) {
      const urlWhatsApp = `https://wa.me/${telefoneLimpo}`;
      return NextResponse.redirect(urlWhatsApp);
    }

    // Decodificar dados (base64)
    try {
      const dadosJson = Buffer.from(dadosEncoded, 'base64').toString('utf-8');
      const dados = JSON.parse(dadosJson);

      // Criar mensagem simplificada
      const mensagem = criarMensagemSimplificada(dados);
      
      // Criar URL do WhatsApp
      const urlWhatsApp = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;
      
      return NextResponse.redirect(urlWhatsApp);
    } catch (err) {
      // Se falhar ao decodificar, redireciona sem mensagem
      console.error('Erro ao decodificar dados:', err);
      const urlWhatsApp = `https://wa.me/${telefoneLimpo}`;
      return NextResponse.redirect(urlWhatsApp);
    }
  } catch (error) {
    console.error('Erro na rota /api/w:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

/**
 * Cria mensagem simplificada para WhatsApp
 */
function criarMensagemSimplificada(dados: any): string {
  const tipoImovelLabels: Record<string, string> = {
    kitnet: 'Kitnet',
    '1_quarto': 'Apto 1q',
    '2_quartos': 'Apto 2q',
    '3_mais': 'Apto 3q+',
    comercial: 'Comercial'
  };
  
  const tipoImovel = tipoImovelLabels[dados.tipo] || dados.tipo || 'Não informado';
  
  // Mensagem ultra-simplificada para reduzir tamanho da URL
  let msg = `Olá! Recebi um orçamento de mudança.\n\n`;
  msg += `*Dados:*\n`;
  msg += `👤 ${dados.nome || ''}\n`;
  msg += `📍 ${dados.origem || ''} → ${dados.destino || ''}\n`;
  msg += `🏠 ${tipoImovel}\n`;
  msg += `📏 ${dados.distancia || 0}km\n`;
  msg += `💰 R$ ${dados.precoMin || 0} - R$ ${dados.precoMax || 0}\n`;
  msg += `\nGostaria de uma cotação.`;
  
  return msg;
}

