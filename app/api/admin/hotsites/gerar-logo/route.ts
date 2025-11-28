import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Garantir que roda no Node.js (necessário para sharp)

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/admin/hotsites/gerar-logo
 * Gera um logo usando DALL-E baseado no nome da empresa e tipo de empresa
 * Faz upload automático para o Supabase Storage e retorna a URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome_exibicao, tipoempresa } = body;

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

    // Mapear tipo de empresa para elementos visuais sutis (opcionais)
    const tipoElemento: Record<string, string> = {
      'Empresa de Mudança': 'subtle geometric accent or minimal line',
      'Carretos': 'subtle speed line or minimal geometric accent',
      'Guarda-Móveis': 'subtle geometric accent or minimal line',
    };

    const elementoVisual = tipoElemento[tipoempresa] || 'subtle geometric accent';

    const prompt = `Create a single, ultra-modern, clean text-based company logo for "${nome_exibicao}".

CRITICAL: Generate ONLY ONE complete logo design, centered in the image. Do NOT create multiple logos, variations, or grid layouts.

Logo design requirements:
- TEXT-FOCUSED design - typography is the main element
- Company name "${nome_exibicao}" as the primary and dominant element
- Modern, clean, professional fonts (sans-serif, geometric, minimalist typography)
- Font styles: bold, elegant, contemporary (similar to Montserrat, Poppins, Inter, or similar clean sans-serif)
- Optional: very subtle ${elementoVisual} as a small accent (if included, must be minimal and not dominant)
- Typography should be the star - large, readable, well-spaced letters
- Vibrant but professional colors (blue, orange, green, or elegant combinations)
- Flat design style - NO shadows, NO 3D effects, NO gradients on text
- Clean white or very subtle gradient background
- Horizontal rectangular layout (wider than tall, approximately 4:3 ratio)
- Professional, trustworthy, contemporary appearance
- Suitable for website header use
- The logo should be primarily text-based with clean, modern typography
- The entire image must show ONE unified logo only`;

    console.log('🎨 Gerando logo com DALL-E:', { nome_exibicao, tipoempresa });

    // Gerar imagem com DALL-E em alta qualidade (1024x1024)
    // Depois redimensionaremos para 133x100 mantendo qualidade
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1024', // Gerar em alta qualidade primeiro
      quality: 'hd', // Alta qualidade
      n: 1, // Apenas uma imagem
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Não foi possível gerar o logo' },
        { status: 500 }
      );
    }

    console.log('✅ Logo gerado com sucesso, fazendo download...');

    // Fazer download da imagem
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Erro ao fazer download da imagem gerada' },
        { status: 500 }
      );
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());

    console.log('🔄 Redimensionando logo para 133x100px em alta qualidade...');

    // Redimensionar para 133x100px mantendo alta qualidade
    // Usar 'cover' para preencher todo o espaço, depois cortar se necessário
    const resizedBuffer = await sharp(imageBuffer)
      .resize(133, 100, {
        fit: 'cover', // Preencher todo o espaço, cortando se necessário
        position: 'center', // Centralizar ao cortar
      })
      .png({ 
        quality: 100,
        compressionLevel: 6, // Balance entre qualidade e tamanho
      })
      .toBuffer();

    console.log('✅ Logo redimensionado com sucesso!');

    // Criar cliente Supabase com service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `logos/${timestamp}-${randomString}.png`;

    console.log('📤 Fazendo upload do logo para Supabase Storage...');

    // Fazer upload para o Supabase Storage (usando o buffer redimensionado)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('empresas-imagens')
      .upload(fileName, resizedBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Erro ao fazer upload:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do logo: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Obter URL pública da imagem
    const { data: urlData } = supabase.storage
      .from('empresas-imagens')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Erro ao obter URL pública do logo' },
        { status: 500 }
      );
    }

    console.log('✅ Logo gerado e enviado com sucesso!', urlData.publicUrl);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Erro ao gerar logo:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar logo' },
      { status: 500 }
    );
  }
}

