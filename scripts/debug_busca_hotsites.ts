import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function debugBusca() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Buscando empresa "TR MUDANÇAS SP"...\n');

  // Buscar empresa por nome (várias variações)
  console.log('Buscando por "TR MUDANÇAS"...');
  const { data: empresas1 } = await supabase
    .from('empresas')
    .select('id, nome, slug, ativo')
    .ilike('nome', '%TR%MUDANÇAS%')
    .limit(10);

  console.log('Buscando por "TR MUDANCAS" (sem acento)...');
  const { data: empresas2 } = await supabase
    .from('empresas')
    .select('id, nome, slug, ativo')
    .ilike('nome', '%TR%MUDANCAS%')
    .limit(10);

  console.log('Buscando por slug "tr-mudancas"...');
  const { data: empresas3 } = await supabase
    .from('empresas')
    .select('id, nome, slug, ativo')
    .ilike('slug', '%tr-mudancas%')
    .limit(10);

  // Combinar resultados únicos
  const todasEmpresas = [...(empresas1 || []), ...(empresas2 || []), ...(empresas3 || [])];
  const empresasUnicas = Array.from(
    new Map(todasEmpresas.map(emp => [emp.id, emp])).values()
  );

  const empresas = empresasUnicas;
  const empresaError = null;

  if (empresaError) {
    console.error('❌ Erro ao buscar empresas:', empresaError);
    return;
  }

  console.log(`✅ Encontradas ${empresas?.length || 0} empresas:`);
  empresas?.forEach((emp) => {
    console.log(`  - ${emp.nome} (slug: ${emp.slug}, ativo: ${emp.ativo})`);
  });

  // Encontrar especificamente "TR Mudanças SP"
  const empresaTR = empresas?.find(emp => 
    emp.slug === 'tr-mudancas-sp' ||
    (emp.nome.toLowerCase().includes('tr mudanças') && emp.nome.toLowerCase().includes('sp'))
  );

  if (empresaTR) {
    console.log(`\n✅ Empresa encontrada: ${empresaTR.nome} (ID: ${empresaTR.id}, slug: ${empresaTR.slug})\n`);
    const empresaId = empresaTR.id;
    console.log(`\n🔍 Buscando hotsites para empresa ID: ${empresaId}\n`);

    // Buscar hotsites dessa empresa
    const { data: hotsites, error: hotsiteError } = await supabase
      .from('hotsites')
      .select('id, empresa_id, nome_exibicao, cidade, estado')
      .eq('empresa_id', empresaId);

    if (hotsiteError) {
      console.error('❌ Erro ao buscar hotsites:', hotsiteError);
      return;
    }

    console.log(`✅ Encontrados ${hotsites?.length || 0} hotsites:`);
    hotsites?.forEach((h) => {
      console.log(`  - ${h.nome_exibicao || 'Sem nome'} (cidade: ${h.cidade}, estado: ${h.estado})`);
    });

    // Buscar como na página admin (com join)
    console.log(`\n🔍 Buscando hotsites com join de empresa (como na página admin)...\n`);

    const { data: hotsitesComEmpresa, error: joinError } = await supabase
      .from('hotsites')
      .select(`
        id,
        empresa_id,
        nome_exibicao,
        descricao,
        endereco,
        cidade,
        estado,
        logo_url,
        foto1_url,
        empresa:empresas(id, nome, slug, email, telefones, ativo)
      `)
      .eq('empresa_id', empresaId);

    if (joinError) {
      console.error('❌ Erro ao buscar hotsites com join:', joinError);
      return;
    }

    console.log(`✅ Encontrados ${hotsitesComEmpresa?.length || 0} hotsites com dados da empresa:`);
    hotsitesComEmpresa?.forEach((h: any) => {
      console.log(`  - Hotsite: ${h.nome_exibicao || 'Sem nome'}`);
      console.log(`    Empresa: ${h.empresa?.nome || 'Sem empresa'} (slug: ${h.empresa?.slug || 'N/A'})`);
      console.log(`    Cidade: ${h.cidade || 'N/A'}, Estado: ${h.estado || 'N/A'}`);
      console.log('');
    });

    // Testar busca simulada
    console.log('🧪 Testando busca simulada com "tr m"...\n');

    const termoBusca = 'tr m';
    const termNormalized = termoBusca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    console.log(`Termo normalizado: "${termNormalized}"\n`);

    hotsitesComEmpresa?.forEach((h: any) => {
      const nomeHotsite = (h.nome_exibicao || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ');

      const empresaNome = (h.empresa?.nome || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ');

      const empresaSlug = (h.empresa?.slug || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const empresaSlugComEspacos = empresaSlug.replace(/-/g, ' ');

      const matchNomeHotsite = nomeHotsite.startsWith(termNormalized);
      const matchEmpresaNome = empresaNome.startsWith(termNormalized);
      const matchEmpresaSlug = empresaSlugComEspacos.startsWith(termNormalized);

      console.log(`Hotsite: ${h.nome_exibicao || 'Sem nome'}`);
      console.log(`  Nome hotsite normalizado: "${nomeHotsite}"`);
      console.log(`  Match nome hotsite: ${matchNomeHotsite}`);
      console.log(`  Nome empresa normalizado: "${empresaNome}"`);
      console.log(`  Match nome empresa: ${matchEmpresaNome}`);
      console.log(`  Slug empresa normalizado: "${empresaSlugComEspacos}"`);
      console.log(`  Match slug empresa: ${matchEmpresaSlug}`);
      console.log(`  ✅ MATCH TOTAL: ${matchNomeHotsite || matchEmpresaNome || matchEmpresaSlug}`);
      console.log('');
    });
  }
}

debugBusca().catch(console.error);

