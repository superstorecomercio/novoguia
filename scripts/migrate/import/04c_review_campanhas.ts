/**
 * Revisa campanhas importadas
 * 
 * Uso:
 *   npx tsx scripts/migrate/import/04c_review_campanhas.ts
 */

// Carregar variáveis de ambiente ANTES de qualquer importação
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase diretamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Função principal
 */
async function main() {
  console.log('🔍 Revisando campanhas importadas...\n');
  
  try {
    // 1. Contar total de campanhas
    const { count: totalCampanhas, error: countError } = await supabase
      .from('campanhas')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar campanhas:', countError.message);
      return;
    }
    
    console.log(`📊 Total de campanhas: ${totalCampanhas}\n`);
    
    // 2. Contar campanhas ativas vs inativas
    const { count: ativasCount } = await supabase
      .from('campanhas')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);
    
    const { count: inativasCount } = await supabase
      .from('campanhas')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', false);
    
    console.log(`📈 Status das Campanhas:`);
    console.log(`   ✅ Ativas: ${ativasCount} (empresas que RECEBEM orçamentos)`);
    console.log(`   ❌ Inativas: ${inativasCount} (empresas que NÃO recebem orçamentos)\n`);
    
    // 3. Contar campanhas com hotsite vinculado
    const { count: comHotsite } = await supabase
      .from('campanhas')
      .select('*', { count: 'exact', head: true })
      .not('hotsite_id', 'is', null);
    
    const { count: semHotsite } = await supabase
      .from('campanhas')
      .select('*', { count: 'exact', head: true })
      .is('hotsite_id', null);
    
    console.log(`🔗 Vinculação com Hotsites:`);
    console.log(`   ✅ Com hotsite: ${comHotsite}`);
    console.log(`   ⚠️  Sem hotsite: ${semHotsite}\n`);
    
    // 4. Contar campanhas com cidade vinculada
    const { count: comCidade } = await supabase
      .from('campanhas')
      .select('*', { count: 'exact', head: true })
      .not('cidade_id', 'is', null);
    
    console.log(`📍 Vinculação com Cidades:`);
    console.log(`   ✅ Com cidade: ${comCidade}`);
    console.log(`   ⚠️  Sem cidade: ${totalCampanhas - comCidade}\n`);
    
    // 5. Verificar campanhas vencidas mas ainda ativas
    const hoje = new Date().toISOString().split('T')[0];
    const { data: vencidasAtivas } = await supabase
      .from('campanhas')
      .select('id, empresa_id, data_fim, ativo')
      .eq('ativo', true)
      .not('data_fim', 'is', null)
      .lt('data_fim', hoje);
    
    if (vencidasAtivas && vencidasAtivas.length > 0) {
      console.log(`⚠️  Campanhas Vencidas mas Ainda Ativas: ${vencidasAtivas.length}`);
      console.log(`   Essas campanhas têm data_fim no passado mas estão marcadas como ativas.\n`);
    }
    
    // 6. Verificar planos usados
    const { data: planosData } = await supabase
      .from('campanhas')
      .select('plano_id')
      .limit(1000);
    
    if (planosData) {
      const planosUnicos = new Set(planosData.map(c => c.plano_id).filter(Boolean));
      console.log(`📋 Planos Utilizados: ${planosUnicos.size} plano(s) único(s)\n`);
    }
    
    // 7. Estatísticas de valores
    const { data: valoresData } = await supabase
      .from('campanhas')
      .select('valor_total')
      .not('valor_total', 'is', null)
      .limit(1000);
    
    if (valoresData && valoresData.length > 0) {
      const valores = valoresData.map(c => c.valor_total).filter(v => v !== null) as number[];
      const soma = valores.reduce((acc, val) => acc + val, 0);
      const media = soma / valores.length;
      const max = Math.max(...valores);
      const min = Math.min(...valores);
      
      console.log(`💰 Estatísticas de Valores:`);
      console.log(`   Total de campanhas com valor: ${valores.length}`);
      console.log(`   Soma total: R$ ${soma.toFixed(2)}`);
      console.log(`   Média: R$ ${media.toFixed(2)}`);
      console.log(`   Maior valor: R$ ${max.toFixed(2)}`);
      console.log(`   Menor valor: R$ ${min.toFixed(2)}\n`);
    }
    
    // 8. Exemplos de campanhas ativas
    console.log(`📋 Exemplos de Campanhas Ativas (primeiras 5):`);
    const { data: exemplos } = await supabase
      .from('campanhas')
      .select(`
        id,
        empresa_id,
        plano_id,
        hotsite_id,
        cidade_id,
        data_inicio,
        data_fim,
        ativo,
        valor_total,
        empresas!inner(nome),
        planos_publicidade!inner(nome)
      `)
      .eq('ativo', true)
      .limit(5);
    
    if (exemplos && exemplos.length > 0) {
      exemplos.forEach((campanha: any, index: number) => {
        console.log(`\n   ${index + 1}. Empresa: ${campanha.empresas?.nome || 'N/A'}`);
        console.log(`      Plano: ${campanha.planos_publicidade?.nome || 'N/A'}`);
        console.log(`      Data início: ${campanha.data_inicio}`);
        console.log(`      Data fim: ${campanha.data_fim || 'Sem vencimento'}`);
        console.log(`      Valor: ${campanha.valor_total ? `R$ ${campanha.valor_total.toFixed(2)}` : 'N/A'}`);
        console.log(`      Hotsite: ${campanha.hotsite_id ? '✅ Vinculado' : '❌ Não vinculado'}`);
        console.log(`      Status: ${campanha.ativo ? '✅ ATIVA (recebe orçamentos)' : '❌ INATIVA (não recebe orçamentos)'}`);
      });
    }
    
    console.log('\n✅ Revisão concluída!');
    
  } catch (error: any) {
    console.error('❌ Erro durante revisão:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export {};

