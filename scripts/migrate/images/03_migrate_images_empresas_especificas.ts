/**
 * Script para migrar imagens de empresas específicas
 * 
 * Útil para migrar imagens de empresas novas ou atualizar empresas existentes
 * 
 * Uso:
 *   npx tsx scripts/migrate/images/03_migrate_images_empresas_especificas.ts
 * 
 * O script irá:
 * 1. Ler o CSV de hotsites
 * 2. Permitir filtrar por IDs legados específicos ou processar todas
 * 3. Migrar apenas empresas que ainda não têm imagens OU atualizar existentes
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../../../lib/storage/upload';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================
// CONFIGURAÇÃO
// ============================================

// IDs legados específicos para migrar (deixe vazio para processar todas)
// Exemplo: ['123', '456', '789']
const EMPRESAS_ESPECIFICAS: string[] = [];

// Se true, atualiza imagens mesmo se já existirem
// Se false, pula empresas que já têm imagens no Supabase
const FORCAR_ATUALIZACAO = false;

// URLs base do servidor antigo
const BASE_URL_LOGOS = 'https://www.guiademudancas.com.br/logotipo/grande/';
const BASE_URL_FOTO1 = 'https://www.guiademudancas.com.br/logotipo/foto1/';
const BASE_URL_FOTO2 = 'https://www.guiademudancas.com.br/logotipo/foto2/';
const BASE_URL_FOTO3 = 'https://www.guiademudancas.com.br/logotipo/foto3/';

const CSV_PATH = path.resolve(process.cwd(), 'data', 'hotsites_export.csv');

// ============================================

interface HotsiteCSV {
  empresa_id_legado: string;
  logo_url?: string;
  foto1_url?: string;
  foto2_url?: string;
  foto3_url?: string;
  nome_exibicao?: string;
}

/**
 * Lê o CSV de hotsites
 */
function readCSV(filePath: string): HotsiteCSV[] {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];

  const separator = lines[0].includes(';') ? ';' : ',';
  const firstLineParts = lines[0].split(separator);
  const isHeader = firstLineParts[0]?.toLowerCase().includes('id_legado') || 
                   firstLineParts[0]?.toLowerCase().includes('empresa_id');
  
  const startIndex = isHeader ? 1 : 0;
  const hotsites: HotsiteCSV[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    
    const empresaIdLegado = values[1] || '';
    const empresaIdNum = parseInt(empresaIdLegado, 10);
    if (!empresaIdLegado || isNaN(empresaIdNum)) {
      continue;
    }

    hotsites.push({
      empresa_id_legado: empresaIdLegado,
      logo_url: values[7] || undefined,
      foto1_url: values[8] || undefined,
      foto2_url: values[9] || undefined,
      foto3_url: values[10] || undefined,
      nome_exibicao: values[2] || undefined,
    });
  }

  return hotsites.filter(h => h.empresa_id_legado && h.empresa_id_legado !== 'NULL' && h.empresa_id_legado !== 'null');
}

/**
 * Faz download de uma imagem do servidor antigo
 */
async function downloadImage(imageName: string, imageType: 'logo' | 'foto1' | 'foto2' | 'foto3'): Promise<Blob | null> {
  if (!imageName || imageName.trim() === '' || imageName === 'NULL' || imageName === 'null') {
    return null;
  }

  const cleanName = imageName.trim().replace(/[^a-zA-Z0-9._-]/g, '');

  try {
    let baseUrl: string;
    switch (imageType) {
      case 'logo':
        baseUrl = BASE_URL_LOGOS;
        break;
      case 'foto1':
        baseUrl = BASE_URL_FOTO1;
        break;
      case 'foto2':
        baseUrl = BASE_URL_FOTO2;
        break;
      case 'foto3':
        baseUrl = BASE_URL_FOTO3;
        break;
    }

    const imageUrl = `${baseUrl}${cleanName}`;
    console.log(`📥 Baixando: ${imageUrl}`);

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.warn(`⚠️ Erro ao baixar ${imageUrl}: ${response.status} ${response.statusText}`);
      return null;
    }

    const blob = await response.blob();
    
    if (!blob.type.startsWith('image/')) {
      console.warn(`⚠️ Arquivo ${cleanName} não é uma imagem (tipo: ${blob.type})`);
      return null;
    }

    return blob;
  } catch (error: any) {
    console.error(`❌ Erro ao baixar ${imageName}:`, error.message);
    return null;
  }
}

