import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('empresas')
      .update({
        nome: body.nome,
        slug: body.slug,
        cnpj: body.cnpj,
        responsavel: body.responsavel,
        email: body.email,
        telefones: body.telefones,
        website: body.website,
        endereco: body.endereco,
        complemento: body.complemento,
        ativo: body.ativo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar empresa:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Erro inesperado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

