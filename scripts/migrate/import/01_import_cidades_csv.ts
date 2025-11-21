/**
 * Importa cidades de um arquivo CSV exportado do SQL Server
 * 
 * Uso:
 *   1. Exporte cidades do SQL Server usando: sql/01_export_cidades.sql
 *   2. Salve o arquivo como: data/cidades_export.csv
 *   3. Execute: npx tsx scripts/migrate/import/01_import_cidades_csv.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createServerClient } from '../../../lib/supabase/server';

interface CidadeCSV {
  id_legado: number;
  nome: string;
  estado?: string;
  descricao?: string;
  regiao?: string;
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
 * Lê arquivo CSV e converte para array de objetos
 */
function readCSV(filePath: string): CidadeCSV[] {
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
    // Sem cabeçalhos, usar ordem padrão
    headers = ['id_legado', 'nome', 'estado', 'descricao', 'regiao'];
    startIndex = 0;
  }
  
  const cidades: CidadeCSV[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim());
    const cidade: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      if (value && value !== 'NULL' && value !== '' && value !== null) {
        // Converter id_legado para número
        if (header === 'id_legado') {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            cidade[header] = numValue;
          }
        } else {
          cidade[header] = value;
        }
      }
    });
    
    // Validar que tem pelo menos nome
    if (cidade.nome) {
      cidades.push(cidade);
    }
  }
  
  return cidades;
}

/**
 * Migra cidade do CSV para Supabase
 */
async function migrateCityFromCSV(
  supabase: any,
  cidade: CidadeCSV,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string; cidadeId?: string }> {
  const slug = generateSlug(cidade.nome);
  
  // Verificar se já existe
  const { data: existing } = await supabase
    .from('cidades')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (existing && !dryRun) {
    // Salvar mapeamento mesmo se já existe
    await supabase.from('migration_cidades_map').upsert({
      id_legado: cidade.id_legado,
      id_novo: existing.id,
      nome: cidade.nome,
    });
    
    return {
      success: false,
      message: `Cidade ${cidade.nome} já existe (slug: ${slug})`,
      cidadeId: existing.id,
    };
  }
  
  if (dryRun) {
    return {
      success: true,
      message: `[DRY RUN] Criaria cidade: ${cidade.nome} (${slug})`,
    };
  }
  
  // Inserir no Supabase
  // Se estado for NULL, usar 'XX' como padrão (você pode ajustar depois)
  const estado = cidade.estado?.toUpperCase() || 'XX';
  
  const { data: cidadeData, error } = await supabase
    .from('cidades')
    .insert({
      nome: cidade.nome,
      estado: estado,
      slug: slug,
      descricao: cidade.descricao || null,
      regiao: cidade.regiao?.toLowerCase() || null,
    })
    .select('id')
    .single();
  
  if (error) {
    return {
      success: false,
      message: `Erro ao inserir ${cidade.nome}: ${error.message}`,
    };
  }
  
  // Salvar mapeamento
  await supabase.from('migration_cidades_map').insert({
    id_legado: cidade.id_legado,
    id_novo: cidadeData.id,
    nome: cidade.nome,
  });
  
  return {
    success: true,
    message: `✅ Migrada: ${cidade.nome} (${slug})`,
    cidadeId: cidadeData.id,
  };
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const csvPath = args.find(arg => arg.endsWith('.csv')) || 'data/cidades_export.csv';
  
  console.log('🚀 Iniciando importação de cidades do CSV...');
  console.log(`📁 Arquivo: ${csvPath}`);
  if (dryRun) {
    console.log('⚠️  MODO DRY RUN - Nenhum dado será inserido\n');
  }
  
  // Verificar se arquivo existe
  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Arquivo não encontrado: ${fullPath}`);
    console.error('\n📝 Como exportar:');
    console.error('   1. Execute scripts/migrate/sql/01_export_cidades.sql no SQL Server');
    console.error('   2. No SSMS: Query -> Results -> Results to File');
    console.error('   3. Salve como: data/cidades_export.csv');
    process.exit(1);
  }
  
  try {
    // Ler CSV
    console.log('📥 Lendo arquivo CSV...');
    const cidades = readCSV(fullPath);
    
    if (cidades.length === 0) {
      console.log('⚠️  Nenhuma cidade encontrada no arquivo CSV.');
      return;
    }
    
    console.log(`✅ Encontradas ${cidades.length} cidades no CSV\n`);
    
    // Conectar ao Supabase
    const supabase = createServerClient();
    
    // Migrar cada cidade
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const cidade of cidades) {
      const result = await migrateCityFromCSV(supabase, cidade, dryRun);
      
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
    
    // Resumo
    console.log('\n📊 Resumo da Importação:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ⏭️  Ignoradas (já existem): ${skippedCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📦 Total: ${cidades.length}`);
    
  } catch (error: any) {
    console.error('❌ Erro durante importação:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { migrateCityFromCSV, readCSV };

