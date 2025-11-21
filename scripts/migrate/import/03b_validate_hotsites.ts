/**
 * Valida se todos os hotsites têm empresa associada
 * 
 * Uso:
 *   npx tsx scripts/migrate/import/03b_validate_hotsites.ts
 */

// Carregar variáveis de ambiente ANTES de qualquer importação
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase diretamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface HotsiteCSV {
  id_legado: number;
  empresa_id_legado: number;
  nome_exibicao?: string;
  cidade_nome?: string;
  estado?: string;
}

/**
 * Lê arquivo CSV
 */
function readCSV(filePath: string): HotsiteCSV[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }
  
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  
  const firstLineParts = firstLine.split(separator);
  const isHeader = firstLineParts[0]?.toLowerCase().includes('id_legado') || 
                   firstLineParts[0]?.toLowerCase().includes('empresa_id');
  
  let startIndex = 0;
  let headers: string[] = [];
  
  if (isHeader) {
    headers = firstLine.split(separator).map(h => h.trim());
    startIndex = 1;
  } else {
    headers = ['id_legado', 'empresa_id_legado', 'nome_exibicao', 'endereco', 'cidade_nome', 'estado', 'descricao', 'logo_url', 'foto1_url', 'foto2_url', 'foto3_url', 'hotServico1', 'hotServico2', 'hotServico3', 'hotServico4', 'hotServico5', 'hotServico6', 'hotServico7', 'hotServico8', 'hotServico9', 'hotServico10', 'hotDesconto1', 'hotDesconto2', 'hotDesconto3', 'hotFormaPagto1', 'hotFormaPagto2', 'hotFormaPagto3', 'hotFormaPagto4', 'hotFormaPagto5'];
    startIndex = 0;
  }
  
  const hotsites: HotsiteCSV[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim());
    const hotsite: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      if (value && value !== 'NULL' && value !== '' && value !== null && value !== '&nbsp;') {
        if (header === 'id_legado' || header === 'empresa_id_legado') {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            hotsite[header] = numValue;
          }
        } else if (header === 'nome_exibicao' || header === 'cidade_nome' || header === 'estado') {
          hotsite[header] = value;
        }
      }
    });
    
    // Validar que tem empresa_id_legado
    if (hotsite.empresa_id_legado && !isNaN(hotsite.empresa_id_legado)) {
      hotsites.push(hotsite);
    }
  }
  
  return hotsites;
}

/**
 * Verifica se empresa existe no mapeamento
 */
async function empresaExisteNoMapeamento(empresaIdLegado: number): Promise<boolean> {
  const { data } = await supabase
    .from('migration_empresas_map')
    .select('id_novo')
    .eq('id_legado', empresaIdLegado)
    .single();
  
  return !!data;
}

/**
 * Função principal
 */
async function main() {
  const csvPath = 'data/hotsites_export.csv';
  
  console.log('🔍 Validando hotsites...');
  console.log(`📁 Arquivo: ${csvPath}\n`);
  
  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Arquivo não encontrado: ${fullPath}`);
    process.exit(1);
  }
  
  try {
    console.log('📥 Lendo arquivo CSV...');
    const hotsites = readCSV(fullPath);
    
    if (hotsites.length === 0) {
      console.log('⚠️  Nenhum hotsite encontrado no arquivo CSV.');
      return;
    }
    
    console.log(`✅ Encontrados ${hotsites.length} hotsites no CSV\n`);
    
    // Agrupar por empresa_id_legado
    const empresasUnicas = new Set<number>();
    const hotsitesPorEmpresa = new Map<number, number>();
    
    hotsites.forEach(h => {
      empresasUnicas.add(h.empresa_id_legado);
      const count = hotsitesPorEmpresa.get(h.empresa_id_legado) || 0;
      hotsitesPorEmpresa.set(h.empresa_id_legado, count + 1);
    });
    
    console.log(`📊 Estatísticas:`);
    console.log(`   Total de hotsites: ${hotsites.length}`);
    console.log(`   Empresas únicas: ${empresasUnicas.size}`);
    console.log(`   Média de hotsites por empresa: ${(hotsites.length / empresasUnicas.size).toFixed(2)}\n`);
    
    // Verificar quais empresas existem no mapeamento
    console.log('🔍 Verificando empresas no mapeamento...\n');
    
    let empresasComMapeamento = 0;
    let empresasSemMapeamento = 0;
    const empresasSemMapeamentoList: number[] = [];
    
    for (const empresaIdLegado of empresasUnicas) {
      const existe = await empresaExisteNoMapeamento(empresaIdLegado);
      if (existe) {
        empresasComMapeamento++;
      } else {
        empresasSemMapeamento++;
        empresasSemMapeamentoList.push(empresaIdLegado);
      }
    }
    
    console.log(`\n📊 Resultado da Validação:`);
    console.log(`   ✅ Empresas com mapeamento: ${empresasComMapeamento}`);
    console.log(`   ❌ Empresas sem mapeamento: ${empresasSemMapeamento}`);
    
    if (empresasSemMapeamento > 0) {
      console.log(`\n⚠️  Empresas sem mapeamento (primeiras 20):`);
      empresasSemMapeamentoList.slice(0, 20).forEach(id => {
        const hotsiteCount = hotsitesPorEmpresa.get(id) || 0;
        console.log(`   - ID legado ${id} (${hotsiteCount} hotsite(s))`);
      });
      
      if (empresasSemMapeamentoList.length > 20) {
        console.log(`   ... e mais ${empresasSemMapeamentoList.length - 20} empresas`);
      }
      
      // Calcular quantos hotsites serão afetados
      let hotsitesAfetados = 0;
      empresasSemMapeamentoList.forEach(empresaId => {
        hotsitesAfetados += hotsitesPorEmpresa.get(empresaId) || 0;
      });
      
      console.log(`\n⚠️  Total de hotsites que NÃO serão importados: ${hotsitesAfetados}`);
    }
    
    // Verificar hotsites sem empresa_id_legado
    const hotsitesSemEmpresa = hotsites.filter(h => !h.empresa_id_legado || isNaN(h.empresa_id_legado));
    if (hotsitesSemEmpresa.length > 0) {
      console.log(`\n❌ Hotsites sem empresa_id_legado válido: ${hotsitesSemEmpresa.length}`);
    } else {
      console.log(`\n✅ Todos os hotsites têm empresa_id_legado válido`);
    }
    
    console.log(`\n✅ Validação concluída!`);
    
  } catch (error: any) {
    console.error('❌ Erro durante validação:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { readCSV, empresaExisteNoMapeamento };

