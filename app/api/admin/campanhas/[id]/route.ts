import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('📥 [API Campanhas] Atualizando campanha:', id, body);

    const supabase = createAdminClient();

    // Preparar dados para atualização da campanha
    const updateData: any = {};

    if (body.data_fim !== undefined) {
      updateData.data_fim = body.data_fim || null;
    }

    if (body.valor !== undefined) {
      updateData.valor_mensal = body.valor;
    }

    if (body.ativo !== undefined) {
      updateData.ativo = body.ativo;
    }

    if (body.participa_cotacao !== undefined) {
      updateData.participa_cotacao = body.participa_cotacao;
    }

    if (body.limite_orcamentos_mes !== undefined) {
      updateData.limite_orcamentos_mes = body.limite_orcamentos_mes || null;
    }

    // Atualizar campanha no banco
    const { data, error } = await supabase
      .from('campanhas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [API Campanhas] Erro ao atualizar campanha:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Se tipoempresa foi enviado, atualizar o hotsite
    if (body.tipoempresa !== undefined && body.hotsite_id) {
      console.log('📝 [API Campanhas] Atualizando tipoempresa do hotsite:', body.hotsite_id);
      
      const { error: hotsiteError } = await supabase
        .from('hotsites')
        .update({ tipoempresa: body.tipoempresa })
        .eq('id', body.hotsite_id);

      if (hotsiteError) {
        console.error('❌ [API Campanhas] Erro ao atualizar hotsite:', hotsiteError);
        // Não retorna erro fatal, apenas loga
      } else {
        console.log('✅ [API Campanhas] Tipoempresa do hotsite atualizado!');
      }
    }

    console.log('✅ [API Campanhas] Campanha atualizada com sucesso!');

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('❌ [API Campanhas] Erro inesperado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('📥 [API Campanhas] Deletando campanha:', id);

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('campanhas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [API Campanhas] Erro ao deletar:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('✅ [API Campanhas] Campanha deletada com sucesso!');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [API Campanhas] Erro inesperado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

