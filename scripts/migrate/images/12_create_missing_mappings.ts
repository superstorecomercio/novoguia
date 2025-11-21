/**
 * Script para criar mapeamentos faltantes para empresas com campanhas
 * Busca empresas no CSV de empresas e cria o mapeamento
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

interface EmpresaCSV {
  id_legado: number;
  nome: string;
}

function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readEmpresasCSV(filePath: string): EmpresaCSV[] {
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
                   firstLineParts[0]?.toLowerCase().includes('nome');
  
  const startIndex = isHeader ? 1 : 0;
  const empresas: EmpresaCSV[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length < 2) continue;
    
    const idLegado = parseInt(values[0] || '0', 10);
    const nome = values[1] || '';
    
    if (!idLegado || isNaN(idLegado) || !nome || nome === 'NULL' || nome === 'null') continue;
    
    empresas.push({
      id_legado: idLegado,
      nome: nome,
    });
  }
  
  return empresas;
}

async function createMappingForEmpresa(
  supabase: any,
  empresa: { id: string; nome: string; slug: string },
  empresaIdLegado: number
): Promise<{ success: boolean; message: string }> {
  // Verificar se mapeamento já existe
  const { data: existingMap } = await supabase
    .from('migration_empresas_map')
    .select('id_novo')
    .eq('id_legado', empresaIdLegado)
    .maybeSingle();
  
  if (existingMap) {
    return {
      success: true,
      message: `⏭️  Mapeamento já existe para ${empresa.nome}`,
    };
  }

  // Criar mapeamento
  const { error } = await supabase.from('migration_empresas_map').insert({
    id_legado: empresaIdLegado,
    id_novo: empresa.id,
    nome: empresa.nome,
  });
  
  if (error) {
    return {
      success: false,
      message: `❌ Erro ao criar mapeamento: ${error.message}`,
    };
  }
  
  return {
    success: true,
    message: `✅ Mapeamento criado: ${empresa.nome} (ID legado: ${empresaIdLegado})`,
  };
}

async function main() {
  console.log('🔍 Criando mapeamentos faltantes para empresas com campanhas...\n');

  // 1. Buscar empresas com campanhas
  const { data: campanhas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .not('empresa_id', 'is', null);

  const empresaIdsComCampanhas = [...new Set(campanhas?.map(c => c.empresa_id) || [])];
  console.log(`✅ ${empresaIdsComCampanhas.length} empresas com campanhas\n`);

  // 2. Buscar empresas
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome, slug')
    .in('id', empresaIdsComCampanhas);

  // 3. Buscar mapeamentos existentes
  const { data: empresaMap } = await supabase
    .from('migration_empresas_map')
    .select('id_legado, id_novo');

  const mapNovoParaLegado = new Map(
    empresaMap?.map(m => [m.id_novo, m.id_legado]) || []
  );

  // 4. Filtrar empresas sem mapeamento
  const empresasSemMapeamento = empresas?.filter(e => !mapNovoParaLegado.has(e.id)) || [];
  console.log(`⚠️  ${empresasSemMapeamento.length} empresas sem mapeamento\n`);

  if (empresasSemMapeamento.length === 0) {
    console.log('✅ Todas as empresas já têm mapeamento!');
    return;
  }

  // 5. Ler CSV de empresas
  const csvPath = path.join(process.cwd(), 'data', 'empresas_export.csv');
  console.log(`📖 Lendo CSV de empresas: ${csvPath}`);
  const empresasCSV = readEmpresasCSV(csvPath);
  console.log(`✅ ${empresasCSV.length} empresas encontradas no CSV\n`);

  // 6. Criar índice por slug para busca rápida
  const empresasCSVPorSlug = new Map<string, EmpresaCSV>();
  for (const empresaCSV of empresasCSV) {
    const slug = generateSlug(empresaCSV.nome);
    if (!empresasCSVPorSlug.has(slug)) {
      empresasCSVPorSlug.set(slug, empresaCSV);
    }
  }

  // 7. Tentar encontrar e criar mapeamentos
  let sucesso = 0;
  let erros = 0;
  let naoEncontradas = 0;

  console.log('🔄 Criando mapeamentos...\n');

  for (const empresa of empresasSemMapeamento) {
    const empresaCSV = empresasCSVPorSlug.get(empresa.slug);
    
    if (!empresaCSV) {
      console.log(`❌ ${empresa.nome}: Não encontrada no CSV (slug: ${empresa.slug})`);
      naoEncontradas++;
      continue;
    }

    const resultado = await createMappingForEmpresa(
      supabase,
      empresa,
      empresaCSV.id_legado
    );

    if (resultado.success) {
      if (resultado.message.includes('já existe')) {
        // Não contar como sucesso novo
      } else {
        sucesso++;
      }
      console.log(resultado.message);
    } else {
      erros++;
      console.log(resultado.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO');
  console.log('='.repeat(80));
  console.log(`✅ Mapeamentos criados: ${sucesso}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`⚠️  Não encontradas no CSV: ${naoEncontradas}`);
  console.log(`📦 Total processadas: ${empresasSemMapeamento.length}`);
  console.log('='.repeat(80));
}

main().catch(console.error);

