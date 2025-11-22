import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/planos/[id]
 * Busca um plano específico por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    console.log('🔍 [API Planos] Buscando plano com ID:', id);

    const { data: plano, error } = await supabase
      .from('planos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [API Planos] Erro ao buscar plano:', error);
      return NextResponse.json(
        { error: 'Plano não encontrado', details: error.message, code: error.code },
        { status: 404 }
      );
    }

    if (!plano) {
      console.error('❌ [API Planos] Plano não encontrado para ID:', id);
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ [API Planos] Plano encontrado:', plano.nome);
    return NextResponse.json({ plano }, { status: 200 });
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/planos/[id]
 * Atualiza um plano existente
 * 
 * Body (todos opcionais):
 * {
 *   nome?: string,
 *   descricao?: string,
 *   ordem?: number,
 *   preco?: number,
 *   periodicidade?: 'mensal' | 'trimestral' | 'anual'
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();

    // Verificar se plano existe
    const { data: planoExistente, error: errorBusca } = await supabase
      .from('planos')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusca || !planoExistente) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Validações
    if (body.nome !== undefined) {
      if (typeof body.nome !== 'string' || body.nome.trim().length === 0) {
        return NextResponse.json(
          { error: 'Nome não pode ser vazio' },
          { status: 400 }
        );
      }

      if (body.nome.length > 50) {
        return NextResponse.json(
          { error: 'Nome deve ter no máximo 50 caracteres' },
          { status: 400 }
        );
      }

      // Verificar se já existe outro plano com mesmo nome
      const { data: nomeExistente } = await supabase
        .from('planos')
        .select('id')
        .eq('nome', body.nome.trim())
        .neq('id', id)
        .single();

      if (nomeExistente) {
        return NextResponse.json(
          { error: 'Já existe outro plano com este nome' },
          { status: 409 }
        );
      }
    }

    if (body.ordem !== undefined) {
      if (typeof body.ordem !== 'number' || body.ordem < 0) {
        return NextResponse.json(
          { error: 'Ordem deve ser um número positivo' },
          { status: 400 }
        );
      }

      // Verificar se já existe outro plano com mesma ordem
      const { data: ordemExistente } = await supabase
        .from('planos')
        .select('id')
        .eq('ordem', body.ordem)
        .neq('id', id)
        .single();

      if (ordemExistente) {
        return NextResponse.json(
          { error: 'Já existe outro plano com esta ordem' },
          { status: 409 }
        );
      }
    }

    if (body.preco !== undefined && (typeof body.preco !== 'number' || body.preco < 0)) {
      return NextResponse.json(
        { error: 'Preço deve ser um número positivo' },
        { status: 400 }
      );
    }

    if (body.periodicidade !== undefined) {
      const periodicidadesValidas = ['mensal', 'trimestral', 'anual'];
      if (!periodicidadesValidas.includes(body.periodicidade)) {
        return NextResponse.json(
          { error: 'Periodicidade deve ser: mensal, trimestral ou anual' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (body.nome !== undefined) {
      updateData.nome = body.nome.trim();
    }

    if (body.descricao !== undefined) {
      updateData.descricao = body.descricao?.trim() || null;
    }

    if (body.ordem !== undefined) {
      updateData.ordem = body.ordem;
    }

    if (body.preco !== undefined) {
      updateData.preco = body.preco;
    }

    if (body.periodicidade !== undefined) {
      updateData.periodicidade = body.periodicidade;
    }

    // Atualizar plano
    const { data: planoAtualizado, error } = await supabase
      .from('planos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar plano:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar plano', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { plano: planoAtualizado, message: 'Plano atualizado com sucesso!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/planos/[id]
 * Remove um plano
 * 
 * ATENÇÃO: Verifica se há campanhas usando este plano antes de deletar
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Verificar se plano existe
    const { data: planoExistente, error: errorBusca } = await supabase
      .from('planos')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusca || !planoExistente) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se há campanhas usando este plano
    const { data: campanhasVinculadas, error: errorCampanhas } = await supabase
      .from('campanhas')
      .select('id')
      .eq('plano_id', id)
      .limit(1);

    if (errorCampanhas) {
      console.error('Erro ao verificar campanhas:', errorCampanhas);
      return NextResponse.json(
        { error: 'Erro ao verificar campanhas vinculadas' },
        { status: 500 }
      );
    }

    if (campanhasVinculadas && campanhasVinculadas.length > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível deletar este plano',
          details: 'Existem campanhas vinculadas a este plano. Remova-as primeiro ou altere o plano delas.'
        },
        { status: 409 }
      );
    }

    // Deletar plano
    const { error } = await supabase
      .from('planos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar plano:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar plano', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Plano deletado com sucesso!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

