/**
 * Script para criar cidades faltantes e reimportar hotsites
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

// Cidades que precisamos criar
const cidadesParaCriar = [
  { nome: 'São Bernardo do Campo', estado: 'SP' },
  { nome: 'Niterói', estado: 'RJ' },
  { nome: 'Praia Grande', estado: 'SP' },
  { nome: 'Campo Grande', estado: 'MS' },
];

async function createMissingCities() {
  console.log('🔍 Verificando e criando cidades faltantes...\n');

  for (const cidade of cidadesParaCriar) {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('cidades')
      .select('id, nome')
      .eq('estado', cidade.estado)
      .ilike('nome', cidade.nome)
      .maybeSingle();

    if (existing) {
      console.log(`✅ ${cidade.nome} - ${cidade.estado}: Já existe (ID: ${existing.id})`);
      continue;
    }

    // Criar cidade
    const slug = cidade.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { data: novaCidade, error } = await supabase
      .from('cidades')
      .insert({
        nome: cidade.nome,
        estado: cidade.estado,
        slug: slug,
      })
      .select()
      .single();

    if (error) {
      console.log(`❌ Erro ao criar ${cidade.nome} - ${cidade.estado}: ${error.message}`);
    } else {
      console.log(`✅ ${cidade.nome} - ${cidade.estado}: Criada (ID: ${novaCidade?.id})`);
    }
  }

  console.log('\n✅ Verificação de cidades concluída!\n');
}

async function main() {
  await createMissingCities();
  
  // Agora executar reimportação
  console.log('🔄 Executando reimportação de hotsites...\n');
  
  // Importar função de reimportação
  const { exec } = require('child_process');
  exec('npx tsx scripts/migrate/images/07_reimport_missing_hotsites.ts', (error: any, stdout: string, stderr: string) => {
    if (error) {
      console.error(`Erro: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
}

main().catch(console.error);

