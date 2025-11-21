/**
 * Script para corrigir os últimos 2 mapeamentos faltantes
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

function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readEmpresasCSV(filePath: string): Array<{ id_legado: number; nome: string }> {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const separator = lines[0].includes(';') ? ';' : ',';
  const firstLineParts = lines[0].split(separator);
  const isHeader = firstLineParts[0]?.toLowerCase().includes('id_legado');
  const startIndex = isHeader ? 1 : 0;
  
  const empresas: Array<{ id_legado: number; nome: string }> = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length < 2) continue;
    
    const idLegado = parseInt(values[0] || '0', 10);
    const nome = values[1] || '';
    
    if (idLegado && !isNaN(idLegado) && nome && nome !== 'NULL' && nome !== 'null') {
      empresas.push({ id_legado: idLegado, nome });
    }
  }
  
  return empresas;
}

async function main() {
  console.log('🔍 Corrigindo últimos 2 mapeamentos...\n');

  // Buscar as 2 empresas específicas
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, nome, slug')
    .in('slug', ['claudinei-mudancas-sp', 'estilo-mudancas-go']);

  console.log(`✅ ${empresas?.length || 0} empresas encontradas\n`);

  // Ler CSV
  const csvPath = path.join(process.cwd(), 'data', 'empresas_export.csv');
  const empresasCSV = readEmpresasCSV(csvPath);
  console.log(`✅ ${empresasCSV.length} empresas no CSV\n`);

  // Buscar por nome similar
  for (const empresa of empresas || []) {
    console.log(`\n🔍 Buscando: ${empresa.nome} (${empresa.slug})`);
    
    // Buscar por slug
    const slug = generateSlug(empresa.nome);
    const encontradaPorSlug = empresasCSV.find(e => generateSlug(e.nome) === slug);
    
    if (encontradaPorSlug) {
      console.log(`✅ Encontrada por slug: ID ${encontradaPorSlug.id_legado}`);
      
      // Verificar se mapeamento já existe
      const { data: existing } = await supabase
        .from('migration_empresas_map')
        .select('id_legado')
        .eq('id_novo', empresa.id)
        .maybeSingle();
      
      if (existing) {
        console.log(`⏭️  Mapeamento já existe`);
      } else {
        // Criar mapeamento
        const { error } = await supabase.from('migration_empresas_map').insert({
          id_legado: encontradaPorSlug.id_legado,
          id_novo: empresa.id,
          nome: empresa.nome,
        });
        
        if (error) {
          console.log(`❌ Erro: ${error.message}`);
        } else {
          console.log(`✅ Mapeamento criado!`);
        }
      }
    } else {
      // Buscar por nome parcial
      const encontradaParcial = empresasCSV.find(e => 
        e.nome.toLowerCase().includes(empresa.nome.toLowerCase().split(' ')[0]) ||
        empresa.nome.toLowerCase().includes(e.nome.toLowerCase().split(' ')[0])
      );
      
      if (encontradaParcial) {
        console.log(`⚠️  Encontrada parcialmente: "${encontradaParcial.nome}" (ID ${encontradaParcial.id_legado})`);
      } else {
        console.log(`❌ Não encontrada no CSV`);
      }
    }
  }
}

main().catch(console.error);

