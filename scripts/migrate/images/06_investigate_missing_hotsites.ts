/**
 * Script para investigar empresas sem hotsites e empresas com hotsites sem imagens
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
  empresa_id_legado: number;
  logo_url?: string;
  foto1_url?: string;
  foto2_url?: string;
  foto3_url?: string;
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
  
  if (lines.length === 0) {
    return [];
  }
  
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
    // Ordem: id_legado (0), empresa_id_legado (1), nome_exibicao (2), endereco (3), cidade_nome (4), estado (5), descricao (6), logo_url (7), foto1_url (8), foto2_url (9), foto3_url (10)
    const empresaIdLegado = values[1] || '';
    
    // Validar que empresa_id_legado é um número válido
    const empresaIdNum = parseInt(empresaIdLegado, 10);
    if (!empresaIdLegado || isNaN(empresaIdNum) || empresaIdLegado === 'NULL' || empresaIdLegado === 'null') {
      continue; // Pular linhas inválidas
    }
    
    const logoUrl = values[7] || undefined;
    const foto1Url = values[8] || undefined;
    const foto2Url = values[9] || undefined;
    const foto3Url = values[10] || undefined;
    const cidadeNome = values[4] || undefined;
    const estado = values[5] || undefined;
    
    // Verificar se tem pelo menos uma imagem
    const temImagem = logoUrl && logoUrl !== 'NULL' && logoUrl !== 'null' && logoUrl.trim() !== '' ||
                      foto1Url && foto1Url !== 'NULL' && foto1Url !== 'null' && foto1Url.trim() !== '' ||
                      foto2Url && foto2Url !== 'NULL' && foto2Url !== 'null' && foto2Url.trim() !== '' ||
                      foto3Url && foto3Url !== 'NULL' && foto3Url !== 'null' && foto3Url.trim() !== '';
    
    hotsites.push({
      empresa_id_legado: empresaIdNum,
      logo_url: logoUrl && logoUrl !== 'NULL' && logoUrl !== 'null' ? logoUrl : undefined,
      foto1_url: foto1Url && foto1Url !== 'NULL' && foto1Url !== 'null' ? foto1Url : undefined,
      foto2_url: foto2Url && foto2Url !== 'NULL' && foto2Url !== 'null' ? foto2Url : undefined,
      foto3_url: foto3Url && foto3Url !== 'NULL' && foto3Url !== 'null' ? foto3Url : undefined,
      cidade_nome: cidadeNome,
      estado: estado,
    });
  }
  
  return hotsites;
}

async function investigate() {
  console.log('🔍 Investigando empresas sem hotsites e empresas com hotsites sem imagens...\n');

  // 1. Buscar empresas com campanhas
  const { data: campanhas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .not('empresa_id', 'is', null);

  const empresaIdsComCampanhas = [...new Set(campanhas?.map(c => c.empresa_id) || [])];
  console.log(`✅ ${empresaIdsComCampanhas.length} empresas com campanhas\n`);

  // 2. Buscar empresas e seus hotsites
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome, slug')
    .in('id', empresaIdsComCampanhas);

  const { data: hotsites } = await supabase
    .from('hotsites')
    .select('empresa_id, logo_url, foto1_url, foto2_url, foto3_url')
    .in('empresa_id', empresaIdsComCampanhas);

  // 3. Buscar mapeamento de empresas legadas
  const { data: empresaMap } = await supabase
    .from('migration_empresas_map')
    .select('id_legado, id_novo');

  const mapLegadoParaNovo = new Map(
    empresaMap?.map(m => [m.id_legado, m.id_novo]) || []
  );
  const mapNovoParaLegado = new Map(
    empresaMap?.map(m => [m.id_novo, m.id_legado]) || []
  );

  // 4. Ler CSV de hotsites
  const csvPath = path.join(process.cwd(), 'data', 'hotsites_export.csv');
  console.log(`📖 Lendo CSV: ${csvPath}`);
  const hotsitesCSV = readCSV(csvPath);
  console.log(`✅ ${hotsitesCSV.length} hotsites encontrados no CSV\n`);

  // 5. Agrupar hotsites do CSV por empresa legada
  const hotsitesPorEmpresaLegada = new Map<number, HotsiteCSV[]>();
  for (const hotsite of hotsitesCSV) {
    if (!hotsitesPorEmpresaLegada.has(hotsite.empresa_id_legado)) {
      hotsitesPorEmpresaLegada.set(hotsite.empresa_id_legado, []);
    }
    hotsitesPorEmpresaLegada.get(hotsite.empresa_id_legado)!.push(hotsite);
  }

  // 6. Analisar cada empresa
  const empresasSemHotsites: Array<{ empresa: any; temNoCSV: boolean; hotsitesNoCSV: number }> = [];
  const empresasComHotsitesSemImagens: Array<{ empresa: any; hotsite: any; temImagensNoCSV: boolean }> = [];

  for (const empresa of empresas || []) {
    const empresaHotsites = hotsites?.filter(h => h.empresa_id === empresa.id) || [];
    const empresaIdLegado = mapNovoParaLegado.get(empresa.id);
    const hotsitesNoCSV = empresaIdLegado ? hotsitesPorEmpresaLegada.get(empresaIdLegado) || [] : [];

    if (empresaHotsites.length === 0) {
      // Empresa sem hotsites
      empresasSemHotsites.push({
        empresa,
        temNoCSV: hotsitesNoCSV.length > 0,
        hotsitesNoCSV: hotsitesNoCSV.length,
      });
    } else {
      // Verificar se tem imagens migradas
      for (const hotsite of empresaHotsites) {
        const logoMigrada = hotsite.logo_url && hotsite.logo_url.includes('supabase.co/storage');
        const foto1Migrada = hotsite.foto1_url && hotsite.foto1_url.includes('supabase.co/storage');
        const foto2Migrada = hotsite.foto2_url && hotsite.foto2_url.includes('supabase.co/storage');
        const foto3Migrada = hotsite.foto3_url && hotsite.foto3_url.includes('supabase.co/storage');
        const temImagemMigrada = logoMigrada || foto1Migrada || foto2Migrada || foto3Migrada;

        if (!temImagemMigrada) {
          // Verificar se tem imagens no CSV
          const temImagensNoCSV = hotsitesNoCSV.some(h => 
            h.logo_url || h.foto1_url || h.foto2_url || h.foto3_url
          );

          empresasComHotsitesSemImagens.push({
            empresa,
            hotsite,
            temImagensNoCSV,
          });
        }
      }
    }
  }

  // 7. Exibir resultados
  console.log('='.repeat(80));
  console.log('📊 ANÁLISE COMPLETA');
  console.log('='.repeat(80));
  console.log(`\nTotal de empresas com campanhas: ${empresaIdsComCampanhas.length}`);
  console.log(`Empresas sem hotsites: ${empresasSemHotsites.length}`);
  console.log(`Empresas com hotsites mas sem imagens migradas: ${empresasComHotsitesSemImagens.length}\n`);

  // Empresas sem hotsites
  if (empresasSemHotsites.length > 0) {
    console.log('='.repeat(80));
    console.log('⚠️  EMPRESAS SEM HOTSITES');
    console.log('='.repeat(80));
    
    const comHotsitesNoCSV = empresasSemHotsites.filter(e => e.temNoCSV);
    const semHotsitesNoCSV = empresasSemHotsites.filter(e => !e.temNoCSV);

    if (comHotsitesNoCSV.length > 0) {
      console.log(`\n✅ ${comHotsitesNoCSV.length} empresas SEM hotsites no banco MAS COM hotsites no CSV (não foram importados):`);
      comHotsitesNoCSV.slice(0, 10).forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.empresa.nome} - ${e.hotsitesNoCSV} hotsite(s) no CSV`);
      });
      if (comHotsitesNoCSV.length > 10) {
        console.log(`  ... e mais ${comHotsitesNoCSV.length - 10} empresas`);
      }
    }

    if (semHotsitesNoCSV.length > 0) {
      console.log(`\n❌ ${semHotsitesNoCSV.length} empresas SEM hotsites no banco E SEM hotsites no CSV (não existem no CSV):`);
      semHotsitesNoCSV.slice(0, 10).forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.empresa.nome}`);
      });
      if (semHotsitesNoCSV.length > 10) {
        console.log(`  ... e mais ${semHotsitesNoCSV.length - 10} empresas`);
      }
    }
  }

  // Empresas com hotsites mas sem imagens
  if (empresasComHotsitesSemImagens.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  EMPRESAS COM HOTSITES MAS SEM IMAGENS MIGRADAS');
    console.log('='.repeat(80));
    
    const comImagensNoCSV = empresasComHotsitesSemImagens.filter(e => e.temImagensNoCSV);
    const semImagensNoCSV = empresasComHotsitesSemImagens.filter(e => !e.temImagensNoCSV);

    if (comImagensNoCSV.length > 0) {
      console.log(`\n✅ ${comImagensNoCSV.length} empresas COM hotsites mas SEM imagens migradas, MAS COM imagens no CSV (precisam migrar):`);
      comImagensNoCSV.slice(0, 10).forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.empresa.nome}`);
        console.log(`     Logo URL: ${e.hotsite.logo_url || '(vazio)'}`);
        console.log(`     Foto1 URL: ${e.hotsite.foto1_url || '(vazio)'}`);
      });
      if (comImagensNoCSV.length > 10) {
        console.log(`  ... e mais ${comImagensNoCSV.length - 10} empresas`);
      }
    }

    if (semImagensNoCSV.length > 0) {
      console.log(`\n❌ ${semImagensNoCSV.length} empresas COM hotsites mas SEM imagens migradas E SEM imagens no CSV (não têm imagens para migrar):`);
      semImagensNoCSV.slice(0, 10).forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.empresa.nome}`);
      });
      if (semImagensNoCSV.length > 10) {
        console.log(`  ... e mais ${semImagensNoCSV.length - 10} empresas`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Investigação concluída!');
  console.log('='.repeat(80));
}

investigate().catch(console.error);

