require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

(async () => {
  const { data, error } = await supabase
    .from('hotsites')
    .select('servicos')
    .not('servicos', 'is', null)
    .limit(10);
  
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  console.log('Exemplos de serviços nos hotsites:');
  data?.forEach((h, i) => {
    console.log(`${i + 1}.`, JSON.stringify(h.servicos));
  });
  
  // Contar quantos têm serviços
  const { count } = await supabase
    .from('hotsites')
    .select('*', { count: 'exact', head: true })
    .not('servicos', 'is', null);
  
  console.log(`\nTotal de hotsites com serviços: ${count}`);
})();

