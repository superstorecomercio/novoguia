import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    console.log('📥 [API] Recebendo requisição para criar hotsite:', {
      nome_exibicao: body.nome_exibicao,
      cidade_id: body.cidade_id,
    });

    // Validação básica
    if (!body.nome_exibicao || !body.cidade_id) {
      console.error('❌ [API] Campos obrigatórios faltando');
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome_exibicao, cidade_id' },
        { status: 400 }
      );
    }

    // Buscar dados da cidade na tabela cidades
    const { data: cidadeData, error: cidadeError } = await supabase
      .from('cidades')
      .select('nome, estado')
      .eq('id', body.cidade_id)
      .single();

    if (cidadeError || !cidadeData) {
      console.error('❌ [API] Cidade não encontrada:', cidadeError);
      return NextResponse.json(
        { error: 'Cidade inválida' },
        { status: 400 }
      );
    }

    // Preparar dados para inserção
    const hotsiteData = {
      nome_exibicao: body.nome_exibicao,
      descricao: body.descricao || null,
      endereco: body.endereco || null,
      cidade_id: body.cidade_id,
      cidade: cidadeData.nome, // Sincroniza com tabela cidades
      estado: cidadeData.estado, // Sincroniza com tabela cidades
      tipoempresa: body.tipoempresa || 'Empresa de Mudança',
      telefone1: body.telefone1 || null,
      telefone2: body.telefone2 || null,
      logo_url: body.logo_url || null,
      foto1_url: body.foto1_url || null,
      foto2_url: body.foto2_url || null,
      foto3_url: body.foto3_url || null,
      servicos: body.servicos || null,
      descontos: body.descontos || null,
      formas_pagamento: body.formas_pagamento || null,
      highlights: body.highlights || null,
    };

    console.log('💾 [API] Inserindo no banco...', hotsiteData);

    // Inserir no banco
    const { data, error } = await supabase
      .from('hotsites')
      .insert(hotsiteData)
      .select()
      .single();

    if (error) {
      console.error('❌ [API] Erro ao criar hotsite:', error);
      return NextResponse.json(
        { error: 'Erro ao criar hotsite: ' + error.message },
        { status: 500 }
      );
    }

    console.log('✅ [API] Hotsite criado com sucesso! ID:', data.id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('❌ [API] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
