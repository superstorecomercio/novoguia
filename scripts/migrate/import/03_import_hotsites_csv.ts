/**
 * Importa hotsites de um arquivo CSV exportado do SQL Server
 * 
 * Uso:
 *   1. Exporte hotsites do SQL Server usando: sql/03_export_hotsites.sql
 *   2. Salve o arquivo como: data/hotsites_export.csv
 *   3. Execute: npx tsx scripts/migrate/import/03_import_hotsites_csv.ts
 */

// Carregar variáveis de ambiente ANTES de qualquer importação
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase diretamente (sem usar server.ts que valida antes)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas!');
  console.error('Verifique se o arquivo .env.local existe e contém:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const createServerClient = () => createClient(supabaseUrl, supabaseAnonKey);

interface HotsiteCSV {
  id_legado: number;
  empresa_id_legado: number;
  nome_exibicao?: string;
  endereco?: string;
  cidade_nome?: string;
  estado?: string;
  descricao?: string;
  logo_url?: string;
  foto1_url?: string;
  foto2_url?: string;
  foto3_url?: string;
  // Campos importantes adicionais
  email?: string;  // hotemail
  sms_numero?: string;
  regiao?: string;  // hotregiao
  tipoempresa?: string;  // Tipo de serviço: mudança, carreto, guarda-móveis
  slugbairro?: string;
  telefone1?: string;  // hottelefone1
  telefone2?: string;  // hottelefone2
  telefone3?: string;  // hottelefone3
  // Serviços, descontos e formas de pagamento
  hotServico1?: string;
  hotServico2?: string;
  hotServico3?: string;
  hotServico4?: string;
  hotServico5?: string;
  hotServico6?: string;
  hotServico7?: string;
  hotServico8?: string;
  hotServico9?: string;
  hotServico10?: string;
  hotDesconto1?: string;
  hotDesconto2?: string;
  hotDesconto3?: string;
  hotFormaPagto1?: string;
  hotFormaPagto2?: string;
  hotFormaPagto3?: string;
  hotFormaPagto4?: string;
  hotFormaPagto5?: string;
}

/**
 * Gera slug a partir do nome
 */
function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  
  // Detectar separador (vírgula ou ponto e vírgula)
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  
  // Verificar se primeira linha é cabeçalho ou dados
  const firstLineParts = firstLine.split(separator);
  const isHeader = firstLineParts[0]?.toLowerCase().includes('id_legado') || 
                   firstLineParts[0]?.toLowerCase().includes('empresa_id');
  
  let startIndex = 0;
  let headers: string[] = [];
  
  if (isHeader) {
    // Primeira linha são os cabeçalhos
    headers = firstLine.split(separator).map(h => h.trim());
    startIndex = 1;
  } else {
    // Sem cabeçalhos, usar ordem padrão baseada na query de exportação atualizada
    headers = [
      'id_legado', 'empresa_id_legado', 'nome_exibicao', 'endereco', 'cidade_nome', 'estado', 'descricao',
      'logo_url', 'foto1_url', 'foto2_url', 'foto3_url',
      'email', 'sms_numero', 'regiao', 'tipoempresa', 'slugbairro', 'telefone1', 'telefone2', 'telefone3',
      'hotServico1', 'hotServico2', 'hotServico3', 'hotServico4', 'hotServico5',
      'hotServico6', 'hotServico7', 'hotServico8', 'hotServico9', 'hotServico10',
      'hotDesconto1', 'hotDesconto2', 'hotDesconto3',
      'hotFormaPagto1', 'hotFormaPagto2', 'hotFormaPagto3', 'hotFormaPagto4', 'hotFormaPagto5'
    ];
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
        } else {
          hotsite[header] = value;
        }
      }
    });
    
    // Validar que tem pelo menos empresa_id_legado
    if (hotsite.empresa_id_legado && !isNaN(hotsite.empresa_id_legado)) {
      hotsites.push(hotsite);
    }
  }
  
  return hotsites;
}

/**
 * Busca empresa no Supabase usando mapeamento
 */
