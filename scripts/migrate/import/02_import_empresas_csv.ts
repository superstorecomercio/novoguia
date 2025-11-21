/**
 * Importa empresas de um arquivo CSV exportado do SQL Server
 * 
 * Uso:
 *   1. Exporte empresas do SQL Server usando: sql/02_export_empresas.sql
 *   2. Salve o arquivo como: data/empresas_export.csv
 *   3. Execute: npx tsx scripts/migrate/import/02_import_empresas_csv.ts
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

interface EmpresaCSV {
  id_legado: number;
  nome: string;
  cnpj?: string;
  responsavel?: string;
  email?: string;
  telefone?: string;
  telefone2?: string;
  telefone3?: string;
  website?: string;
  endereco?: string;
  complemento?: string;
  cidade_id_legado?: number;
  cidade_nome?: string;
  estado?: string;
  descricao?: string;
  ativo: number;
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
 * Converte telefones para array
 */
function parseTelefones(
  telefone?: string,
  telefone2?: string,
  telefone3?: string
): string[] {
  const telefones: string[] = [];
  
  if (telefone) {
    const parts = telefone.split(/[,;]/).map(t => t.trim()).filter(t => t);
    telefones.push(...parts);
  }
  
  if (telefone2) telefones.push(telefone2.trim());
  if (telefone3) telefones.push(telefone3.trim());
  
  return [...new Set(telefones.filter(t => t.length > 0))];
}

/**
 * Lê arquivo CSV
 */
function readCSV(filePath: string): EmpresaCSV[] {
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
                   firstLineParts[0]?.toLowerCase().includes('nome');
  
  let startIndex = 0;
  let headers: string[] = [];
  
  if (isHeader) {
    // Primeira linha são os cabeçalhos
    headers = firstLine.split(separator).map(h => h.trim());
    startIndex = 1;
  } else {
    // Sem cabeçalhos, usar ordem padrão baseada na query de exportação
    // SELECT: id_legado, nome, cnpj, responsavel, email, telefone, telefone2, telefone3, website, endereco, complemento, cidade_id_legado, cidade_nome, estado, descricao, ativo
    headers = ['id_legado', 'nome', 'cnpj', 'responsavel', 'email', 'telefone', 'telefone2', 'telefone3', 'website', 'endereco', 'complemento', 'cidade_id_legado', 'cidade_nome', 'estado', 'descricao', 'ativo'];
    startIndex = 0;
  }
  
  const empresas: EmpresaCSV[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim());
    const empresa: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      if (value && value !== 'NULL' && value !== '' && value !== null && value !== '&nbsp;') {
        if (header === 'id_legado' || header === 'cidade_id_legado' || header === 'ativo') {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            empresa[header] = numValue;
          }
        } else {
          empresa[header] = value;
        }
      }
    });
    
    // Validar que tem pelo menos nome
    if (empresa.nome && empresa.nome !== '&nbsp;' && empresa.nome.trim() !== '') {
      empresas.push(empresa);
    }
  }
  
  return empresas;
}

/**
 * Busca cidade no Supabase usando mapeamento
 */
async function findCityId(
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
    const slug = generateSlug(cidadeNome);
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
 * Migra empresa do CSV
 */
async function migrateEmpresaFromCSV(
  supabase: any,
  empresa: EmpresaCSV,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string }> {
  const slug = generateSlug(empresa.nome);
  
  // Verificar se já existe
  const { data: existing } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (existing && !dryRun) {
    // Empresa já existe, mas vamos criar/atualizar o mapeamento mesmo assim
    const { data: existingMap } = await supabase
      .from('migration_empresas_map')
      .select('id_novo')
      .eq('id_legado', empresa.id_legado)
      .single();
    
    if (!existingMap) {
      // Criar mapeamento se não existir
      await supabase.from('migration_empresas_map').upsert({
        id_legado: empresa.id_legado,
        id_novo: existing.id,
        nome: empresa.nome,
      });
    }
    
    return {
      success: false,
      message: `Empresa ${empresa.nome} já existe (slug: ${slug})`,
    };
  }
  
  // Buscar cidade
  const cidadeId = await findCityId(
    supabase,
    empresa.cidade_id_legado,
    empresa.cidade_nome
  );
  
  if (!cidadeId) {
    return {
      success: false,
      message: `Cidade não encontrada para empresa ${empresa.nome}`,
    };
  }
  
  const telefones = parseTelefones(
    empresa.telefone,
    empresa.telefone2,
    empresa.telefone3
  );
  
  const empresaData: any = {
    nome: empresa.nome,
    slug: slug,
    cnpj: empresa.cnpj || null,
    responsavel: empresa.responsavel || null,
    email: empresa.email || null,
    telefones: telefones.length > 0 ? telefones : [],
    website: empresa.website || null,
    endereco: empresa.endereco || null,
    complemento: empresa.complemento || null,
    cidade_id: cidadeId,
    estado: empresa.estado?.toUpperCase() || null,
    descricao: empresa.descricao || null,
    ativo: empresa.ativo === 1,
  };
  
  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Criaria empresa: ${empresa.nome} (${slug})`,
    };
  }
  
  // Inserir empresa
  const { data: empresaInserted, error: empresaError } = await supabase
    .from('empresas')
    .insert(empresaData)
    .select('id')
    .single();
  
  if (empresaError) {
    return {
      success: false,
      message: `Erro ao inserir empresa ${empresa.nome}: ${empresaError.message}`,
    };
  }
  
  // Salvar mapeamento
  await supabase.from('migration_empresas_map').insert({
    id_legado: empresa.id_legado,
    id_novo: empresaInserted.id,
    nome: empresa.nome,
  });
  
  return {
    success: true,
    message: `✅ Migrada: ${empresa.nome} (${slug})`,
  };
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const csvPath = args.find(arg => arg.endsWith('.csv')) || 'data/empresas_export.csv';
  
  console.log('🚀 Iniciando importação de empresas do CSV...');
  console.log(`📁 Arquivo: ${csvPath}`);
  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhum dado será inserido\n');
  }
  
  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Arquivo não encontrado: ${fullPath}`);
    console.error('\n📝 Como exportar:');
    console.error('   1. Execute scripts/migrate/sql/02_export_empresas.sql no SQL Server');
    console.error('   2. No SSMS: Query -> Results -> Results to File');
    console.error('   3. Salve como: data/empresas_export.csv');
    process.exit(1);
  }
  
  try {
    console.log('📥 Lendo arquivo CSV...');
    const empresas = readCSV(fullPath);
    
    if (empresas.length === 0) {
      console.log('⚠️  Nenhuma empresa encontrada no arquivo CSV.');
      return;
    }
    
    console.log(`✅ Encontradas ${empresas.length} empresas no CSV\n`);
    
    const supabase = createServerClient();
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const empresa of empresas) {
      const result = await migrateEmpresaFromCSV(supabase, empresa, dryRun);
      
      if (result.success) {
        console.log(result.message);
        successCount++;
      } else {
        if (result.message.includes('já existe')) {
          skippedCount++;
          console.log(`⏭️  ${result.message}`);
        } else {
          errorCount++;
          console.error(`❌ ${result.message}`);
        }
      }
    }
    
    console.log('\n📊 Resumo da Importação:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ⏭️  Ignoradas (já existem): ${skippedCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📦 Total: ${empresas.length}`);
    
  } catch (error: any) {
    console.error('❌ Erro durante importação:', error.message);
    process.exit(1);
    }
}

if (require.main === module) {
  main();
}

export { migrateEmpresaFromCSV, readCSV };

