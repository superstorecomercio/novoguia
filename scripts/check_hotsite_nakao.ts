import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkNakao() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Buscando hotsite "nakao"...\n');

  // Buscar por nome_exibicao
  const { data: hotsites, error } = await supabase
    .from('hotsites')
    .select(`
      id,
      empresa_id,
      nome_exibicao,
      empresa:empresas(id, nome, slug)
    `)
    .ilike('nome_exibicao', '%nakao%')
    .limit(10);

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log(`✅ Encontrados ${hotsites?.length || 0} hotsites com "nakao" no nome:\n`);
  hotsites?.forEach((h: any) => {
    console.log(`  - ${h.nome_exibicao || 'Sem nome'}`);
    console.log(`    Empresa: ${h.empresa?.nome || 'Sem empresa'} (${h.empresa?.slug || 'N/A'})`);
    console.log(`    ID: ${h.id}`);
    console.log('');
  });

  // Testar busca simulada
  if (hotsites && hotsites.length > 0) {
    const hotsite = hotsites[0];
    console.log('🧪 Testando busca simulada com "nakao"...\n');

    const termoBusca = 'nakao';
    const termNormalized = termoBusca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    const nomeHotsite = (hotsite.nome_exibicao || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    console.log(`Termo normalizado: "${termNormalized}"`);
    console.log(`Nome hotsite normalizado: "${nomeHotsite}"`);
    console.log(`Começa com termo? ${nomeHotsite.startsWith(termNormalized)}`);
  }

  // Verificar se está sendo carregado na lista completa
  console.log('\n🔍 Verificando se está na lista completa (primeiros 1000)...\n');
  const { data: todosHotsites } = await supabase
    .from('hotsites')
    .select('id, nome_exibicao')
    .order('created_at', { ascending: false })
    .limit(1000);

  const nakaoNaLista = todosHotsites?.find((h: any) => 
    h.nome_exibicao?.toLowerCase().includes('nakao')
  );

  if (nakaoNaLista) {
    console.log(`✅ Hotsite "nakao" encontrado na lista completa:`);
    console.log(`  - ${nakaoNaLista.nome_exibicao} (ID: ${nakaoNaLista.id})`);
  } else {
    console.log('❌ Hotsite "nakao" NÃO encontrado nos primeiros 1000 hotsites');
    console.log('   (pode estar além do limite padrão do Supabase)');
  }
}

checkNakao().catch(console.error);