/**
 * Busca empresa no Supabase pelo ID legado
 */
async function findEmpresaByLegadoId(
  supabase: any,
  empresaIdLegado: string
): Promise<{ id: string; slug: string } | null> {
  const empresaIdNum = parseInt(empresaIdLegado, 10);
  if (isNaN(empresaIdNum)) {
    return null;
  }

  const { data: mapping, error: mappingError } = await supabase
    .from('migration_empresas_map')
    .select('id_novo')
    .eq('id_legado', empresaIdNum)
    .single();

  if (mappingError || !mapping) {
    return null;
  }

  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('id, slug')
    .eq('id', mapping.id_novo)
    .single();

  if (empresaError || !empresa) {
    return null;
  }

  return empresa;
}

/**
 * Verifica se empresa já tem imagens no Supabase
 */
async function empresaTemImagens(
  supabase: any,
  empresaId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('hotsites')
    .select('logo_url, foto1_url')
    .eq('empresa_id', empresaId)
    .limit(1)
    .single();

  if (error || !data) {
    return false;
  }

  // Verificar se tem pelo menos uma imagem que seja URL do Supabase Storage
  const temImagem = data.logo_url || data.foto1_url;
  if (!temImagem) {
    return false;
  }

  // Se forçar atualização, sempre retornar false
  if (FORCAR_ATUALIZACAO) {
    return false;
  }

  // Verificar se a URL é do Supabase Storage (já migrada)
  return temImagem.includes('supabase.co/storage');
}

/**
 * Migra imagens de uma empresa
 */
