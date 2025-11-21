/**
 * Testa se a query de empresas está funcionando corretamente
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

import { getEmpresas, getEmpresasByCidade } from '../lib/db/queries/empresas';

async function main() {
  console.log('🧪 Testando query de empresas...\n');
  
  try {
    // Teste 1: Buscar todas as empresas
    console.log('1️⃣ Buscando todas as empresas...');
    const todasEmpresas = await getEmpresas();
    console.log(`   ✅ Encontradas ${todasEmpresas.length} empresas\n`);
    
    if (todasEmpresas.length > 0) {
      console.log('   Primeiras 3 empresas:');
      todasEmpresas.slice(0, 3).forEach((empresa, index) => {
        console.log(`   ${index + 1}. ${empresa.name} (${empresa.cidadeName || 'Sem cidade'})`);
        console.log(`      Plano: ${empresa.planoPublicidade || 'N/A'}`);
        console.log(`      Slug: ${empresa.slug}`);
      });
      console.log('');
    }
    
    // Teste 2: Buscar empresas por cidade (São Paulo)
    console.log('2️⃣ Buscando empresas em São Paulo...');
    const empresasSP = await getEmpresasByCidade('sao-paulo');
    console.log(`   ✅ Encontradas ${empresasSP.length} empresas em São Paulo\n`);
    
    if (empresasSP.length > 0) {
      console.log('   Primeiras 3 empresas em SP:');
      empresasSP.slice(0, 3).forEach((empresa, index) => {
        console.log(`   ${index + 1}. ${empresa.name}`);
        console.log(`      Plano: ${empresa.planoPublicidade || 'N/A'}`);
      });
      console.log('');
    }
    
    // Teste 3: Buscar empresas por cidade (Rio de Janeiro)
    console.log('3️⃣ Buscando empresas no Rio de Janeiro...');
    const empresasRJ = await getEmpresasByCidade('rio-de-janeiro');
    console.log(`   ✅ Encontradas ${empresasRJ.length} empresas no Rio de Janeiro\n`);
    
    console.log('✅ Todos os testes concluídos!');
    console.log('\n💡 Acesse http://localhost:3000 para ver o site');
    console.log('💡 Acesse http://localhost:3000/cidades/sao-paulo para ver empresas de SP');
    
  } catch (error: any) {
    console.error('❌ Erro durante teste:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export {};

