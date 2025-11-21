/**
 * EXEMPLO: Como fazer upload de imagens para Supabase Storage
 * 
 * Este é um exemplo de como usar a função de upload.
 * Adapte conforme sua necessidade.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { uploadImage } from '../../../lib/storage/upload';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Exemplo 1: Upload de uma imagem
 */
async function exemploUploadSimples() {
  // Simular um arquivo (em produção, viria de um input file)
  const file = new File(['conteudo'], 'logo.png', { type: 'image/png' });
  
  const empresaId = '123e4567-e89b-12d3-a456-426614174000';
  
  const url = await uploadImage(file, 'logo.png', empresaId);
  
  if (url) {
    console.log('✅ Upload realizado com sucesso!');
    console.log('URL:', url);
    
    // Agora você pode salvar essa URL no banco:
    // UPDATE hotsites SET logo_url = url WHERE empresa_id = empresaId;
  } else {
    console.error('❌ Erro ao fazer upload');
  }
}

/**
 * Exemplo 2: Upload de múltiplas imagens
 */
async function exemploUploadMultiplo() {
  const empresaId = '123e4567-e89b-12d3-a456-426614174000';
  
  const files = [
    { file: new File([''], 'logo.png', { type: 'image/png' }), path: 'logo.png' },
    { file: new File([''], 'foto1.jpg', { type: 'image/jpeg' }), path: 'foto1.jpg' },
    { file: new File([''], 'foto2.jpg', { type: 'image/jpeg' }), path: 'foto2.jpg' },
  ];
  
  const urls = await uploadMultipleImages(files, empresaId);
  
  console.log('URLs geradas:', urls);
  
  // Salvar no banco:
  // UPDATE hotsites SET 
  //   logo_url = urls[0],
  //   foto1_url = urls[1],
  //   foto2_url = urls[2]
  // WHERE empresa_id = empresaId;
}

/**
 * Exemplo 3: Migração de imagens do SQL Server
 * 
 * Se você tem imagens hospedadas no servidor antigo,
 * pode fazer download e upload para Supabase
 */
async function exemploMigracao() {
  const empresaId = '123e4567-e89b-12d3-a456-426614174000';
  const urlAntiga = 'http://servidor-antigo.com/logos/empresa123.png';
  
  try {
    // 1. Fazer download da imagem
    const response = await fetch(urlAntiga);
    const blob = await response.blob();
    
    // 2. Upload para Supabase
    const novaUrl = await uploadImage(blob, 'logo.png', empresaId);
    
    if (novaUrl) {
      console.log('✅ Migração realizada!');
      console.log('URL antiga:', urlAntiga);
      console.log('URL nova:', novaUrl);
      
      // 3. Atualizar no banco
      // UPDATE hotsites SET logo_url = novaUrl WHERE empresa_id = empresaId;
    }
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
}

// Descomente para testar:
// exemploUploadSimples();
// exemploUploadMultiplo();
// exemploMigracao();

