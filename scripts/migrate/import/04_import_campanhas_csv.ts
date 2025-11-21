/**
 * Importa campanhas de um arquivo CSV exportado do SQL Server
 * 
 * IMPORTANTE: Campanhas controlam o status ativo/inativo das empresas no site.
 * Se uma campanha está ativa, a empresa recebe orçamentos. Se inativa, não recebe.
 * 
 * Uso:
 *   1. Exporte campanhas do SQL Server usando: sql/04_export_campanhas.sql
 *   2. Salve o arquivo como: data/campanhas_export.csv
 *   3. Execute: npx tsx scripts/migrate/import/04_import_campanhas_csv.ts
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

interface CampanhaCSV {
  id_legado: number;
  empresa_id_legado: number;
  plano_id_legado?: number;
  plano_nome?: string;
  data_inicio: string;
  data_fim?: string;
  valor_total?: number;
  data_cobranca?: string;
  cidade_id_legado?: number;
  cidade_nome?: string;
  hotsite_id_legado?: number;
  hotsite_cidade_nome?: string;
  ativo?: number;
}

/**
 * Mapeia nome do plano legado para slug do plano no Supabase
 * 
 * NOTA: Todas as empresas serão do tipo "lista" (standard) no novo site.
 * O campo de plano não será mais usado, mas mantemos para compatibilidade.
 */
function getPlanoSlug(planoNome?: string): string | null {
  // Todas as campanhas usam o plano "standard" (equivalente a "lista")
  // O campo não será mais usado no novo site, mas mantemos para compatibilidade
  return 'standard';
}

/**
 * Lê arquivo CSV
 */
function readCSV(filePath: string): CampanhaCSV[] {
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
    // Sem cabeçalhos, usar ordem padrão baseada na query de exportação
    // SELECT: id_legado, empresa_id_legado, plano_id_legado, plano_nome, data_inicio, data_fim, valor_total, data_cobranca, cidade_id_legado, cidade_nome, hotsite_cidade_nome
    // Nota: O campo 'ativo' pode não estar presente no CSV (será calculado pela função isCampanhaAtiva)
    headers = ['id_legado', 'empresa_id_legado', 'plano_id_legado', 'plano_nome', 'data_inicio', 'data_fim', 'valor_total', 'data_cobranca', 'cidade_id_legado', 'cidade_nome', 'hotsite_cidade_nome'];
    startIndex = 0;
  }
  
  const campanhas: CampanhaCSV[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim());
    const campanha: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      if (value && value !== 'NULL' && value !== '' && value !== null && value !== '&nbsp;') {
        if (header.includes('id_legado') || header === 'ativo') {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            campanha[header] = numValue;
          }
        } else if (header.includes('valor') || header.includes('total')) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            campanha[header] = numValue;
          }
        } else {
          campanha[header] = value;
        }
      }
    });
    
    // Validar que tem pelo menos empresa_id_legado e data_inicio
    if (campanha.empresa_id_legado && !isNaN(campanha.empresa_id_legado) && campanha.data_inicio) {
      campanhas.push(campanha);
    }
  }
  
  return campanhas;
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
 * Busca plano de publicidade
 * 
 * NOTA: Todas as empresas usam o plano "standard" (lista) no novo site.
 * O campo de plano não será mais usado, mas mantemos para compatibilidade.
 */
async function findPlanoId(
  supabase: any,
  planoNome?: string,
  planoIdLegado?: number
): Promise<string | null> {
  // Sempre busca o plano "standard" (equivalente a "lista")
  // Todas as empresas serão do tipo lista no novo site
  const { data } = await supabase
    .from('planos_publicidade')
    .select('id')
    .eq('nome', 'standard')
    .single();
  
  if (data) return data.id;
  
  // Se não encontrou "standard", tenta criar ou retorna null
  console.warn('⚠️  Plano "standard" não encontrado. Certifique-se de que os planos foram criados no Supabase.');
  return null;
}

/**
 * Busca cidade no Supabase usando mapeamento ou nome
 */
