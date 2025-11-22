import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/planos
 * Lista todos os planos ordenados por 'ordem'
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: planos, error } = await supabase
      .from('planos')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Erro ao buscar planos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar planos', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ planos }, { status: 200 });
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/planos
 * Cria um novo plano
 * 
 * Body:
 * {
 *   nome: string (max 50 chars, required, unique),
 *   descricao?: string,
 *   ordem: number (required, unique),
 *   preco: number (required),
 *   periodicidade: 'mensal' | 'trimestral' | 'anual' (required)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação
    if (!body.nome || typeof body.nome !== 'string' || body.nome.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (body.nome.length > 50) {
      return NextResponse.json(
        { error: 'Nome deve ter no máximo 50 caracteres' },
        { status: 400 }
      );
    }

    if (typeof body.ordem !== 'number' || body.ordem < 0) {
      return NextResponse.json(
        { error: 'Ordem deve ser um número positivo' },
        { status: 400 }
      );
    }

    if (typeof body.preco !== 'number' || body.preco < 0) {
      return NextResponse.json(
        { error: 'Preço deve ser um número positivo' },
        { status: 400 }
      );
    }

    const periodicidadesValidas = ['mensal', 'trimestral', 'anual'];
    if (!body.periodicidade || !periodicidadesValidas.includes(body.periodicidade)) {
      return NextResponse.json(
        { error: 'Periodicidade deve ser: mensal, trimestral ou anual' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar se já existe plano com mesmo nome
    const { data: planoExistente } = await supabase
      .from('planos')
      .select('id')
      .eq('nome', body.nome.trim())
      .single();

    if (planoExistente) {
      return NextResponse.json(
        { error: 'Já existe um plano com este nome' },
        { status: 409 }
      );
    }

    // Verificar se já existe plano com mesma ordem
    const { data: ordemExistente } = await supabase
      .from('planos')
      .select('id')
      .eq('ordem', body.ordem)
      .single();

    if (ordemExistente) {
      return NextResponse.json(
        { error: 'Já existe um plano com esta ordem' },
        { status: 409 }
      );
    }

    // Criar plano
    const { data: novoPlano, error } = await supabase
      .from('planos')
      .insert({
        nome: body.nome.trim(),
        descricao: body.descricao?.trim() || null,
        ordem: body.ordem,
        preco: body.preco,
        periodicidade: body.periodicidade,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar plano:', error);
      return NextResponse.json(
        { error: 'Erro ao criar plano', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { plano: novoPlano, message: 'Plano criado com sucesso!' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

