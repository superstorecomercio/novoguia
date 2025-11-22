/**
 * Script de teste para verificar o rate limiting
 * 
 * Este script testa:
 * 1. Rate limiting por IP/email
 * 2. Verificação de duplicatas
 * 3. Bloqueio após exceder limite
 * 
 * IMPORTANTE: Usa dados de teste específicos para não interferir com testes manuais
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api/calcular-orcamento';

// Dados de teste (não usar emails reais)
const TEST_DATA = {
  nome: 'Teste Rate Limit',
  email: `teste-rate-limit-${Date.now()}@teste.com`, // Email único para cada execução
  whatsapp: '11999999999',
  origem: 'São Paulo, SP',
  destino: 'Guarulhos, SP',
  tipoImovel: '2_quartos' as const,
  temElevador: 'sim' as const,
  andar: 1,
  precisaEmbalagem: 'sim' as const,
};

async function fazerRequisicao(numero: number) {
  console.log(`\n📤 Requisição ${numero}...`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_DATA),
    });

    // Verificar se a resposta é JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.log(`   ❌ Resposta não é JSON. Status: ${response.status}`);
      console.log(`   Resposta (primeiros 200 chars): ${text.substring(0, 200)}`);
      return { blocked: false, status: response.status, error: 'Resposta não é JSON' };
    }

    const data = await response.json();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 429) {
      console.log(`   ⚠️ RATE LIMIT ATIVADO!`);
      console.log(`   Mensagem: ${data.error}`);
      if (data.retryAfter) {
        const minutos = Math.ceil(data.retryAfter / 1000 / 60);
        console.log(`   Retry After: ${minutos} minutos`);
      }
      return { blocked: true, status: 429 };
    }
    
    if (response.status === 409) {
      console.log(`   ⚠️ DUPLICATA DETECTADA!`);
      console.log(`   Mensagem: ${data.error}`);
      return { blocked: true, status: 409 };
    }
    
    if (response.ok) {
      console.log(`   ✅ Sucesso!`);
      console.log(`   Orçamento ID: ${data.precoMin ? 'calculado' : 'não calculado'}`);
      return { blocked: false, status: 200 };
    }
    
    console.log(`   ❌ Erro: ${data.error || 'Erro desconhecido'}`);
    return { blocked: false, status: response.status };
    
  } catch (error) {
    console.error(`   ❌ Erro na requisição:`, error);
    return { blocked: false, status: 0, error };
  }
}

async function testarRateLimiting() {
  console.log('🧪 TESTE DE RATE LIMITING');
  console.log('='.repeat(50));
  console.log(`API: ${API_URL}`);
  console.log(`Email de teste: ${TEST_DATA.email}`);
  console.log('='.repeat(50));

  const resultados: Array<{ numero: number; status: number; blocked: boolean }> = [];

  // Fazer 7 requisições (5 permitidas + 2 bloqueadas)
  for (let i = 1; i <= 7; i++) {
    const resultado = await fazerRequisicao(i);
    resultados.push({
      numero: i,
      status: resultado.status,
      blocked: resultado.blocked || false,
    });

    // Aguardar 1 segundo entre requisições
    if (i < 7) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DO TESTE');
  console.log('='.repeat(50));
  
  const sucessos = resultados.filter(r => r.status === 200).length;
  const bloqueados = resultados.filter(r => r.blocked).length;
  
  console.log(`Total de requisições: ${resultados.length}`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`🚫 Bloqueados: ${bloqueados}`);
  
  if (bloqueados > 0) {
    console.log(`\n✅ Rate limiting está funcionando!`);
    console.log(`   Primeiras ${sucessos} requisições foram permitidas`);
    console.log(`   Requisições ${sucessos + 1}+ foram bloqueadas`);
  } else {
    console.log(`\n⚠️ Rate limiting NÃO está bloqueando!`);
    console.log(`   Todas as requisições foram permitidas`);
  }

  console.log('\n📋 Detalhes:');
  resultados.forEach(r => {
    const status = r.blocked ? '🚫 BLOQUEADO' : '✅ PERMITIDO';
    console.log(`   Requisição ${r.numero}: ${status} (${r.status})`);
  });
}

async function testarDuplicatas() {
  console.log('\n\n🧪 TESTE DE DUPLICATAS');
  console.log('='.repeat(50));
  
  // Primeira requisição
  console.log('\n📤 Primeira requisição (deve funcionar)...');
  const resultado1 = await fazerRequisicao(1);
  
  if (resultado1.status === 200) {
    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Segunda requisição (mesmos dados - deve ser bloqueada)
    console.log('\n📤 Segunda requisição (mesmos dados - deve ser bloqueada)...');
    const resultado2 = await fazerRequisicao(2);
    
    if (resultado2.status === 409) {
      console.log('\n✅ Verificação de duplicatas está funcionando!');
    } else {
      console.log('\n⚠️ Verificação de duplicatas NÃO está funcionando!');
    }
  } else {
    console.log('\n⚠️ Primeira requisição falhou, não é possível testar duplicatas');
  }
}

// Verificar se o servidor está rodando
async function verificarServidor() {
  try {
    const response = await fetch(API_URL.replace('/api/calcular-orcamento', ''), {
      method: 'GET',
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Executar testes
async function main() {
  console.log('🔍 Verificando se o servidor está rodando...');
  const servidorRodando = await verificarServidor();
  
  if (!servidorRodando) {
    console.log('⚠️ Servidor não está respondendo!');
    console.log(`   Certifique-se de que o servidor está rodando em: ${API_URL.replace('/api/calcular-orcamento', '')}`);
    console.log('   Execute: npm run dev');
    console.log('\n💡 Este script usa emails únicos (com timestamp) e NÃO interfere com seus testes manuais!');
    process.exit(1);
  }
  
  console.log('✅ Servidor está rodando!\n');
  
  try {
    // Teste 1: Rate limiting
    await testarRateLimiting();
    
    // Aguardar um pouco antes do próximo teste
    console.log('\n⏳ Aguardando 3 segundos antes do próximo teste...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Teste 2: Duplicatas (com novo email)
    TEST_DATA.email = `teste-duplicata-${Date.now()}@teste.com`;
    await testarDuplicatas();
    
    console.log('\n✅ Testes concluídos!');
  } catch (error) {
    console.error('\n❌ Erro ao executar testes:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

export { testarRateLimiting, testarDuplicatas };