async function findEmpresaId(
  supabase: any,
  empresaIdLegado: number
): Promise<string | null> {
  const { data } = await supabase
    .from('migration_empresas_map')
    .select('id_novo')
    .eq('id_legado', empresaIdLegado)
    .single();
  
  return data?.id_novo || null;
}

/**
 * Busca cidade no Supabase pelo nome
 */
async function findCidadeByNome(
  supabase: any,
  cidadeNome?: string,
  estado?: string
): Promise<string | null> {
  if (!cidadeNome) return null;
  
  const slug = generateSlug(cidadeNome);
  
  let query = supabase
    .from('cidades')
    .select('id')
    .eq('slug', slug);
  
  if (estado) {
    query = query.eq('estado', estado.toUpperCase());
  }
  
  const { data } = await query.single();
  
  return data?.id || null;
}

/**
 * Converte serviços para array
 */
function parseServicos(hotsite: HotsiteCSV): string[] {
  return [
    hotsite.hotServico1,
    hotsite.hotServico2,
    hotsite.hotServico3,
    hotsite.hotServico4,
    hotsite.hotServico5,
    hotsite.hotServico6,
    hotsite.hotServico7,
    hotsite.hotServico8,
    hotsite.hotServico9,
    hotsite.hotServico10,
  ].filter(Boolean) as string[];
}

/**
 * Converte descontos para array
 */
function parseDescontos(hotsite: HotsiteCSV): string[] {
  return [
    hotsite.hotDesconto1,
    hotsite.hotDesconto2,
    hotsite.hotDesconto3,
  ].filter(Boolean) as string[];
}

/**
 * Converte formas de pagamento para array
 */
function parseFormasPagamento(hotsite: HotsiteCSV): string[] {
  return [
    hotsite.hotFormaPagto1,
    hotsite.hotFormaPagto2,
    hotsite.hotFormaPagto3,
    hotsite.hotFormaPagto4,
    hotsite.hotFormaPagto5,
  ].filter(Boolean) as string[];
}

/**
 * Mapeia tipoempresa para tipo de serviço padronizado
 */
