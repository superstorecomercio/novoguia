-- ============================================
-- Criar bucket de Storage para imagens das empresas
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Criar bucket público para logos e fotos das empresas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'empresas-imagens',
  'empresas-imagens',
  true, -- Bucket público (qualquer um pode ver as imagens)
  5242880, -- Limite de 5MB por arquivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir leitura pública (qualquer um pode ver)
CREATE POLICY "Permitir leitura pública de imagens"
ON storage.objects FOR SELECT
USING (bucket_id = 'empresas-imagens');

-- Política para permitir upload (qualquer um durante migração)
-- IMPORTANTE: Usar service role key durante migração para bypass RLS
CREATE POLICY "Permitir upload de imagens durante migração"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'empresas-imagens');

-- Política para permitir atualização
CREATE POLICY "Permitir atualização de imagens"
ON storage.objects FOR UPDATE
USING (bucket_id = 'empresas-imagens');

-- Política para permitir deleção
CREATE POLICY "Permitir deleção de imagens"
ON storage.objects FOR DELETE
USING (bucket_id = 'empresas-imagens');

