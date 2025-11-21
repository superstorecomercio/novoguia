import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function atualizarTipoEmpresa() {
  console.log('🔍 Buscando hotsites com tipoempresa vazio ou null...\n');

  // Buscar hotsites com tipoempresa null ou vazio
  const { data: hotsites, error } = await supabase
    .from('hotsites')
    .select('id, nome_exibicao, cidade, estado, tipoempresa')
    .or('tipoempresa.is.null,tipoempresa.eq.');

  if (error) {
    console.error('❌ Erro ao buscar hotsites:', error);
    return;
  }

  if (!hotsites || hotsites.length === 0) {
    console.log('✅ Nenhum hotsite com tipoempresa vazio encontrado!');
    return;
  }

  console.log(`📊 Encontrados ${hotsites.length} hotsites com tipoempresa vazio:\n`);
  
  hotsites.forEach((h, index) => {
    console.log(`${index + 1}. ${h.nome_exibicao} (${h.cidade}/${h.estado}) - ID: ${h.id}`);
  });

  console.log('\n🔄 Atualizando para "Empresa de Mudança"...\n');

  // Atualizar todos de uma vez (sem .select() para evitar problemas)
  const { error: updateError } = await supabase
    .from('hotsites')
    .update({ tipoempresa: 'Empresa de Mudança' })
    .or('tipoempresa.is.null,tipoempresa.eq.');

  if (updateError) {
    console.error('❌ Erro ao atualizar hotsites vazios:', updateError);
  } else {
    console.log(`✅ Hotsites com tipoempresa vazio atualizados!\n`);
  }

  // Atualizar tipos inválidos também
  console.log('🔄 Corrigindo tipos inválidos (Transportadoras, etc)...\n');
  
  const tiposValidos = ['Empresa de Mudança', 'Carretos', 'Guarda-Móveis'];
  
  const { error: updateInvalidError } = await supabase
    .from('hotsites')
    .update({ tipoempresa: 'Empresa de Mudança' })
    .not('tipoempresa', 'in', `(${tiposValidos.map(t => `"${t}"`).join(',')})`);

  if (updateInvalidError) {
    console.error('❌ Erro ao corrigir tipos inválidos:', updateInvalidError);
  } else {
    console.log(`✅ Tipos inválidos corrigidos!\n`);
  }

  // Verificar resultado
  const { data: verificacao } = await supabase
    .from('hotsites')
    .select('tipoempresa')
    .or('tipoempresa.is.null,tipoempresa.eq.');

  if (verificacao && verificacao.length > 0) {
    console.log('⚠️  Ainda existem hotsites com tipoempresa vazio:', verificacao.length);
  } else {
    console.log('✅ Todos os hotsites agora têm tipoempresa definido!');
  }

  // Mostrar estatísticas
  console.log('\n📊 Estatísticas atualizadas:');
  
  const { data: stats } = await supabase
    .from('hotsites')
    .select('tipoempresa');

  if (stats) {
    const contagem = stats.reduce((acc: any, h: any) => {
      const tipo = h.tipoempresa || 'Vazio';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    Object.entries(contagem).forEach(([tipo, count]) => {
      console.log(`  - ${tipo}: ${count}`);
    });
  }
}

atualizarTipoEmpresa()
  .then(() => {
    console.log('\n✅ Script concluído!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro no script:', err);
    process.exit(1);
  });
