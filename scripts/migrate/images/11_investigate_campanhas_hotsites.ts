/**
 * Script para investigar por que empresas com campanhas não têm hotsites no CSV
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface HotsiteCSV {
  id_legado: number;
  empresa_id_legado: number;
  nome_exibicao?: string;
  cidade_nome?: string;
  estado?: string;
}

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
    
    if (values.length < 2) continue;
    
    const idLegado = parseInt(values[0] || '0', 10);
    const empresaIdLegado = parseInt(values[1] || '0', 10);
    
    if (!empresaIdLegado || isNaN(empresaIdLegado)) continue;
    
    hotsites.push({
      id_legado: idLegado,
      empresa_id_legado: empresaIdLegado,
      nome_exibicao: values[2] || undefined,
      cidade_nome: values[4] || undefined,
      estado: values[5] || undefined,
    });
  }
  
  return hotsites;
}

async function investigate() {
  console.log('🔍 Investigando empresas com campanhas mas sem hotsites no CSV...\n');

  // 1. Buscar empresas com campanhas
  const { data: campanhas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .not('empresa_id', 'is', null);

  const empresaIdsComCampanhas = [...new Set(campanhas?.map(c => c.empresa_id) || [])];
  console.log(`✅ ${empresaIdsComCampanhas.length} empresas com campanhas\n`);

  // 2. Buscar empresas e seus dados
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome, slug')
    .in('id', empresaIdsComCampanhas);

  // 3. Buscar mapeamento de empresas - buscar diretamente para cada empresa
  const mapNovoParaLegado = new Map<string, number>();
  
  // Buscar mapeamentos em lote para todas as empresas
  const { data: empresaMap } = await supabase
    .from('migration_empresas_map')
    .select('id_legado, id_novo')
    .in('id_novo', empresaIdsComCampanhas);
  
  // Agrupar por id_novo (uma empresa pode ter múltiplos id_legado)
  for (const map of empresaMap || []) {
    if (!mapNovoParaLegado.has(map.id_novo)) {
      mapNovoParaLegado.set(map.id_novo, map.id_legado);
    }
  }

  console.log(`✅ ${empresaMap?.length || 0} empresas no mapeamento\n`);

  // 4. Ler CSV
  const csvPath = path.join(process.cwd(), 'data', 'hotsites_export.csv');
  console.log(`📖 Lendo CSV: ${csvPath}`);
  const hotsitesCSV = readCSV(csvPath);
  console.log(`✅ ${hotsitesCSV.length} hotsites encontrados no CSV\n`);

  // 5. Agrupar hotsites por empresa legada
  const hotsitesPorEmpresaLegada = new Map<number, HotsiteCSV[]>();
  for (const hotsite of hotsitesCSV) {
    if (!hotsitesPorEmpresaLegada.has(hotsite.empresa_id_legado)) {
      hotsitesPorEmpresaLegada.set(hotsite.empresa_id_legado, []);
    }
    hotsitesPorEmpresaLegada.get(hotsite.empresa_id_legado)!.push(hotsite);
  }

  console.log(`✅ ${hotsitesPorEmpresaLegada.size} empresas únicas com hotsites no CSV\n`);

  // 6. Verificar cada empresa com campanha
  const empresasSemMapeamento: Array<{ empresa: any }> = [];
  const empresasSemHotsitesNoCSV: Array<{ empresa: any; empresaIdLegado: number | null }> = [];
  const empresasComHotsitesNoCSV: Array<{ empresa: any; empresaIdLegado: number; quantidadeHotsites: number }> = [];

  for (const empresa of empresas || []) {
    const empresaIdLegado = mapNovoParaLegado.get(empresa.id);
    
    if (!empresaIdLegado) {
      empresasSemMapeamento.push({ empresa });
      continue;
    }

    const hotsitesDaEmpresa = hotsitesPorEmpresaLegada.get(empresaIdLegado);
    
    if (!hotsitesDaEmpresa || hotsitesDaEmpresa.length === 0) {
      empresasSemHotsitesNoCSV.push({ empresa, empresaIdLegado });
    } else {
      empresasComHotsitesNoCSV.push({
        empresa,
        empresaIdLegado,
        quantidadeHotsites: hotsitesDaEmpresa.length,
      });
    }
  }

  // 7. Exibir resultados
  console.log('='.repeat(80));
  console.log('📊 ANÁLISE DETALHADA');
  console.log('='.repeat(80));
  console.log(`\nTotal de empresas com campanhas: ${empresaIdsComCampanhas.length}`);
  console.log(`Empresas com mapeamento: ${empresasComHotsitesNoCSV.length + empresasSemHotsitesNoCSV.length}`);
  console.log(`Empresas sem mapeamento: ${empresasSemMapeamento.length}`);
  console.log(`Empresas com hotsites no CSV: ${empresasComHotsitesNoCSV.length}`);
  console.log(`Empresas sem hotsites no CSV: ${empresasSemHotsitesNoCSV.length}\n`);

  // Empresas sem mapeamento
  if (empresasSemMapeamento.length > 0) {
    console.log('='.repeat(80));
    console.log('⚠️  EMPRESAS COM CAMPANHAS MAS SEM MAPEAMENTO (não têm id_legado)');
    console.log('='.repeat(80));
    empresasSemMapeamento.slice(0, 10).forEach((e, i) => {
      console.log(`${i + 1}. ${e.empresa.nome} (${e.empresa.slug})`);
    });
    if (empresasSemMapeamento.length > 10) {
      console.log(`... e mais ${empresasSemMapeamento.length - 10} empresas`);
    }
    console.log('');
  }

  // Empresas sem hotsites no CSV
  if (empresasSemHotsitesNoCSV.length > 0) {
    console.log('='.repeat(80));
    console.log('⚠️  EMPRESAS COM CAMPANHAS E MAPEAMENTO MAS SEM HOTSITES NO CSV');
    console.log('='.repeat(80));
    console.log('Essas empresas têm id_legado mas não aparecem no CSV de hotsites:\n');
    empresasSemHotsitesNoCSV.slice(0, 20).forEach((e, i) => {
      console.log(`${i + 1}. ${e.empresa.nome}`);
      console.log(`   ID Legado: ${e.empresaIdLegado}`);
      console.log(`   Slug: ${e.empresa.slug}`);
      console.log('');
    });
    if (empresasSemHotsitesNoCSV.length > 20) {
      console.log(`... e mais ${empresasSemHotsitesNoCSV.length - 20} empresas`);
    }
    console.log('');
  }

  // Verificar se essas empresas realmente não estão no CSV
  console.log('='.repeat(80));
  console.log('🔍 VERIFICAÇÃO MANUAL NO CSV');
  console.log('='.repeat(80));
  console.log('\nVerificando se essas empresas realmente não estão no CSV...\n');
  
  const empresasIdLegadoParaVerificar = empresasSemHotsitesNoCSV
    .map(e => e.empresaIdLegado)
    .filter((id): id is number => id !== null)
    .slice(0, 5);

  for (const empresaIdLegado of empresasIdLegadoParaVerificar) {
    const encontrados = hotsitesCSV.filter(h => h.empresa_id_legado === empresaIdLegado);
    if (encontrados.length > 0) {
      console.log(`✅ Empresa ID ${empresaIdLegado}: Encontrada ${encontrados.length} vez(es) no CSV`);
      encontrados.slice(0, 3).forEach(h => {
        console.log(`   - Hotsite ID ${h.id_legado} em ${h.cidade_nome} - ${h.estado}`);
      });
    } else {
      console.log(`❌ Empresa ID ${empresaIdLegado}: NÃO encontrada no CSV`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Investigação concluída!');
  console.log('='.repeat(80));
}

investigate().catch(console.error);

