import { createClient } from '@supabase/supabase-js';

/**
 * Obtém cliente Supabase admin (carrega variáveis dinamicamente)
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

const BUCKET_NAME = 'empresas-imagens';

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param file Arquivo de imagem (File ou Blob)
 * @param path Caminho onde salvar (ex: 'logos/empresa-123.png')
 * @param empresaId ID da empresa (para organização)
 * @returns URL pública da imagem ou null em caso de erro
 */
export async function uploadImage(
  file: File | Blob,
  path: string,
  empresaId?: string
): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error('❌ Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  try {
    // Organizar por tipo de arquivo e empresa
    const folder = empresaId ? `empresas/${empresaId}` : 'temp';
    const fullPath = `${folder}/${path}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: true, // Substituir se já existir
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      console.error('Erro ao fazer upload:', error);
      return null;
    }

    // Retornar URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fullPath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    return null;
  }
}

/**
 * Faz upload de múltiplas imagens
 */
export async function uploadMultipleImages(
  files: Array<{ file: File | Blob; path: string }>,
  empresaId?: string
): Promise<string[]> {
  const uploads = files.map(({ file, path }) => uploadImage(file, path, empresaId));
  const results = await Promise.all(uploads);
  return results.filter((url): url is string => url !== null);
}

/**
 * Deleta uma imagem do storage
 */
export async function deleteImage(path: string): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error('❌ Supabase não configurado');
    return false;
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Erro ao deletar imagem:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    return false;
  }
}

/**
 * Gera URL pública de uma imagem já existente
 */
export function getImageUrl(path: string): string {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }
  
  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Converte URL do SQL Server para path do Supabase Storage
 * Útil durante a migração
 */
export function convertLegacyImageUrl(legacyUrl: string | null | undefined): string | null {
  if (!legacyUrl) return null;
  
  // Se já é uma URL completa, retornar como está
  if (legacyUrl.startsWith('http://') || legacyUrl.startsWith('https://')) {
    return legacyUrl;
  }
  
  // Se é um caminho relativo do SQL Server, pode precisar de conversão
  // Por enquanto, retornar null para forçar novo upload
  return null;
}

