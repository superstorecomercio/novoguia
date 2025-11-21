import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'empresas-imagens';
    const folder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Apenas arquivos de imagem são permitidos' },
        { status: 400 }
      );
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'A imagem deve ter no máximo 5MB' },
        { status: 400 }
      );
    }

    // Criar cliente Supabase com service role key (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder ? `${folder}/` : ''}${timestamp}-${randomString}.${fileExtension}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false, // Não sobrescrever arquivos existentes
      });

    if (error) {
      console.error('Erro ao fazer upload:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao fazer upload da imagem' },
        { status: 500 }
      );
    }

    // Obter URL pública da imagem
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Erro ao obter URL pública da imagem' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
    });
  } catch (error: any) {
    console.error('Erro inesperado no upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erro inesperado ao fazer upload' },
      { status: 500 }
    );
  }
}

