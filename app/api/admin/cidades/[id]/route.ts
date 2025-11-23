import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/admin/cidades/[id] - Buscar cidade por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data: cidade, error } = await supabase
      .from('cidades')
      .select(`
        id,
        nome,
        slug,
        estado,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error || !cidade) {
      return NextResponse.json(
        { error: 'Cidade não encontrada' },
        { status: 404 }
      );
    }

    // Contar hotsites e orçamentos
    const { count: hotsitesCount } = await supabase
      .from('hotsites')
      .select('*', { count: 'exact', head: true })
      .eq('cidade_id', id);

    const { count: orcamentosCount } = await supabase
      .from('orcamentos')
      .select('*', { count: 'exact', head: true })
      .eq('cidade_id', id);

    return NextResponse.json({
      ...cidade,
      total_hotsites: hotsitesCount || 0,
      total_orcamentos: orcamentosCount || 0,
    });
  } catch (error: any) {
    console.error('❌ [API Cidades] Erro ao buscar cidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/cidades/[id] - Atualizar cidade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('📝 [API Cidades] Atualizando cidade:', id, body);

    // Validações
    if (!body.nome || !body.slug || !body.estado) {
      return NextResponse.json(
        { error: 'Nome, slug e estado são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do estado (2 letras maiúsculas)
    if (!/^[A-Z]{2}$/.test(body.estado)) {
      return NextResponse.json(
        { error: 'Estado deve conter exatamente 2 letras maiúsculas (ex: SP, RJ)' },
        { status: 400 }
      );
    }

    // Validar que não é "XX"
    if (body.estado === 'XX') {
      return NextResponse.json(
        { error: 'Estado "XX" não é válido. Use a sigla correta do estado.' },
        { status: 400 }
      );
    }

    // Verificar se slug já existe em outra cidade
    const { data: existente } = await supabase
      .from('cidades')
      .select('id')
      .eq('slug', body.slug)
      .neq('id', id)
      .single();

    if (existente) {
      return NextResponse.json(
        { error: `Slug "${body.slug}" já existe em outra cidade. Use outro slug.` },
        { status: 400 }
      );
    }

    // Atualizar no banco
    const { data, error } = await supabase
      .from('cidades')
      .update({
        nome: body.nome,
        slug: body.slug,
        estado: body.estado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [API Cidades] Erro ao atualizar cidade:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar cidade: ' + error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Cidade não encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ [API Cidades] Cidade atualizada com sucesso:', id);
    
    // Sincronizar hotsites automaticamente via trigger
    // (O trigger trg_sync_hotsite_city_fields vai atualizar os campos de texto)
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [API Cidades] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/cidades/[id] - Deletar cidade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🗑️ [API Cidades] Deletando cidade:', id);

    // Verificar se há hotsites ou orçamentos vinculados
    const { count: hotsitesCount } = await supabase
      .from('hotsites')
      .select('*', { count: 'exact', head: true })
      .eq('cidade_id', id);

    const { count: orcamentosCount } = await supabase
      .from('orcamentos')
      .select('*', { count: 'exact', head: true })
      .eq('cidade_id', id);

    if ((hotsitesCount || 0) > 0 || (orcamentosCount || 0) > 0) {
      return NextResponse.json(
        { 
          error: `Não é possível deletar esta cidade pois existem ${hotsitesCount || 0} hotsites e ${orcamentosCount || 0} orçamentos vinculados. Delete ou mova-os primeiro.` 
        },
        { status: 400 }
      );
    }

    // Deletar cidade
    const { error } = await supabase
      .from('cidades')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [API Cidades] Erro ao deletar cidade:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar cidade: ' + error.message },
        { status: 500 }
      );
    }

    console.log('✅ [API Cidades] Cidade deletada com sucesso:', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [API Cidades] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}



