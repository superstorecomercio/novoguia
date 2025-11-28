import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/admin/cidades - Listar todas as cidades
export async function GET() {
  try {
    const { data: cidades, error } = await supabase
      .from('cidades')
      .select(`
        id,
        nome,
        slug,
        estado,
        created_at,
        updated_at
      `)
      .order('nome', { ascending: true });

    if (error) {
      console.error('❌ [API Cidades] Erro ao buscar cidades:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar cidades: ' + error.message },
        { status: 500 }
      );
    }

    // Contar hotsites e orçamentos para cada cidade
    const cidadesComContadores = await Promise.all(
      (cidades || []).map(async (cidade) => {
        const { count: hotsitesCount } = await supabase
          .from('hotsites')
          .select('*', { count: 'exact', head: true })
          .eq('cidade_id', cidade.id);

        const { count: orcamentosCount } = await supabase
          .from('orcamentos')
          .select('*', { count: 'exact', head: true })
          .eq('cidade_id', cidade.id);

        return {
          ...cidade,
          total_hotsites: hotsitesCount || 0,
          total_orcamentos: orcamentosCount || 0,
        };
      })
    );

    return NextResponse.json(cidadesComContadores);
  } catch (error: any) {
    console.error('❌ [API Cidades] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin/cidades - Criar nova cidade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📝 [API Cidades] Criando nova cidade:', body);

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

    // Verificar se slug já existe
    const { data: existente } = await supabase
      .from('cidades')
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (existente) {
      return NextResponse.json(
        { error: `Slug "${body.slug}" já existe. Use outro slug.` },
        { status: 400 }
      );
    }

    // Inserir no banco
    const { data, error } = await supabase
      .from('cidades')
      .insert({
        nome: body.nome,
        slug: body.slug,
        estado: body.estado,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [API Cidades] Erro ao criar cidade:', error);
      return NextResponse.json(
        { error: 'Erro ao criar cidade: ' + error.message },
        { status: 500 }
      );
    }

    console.log('✅ [API Cidades] Cidade criada com sucesso:', data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('❌ [API Cidades] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}