function mapTipoEmpresa(tipoempresa?: string): string | null {
  if (!tipoempresa) return null;
  
  const tipoUpper = tipoempresa.toUpperCase().trim();
  
  const mapping: Record<string, string> = {
    'MUDANÇA': 'mudanca',
    'MUDANCA': 'mudanca',
    'MUDANÇAS': 'mudanca',
    'MUDANCAS': 'mudanca',
    'CARRETO': 'carreto',
    'CARRETOS': 'carreto',
    'GUARDA-MÓVEIS': 'guardamoveis',
    'GUARDA-MOVEIS': 'guardamoveis',
    'GUARDAMOVEIS': 'guardamoveis',
    'GUARDA MÓVEIS': 'guardamoveis',
    'GUARDA MOVEIS': 'guardamoveis',
    'TRANSPORTADORA': 'transportadora',
    'MONTADOR': 'montador',
  };
  
  // Tentar mapeamento direto
  if (mapping[tipoUpper]) {
    return mapping[tipoUpper];
  }
  
  // Tentar mapeamento parcial
  for (const [key, value] of Object.entries(mapping)) {
    if (tipoUpper.includes(key)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Importa tipo de serviço na tabela empresa_servicos baseado em tipoempresa
 * Usa UPSERT para evitar consultas duplicadas
 */
async function importTipoServico(
  supabase: any,
  empresaId: string,
  tipoempresa: string
): Promise<void> {
  const tipoServico = mapTipoEmpresa(tipoempresa);
  
  if (!tipoServico) {
    return; // Tipo não reconhecido, ignorar
  }
  
  // Usar UPSERT para inserir ou atualizar em uma única operação
  await supabase
    .from('empresa_servicos')
    .upsert({
      empresa_id: empresaId,
      tipo_servico: tipoServico,
      areas_atendidas: [],
    }, {
      onConflict: 'empresa_id,tipo_servico',
      ignoreDuplicates: false
    });
  
  // Ignorar erros silenciosamente (já existe ou foi criado)
}

/**
 * Migra hotsite do CSV
 */
async function migrateHotsiteFromCSV(
  supabase: any,
  hotsite: HotsiteCSV,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string }> {
  // Buscar empresa
  const empresaId = await findEmpresaId(supabase, hotsite.empresa_id_legado);
  if (!empresaId) {
    return {
      success: false,
      message: `Empresa legada ${hotsite.empresa_id_legado} não encontrada`,
    };
  }
  
  // Buscar cidade onde o hotsite é exibido
  const cidadeId = await findCidadeByNome(
    supabase,
    hotsite.cidade_nome,
    hotsite.estado
  );
  
  if (!cidadeId) {
    return {
      success: false,
      message: `Cidade não encontrada: ${hotsite.cidade_nome} - ${hotsite.estado}`,
    };
  }
  
  const hotsiteData = {
    empresa_id: empresaId,
    cidade_id: cidadeId,
    nome_exibicao: hotsite.nome_exibicao || null,
    descricao: hotsite.descricao || null,
    endereco: hotsite.endereco || null,
    cidade: hotsite.cidade_nome || null,
    estado: hotsite.estado?.toUpperCase() || null,
    logo_url: hotsite.logo_url || null,
    foto1_url: hotsite.foto1_url || null,
    foto2_url: hotsite.foto2_url || null,
    foto3_url: hotsite.foto3_url || null,
    // Novos campos importantes
    email: hotsite.email || null,
    sms_numero: hotsite.sms_numero || null,
    regiao: hotsite.regiao || null,
    tipoempresa: hotsite.tipoempresa || null,
    slugbairro: hotsite.slugbairro || null,
    telefone1: hotsite.telefone1 || null,
    telefone2: hotsite.telefone2 || null,
    telefone3: hotsite.telefone3 || null,
    servicos: parseServicos(hotsite),
    descontos: parseDescontos(hotsite),
    formas_pagamento: parseFormasPagamento(hotsite),
    highlights: [],
  };
  
  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Criaria hotsite para empresa ${empresaId} em ${hotsite.cidade_nome}`,
    };
  }
  
  // Importar tipo de serviço se tipoempresa estiver preenchido (antes de criar/atualizar hotsite)
  if (hotsite.tipoempresa && !dryRun) {
    await importTipoServico(supabase, empresaId, hotsite.tipoempresa);
  }
  
  // Usar UPSERT para inserir ou atualizar em uma única operação (evita 2 consultas)
  const { error } = await supabase
    .from('hotsites')
    .upsert(hotsiteData, {
      onConflict: 'empresa_id,cidade_id',
      ignoreDuplicates: false
    });
  
  if (error) {
    return {
      success: false,
      message: `Erro ao salvar hotsite: ${error.message}`,
    };
  }
  
  return {
    success: true,
    message: `✅ Hotsite salvo para empresa em ${hotsite.cidade_nome}`,
  };
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const csvPath = args.find(arg => arg.endsWith('.csv')) || 'data/hotsites_export.csv';
  
  console.log('🚀 Iniciando importação de hotsites do CSV...');
  console.log(`📁 Arquivo: ${csvPath}`);
  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhum dado será inserido\n');
  }
  
  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Arquivo não encontrado: ${fullPath}`);
    console.error('\n📝 Como exportar:');
    console.error('   1. Execute scripts/migrate/sql/03_export_hotsites.sql no SQL Server');
    console.error('   2. No SSMS: Query -> Results -> Results to File');
    console.error('   3. Salve como: data/hotsites_export.csv');
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
    
    const supabase = createServerClient();
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const hotsite of hotsites) {
      const result = await migrateHotsiteFromCSV(supabase, hotsite, dryRun);
      
      if (result.success) {
        console.log(result.message);
        successCount++;
      } else {
        errorCount++;
        console.error(`❌ ${result.message}`);
      }
    }
    
    console.log('\n📊 Resumo da Importação:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📦 Total: ${hotsites.length}`);
    
  } catch (error: any) {
    console.error('❌ Erro durante importação:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { migrateHotsiteFromCSV, readCSV };

