/**
 * Script de teste para o formulário da calculadora
 * Testa o fluxo completo: envio de dados → salvamento no banco
 */

interface TestData {
  origem: string;
  destino: string;
  tipoImovel: string;
  temElevador: string;
  andar: number;
  precisaEmbalagem: string;
  nome: string;
  email: string;
  whatsapp: string;
  dataEstimada?: string;
  listaObjetos?: string;
}

async function testarCalculadora() {
  console.log('🧪 Iniciando teste do formulário da calculadora...\n');

  // Dados de teste
  const dadosTeste: TestData = {
    origem: 'São Paulo, SP',
    destino: 'Rio de Janeiro, RJ',
    tipoImovel: '2_quartos',
    temElevador: 'sim',
    andar: 3,
    precisaEmbalagem: 'sim',
    nome: 'Teste Usuário',
    email: 'teste@exemplo.com',
    whatsapp: '11987654321',
    dataEstimada: '2025-02-15',
    listaObjetos: 'Sofá, geladeira, cama'
  };

  console.log('📋 Dados de teste:');
  console.log(JSON.stringify(dadosTeste, null, 2));
  console.log('\n');

  try {
    // 1. Simular chamada à API
    console.log('1️⃣ Chamando API /api/calcular-orcamento...');
    const response = await fetch('http://localhost:3000/api/calcular-orcamento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origem: dadosTeste.origem,
        destino: dadosTeste.destino,
        tipoImovel: dadosTeste.tipoImovel,
        temElevador: dadosTeste.temElevador,
        andar: dadosTeste.andar,
        precisaEmbalagem: dadosTeste.precisaEmbalagem,
        nome: dadosTeste.nome,
        email: dadosTeste.email,
        whatsapp: dadosTeste.whatsapp,
        dataEstimada: dadosTeste.dataEstimada,
        listaObjetos: dadosTeste.listaObjetos,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', response.status, errorText);
      return;
    }

    const resultado = await response.json();
    console.log('✅ API retornou resultado:');
    console.log(JSON.stringify(resultado, null, 2));
    console.log('\n');

    // 2. Verificar logs do servidor
    console.log('2️⃣ Verifique os logs do servidor (terminal onde está rodando npm run dev)');
    console.log('   Procure por mensagens que começam com:');
    console.log('   - 🔍 Criando orçamento');
    console.log('   - 📋 Dados recebidos');
    console.log('   - 📤 Enviando dados para RPC');
    console.log('   - ✅ Orçamento criado!');
    console.log('   - ❌ Erro (se houver)');
    console.log('\n');

    // 3. Verificar se o resultado contém informações esperadas
    console.log('3️⃣ Verificando resultado da API...');
    if (resultado.precoMin && resultado.precoMax) {
      console.log('✅ API retornou faixa de preço:', `R$ ${resultado.precoMin} - R$ ${resultado.precoMax}`);
    } else {
      console.log('⚠️ API não retornou faixa de preço');
    }

    if (resultado.estadoDestino) {
      console.log('✅ Estado de destino extraído:', resultado.estadoDestino);
    } else {
      console.log('⚠️ Estado de destino não foi extraído');
    }

    if (resultado.cidadeDestino) {
      console.log('✅ Cidade de destino extraída:', resultado.cidadeDestino);
    } else {
      console.log('⚠️ Cidade de destino não foi extraída');
    }

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Executar teste
testarCalculadora().catch(console.error);

