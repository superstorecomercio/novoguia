require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Funções simplificadas para teste
async function getEmpresasCountByTipo(cidadeSlug: string) {
  const { data: cidade } = await supabase
    .from('cidades')
    .select('id')
    .eq('slug', cidadeSlug)
    .single();
  
  if (!cidade) return { mudanca: 0, carreto: 0, guardamoveis: 0, transportadora: 0, montador: 0 };
  
  const hoje = new Date().toISOString().split('T')[0];
  const { data: empresasComCampanhasAtivas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .eq('ativo', true)
    .or(`data_fim.is.null,data_fim.gte.${hoje}`);
  
  const empresaIdsAtivas = [...new Set(empresasComCampanhasAtivas?.map(c => c.empresa_id) || [])];
  
  if (empresaIdsAtivas.length === 0) {
    return { mudanca: 0, carreto: 0, guardamoveis: 0, transportadora: 0, montador: 0 };
  }
  
  const { data: empresas } = await supabase
    .from('empresas')
    .select('id, empresa_servicos(tipo_servico)')
    .eq('cidade_id', cidade.id)
    .eq('ativo', true)
    .in('id', empresaIdsAtivas);
  
  const counts = { mudanca: 0, carreto: 0, guardamoveis: 0, transportadora: 0, montador: 0 };
  
  empresas?.forEach((empresa: any) => {
    empresa.empresa_servicos?.forEach((servico: any) => {
      const tipo = servico.tipo_servico;
      if (tipo in counts) {
        counts[tipo as keyof typeof counts]++;
      }
    });
  });
  
  return counts;
}

async function getEmpresasByCidade(cidadeSlug: string, serviceType?: string) {
  const { data: cidade } = await supabase
    .from('cidades')
    .select('id')
    .eq('slug', cidadeSlug)
    .single();
  
  if (!cidade) return [];
  
  const hoje = new Date().toISOString().split('T')[0];
  const { data: empresasComCampanhasAtivas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .eq('ativo', true)
    .or(`data_fim.is.null,data_fim.gte.${hoje}`);
  
  const empresaIdsAtivas = [...new Set(empresasComCampanhasAtivas?.map(c => c.empresa_id) || [])];
  
  if (empresaIdsAtivas.length === 0) return [];
  
  let query = supabase
    .from('empresas')
    .select('id, nome, slug, empresa_servicos(tipo_servico)')
    .eq('cidade_id', cidade.id)
    .eq('ativo', true)
    .in('id', empresaIdsAtivas);
  
  const { data: empresas } = await query;
  
  if (!empresas) return [];
  
  let empresasFiltradas = empresas;
  
  if (serviceType) {
    empresasFiltradas = empresas.filter((emp: any) =>
      emp.empresa_servicos?.some((s: any) => s.tipo_servico === serviceType)
    );
  }
  
  return empresasFiltradas.map((emp: any) => ({
    id: emp.id,
    name: emp.nome,
    slug: emp.slug,
    serviceTypes: emp.empresa_servicos?.map((s: any) => s.tipo_servico) || [],
  }));
}

async function main() {
  console.log('🧪 Testando filtros no site...\n');
  
  const cidadeSlug = 'sao-paulo';
  
  try {
    // Teste 1: Contagem por tipo
    console.log('1️⃣ Contagem de empresas por tipo em São Paulo:');
    const counts = await getEmpresasCountByTipo(cidadeSlug);
    console.log(`   Mudanças: ${counts.mudanca}`);
    console.log(`   Carretos: ${counts.carreto}`);
    console.log(`   Guarda-Móveis: ${counts.guardamoveis}`);
    console.log(`   Transportadora: ${counts.transportadora}`);
    console.log(`   Montador: ${counts.montador}\n`);
    
    // Teste 2: Buscar empresas de mudança
    console.log('2️⃣ Empresas de Mudança:');
    const mudancas = await getEmpresasByCidade(cidadeSlug, 'mudanca');
    console.log(`   Total encontradas: ${mudancas.length}`);
    if (mudancas.length > 0) {
      console.log(`   Primeiras 3:`);
      mudancas.slice(0, 3).forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.name} - Tipos: ${emp.serviceTypes?.join(', ') || 'N/A'}`);
      });
    }
    console.log('');
    
    // Teste 3: Buscar empresas de carreto
    console.log('3️⃣ Empresas de Carreto:');
    const carretos = await getEmpresasByCidade(cidadeSlug, 'carreto');
    console.log(`   Total encontradas: ${carretos.length}`);
    if (carretos.length > 0) {
      console.log(`   Primeiras 3:`);
      carretos.slice(0, 3).forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.name} - Tipos: ${emp.serviceTypes?.join(', ') || 'N/A'}`);
      });
    }
    console.log('');
    
    // Teste 4: Buscar empresas de guarda-móveis
    console.log('4️⃣ Empresas de Guarda-Móveis:');
    const guardamoveis = await getEmpresasByCidade(cidadeSlug, 'guardamoveis');
    console.log(`   Total encontradas: ${guardamoveis.length}`);
    if (guardamoveis.length > 0) {
      console.log(`   Primeiras 3:`);
      guardamoveis.slice(0, 3).forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.name} - Tipos: ${emp.serviceTypes?.join(', ') || 'N/A'}`);
      });
    }
    console.log('');
    
    // Teste 5: Verificar mapeamento tipoempresa
    console.log('5️⃣ Verificando mapeamento tipoempresa → empresa_servicos:');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Buscar alguns hotsites com tipoempresa
    const { data: hotsites } = await supabase
      .from('hotsites')
      .select('empresa_id, tipoempresa')
      .not('tipoempresa', 'is', null)
      .limit(10);
    
    if (hotsites && hotsites.length > 0) {
      console.log(`   Encontrados ${hotsites.length} hotsites com tipoempresa`);
      
      for (const hotsite of hotsites.slice(0, 5)) {
        const { data: servicos } = await supabase
          .from('empresa_servicos')
          .select('tipo_servico')
          .eq('empresa_id', hotsite.empresa_id);
        
        console.log(`   Empresa ${hotsite.empresa_id.substring(0, 8)}...`);
        console.log(`     tipoempresa: ${hotsite.tipoempresa}`);
        console.log(`     empresa_servicos: ${servicos?.map(s => s.tipo_servico).join(', ') || 'Nenhum'}`);
      }
    }
    
    console.log('\n✅ Testes concluídos!');
    
  } catch (error: any) {
    console.error('❌ Erro durante teste:', error.message);
    console.error(error);
  }
}

main();

