import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * POST /api/admin/hotsites/gerar-descricao
 * Gera uma descrição sugerida para o hotsite usando IA baseada no nome de exibição
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome_exibicao } = body;

    if (!nome_exibicao || nome_exibicao.trim() === '') {
      return NextResponse.json(
        { error: 'Nome de exibição é obrigatório' },
        { status: 400 }
      );
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API Key não configurada' },
        { status: 500 }
      );
    }

    const prompt = `Você é um especialista em marketing digital para empresas de mudanças, carretos e guarda-móveis no Brasil.

Crie uma descrição profissional e atrativa para uma empresa com o nome: "${nome_exibicao}"

A descrição deve:
- Ser em português brasileiro
- Ter entre 100 e 200 palavras
- Ser profissional, mas acessível
- Destacar os principais serviços oferecidos (mudanças, carretos, guarda-móveis, etc.)
- Mencionar confiança, experiência e qualidade
- Ser otimizada para SEO
- Não incluir informações específicas que não possam ser inferidas do nome (como endereço, telefone, etc.)

Retorne APENAS a descrição, sem aspas, sem formatação adicional, apenas o texto puro.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um redator profissional especializado em criar descrições para empresas de mudanças e transportes no Brasil. Seja conciso, profissional e atrativo.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const descricao = completion.choices[0]?.message?.content?.trim();

    if (!descricao) {
      return NextResponse.json(
        { error: 'Não foi possível gerar a descrição' },
        { status: 500 }
      );
    }

    return NextResponse.json({ descricao }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Erro ao gerar descrição:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar descrição' },
      { status: 500 }
    );
  }
}

