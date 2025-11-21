/**
 * Script para verificar se as cidades existem no banco
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

async function checkCities() {
  const cidadesParaVerificar = [
    { nome: 'São Bernardo do Campo', estado: 'SP' },
    { nome: 'Niterói', estado: 'RJ' },
    { nome: 'Praia Grande', estado: 'SP' },
    { nome: 'Campo Grande', estado: 'MS' },
  ];

  console.log('🔍 Verificando cidades no banco...\n');

  for (const cidade of cidadesParaVerificar) {
    // Busca exata
    const { data: exacta } = await supabase
      .from('cidades')
      .select('id, nome, estado')
      .eq('estado', cidade.estado)
      .ilike('nome', cidade.nome)
      .maybeSingle();

    if (exacta) {
      console.log(`✅ ${cidade.nome} - ${cidade.estado}: Encontrada (ID: ${exacta.id})`);
    } else {
      // Busca parcial
      const { data: parcial } = await supabase
        .from('cidades')
        .select('id, nome, estado')
        .eq('estado', cidade.estado)
        .ilike('nome', `%${cidade.nome}%`)
        .limit(5);

      if (parcial && parcial.length > 0) {
        console.log(`⚠️  ${cidade.nome} - ${cidade.estado}: Não encontrada exata, mas encontradas similares:`);
        parcial.forEach(c => {
          console.log(`   - ${c.nome} - ${c.estado} (ID: ${c.id})`);
        });
      } else {
        console.log(`❌ ${cidade.nome} - ${cidade.estado}: Não encontrada`);
      }
    }
  }
}

checkCities().catch(console.error);

