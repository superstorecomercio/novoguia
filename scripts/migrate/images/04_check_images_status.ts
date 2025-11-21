/**
 * Script para verificar status da migração de imagens
 * 
 * Mostra:
 * - Quantas empresas têm imagens migradas
 * - Quantas empresas têm campanhas mas não têm imagens
 * - URLs das imagens migradas
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImagesStatus() {
  console.log('🔍 Verificando status da migração de imagens...\n');

  // 1. Buscar empresas com campanhas
  console.log('📊 Buscando empresas com campanhas...');
  const { data: campanhas, error: campanhasError } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .not('empresa_id', 'is', null);

  if (campanhasError) {
    console.error('❌ Erro ao buscar campanhas:', campanhasError);
    return;
  }

  const empresaIdsComCampanhas = [...new Set(campanhas?.map(c => c.empresa_id) || [])];
  console.log(`✅ ${empresaIdsComCampanhas.length} empresas com campanhas encontradas\n`);

  // 2. Buscar hotsites dessas empresas
  console.log('🖼️  Buscando hotsites com imagens...');
  const { data: hotsites, error: hotsitesError } = await supabase
    .from('hotsites')
    .select('empresa_id, logo_url, foto1_url, foto2_url, foto3_url')
    .in('empresa_id', empresaIdsComCampanhas);

  if (hotsitesError) {
    console.error('❌ Erro ao buscar hotsites:', hotsitesError);
    return;
  }

  // 3. Analisar status das imagens
  let empresasComImagens = 0;
  let empresasSemImagens = 0;
  let totalImagens = 0;
  const empresasComImagensDetalhes: Array<{
    empresaId: string;
    logo: boolean;
    foto1: boolean;
    foto2: boolean;
    foto3: boolean;
    urls: string[];
  }> = [];

  const empresaIdsComHotsites = new Set(hotsites?.map(h => h.empresa_id) || []);

  for (const empresaId of empresaIdsComCampanhas) {
    const hotsite = hotsites?.find(h => h.empresa_id === empresaId);
    
    if (!hotsite) {
      empresasSemImagens++;
      continue;
    }

    const logoMigrada = hotsite.logo_url && hotsite.logo_url.includes('supabase.co/storage');
    const foto1Migrada = hotsite.foto1_url && hotsite.foto1_url.includes('supabase.co/storage');
    const foto2Migrada = hotsite.foto2_url && hotsite.foto2_url.includes('supabase.co/storage');
    const foto3Migrada = hotsite.foto3_url && hotsite.foto3_url.includes('supabase.co/storage');

    const temImagemMigrada = logoMigrada || foto1Migrada || foto2Migrada || foto3Migrada;

    if (temImagemMigrada) {
      empresasComImagens++;
      const urls: string[] = [];
      if (logoMigrada) urls.push(hotsite.logo_url!);
      if (foto1Migrada) urls.push(hotsite.foto1_url!);
      if (foto2Migrada) urls.push(hotsite.foto2_url!);
      if (foto3Migrada) urls.push(hotsite.foto3_url!);
      
      empresasComImagensDetalhes.push({
        empresaId,
        logo: logoMigrada,
        foto1: foto1Migrada,
        foto2: foto2Migrada,
        foto3: foto3Migrada,
        urls,
      });

      totalImagens += [logoMigrada, foto1Migrada, foto2Migrada, foto3Migrada].filter(Boolean).length;
    } else {
      empresasSemImagens++;
    }
  }

  // 4. Buscar nomes das empresas para exibição
  console.log('📝 Buscando nomes das empresas...');
  const { data: empresas, error: empresasError } = await supabase
    .from('empresas')
    .select('id, nome, slug')
    .in('id', Array.from(empresaIdsComCampanhas));

  const empresaMap = new Map(
    empresas?.map(e => [e.id, { nome: e.nome, slug: e.slug }]) || []
  );

  // 5. Exibir resultados
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA MIGRAÇÃO DE IMAGENS');
  console.log('='.repeat(60));
  console.log(`\n✅ Empresas com campanhas: ${empresaIdsComCampanhas.length}`);
  console.log(`🖼️  Empresas com imagens migradas: ${empresasComImagens}`);
  console.log(`❌ Empresas sem imagens migradas: ${empresasSemImagens}`);
  console.log(`📸 Total de imagens migradas: ${totalImagens}`);
  console.log(`\n📈 Taxa de sucesso: ${((empresasComImagens / empresaIdsComCampanhas.length) * 100).toFixed(1)}%\n`);

  // 6. Exibir detalhes das primeiras empresas
  if (empresasComImagensDetalhes.length > 0) {
    console.log('='.repeat(60));
    console.log('📋 DETALHES DAS EMPRESAS COM IMAGENS MIGRADAS');
    console.log('='.repeat(60));
    
    empresasComImagensDetalhes.slice(0, 10).forEach((detalhe, index) => {
      const empresa = empresaMap.get(detalhe.empresaId);
      const nome = empresa?.nome || detalhe.empresaId;
      
      console.log(`\n${index + 1}. ${nome}`);
      console.log(`   Logo: ${detalhe.logo ? '✅' : '❌'}`);
      console.log(`   Foto 1: ${detalhe.foto1 ? '✅' : '❌'}`);
      console.log(`   Foto 2: ${detalhe.foto2 ? '✅' : '❌'}`);
      console.log(`   Foto 3: ${detalhe.foto3 ? '✅' : '❌'}`);
      
      if (detalhe.urls.length > 0) {
        console.log(`   URLs:`);
        detalhe.urls.slice(0, 2).forEach(url => {
          console.log(`     - ${url.substring(0, 80)}...`);
        });
      }
    });

    if (empresasComImagensDetalhes.length > 10) {
      console.log(`\n... e mais ${empresasComImagensDetalhes.length - 10} empresas`);
    }
  }

  // 7. Verificar empresas sem imagens
  const empresasSemImagensIds = empresaIdsComCampanhas.filter(
    id => !empresasComImagensDetalhes.some(e => e.empresaId === id)
  );

  if (empresasSemImagensIds.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  EMPRESAS COM CAMPANHAS MAS SEM IMAGENS MIGRADAS');
    console.log('='.repeat(60));
    
    empresasSemImagensIds.slice(0, 10).forEach((empresaId, index) => {
      const empresa = empresaMap.get(empresaId);
      const nome = empresa?.nome || empresaId;
      console.log(`${index + 1}. ${nome} (${empresaId})`);
    });

    if (empresasSemImagensIds.length > 10) {
      console.log(`\n... e mais ${empresasSemImagensIds.length - 10} empresas`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verificação concluída!');
  console.log('='.repeat(60) + '\n');
}

checkImagesStatus().catch(console.error);

