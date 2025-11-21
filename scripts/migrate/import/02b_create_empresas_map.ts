/**
 * Cria mapeamento de empresas (migration_empresas_map) a partir do CSV
 * 
 * Este script lê o CSV de empresas e cria o mapeamento relacionando
 * os IDs legados com as empresas existentes na tabela empresas.
 * 
 * Uso:
 *   npx tsx scripts/migrate/import/02b_create_empresas_map.ts
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
  console.error('Verifique se o arquivo .env.local existe e contém:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface EmpresaCSV {
  id_legado: number;
  nome: string;
  cnpj?: string;
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
    headers = firstLine.split(separator).map(h => h.trim());
    startIndex = 1;
  } else {
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
        if (header === 'id_legado') {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            empresa[header] = numValue;
          }
        } else if (header === 'nome' || header === 'cnpj') {
          empresa[header] = value;
        }
      }
    });
    
    if (empresa.id_legado && empresa.nome && empresa.nome !== '&nbsp;' && empresa.nome.trim() !== '') {
      empresas.push(empresa);
    }
  }
  
  return empresas;
}

/**
 * Cria mapeamento para uma empresa
 */
async function createMapping(
  empresa: EmpresaCSV
): Promise<{ success: boolean; message: string }> {
  const slug = generateSlug(empresa.nome);
  
  // Buscar empresa existente pelo slug
  const { data: existing } = await supabase
    .from('empresas')
    .select('id, nome')
    .eq('slug', slug)
    .single();
  
  if (!existing) {
    return {
      success: false,
      message: `Empresa não encontrada: ${empresa.nome} (slug: ${slug})`,
    };
  }
  
  // Verificar se mapeamento já existe
  const { data: existingMap } = await supabase
    .from('migration_empresas_map')
    .select('id_novo')
    .eq('id_legado', empresa.id_legado)
    .single();
  
  if (existingMap) {
    return {
      success: true,
      message: `⏭️  Mapeamento já existe: ${empresa.nome} (ID legado: ${empresa.id_legado})`,
    };
  }
  
  // Criar mapeamento
  const { error } = await supabase.from('migration_empresas_map').insert({
    id_legado: empresa.id_legado,
    id_novo: existing.id,
    nome: empresa.nome,
  });
  
  if (error) {
    return {
      success: false,
      message: `Erro ao criar mapeamento para ${empresa.nome}: ${error.message}`,
    };
  }
  
  return {
    success: true,
    message: `✅ Mapeamento criado: ${empresa.nome} (ID legado: ${empresa.id_legado} → ${existing.id})`,
  };
}

/**
 * Cria a tabela de mapeamento se não existir
 */
async function ensureMappingTable(): Promise<boolean> {
  // Tentar criar a tabela usando SQL direto
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migration_empresas_map (
      id_legado INTEGER PRIMARY KEY,
      id_novo UUID NOT NULL REFERENCES empresas(id),
      nome VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_migration_empresas_map_legado ON migration_empresas_map(id_legado);
    CREATE INDEX IF NOT EXISTS idx_migration_empresas_map_novo ON migration_empresas_map(id_novo);
  `;
  
  // Usar RPC ou executar SQL diretamente
  // Como não temos acesso direto ao SQL, vamos tentar uma query simples primeiro
  const { error: checkError } = await supabase
    .from('migration_empresas_map')
    .select('id_legado')
    .limit(1);
  
  if (checkError && (checkError.message.includes('does not exist') || checkError.message.includes('schema cache'))) {
    console.log('⚠️  Tabela migration_empresas_map não existe.');
    console.log('\n📝 Por favor, execute o seguinte SQL no Supabase SQL Editor:');
    console.log('   Arquivo: scripts/migrate/sql/create_migration_tables.sql\n');
    console.log('Ou copie e cole este SQL:\n');
    console.log(createTableSQL);
    console.log('\n');
    return false;
  }
  
  return true;
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const csvPath = args.find(arg => arg.endsWith('.csv')) || 'data/empresas_export.csv';
  
  console.log('🚀 Criando mapeamento de empresas...');
  console.log(`📁 Arquivo: ${csvPath}\n`);
  
  // Verificar se a tabela existe
  const tableExists = await ensureMappingTable();
  if (!tableExists) {
    console.error('\n❌ Execute o SQL acima no Supabase antes de continuar.');
    process.exit(1);
  }
  
  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Arquivo não encontrado: ${fullPath}`);
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
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const empresa of empresas) {
      const result = await createMapping(empresa);
      
      if (result.success) {
        if (result.message.includes('já existe')) {
          skippedCount++;
        } else {
          successCount++;
        }
        console.log(result.message);
      } else {
        errorCount++;
        console.error(`❌ ${result.message}`);
      }
    }
    
    console.log('\n📊 Resumo do Mapeamento:');
    console.log(`   ✅ Criados: ${successCount}`);
    console.log(`   ⏭️  Já existiam: ${skippedCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📦 Total processadas: ${empresas.length}`);
    
  } catch (error: any) {
    console.error('❌ Erro durante criação do mapeamento:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { createMapping, readCSV };