async function migrateEmpresaImages(
  supabase: any,
  hotsite: HotsiteCSV
): Promise<void> {
  const empresa = await findEmpresaByLegadoId(supabase, hotsite.empresa_id_legado);
  
  if (!empresa) {
    console.warn(`⚠️ Empresa ${hotsite.empresa_id_legado} não encontrada, pulando...`);
    return;
  }

  // Verificar se já tem imagens (a menos que force atualização)
  if (!FORCAR_ATUALIZACAO) {
    const jaTemImagens = await empresaTemImagens(supabase, empresa.id);
    if (jaTemImagens) {
      console.log(`⏭️  Empresa ${empresa.slug} já tem imagens migradas, pulando...`);
      return;
    }
  }

  console.log(`\n🔄 Migrando imagens para empresa: ${empresa.slug} (${empresa.id})`);

  const updates: Record<string, string> = {};

  // Migrar logo
  if (hotsite.logo_url && hotsite.logo_url.trim() !== '' && hotsite.logo_url !== 'NULL' && hotsite.logo_url !== 'null') {
    const blob = await downloadImage(hotsite.logo_url, 'logo');
    if (blob) {
      const ext = hotsite.logo_url.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `logo.${ext}`;
      
      const url = await uploadImage(blob, fileName, empresa.id);
      if (url) {
        updates.logo_url = url;
        console.log(`  ✅ Logo migrado: ${hotsite.logo_url} → ${url}`);
      }
    } else {
      console.warn(`  ⚠️ Logo não encontrado: ${BASE_URL_LOGOS}${hotsite.logo_url}`);
    }
  }

  // Migrar fotos
  const fotos = [
    { field: 'foto1_url', name: hotsite.foto1_url, type: 'foto1' as const, defaultName: 'foto1.jpg' },
    { field: 'foto2_url', name: hotsite.foto2_url, type: 'foto2' as const, defaultName: 'foto2.jpg' },
    { field: 'foto3_url', name: hotsite.foto3_url, type: 'foto3' as const, defaultName: 'foto3.jpg' },
  ];

  for (const foto of fotos) {
    if (foto.name && foto.name.trim() !== '' && foto.name !== 'NULL' && foto.name !== 'null') {
      const blob = await downloadImage(foto.name, foto.type);
      if (blob) {
        const ext = foto.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = foto.defaultName.replace('.jpg', `.${ext}`);
        
        const url = await uploadImage(blob, fileName, empresa.id);
        if (url) {
          updates[foto.field] = url;
          console.log(`  ✅ ${foto.field} migrado: ${foto.name} → ${url}`);
        }
      } else {
        const baseUrl = foto.type === 'foto1' ? BASE_URL_FOTO1 : 
                       foto.type === 'foto2' ? BASE_URL_FOTO2 : BASE_URL_FOTO3;
        console.warn(`  ⚠️ ${foto.field} não encontrado: ${baseUrl}${foto.name}`);
      }
    }
  }

  // Atualizar hotsite no banco
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('hotsites')
      .update(updates)
      .eq('empresa_id', empresa.id);

    if (error) {
      console.error(`  ❌ Erro ao atualizar hotsite:`, error);
    } else {
      console.log(`  ✅ Hotsite atualizado no banco`);
    }
  } else {
    console.log(`  ⚠️ Nenhuma imagem encontrada para migrar`);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando migração de imagens (empresas específicas)...\n');
  console.log(`📁 CSV: ${CSV_PATH}`);
  
  if (EMPRESAS_ESPECIFICAS.length > 0) {
    console.log(`🎯 Empresas específicas: ${EMPRESAS_ESPECIFICAS.join(', ')}\n`);
  } else {
    console.log(`🌐 Processando todas as empresas do CSV\n`);
  }

  console.log(`⚙️  Forçar atualização: ${FORCAR_ATUALIZACAO ? 'SIM' : 'NÃO (pula empresas com imagens já migradas)'}\n`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Ler CSV
  console.log('📖 Lendo CSV...');
  const hotsites = readCSV(CSV_PATH);
  console.log(`✅ ${hotsites.length} hotsites encontrados\n`);

  // Filtrar por empresas específicas se configurado
  let hotsitesParaProcessar = hotsites;
  if (EMPRESAS_ESPECIFICAS.length > 0) {
    const empresasSet = new Set(EMPRESAS_ESPECIFICAS);
    hotsitesParaProcessar = hotsites.filter(h => empresasSet.has(h.empresa_id_legado));
    console.log(`🎯 ${hotsitesParaProcessar.length} hotsites das empresas especificadas\n`);
  }

  // Filtrar apenas os que têm imagens
  const hotsitesComImagens = hotsitesParaProcessar.filter(h => 
    h.logo_url || h.foto1_url || h.foto2_url || h.foto3_url
  );
  console.log(`📸 ${hotsitesComImagens.length} hotsites com imagens para migrar\n`);

  // Migrar cada empresa
  let sucesso = 0;
  let erro = 0;
  let puladas = 0;

  for (let i = 0; i < hotsitesComImagens.length; i++) {
    const hotsite = hotsitesComImagens[i];
    console.log(`\n[${i + 1}/${hotsitesComImagens.length}] Processando empresa ${hotsite.empresa_id_legado}...`);
    
    try {
      const empresa = await findEmpresaByLegadoId(supabase, hotsite.empresa_id_legado);
      if (empresa && !FORCAR_ATUALIZACAO) {
        const jaTemImagens = await empresaTemImagens(supabase, empresa.id);
        if (jaTemImagens) {
          puladas++;
          continue;
        }
      }
      
      await migrateEmpresaImages(supabase, hotsite);
      sucesso++;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`❌ Erro ao migrar empresa ${hotsite.empresa_id_legado}:`, error.message);
      erro++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Migração concluída!');
  console.log(`   Sucesso: ${sucesso}`);
  console.log(`   Puladas (já migradas): ${puladas}`);
  console.log(`   Erros: ${erro}`);
  console.log('='.repeat(50));
}

main().catch(console.error);

