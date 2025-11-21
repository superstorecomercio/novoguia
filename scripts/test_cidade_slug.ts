import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testCidadeSlug() {
  const slug = 'sao-paulo-sp';
  console.log('🔍 Testando slug:', slug);
  
  // Parse do slug
  const parts = slug.split('-');
  const estadosBR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  
  let estadoNome: string | null = null;
  let cidadeNome: string;
  
  if (parts.length >= 2 && estadosBR.includes(parts[parts.length - 1].toUpperCase())) {
    estadoNome = parts[parts.length - 1].toUpperCase();
    cidadeNome = parts.slice(0, -1).join(' ');
  } else {
    cidadeNome = parts.join(' ');
  }
  
  console.log('📋 Parse:');
  console.log('  Cidade:', cidadeNome);
  console.log('  Estado:', estadoNome);
  
  // Buscar empresas com campanhas ativas
  const hoje = new Date().toISOString().split('T')[0];
  const { data: empresasComCampanhasAtivas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .eq('ativo', true)
    .or(`data_fim.is.null,data_fim.gte.${hoje}`);
  
  const empresaIdsAtivas = [...new Set(empresasComCampanhasAtivas?.map(c => c.empresa_id) || [])];
  console.log('\n📊 Empresas com campanhas ativas:', empresaIdsAtivas.length);
  
  if (empresaIdsAtivas.length === 0) {
    console.log('❌ Nenhuma empresa com campanha ativa encontrada!');
    return;
  }
  
  // Normalizar nome da cidade para busca (remover acentos)
  const normalizeForSearch = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cidadeNomeNormalizado = normalizeForSearch(cidadeNome);
  
  // Buscar TODOS os hotsites primeiro (para fazer busca case-insensitive e sem acentos)
  let query = supabase
    .from('hotsites')
    .select('cidade, estado, empresa_id')
    .in('empresa_id', empresaIdsAtivas);
  
  if (estadoNome) {
    query = query.eq('estado', estadoNome);
  }
  
  const { data: todosHotsites, error } = await query;
  
  // Filtrar localmente por nome normalizado (sem acentos)
  const hotsites = todosHotsites?.filter(h => 
    h.cidade && normalizeForSearch(h.cidade).includes(cidadeNomeNormalizado)
  ) || [];
  
  if (error) {
    console.error('❌ Erro ao buscar hotsites:', error);
    return;
  }
  
  console.log('\n🏙️ Hotsites encontrados:', hotsites?.length || 0);
  
  if (hotsites && hotsites.length > 0) {
    console.log('\n📝 Primeiros hotsites:');
    hotsites.forEach((h, i) => {
      console.log(`  ${i + 1}. Cidade: "${h.cidade}", Estado: "${h.estado}"`);
    });
    
    // Verificar variações do nome
    console.log('\n🔎 Verificando variações do nome "São Paulo":');
    const variacoes = ['São Paulo', 'Sao Paulo', 'são paulo', 'sao paulo', 'SAO PAULO'];
    for (const variacao of variacoes) {
      const { data } = await supabase
        .from('hotsites')
        .select('cidade, estado')
        .in('empresa_id', empresaIdsAtivas)
        .ilike('cidade', variacao)
        .eq('estado', 'SP')
        .limit(1);
      console.log(`  "${variacao}": ${data?.length || 0} encontrado(s)`);
    }
  } else {
    console.log('❌ Nenhum hotsite encontrado para esta cidade!');
    
    // Verificar todas as cidades disponíveis
    console.log('\n🔍 Verificando cidades disponíveis no banco:');
    const { data: todasCidades } = await supabase
      .from('hotsites')
      .select('cidade, estado')
      .in('empresa_id', empresaIdsAtivas)
      .not('cidade', 'is', null)
      .not('estado', 'is', null)
      .limit(20);
    
    const cidadesUnicas = new Set(todasCidades?.map(h => `${h.cidade}-${h.estado}`) || []);
    console.log(`\n📋 Total de cidades únicas encontradas: ${cidadesUnicas.size}`);
    console.log('Primeiras 10:');
    Array.from(cidadesUnicas).slice(0, 10).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c}`);
    });
  }
}

testCidadeSlug().catch(console.error);

