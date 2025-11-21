/**
 * Script para migrar imagens do servidor antigo para Supabase Storage
 * 
 * Este script:
 * 1. Lê o CSV de hotsites exportado
 * 2. Para cada empresa com logo/foto, faz download da pasta antiga
 * 3. Faz upload para Supabase Storage
 * 4. Atualiza o banco de dados com as novas URLs
 * 
 * CONFIGURAÇÃO NECESSÁRIA:
 * - Configure BASE_URL_IMAGENS_ANTIGAS com o caminho base das imagens
 * - Exemplo: "http://servidor-antigo.com/imagens/" ou "C:/pasta/imagens/"
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { uploadImage } from '../../../lib/storage/upload';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================
// CONFIGURAÇÃO - URLs do servidor antigo
// ============================================

// URLs base do servidor antigo (guiademudancas.com.br)
const BASE_URL_LOGOS = 'https://www.guiademudancas.com.br/logotipo/grande/';
const BASE_URL_FOTO1 = 'https://www.guiademudancas.com.br/logotipo/foto1/';
const BASE_URL_FOTO2 = 'https://www.guiademudancas.com.br/logotipo/foto2/';
const BASE_URL_FOTO3 = 'https://www.guiademudancas.com.br/logotipo/foto3/';

// Caminho do CSV exportado
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

  // Detectar separador (vírgula ou ponto e vírgula)
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  
  // Verificar se primeira linha é cabeçalho
  const firstLineParts = firstLine.split(separator);
  const isHeader = firstLineParts[0]?.toLowerCase().includes('id_legado') || 
                   firstLineParts[0]?.toLowerCase().includes('empresa_id');
  
  const startIndex = isHeader ? 1 : 0;
  const hotsites: HotsiteCSV[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    
    // Mapear colunas baseado no SQL export
    // Ordem: id_legado, empresa_id_legado, nome_exibicao, endereco, cidade_nome, estado, descricao, logo_url, foto1_url, foto2_url, foto3_url, ...
    const empresaIdLegado = values[1] || '';
    
    // Validar que empresa_id_legado é um número válido
    const empresaIdNum = parseInt(empresaIdLegado, 10);
    if (!empresaIdLegado || isNaN(empresaIdNum)) {
      continue; // Pular linhas inválidas
    }

    hotsites.push({
      empresa_id_legado: empresaIdLegado,
      logo_url: values[7] || undefined, // logo_url (coluna 8)
      foto1_url: values[8] || undefined, // foto1_url (coluna 9)
      foto2_url: values[9] || undefined, // foto2_url (coluna 10)
      foto3_url: values[10] || undefined, // foto3_url (coluna 11)
      nome_exibicao: values[2] || undefined, // nome_exibicao (coluna 3)
    });
  }

  return hotsites.filter(h => h.empresa_id_legado && h.empresa_id_legado !== 'NULL' && h.empresa_id_legado !== 'null');
}

/**
 * Faz download de uma imagem do servidor antigo
 * @param imageName Nome do arquivo (ex: "logo123.png") - apenas o nome
 * @param imageType Tipo da imagem: 'logo' | 'foto1' | 'foto2' | 'foto3'
 */