async function findCidadeId(
  supabase: any,
  cidadeIdLegado?: number,
  cidadeNome?: string
): Promise<string | null> {
  if (cidadeIdLegado) {
    const { data } = await supabase
      .from('migration_cidades_map')
      .select('id_novo')
      .eq('id_legado', cidadeIdLegado)
      .single();
    
    if (data) return data.id_novo;
  }
  
  if (cidadeNome) {
    const slug = cidadeNome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const { data } = await supabase
      .from('cidades')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (data) return data.id;
  }
  
  return null;
}

/**
 * Busca hotsite no Supabase usando empresa e cidade
 */
async function findHotsiteId(
  supabase: any,
  empresaId: string,
  cidadeNome?: string
): Promise<string | null> {
  if (!cidadeNome) return null;
  
  const cidadeId = await findCidadeId(supabase, undefined, cidadeNome);
  if (!cidadeId) return null;
  
  const { data } = await supabase
    .from('hotsites')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('cidade_id', cidadeId)
    .single();
  
  return data?.id || null;
}

/**
 * Converte data do formato SQL Server para formato PostgreSQL
 */
function parseDate(dateStr?: string): string | null {
  if (!dateStr || dateStr === 'NULL' || dateStr === '' || dateStr === '&nbsp;') return null;
  
  // Remover espaços e caracteres especiais
  const cleaned = dateStr.trim();
  
  // Se já está no formato YYYY-MM-DD, retornar direto
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Tentar vários formatos comuns
  try {
    // Formato SQL Server: "2016-01-01 00:00:00.000"
    const date = new Date(cleaned);
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return null;
  }
}

/**
 * Determina se campanha está ativa
 * 
 * IMPORTANTE: Se retornar false, a empresa NÃO receberá orçamentos.
 * Uma campanha está ativa se:
 * - Tem flag ativo=1 explícito, OU
 * - Não tem data_fim, OU
 * - data_fim está no futuro ou é hoje, OU
 * - data_fim é muito antiga (provavelmente valor padrão do sistema legado)
 */
function isCampanhaAtiva(
  dataFim?: string,
  ativoFlag?: number,
  dataInicio?: string
): boolean {
  // Se tem flag explícito, usa ele (prioridade máxima)
  if (ativoFlag !== undefined && ativoFlag !== null) {
    return ativoFlag === 1;
  }
  
  // Se não tem data fim, está ativa (sem vencimento = permanente)
  if (!dataFim || dataFim === 'NULL' || dataFim === '') {
    return true;
  }
  
  // Verificar se data fim está no futuro
  const fim = parseDate(dataFim);
  if (!fim) {
    // Se não conseguiu parsear, assume ativa (erro de dados)
    return true;
  }
  
  // Se data_fim = data_inicio e ambas são muito antigas (antes de 2020),
  // provavelmente é um valor padrão do sistema legado = tratar como sem vencimento
  if (dataInicio) {
    const inicio = parseDate(dataInicio);
    if (inicio && inicio === fim) {
      const anoFim = parseInt(fim.split('-')[0], 10);
      if (anoFim < 2020) {
        // Data muito antiga e igual ao início = provavelmente valor padrão
        // Tratar como sem vencimento (ativa)
        return true;
      }
    }
  }
  
  const hoje = new Date().toISOString().split('T')[0];
  // Se data fim é hoje ou no futuro, está ativa
  return fim >= hoje;
}

/**
 * Migra campanha do CSV
 */
