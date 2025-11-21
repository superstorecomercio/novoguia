import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarColunas() {
  console.log('🔍 Verificando estrutura da tabela hotsites...\n');

  // Buscar um hotsite qualquer para ver todas as colunas
  const { data, error } = await supabase
    .from('hotsites')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar hotsite:', error);
    return;
  }

  console.log('📋 Colunas disponíveis na tabela hotsites:');
  console.log(Object.keys(data || {}).sort().join('\n'));
  console.log('\n📊 Exemplo de hotsite:');
  console.log(JSON.stringify(data, null, 2));
}

verificarColunas()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });

