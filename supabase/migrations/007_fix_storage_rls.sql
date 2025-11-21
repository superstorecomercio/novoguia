-- ============================================
-- Ajustar RLS do Storage para permitir upload durante migração
-- ============================================
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Remover políticas existentes se houverem
DROP POLICY IF EXISTS "Permitir upload de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de imagens durante migração" ON storage.objects;

-- Criar política que permite upload usando service role key
-- IMPORTANTE: Quando usar service role key, o RLS é bypassado automaticamente
-- Mas precisamos garantir que a política existe para quando usar anon key
CREATE POLICY "Permitir upload de imagens durante migração"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'empresas-imagens');

-- Se ainda não existir, criar as outras políticas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Permitir leitura pública de imagens'
  ) THEN
    CREATE POLICY "Permitir leitura pública de imagens"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'empresas-imagens');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Permitir atualização de imagens'
  ) THEN
    CREATE POLICY "Permitir atualização de imagens"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'empresas-imagens');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Permitir deleção de imagens'
  ) THEN
    CREATE POLICY "Permitir deleção de imagens"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'empresas-imagens');
  END IF;
END $$;

-- NOTA: Se ainda estiver dando erro de RLS mesmo com service role key,
-- pode ser necessário desabilitar RLS temporariamente no bucket:
-- UPDATE storage.buckets SET public = true WHERE id = 'empresas-imagens';