async function migrateCampanhaFromCSV(
  supabase: any,
  campanha: CampanhaCSV,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string }> {
  // Buscar empresa
  const empresaId = await findEmpresaId(supabase, campanha.empresa_id_legado);
  if (!empresaId) {
    return {
      success: false,
      message: `Empresa legada ${campanha.empresa_id_legado} não encontrada`,
    };
  }
  
  // Buscar plano
  const planoId = await findPlanoId(
    supabase,
    campanha.plano_nome,
    campanha.plano_id_legado
  );
  
  if (!planoId) {
    return {
      success: false,
      message: `Plano não encontrado: ${campanha.plano_nome || campanha.plano_id_legado}`,
    };
  }
  
  // Buscar cidade (opcional)
  const cidadeId = await findCidadeId(
    supabase,
    campanha.cidade_id_legado,
    campanha.cidade_nome
  );
  
  // Buscar hotsite (opcional)
  const hotsiteId = await findHotsiteId(
    supabase,
    empresaId,
    campanha.hotsite_cidade_nome || campanha.cidade_nome
  );
  
  // Determinar se campanha está ativa
  // IMPORTANTE: Se ativo=false, empresa NÃO recebe orçamentos
  const ativo = isCampanhaAtiva(campanha.data_fim, campanha.ativo, campanha.data_inicio);
  
  const campanhaData = {
    empresa_id: empresaId,
    plano_id: planoId,
    cidade_id: cidadeId || null,
    hotsite_id: hotsiteId || null,
    data_inicio: parseDate(campanha.data_inicio) || new Date().toISOString().split('T')[0],
    // Se data_fim = data_inicio e ambas são muito antigas, tratar como NULL (sem vencimento)
    data_fim: (() => {
      const fim = parseDate(campanha.data_fim);
      const inicio = parseDate(campanha.data_inicio);
      if (fim && inicio && fim === inicio) {
        const anoFim = parseInt(fim.split('-')[0], 10);
        if (anoFim < 2020) {
          // Data muito antiga e igual ao início = provavelmente valor padrão
          return null; // Sem vencimento
        }
      }
      return fim;
    })(),
    valor_total: campanha.valor_total || null,
    data_cobranca: parseDate(campanha.data_cobranca) || null,
    ativo: ativo, // Se false, empresa não recebe orçamentos
    observacoes: `Migrado do sistema legado (ID: ${campanha.id_legado})`,
  };
  
  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Criaria campanha para empresa ${empresaId} (plano: ${campanha.plano_nome})`,
    };
  }
  
  // Verificar se já existe (por empresa + plano + data_inicio)
  const { data: existing } = await supabase
    .from('campanhas')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('plano_id', planoId)
    .eq('data_inicio', campanhaData.data_inicio)
    .single();
  
  if (existing) {
    // Atualizar
    const { error } = await supabase
      .from('campanhas')
      .update(campanhaData)
      .eq('id', existing.id);
    
    if (error) {
      return {
        success: false,
        message: `Erro ao atualizar campanha: ${error.message}`,
      };
    }
    
    return {
      success: true,
      message: `✅ Atualizada campanha para empresa (plano: ${campanha.plano_nome})`,
    };
  } else {
    // Criar nova
    const { error } = await supabase.from('campanhas').insert(campanhaData);
    
    if (error) {
      return {
        success: false,
        message: `Erro ao criar campanha: ${error.message}`,
      };
    }
    
    return {
      success: true,
      message: `✅ Criada campanha para empresa (plano: ${campanha.plano_nome})`,
    };
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const csvPath = args.find(arg => arg.endsWith('.csv')) || 'data/campanhas_export.csv';
  
  console.log('🚀 Iniciando importação de campanhas do CSV...');
  console.log(`📁 Arquivo: ${csvPath}`);
  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhum dado será inserido\n');
  }
  
  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Arquivo não encontrado: ${fullPath}`);
    console.error('\n📝 Como exportar:');
    console.error('   1. Execute scripts/migrate/sql/04_export_campanhas.sql no SQL Server');
    console.error('   2. No SSMS: Query -> Results -> Results to File');
    console.error('   3. Salve como: data/campanhas_export.csv');
    process.exit(1);
  }
  
  try {
    console.log('📥 Lendo arquivo CSV...');
    const campanhas = readCSV(fullPath);
    
    if (campanhas.length === 0) {
      console.log('⚠️  Nenhuma campanha encontrada no arquivo CSV.');
      return;
    }
    
    console.log(`✅ Encontradas ${campanhas.length} campanhas no CSV\n`);
    
    const supabase = createServerClient();
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const campanha of campanhas) {
      const result = await migrateCampanhaFromCSV(supabase, campanha, dryRun);
      
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
    console.log(`   📦 Total: ${campanhas.length}`);
    
  } catch (error: any) {
    console.error('❌ Erro durante importação:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { migrateCampanhaFromCSV, readCSV };

