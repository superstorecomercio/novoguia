require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

(async () => {
  console.log('🔍 Verificando resultados da importação...\n');
  
  // Verificar tipos de serviço importados
  const { data: servicos, error: servicosError } = await supabase
    .from('empresa_servicos')
    .select('tipo_servico')
    .limit(10000);
  
  if (!servicosError && servicos) {
    const tipos: Record<string, number> = {};
    servicos.forEach(s => {
      tipos[s.tipo_servico] = (tipos[s.tipo_servico] || 0) + 1;
    });
    
    console.log('📊 Tipos de Serviço Importados:');
    Object.entries(tipos).forEach(([tipo, count]) => {
      console.log(`   ${tipo}: ${count} empresas`);
    });
    console.log(`\n   Total de registros: ${servicos.length}\n`);
  }
  
  // Verificar hotsites com novos campos
  const { count: hotsitesComTipo } = await supabase
    .from('hotsites')
    .select('*', { count: 'exact', head: true })
    .not('tipoempresa', 'is', null);
  
  const { count: hotsitesComEmail } = await supabase
    .from('hotsites')
    .select('*', { count: 'exact', head: true })
    .not('email', 'is', null);
  
  const { count: totalHotsites } = await supabase
    .from('hotsites')
    .select('*', { count: 'exact', head: true });
  
  console.log('📋 Hotsites Importados:');
  console.log(`   Total: ${totalHotsites}`);
  console.log(`   Com tipoempresa: ${hotsitesComTipo}`);
  console.log(`   Com email: ${hotsitesComEmail}`);
  
})();

