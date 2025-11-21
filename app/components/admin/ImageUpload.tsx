'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageUploadProps {
  label: string;
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  bucket?: string;
  folder?: string;
}

export default function ImageUpload({
  label,
  currentUrl,
  onUploadComplete,
  bucket = 'empresas-imagens',
  folder = 'uploads',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualizar preview quando currentUrl mudar
  useEffect(() => {
    setPreview(currentUrl || null);
  }, [currentUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (folder) {
        formData.append('folder', folder);
      }

      // Fazer upload
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }

      const { url } = await response.json();
      setPreview(url);
      onUploadComplete(url);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err.message || 'Erro ao fazer upload da imagem');
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="flex items-start gap-4">
        {/* Preview da imagem */}
        <div className="flex-shrink-0">
          {preview ? (
            <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={preview}
                alt={label}
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-sm">Enviando...</div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-400">
                <svg
                  className="mx-auto h-12 w-12"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h12m-4 4v12m0 0v-8m0 4H12"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-1 text-xs">Sem imagem</p>
              </div>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="flex-1">
          <div className="flex gap-2 mb-2">
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-4 py-2 bg-[#0073e6] text-white rounded-lg hover:bg-[#005bb5] transition-colors text-sm">
                {preview ? 'Trocar Imagem' : 'Selecionar Imagem'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
            
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
              >
                Remover
              </button>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 mb-2">{error}</div>
          )}

          {preview && (
            <div className="text-xs text-gray-500 break-all">
              {preview.length > 60 ? `${preview.substring(0, 60)}...` : preview}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-1">
            Formatos aceitos: JPG, PNG, WebP, GIF (máx. 5MB)
          </p>
        </div>
      </div>
    </div>
  );
}

