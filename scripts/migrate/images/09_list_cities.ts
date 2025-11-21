/**
 * Script para listar cidades do banco
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listCities() {
  console.log('🔍 Listando cidades no banco...\n');

  // Buscar cidades que podem ser as que estamos procurando
  const { data: cidadesSP } = await supabase
    .from('cidades')
    .select('id, nome, estado')
    .eq('estado', 'SP')
    .or('nome.ilike.%sao bernardo%,nome.ilike.%bernardo%,nome.ilike.%praia grande%,nome.ilike.%praia%')
    .limit(10);

  const { data: cidadesRJ } = await supabase
    .from('cidades')
    .select('id, nome, estado')
    .eq('estado', 'RJ')
    .or('nome.ilike.%niteroi%,nome.ilike.%niter%')
    .limit(10);

  const { data: cidadesMS } = await supabase
    .from('cidades')
    .select('id, nome, estado')
    .eq('estado', 'MS')
    .or('nome.ilike.%campo grande%,nome.ilike.%campo%')
    .limit(10);

  console.log('Cidades em SP (São Bernardo, Praia Grande):');
  cidadesSP?.forEach(c => {
    console.log(`  - ${c.nome} - ${c.estado} (ID: ${c.id})`);
  });

  console.log('\nCidades em RJ (Niterói):');
  cidadesRJ?.forEach(c => {
    console.log(`  - ${c.nome} - ${c.estado} (ID: ${c.id})`);
  });

  console.log('\nCidades em MS (Campo Grande):');
  cidadesMS?.forEach(c => {
    console.log(`  - ${c.nome} - ${c.estado} (ID: ${c.id})`);
  });

  // Verificar total de cidades
  const { count } = await supabase
    .from('cidades')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total de cidades no banco: ${count}`);
}

listCities().catch(console.error);

