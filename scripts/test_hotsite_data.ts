import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testHotsiteData() {
  console.log('🔍 Testando busca de hotsites para São Paulo...\n');
  
  // Buscar empresas com campanhas ativas
  const hoje = new Date().toISOString().split('T')[0];
  const { data: empresasComCampanhasAtivas } = await supabase
    .from('campanhas')
    .select('empresa_id')
    .eq('ativo', true)
    .or(`data_fim.is.null,data_fim.gte.${hoje}`);
  
  const empresaIdsAtivas = [...new Set(empresasComCampanhasAtivas?.map(c => c.empresa_id) || [])];
  console.log(`📊 Empresas com campanhas ativas: ${empresaIdsAtivas.length}\n`);
  
  // Buscar uma empresa de São Paulo
  const normalizeForSearch = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cidadeNome = 'sao paulo';
  const cidadeNomeNormalizado = normalizeForSearch(cidadeNome);
  
  const { data: hotsites } = await supabase
    .from('hotsites')
    .select('empresa_id, cidade, estado, logo_url, foto1_url, descricao, nome_exibicao')
    .in('empresa_id', empresaIdsAtivas)
    .eq('estado', 'SP');
  
  const hotsitesFiltrados = hotsites?.filter(h => 
    h.cidade && normalizeForSearch(h.cidade).includes(cidadeNomeNormalizado)
  ) || [];
  
  console.log(`🏙️ Hotsites encontrados para São Paulo: ${hotsitesFiltrados.length}\n`);
  
  if (hotsitesFiltrados.length > 0) {
    const primeiro = hotsitesFiltrados[0];
    console.log('📝 Primeiro hotsite:');
    console.log('  Empresa ID:', primeiro.empresa_id);
    console.log('  Cidade:', primeiro.cidade);
    console.log('  Estado:', primeiro.estado);
    console.log('  Logo URL:', primeiro.logo_url || '(vazio)');
    console.log('  Foto1 URL:', primeiro.foto1_url || '(vazio)');
    console.log('  Descrição:', primeiro.descricao ? primeiro.descricao.substring(0, 50) + '...' : '(vazio)');
    console.log('  Nome Exibição:', primeiro.nome_exibicao || '(vazio)');
    
    // Buscar empresa completa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id, nome, slug')
      .eq('id', primeiro.empresa_id)
      .single();
    
    if (empresa) {
      console.log('\n🏢 Empresa:');
      console.log('  Nome:', empresa.nome);
      console.log('  Slug:', empresa.slug);
    }
  }
}

testHotsiteData().catch(console.error);

