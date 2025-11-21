# 📸 Armazenamento de Imagens - Guia Completo

## Visão Geral

As imagens das empresas (logotipos e fotos) são armazenadas no **Supabase Storage**, um serviço de armazenamento de arquivos integrado ao Supabase.

## 🗂️ Estrutura de Armazenamento

### Bucket: `empresas-imagens`

**Estrutura de pastas:**
```
empresas-imagens/
├── empresas/
│   ├── {empresa-id}/
│   │   ├── logo.png
│   │   ├── foto1.jpg
│   │   ├── foto2.jpg
│   │   └── foto3.jpg
│   └── ...
└── temp/  (uploads temporários)
```

## 🚀 Como Usar

### 1. Configurar o Bucket (Uma vez)

Execute o script SQL no Supabase:
```sql
-- Ver arquivo: supabase/migrations/006_create_storage_bucket.sql
```

### 2. Fazer Upload de Imagem

```typescript
import { uploadImage } from '@/lib/storage/upload';

// Upload de logo
const logoUrl = await uploadImage(
  file, // File ou Blob
  'logo.png',
  empresaId // ID da empresa
);

// Upload de foto
const fotoUrl = await uploadImage(
  file,
  'foto1.jpg',
  empresaId
);
```

### 3. Obter URL da Imagem

```typescript
import { getImageUrl } from '@/lib/storage/getImageUrl';

// Converter path para URL pública
const url = getImageUrl('empresas/123/logo.png');
// Retorna: https://seu-projeto.supabase.co/storage/v1/object/public/empresas-imagens/empresas/123/logo.png
```

### 4. Exibir Imagem no Componente

O `CompanyCard` já está configurado para usar automaticamente:

```tsx
// Já funciona automaticamente!
<CompanyCard company={empresa} />
```

## 📋 Migração de Imagens Existentes

Se você já tem URLs de imagens no SQL Server, há duas opções:

### Opção 1: Manter URLs Externas
- Se as imagens já estão hospedadas em outro lugar (ex: servidor próprio)
- Basta manter as URLs como estão no campo `logo_url` e `foto1_url`
- O sistema detecta URLs completas e usa diretamente

### Opção 2: Migrar para Supabase Storage
1. Criar script para fazer download das imagens do servidor antigo
2. Fazer upload para Supabase Storage
3. Atualizar URLs no banco de dados

**Script de migração exemplo:**
```typescript
// scripts/migrate/images/01_migrate_images.ts
import { uploadImage } from '@/lib/storage/upload';
import { createClient } from '@supabase/supabase-js';

// 1. Buscar todas empresas com logo_url
// 2. Fazer download da imagem
// 3. Upload para Supabase
// 4. Atualizar logo_url no banco
```

## 🔒 Segurança

### Políticas de Acesso

- **Leitura**: Pública (qualquer um pode ver as imagens)
- **Upload**: Requer autenticação (via service role key)
- **Deleção**: Requer autenticação

### Limites

- **Tamanho máximo**: 5MB por arquivo
- **Tipos permitidos**: JPEG, PNG, WebP, GIF
- **Bucket**: `empresas-imagens`

## 📝 Variáveis de Ambiente

Certifique-se de ter no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role  # Para uploads administrativos
```

## 🛠️ Utilitários Disponíveis

### `lib/storage/upload.ts`
- `uploadImage()` - Upload de uma imagem
- `uploadMultipleImages()` - Upload de múltiplas imagens
- `deleteImage()` - Deletar imagem
- `getImageUrl()` - Obter URL pública

### `lib/storage/getImageUrl.ts`
- `getImageUrl()` - Converte path para URL pública
- `getOptimizedImageUrl()` - URL otimizada (futuro)

## 💡 Dicas

1. **Nomes de arquivo**: Use nomes descritivos e únicos
   - ✅ `logo-empresa-123.png`
   - ❌ `logo.png`

2. **Organização**: Organize por empresa ID
   - ✅ `empresas/{empresa-id}/logo.png`
   - ❌ `logos/logo.png`

3. **Otimização**: Comprima imagens antes do upload
   - Use ferramentas como TinyPNG ou ImageOptim
   - Formatos WebP são mais eficientes

4. **Cache**: URLs do Supabase têm cache automático
   - Configure cache no navegador também
   - Use `cacheControl` no upload

## 🔄 Próximos Passos

1. ✅ Bucket criado
2. ✅ Utilitários de upload criados
3. ✅ Componente atualizado
4. ⏳ Criar interface de upload no admin (futuro)
5. ⏳ Script de migração de imagens antigas (se necessário)

