/**
 * Script para verificar diretamente no banco se empresas têm mapeamento
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

async function checkMappings() {
  console.log('🔍 Verificando mapeamentos diretamente no banco...\n');

  // Buscar empresas com campanhas
  const { data: campanhas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .not('empresa_id', 'is', null);

  const empresaIdsComCampanhas = [...new Set(campanhas?.map(c => c.empresa_id) || [])];
  console.log(`✅ ${empresaIdsComCampanhas.length} empresas com campanhas\n`);

  // Buscar empresas
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome, slug')
    .in('id', empresaIdsComCampanhas);

  // Verificar mapeamento para cada empresa
  console.log('🔍 Verificando mapeamentos...\n');
  
  let comMapeamento = 0;
  let semMapeamento = 0;
  const empresasSemMapeamento: Array<{ empresa: any }> = [];

  for (const empresa of empresas || []) {
    const { data: map } = await supabase
      .from('migration_empresas_map')
      .select('id_legado')
      .eq('id_novo', empresa.id)
      .maybeSingle();

    if (map) {
      comMapeamento++;
    } else {
      semMapeamento++;
      empresasSemMapeamento.push({ empresa });
    }
  }

  console.log('='.repeat(80));
  console.log('📊 RESULTADO');
  console.log('='.repeat(80));
  console.log(`✅ Empresas com mapeamento: ${comMapeamento}`);
  console.log(`❌ Empresas sem mapeamento: ${semMapeamento}\n`);

  if (empresasSemMapeamento.length > 0) {
    console.log('Empresas sem mapeamento:');
    empresasSemMapeamento.slice(0, 10).forEach((e, i) => {
      console.log(`${i + 1}. ${e.empresa.nome} (${e.empresa.slug})`);
    });
    if (empresasSemMapeamento.length > 10) {
      console.log(`... e mais ${empresasSemMapeamento.length - 10} empresas`);
    }
  }
}

checkMappings().catch(console.error);

