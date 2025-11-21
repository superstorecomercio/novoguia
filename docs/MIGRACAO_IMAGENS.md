# 📸 Guia de Migração de Imagens

## Visão Geral

As imagens (logotipos e fotos) das empresas estão armazenadas em uma **pasta física no servidor antigo**, e no banco de dados SQL Server apenas o **nome do arquivo** é salvo (ex: `logo123.png`).

Este guia explica como migrar essas imagens para o **Supabase Storage**.

## 📋 Pré-requisitos

1. ✅ Bucket criado no Supabase (`supabase/migrations/006_create_storage_bucket.sql`)
2. ✅ CSV exportado (`hotsites_export.csv`)
3. ✅ Acesso à pasta de imagens do servidor antigo
4. ✅ Variáveis de ambiente configuradas

## 🔧 Configuração

### 1. URLs do Servidor Antigo

As imagens estão hospedadas no servidor antigo (`guiademudancas.com.br`) com as seguintes estruturas:

- **Logos**: `https://www.guiademudancas.com.br/logotipo/grande/{nome_arquivo}`
- **Foto 1**: `https://www.guiademudancas.com.br/logotipo/foto1/{nome_arquivo}`
- **Foto 2**: `https://www.guiademudancas.com.br/logotipo/foto2/{nome_arquivo}`
- **Foto 3**: `https://www.guiademudancas.com.br/logotipo/foto3/{nome_arquivo}`

**Nota**: No CSV, os campos `logo_url`, `foto1_url`, etc. contêm apenas o **nome do arquivo** (ex: `logo123.png`). O script constrói automaticamente a URL completa.

### 2. Configuração Automática

As URLs estão configuradas diretamente no script. Não é necessário configurar variáveis de ambiente para isso.

### 3. Verificar estrutura do CSV

O CSV deve ter as colunas:
- `empresa_id_legado`
- `logo_url` (nome do arquivo, ex: `logo123.png`)
- `foto1_url` (nome do arquivo)
- `foto2_url` (nome do arquivo)
- `foto3_url` (nome do arquivo)

## 🚀 Executar Migração

### Opção 1: Script Automático (Recomendado)

```bash
npx tsx scripts/migrate/images/02_migrate_images_from_server.ts
```

O script irá:
1. ✅ Ler o CSV `data/hotsites_export.csv`
2. ✅ Para cada empresa, baixar as imagens da pasta antiga
3. ✅ Fazer upload para Supabase Storage
4. ✅ Atualizar o banco de dados com as novas URLs

### Opção 2: Migração Manual

Se preferir fazer manualmente:

```typescript
import { uploadImage } from '@/lib/storage/upload';

// 1. Fazer download da imagem antiga
const response = await fetch('http://servidor-antigo.com/imagens/logo123.png');
const blob = await response.blob();

// 2. Upload para Supabase
const url = await uploadImage(blob, 'logo.png', empresaId);

// 3. Atualizar no banco
// UPDATE hotsites SET logo_url = url WHERE empresa_id = empresaId;
```

## 📁 Estrutura de Armazenamento

### Antes (SQL Server)
```
Servidor: C:/imagens/
Banco: logo123.png (apenas nome)
```

### Depois (Supabase Storage)
```
Bucket: empresas-imagens/
Estrutura: empresas/{empresa-id}/logo.png
Banco: https://projeto.supabase.co/storage/v1/object/public/empresas-imagens/empresas/{id}/logo.png
```

## 🔍 Verificação

Após a migração, verifique:

1. **No Supabase Storage**:
   - Acesse Storage → `empresas-imagens`
   - Veja se as pastas `empresas/{id}/` foram criadas
   - Confirme que as imagens estão lá

2. **No Banco de Dados**:
   ```sql
   SELECT empresa_id, logo_url, foto1_url 
   FROM hotsites 
   WHERE logo_url IS NOT NULL 
   LIMIT 10;
   ```
   - URLs devem começar com `https://seu-projeto.supabase.co/storage/...`

3. **No Site**:
   - Acesse uma página de empresa
   - Verifique se os logotipos aparecem corretamente

## ⚠️ Troubleshooting

### Erro: "Arquivo não encontrado"
- Verifique se `BASE_URL_IMAGENS_ANTIGAS` está correto
- Teste acessar uma imagem manualmente: `{BASE_URL}/logo123.png`

### Erro: "Empresa não encontrada"
- Verifique se o `migration_empresas_map` está completo
- Execute: `SELECT * FROM migration_empresas_map WHERE empresa_id_legado = 'X'`

### Erro: "Bucket não existe"
- Execute a migration: `supabase/migrations/006_create_storage_bucket.sql`
- Verifique no Supabase: Storage → Buckets

### Imagens não aparecem no site
- Verifique se as URLs no banco estão corretas
- Teste acessar a URL diretamente no navegador
- Verifique o console do navegador para erros

## 📊 Estatísticas

Após executar o script, você verá:
- ✅ Quantas empresas foram migradas com sucesso
- ❌ Quantas tiveram erro
- 📸 Total de imagens migradas

## 🔄 Re-executar Migração

Se precisar re-executar:
- O script usa `upsert: true`, então substitui imagens existentes
- Pode executar quantas vezes quiser sem duplicar

## 💡 Dicas

1. **Teste com uma empresa primeiro**: Comente o loop e teste com `hotsitesComImagens[0]`
2. **Backup**: Faça backup do banco antes de atualizar URLs
3. **Logs**: O script mostra logs detalhados de cada etapa
4. **Performance**: O script tem delay de 500ms entre empresas para não sobrecarregar

## 📝 Exemplo de Saída

```
🚀 Iniciando migração de imagens...

📁 CSV: C:/projeto/data/hotsites_export.csv
🌐 Base URL imagens: http://servidor-antigo.com/imagens/

📖 Lendo CSV...
✅ 150 hotsites encontrados

📸 120 hotsites com imagens para migrar

[1/120] Processando empresa 123...
🔄 Migrando imagens para empresa: empresa-exemplo (uuid-123)
📥 Baixando: http://servidor-antigo.com/imagens/logo123.png
  ✅ Logo migrado: https://projeto.supabase.co/storage/.../logo.png
  ✅ Hotsite atualizado no banco

...

==================================================
✅ Migração concluída!
   Sucesso: 115
   Erros: 5
==================================================
```

