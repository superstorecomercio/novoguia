import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET_NAME = 'empresas-imagens';

/**
 * Obtém a URL pública de uma imagem do Supabase Storage
 * Se a URL já for completa (http/https), retorna como está
 * Se for um path relativo, converte para URL pública do Supabase
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;

  // Se já é uma URL completa, retornar como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Se não tem cliente configurado, retornar null
  if (!supabase) {
    console.warn('Supabase não configurado, retornando path original');
    return imagePath;
  }

  // Se é um path do Supabase Storage, gerar URL pública
  if (imagePath.startsWith(BUCKET_NAME) || !imagePath.includes('/')) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(imagePath);
    
    return data.publicUrl;
  }

  // Tentar como path relativo
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(imagePath);
  
  return data.publicUrl;
}

/**
 * Obtém URL otimizada para exibição (com transformações se necessário)
 */
export function getOptimizedImageUrl(
  imagePath: string | null | undefined,
  width?: number,
  height?: number
): string | null {
  const baseUrl = getImageUrl(imagePath);
  if (!baseUrl) return null;

  // Supabase Storage não tem transformações built-in
  // Mas você pode usar um serviço como Cloudinary ou ImageKit
  // Por enquanto, retornar URL base
  return baseUrl;
}

