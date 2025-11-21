/**
 * Script detalhado para verificar status da migração de imagens
 * Mostra informações mais detalhadas sobre cada empresa
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function detailedCheck() {
  console.log('🔍 Verificação detalhada da migração de imagens...\n');

  // Buscar empresas com campanhas
  const { data: campanhas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .not('empresa_id', 'is', null);

  const empresaIdsComCampanhas = [...new Set(campanhas?.map(c => c.empresa_id) || [])];
  console.log(`✅ ${empresaIdsComCampanhas.length} empresas com campanhas\n`);

  // Buscar todas as empresas e seus hotsites
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome, slug')
    .in('id', empresaIdsComCampanhas);

  const { data: hotsites } = await supabase
    .from('hotsites')
    .select('empresa_id, logo_url, foto1_url, foto2_url, foto3_url')
    .in('empresa_id', empresaIdsComCampanhas);

  console.log(`📊 Total de hotsites encontrados: ${hotsites?.length || 0}\n`);

  // Agrupar por empresa
  const empresasComDetalhes = empresas?.map(empresa => {
    const hotsite = hotsites?.find(h => h.empresa_id === empresa.id);
    
    const logoMigrada = hotsite?.logo_url && hotsite.logo_url.includes('supabase.co/storage');
    const foto1Migrada = hotsite?.foto1_url && hotsite.foto1_url.includes('supabase.co/storage');
    const foto2Migrada = hotsite?.foto2_url && hotsite.foto2_url.includes('supabase.co/storage');
    const foto3Migrada = hotsite?.foto3_url && hotsite.foto3_url.includes('supabase.co/storage');
    
    const temImagemMigrada = logoMigrada || foto1Migrada || foto2Migrada || foto3Migrada;
    
    return {
      empresa,
      hotsite,
      logoMigrada,
      foto1Migrada,
      foto2Migrada,
      foto3Migrada,
      temImagemMigrada,
      logoUrl: hotsite?.logo_url || null,
      foto1Url: hotsite?.foto1_url || null,
      foto2Url: hotsite?.foto2_url || null,
      foto3Url: hotsite?.foto3_url || null,
    };
  }) || [];

  // Estatísticas
  const empresasComImagens = empresasComDetalhes.filter(e => e.temImagemMigrada).length;
  const empresasSemHotsites = empresasComDetalhes.filter(e => !e.hotsite).length;
  const empresasComHotsitesSemImagens = empresasComDetalhes.filter(e => e.hotsite && !e.temImagemMigrada).length;

  console.log('='.repeat(80));
  console.log('📊 ESTATÍSTICAS');
  console.log('='.repeat(80));
  console.log(`Total de empresas com campanhas: ${empresaIdsComCampanhas.length}`);
  console.log(`Empresas com imagens migradas: ${empresasComImagens}`);
  console.log(`Empresas sem hotsites: ${empresasSemHotsites}`);
  console.log(`Empresas com hotsites mas sem imagens migradas: ${empresasComHotsitesSemImagens}`);
  console.log('');

  // Mostrar empresas sem hotsites
  if (empresasSemHotsites > 0) {
    console.log('='.repeat(80));
    console.log('⚠️  EMPRESAS SEM HOTSITES');
    console.log('='.repeat(80));
    empresasComDetalhes
      .filter(e => !e.hotsite)
      .slice(0, 10)
      .forEach((e, i) => {
        console.log(`${i + 1}. ${e.empresa.nome} (${e.empresa.slug})`);
      });
    if (empresasSemHotsites > 10) {
      console.log(`... e mais ${empresasSemHotsites - 10} empresas`);
    }
    console.log('');
  }

  // Mostrar empresas com hotsites mas sem imagens migradas
  if (empresasComHotsitesSemImagens > 0) {
    console.log('='.repeat(80));
    console.log('⚠️  EMPRESAS COM HOTSITES MAS SEM IMAGENS MIGRADAS');
    console.log('='.repeat(80));
    empresasComDetalhes
      .filter(e => e.hotsite && !e.temImagemMigrada)
      .slice(0, 10)
      .forEach((e, i) => {
        console.log(`${i + 1}. ${e.empresa.nome}`);
        console.log(`   Logo URL: ${e.logoUrl || '(vazio)'}`);
        console.log(`   Foto1 URL: ${e.foto1Url || '(vazio)'}`);
        console.log(`   Foto2 URL: ${e.foto2Url || '(vazio)'}`);
        console.log(`   Foto3 URL: ${e.foto3Url || '(vazio)'}`);
        console.log('');
      });
    if (empresasComHotsitesSemImagens > 10) {
      console.log(`... e mais ${empresasComHotsitesSemImagens - 10} empresas`);
    }
    console.log('');
  }

  // Mostrar empresas com imagens migradas recentemente
  console.log('='.repeat(80));
  console.log('✅ EMPRESAS COM IMAGENS MIGRADAS');
  console.log('='.repeat(80));
  empresasComDetalhes
    .filter(e => e.temImagemMigrada)
    .slice(0, 20)
    .forEach((e, i) => {
      console.log(`${i + 1}. ${e.empresa.nome}`);
      console.log(`   Logo: ${e.logoMigrada ? '✅' : '❌'}`);
      console.log(`   Foto1: ${e.foto1Migrada ? '✅' : '❌'}`);
      console.log(`   Foto2: ${e.foto2Migrada ? '✅' : '❌'}`);
      console.log(`   Foto3: ${e.foto3Migrada ? '✅' : '❌'}`);
      console.log('');
    });
  
  const totalComImagens = empresasComDetalhes.filter(e => e.temImagemMigrada).length;
  if (totalComImagens > 20) {
    console.log(`... e mais ${totalComImagens - 20} empresas`);
  }

  console.log('='.repeat(80));
  console.log('✅ Verificação detalhada concluída!');
  console.log('='.repeat(80));
}

detailedCheck().catch(console.error);

