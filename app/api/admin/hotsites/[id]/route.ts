import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('📥 [API Hotsites] Atualizando hotsite:', id);

    const supabase = createAdminClient();

    // Se cidade_id foi fornecido, buscar dados da cidade para sincronizar
    let cidadeData = null;
    if (body.cidade_id) {
      const { data, error: cidadeError } = await supabase
        .from('cidades')
        .select('nome, estado')
        .eq('id', body.cidade_id)
        .single();

      if (!cidadeError && data) {
        cidadeData = data;
      }
    }

    const updateData = {
      empresa_id: body.empresa_id || null,
      nome_exibicao: body.nome_exibicao,
      descricao: body.descricao,
      endereco: body.endereco,
      // Se cidade_id foi fornecido, usar dados da tabela cidades
      ...(body.cidade_id && cidadeData ? {
        cidade_id: body.cidade_id,
        cidade: cidadeData.nome,
        estado: cidadeData.estado,
      } : {
        // Caso contrário, manter os campos texto se fornecidos
        ...(body.cidade && { cidade: body.cidade }),
        ...(body.estado && { estado: body.estado }),
      }),
      tipoempresa: body.tipoempresa || 'Empresa de Mudança',
      telefone1: body.telefone1 || null,
      telefone2: body.telefone2 || null,
      verificado: body.verificado !== undefined ? body.verificado : false,
      logo_url: body.logo_url || null,
      foto1_url: body.foto1_url || null,
      foto2_url: body.foto2_url || null,
      foto3_url: body.foto3_url || null,
      servicos: body.servicos || null,
      descontos: body.descontos || null,
      formas_pagamento: body.formas_pagamento || null,
      highlights: body.highlights || null,
      updated_at: new Date().toISOString(),
    };

    console.log('💾 [API Hotsites] Dados para atualização:', updateData);

    const { data, error } = await supabase
      .from('hotsites')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [API Hotsites] Erro ao atualizar:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 400 });
    }

    console.log('✅ [API Hotsites] Hotsite atualizado com sucesso!');

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('❌ [API Hotsites] Erro inesperado:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