async function downloadImage(imageName: string, imageType: 'logo' | 'foto1' | 'foto2' | 'foto3'): Promise<Blob | null> {
  if (!imageName || imageName.trim() === '' || imageName === 'NULL' || imageName === 'null') {
    return null;
  }

  // Limpar nome do arquivo (remover espaços, caracteres especiais)
  const cleanName = imageName.trim().replace(/[^a-zA-Z0-9._-]/g, '');

  try {
    // Construir URL completa baseada no tipo
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

    // Fazer download via HTTP/HTTPS
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
    
    // Verificar se é realmente uma imagem
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
  // Converter para número
  const empresaIdNum = parseInt(empresaIdLegado, 10);
  if (isNaN(empresaIdNum)) {
    return null;
  }

  // Buscar na tabela de mapeamento
  const { data: mapping, error: mappingError } = await supabase
    .from('migration_empresas_map')
    .select('id_novo')
    .eq('id_legado', empresaIdNum)
    .single();

  if (mappingError || !mapping) {
    return null;
  }

  // Buscar empresa no Supabase
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

  console.log(`\n🔄 Migrando imagens para empresa: ${empresa.slug} (${empresa.id})`);

  const updates: Record<string, string> = {};

  // Migrar logo
  if (hotsite.logo_url && hotsite.logo_url.trim() !== '' && hotsite.logo_url !== 'NULL' && hotsite.logo_url !== 'null') {
    const blob = await downloadImage(hotsite.logo_url, 'logo');
    if (blob) {
      // Determinar extensão do arquivo original
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
        // Determinar extensão do arquivo original
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
  console.log('🚀 Iniciando migração de imagens...\n');
  console.log(`📁 CSV: ${CSV_PATH}`);
  console.log(`🌐 URLs do servidor antigo:`);
  console.log(`   Logos: ${BASE_URL_LOGOS}`);
  console.log(`   Fotos: ${BASE_URL_FOTO1}`);
  console.log(`          ${BASE_URL_FOTO2}`);
  console.log(`          ${BASE_URL_FOTO3}\n`);

  // Verificar Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Buscar empresas que têm campanhas cadastradas
  console.log('🔍 Buscando empresas com campanhas cadastradas...');
  const { data: campanhas, error: campanhasError } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .not('empresa_id', 'is', null);

  if (campanhasError) {
    console.error('❌ Erro ao buscar campanhas:', campanhasError);
    process.exit(1);
  }

  // Extrair IDs únicos de empresas com campanhas
  const empresaIdsComCampanhas = [...new Set(campanhas?.map(c => c.empresa_id) || [])];
  console.log(`✅ ${empresaIdsComCampanhas.length} empresas com campanhas encontradas\n`);

  if (empresaIdsComCampanhas.length === 0) {
    console.error('❌ Nenhuma empresa com campanha encontrada. Verifique se as campanhas foram importadas.');
    process.exit(1);
  }

  // Buscar IDs legados dessas empresas no mapeamento
  console.log('🔍 Buscando IDs legados das empresas...');
  const { data: mapeamentos, error: mapeamentoError } = await supabase
    .from('migration_empresas_map')
    .select('id_legado, id_novo')
    .in('id_novo', empresaIdsComCampanhas);

  if (mapeamentoError) {
    console.error('❌ Erro ao buscar mapeamentos:', mapeamentoError);
    process.exit(1);
  }

  const empresaIdsLegadosComCampanhas = new Set(
    mapeamentos?.map(m => m.id_legado.toString()) || []
  );
  console.log(`✅ ${empresaIdsLegadosComCampanhas.size} IDs legados encontrados\n`);

  // Ler CSV
  console.log('📖 Lendo CSV...');
  const hotsites = readCSV(CSV_PATH);
  console.log(`✅ ${hotsites.length} hotsites encontrados\n`);

  // Filtrar apenas empresas com campanhas E que têm imagens
  const hotsitesComImagens = hotsites.filter(h => {
    const temImagem = h.logo_url || h.foto1_url || h.foto2_url || h.foto3_url;
    const temCampanha = empresaIdsLegadosComCampanhas.has(h.empresa_id_legado);
    return temImagem && temCampanha;
  });
  console.log(`📸 ${hotsitesComImagens.length} hotsites com imagens E campanhas para migrar\n`);

  // Migrar cada empresa
  let sucesso = 0;
  let erro = 0;

  for (let i = 0; i < hotsitesComImagens.length; i++) {
    const hotsite = hotsitesComImagens[i];
    console.log(`\n[${i + 1}/${hotsitesComImagens.length}] Processando empresa ${hotsite.empresa_id_legado}...`);
    
    try {
      await migrateEmpresaImages(supabase, hotsite);
      sucesso++;
      
      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`❌ Erro ao migrar empresa ${hotsite.empresa_id_legado}:`, error.message);
      erro++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Migração concluída!');
  console.log(`   Sucesso: ${sucesso}`);
  console.log(`   Erros: ${erro}`);
  console.log('='.repeat(50));
}

// Executar
main().catch(console.error);

