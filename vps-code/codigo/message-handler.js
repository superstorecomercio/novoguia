const { PERGUNTAS, criarSessao, getSessao, atualizarSessao, proximaEtapa, limparSessao, marcarPerguntaEnviada, setProcessando } = require('./sessions');
const { enviarMensagem, enviarBotoes, enviarLista, enviarTyping } = require('./whatsapp');
const { calcularOrcamentoComIA } = require('./openai-service');
const { salvarOrcamento } = require('./supabase-service');
const { validarEFormatarData } = require('./date-validator');

// ✅ Palavras-chave para ativar o bot
const PALAVRAS_ATIVACAO = [
  'oi', 'olá', 'ola', 'hey', 'hi', 'hello',
  'orçamento', 'orcamento', 'cotação', 'cotacao',
  'mudança', 'mudanca', 'mudar',
  'iniciar', 'começar', 'comecar', 'start',
  'nova cotação', 'nova cotacao', 'novo orçamento', 'novo orcamento'
];

function ehMensagemAtivacao(mensagem) {
  if (!mensagem || typeof mensagem !== 'string') {
    return false;
  }
  
  // Normalizar mensagem: remover acentos e converter para minúsculas
  const msgNormalizada = mensagem
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
  
  // Verificar se contém "calcular" + "mudança" (com ou sem acento)
  const temCalcular = msgNormalizada.includes('calcular');
  const temMudanca = msgNormalizada.includes('mudanca') || msgNormalizada.includes('mudança');
  
  // Verificar se contém "olá" (com ou sem acento) - PRIORIDADE: aceita apenas "olá"
  const temOla = msgNormalizada === 'ola' || msgNormalizada === 'olá' || 
                 msgNormalizada.includes('ola') || msgNormalizada.includes('olá');
  
  // Verificar palavras-chave simples
  const temPalavraChave = PALAVRAS_ATIVACAO.some(palavra => {
    const palavraNormalizada = palavra
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return msgNormalizada.includes(palavraNormalizada);
  });
  
  // Ativar se:
  // 1. Contém "calcular" E "mudança" (com ou sem acento)
  // 2. Contém "olá" (com ou sem acento) - aceita apenas "olá" ou mensagens com "olá"
  // 3. Contém qualquer palavra-chave simples
  return (temCalcular && temMudanca) || temOla || temPalavraChave;
}

// Validações
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Previne que números no texto sejam detectados como clicáveis pelo WhatsApp
 * Envolve o texto entre aspas para evitar detecção automática de números
 */
function prevenirNumerosClicaveis(texto) {
  if (!texto) return texto;
  // Envolver o texto entre aspas para evitar que números sejam clicáveis
  return `"${texto}"`;
}

function validarData(data) {
  if (!data || data.toLowerCase() === 'pular' || data.toLowerCase() === 'não sei') {
    return null; // Data opcional
  }
  
  // Usar a função validarEFormatarData que aceita vários formatos (DD/MM, DD.MM, DD MM, DD/MM/YYYY, etc.)
  const dataFormatada = validarEFormatarData(data);
  
  if (!dataFormatada) {
    return false; // Data inválida
  }
  
  // Converter DD/MM/YYYY para YYYY-MM-DD para salvar no banco
  const partes = dataFormatada.split('/');
  if (partes.length === 3) {
    const [dia, mes, ano] = partes;
    const diaNum = parseInt(dia, 10);
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);
    
    // Validar se a data é válida (sem usar Date para evitar problemas de timezone)
    if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12 || anoNum < 2024) {
      return false;
    }
    
    // Verificar se a data não é no passado usando UTC para evitar problemas de timezone
    const hoje = new Date();
    const hojeUTC = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));
    const dataObjUTC = new Date(Date.UTC(anoNum, mesNum - 1, diaNum));
    
    // Verificar se a data é válida e não é no passado
    if (dataObjUTC >= hojeUTC) {
      // Retornar diretamente no formato YYYY-MM-DD sem usar conversão de timezone
      // Garantir que dia e mês tenham 2 dígitos
      const diaFormatado = String(diaNum).padStart(2, '0');
      const mesFormatado = String(mesNum).padStart(2, '0');
      return `${anoNum}-${mesFormatado}-${diaFormatado}`; // Retornar no formato YYYY-MM-DD para o banco
    }
  }
  
  return false; // Data inválida ou no passado
}

async function processarMensagem(from, mensagem) {
  try {
    // ⚡ ENVIAR TYPING IMEDIATAMENTE (melhora percepção de velocidade)
  //  enviarTyping(from).catch(() => {});
    
    console.log(`[processarMensagem] Processando mensagem de ${from}: "${mensagem}"`);
    
    let sessao = getSessao(from);
    if (sessao) {
      console.log(`[processarMensagem] Sessão encontrada. Etapa atual: ${sessao.etapaAtual}`);
    } else {
      console.log(`[processarMensagem] Nenhuma sessão encontrada para ${from}`);
    }
    
    // ✅ LÓGICA DE ATIVAÇÃO
    // Se não tem sessão E não é mensagem de ativação → IGNORAR
    if (!sessao && !ehMensagemAtivacao(mensagem)) {
      console.log(`Mensagem ignorada de ${from}: "${mensagem}" (não é palavra de ativação)`);
      return; // NÃO RESPONDE
    }
    
    // Se não tem sessão MAS é mensagem de ativação → CRIAR SESSÃO
    if (!sessao && ehMensagemAtivacao(mensagem)) {
      console.log(`✅ ATIVAÇÃO: Criando nova sessão para ${from}`);
      sessao = criarSessao(from);
      atualizarSessao(from, { whatsapp: from });
      
      console.log(`📤 ENVIANDO mensagem de boas-vindas para ${from}`);
      marcarPerguntaEnviada(from);
      await enviarMensagem(from, '👋 Olá! Sou a *Julia*!\n\nVou calcular o valor da sua mudança agora — e o melhor: o preço aparece na hora, em poucos segundos. No final, também te mostro quais empresas estão disponíveis para seu trajeto.\n\n📍 *De onde você está saindo?*\n\n💡 Informe a cidade ou endereço completo');
      console.log(`✅ Mensagem enviada com sucesso para ${from}`);
      return;
    }

    // ✅ VALIDAÇÃO: Evitar processamento de mensagens muito rápidas
    // Se está processando outra mensagem, ignorar
    if (sessao.processando) {
      console.log(`[processarMensagem] Mensagem ignorada de ${from}: ainda processando mensagem anterior`);
      await enviarMensagem(from, '⏳ Aguarde um momento, estou processando sua resposta anterior...');
      return;
    }

    // Validar se a mensagem chegou muito rápido após a última pergunta (menos de 2 segundos)
    if (sessao.ultima_pergunta_enviada_em) {
      const tempoDesdeUltimaPergunta = new Date() - new Date(sessao.ultima_pergunta_enviada_em);
      const tempoMinimo = 2000; // 2 segundos em milissegundos
      
      if (tempoDesdeUltimaPergunta < tempoMinimo) {
        console.log(`[processarMensagem] Mensagem muito rápida de ${from}: ${tempoDesdeUltimaPergunta}ms após última pergunta`);
        await enviarMensagem(from, '⏳ Aguarde um momento, estou processando... Por favor, responda minha pergunta novamente....');
        return;
      }
    }

    // Marcar como processando
    setProcessando(from, true);

    // ✅ A PARTIR DAQUI: Pessoa está em conversa ativa
    const etapa = sessao.etapaAtual;
    
    if (etapa === PERGUNTAS.ORIGEM) {
      atualizarSessao(from, { origem: mensagem });
      proximaEtapa(from);
      setProcessando(from, false);
      marcarPerguntaEnviada(from);
      await enviarMensagem(from, '✅ Ótimo!\n\n🎯 *Para onde você está se mudando?*\n\n💡 Informe a cidade ou endereço completo');
    }
    
    else if (etapa === PERGUNTAS.DESTINO) {
      atualizarSessao(from, { destino: mensagem });
      proximaEtapa(from);
      setProcessando(from, false);
      marcarPerguntaEnviada(from);
      
      await enviarLista(from, 
        '🏠 *Qual o tipo de imóvel na origem?*',
        'Selecionar tipo',
        [
          {
            title: 'Tipo de Imóvel na Origem',
            rows: [
              { id: 'casa', title: 'Casa', description: 'Residencial' },
              { id: 'apartamento', title: 'Apartamento', description: 'Residencial' },
              { id: 'empresa', title: 'Empresa', description: 'Comercial' }
            ]
          }
        ]
      );
    }
    
    else if (etapa === PERGUNTAS.TIPO_IMOVEL) {
      try {
        const tipos = ['casa', 'apartamento', 'empresa'];
        const mensagemLower = mensagem.toLowerCase().trim();
        
        console.log(`[TIPO_IMOVEL] Mensagem recebida: "${mensagem}" (normalizada: "${mensagemLower}")`);
        console.log(`[TIPO_IMOVEL] Tipos válidos:`, tipos);
        
        if (!tipos.includes(mensagemLower)) {
          console.log(`[TIPO_IMOVEL] Tipo inválido: ${mensagemLower}`);
          setProcessando(from, false);
          await enviarMensagem(from, '❌ Opção inválida. Por favor, selecione uma das opções da lista.');
          return;
        }
        
        console.log(`[TIPO_IMOVEL] Tipo válido: ${mensagemLower}`);
        atualizarSessao(from, { tipo_imovel: mensagemLower });
        proximaEtapa(from);
        
        try {
          await enviarLista(from, 
            '📏 *Qual a metragem aproximada do imóvel na origem?*',
            'Selecionar metragem',
            [
              {
                title: 'Metragem Aproximada na Origem',
                rows: [
                  { id: 'ate_50', title: 'Até 50 m²', description: 'Pequeno' },
                  { id: '50_150', title: '50 a 150 m²', description: 'Médio' },
                  { id: '150_300', title: '150 a 300 m²', description: 'Grande' },
                  { id: 'acima_300', title: 'Acima de 300 m²', description: 'Muito grande' }
                ]
              }
            ]
          );
          console.log(`[TIPO_IMOVEL] Lista de metragem enviada com sucesso`);
        setProcessando(from, false);
        marcarPerguntaEnviada(from);
        } catch (listaError) {
          console.error(`[TIPO_IMOVEL] Erro ao enviar lista de metragem:`, listaError);
          // Se falhar ao enviar lista, tentar enviar mensagem simples
          await enviarMensagem(from, '📏 *Qual a metragem aproximada do imóvel na origem?*\n\nDigite:\n1️⃣ Até 50 m²\n2️⃣ 50 a 150 m²\n3️⃣ 150 a 300 m²\n4️⃣ Acima de 300 m²');
          setProcessando(from, false);
          marcarPerguntaEnviada(from);
        }
      } catch (error) {
        console.error(`[TIPO_IMOVEL] Erro ao processar tipo de imóvel:`, error);
        setProcessando(from, false);
        throw error;
      }
    }
    
    else if (etapa === PERGUNTAS.METRAGEM) {
      try {
        const metragens = ['ate_50', '50_150', '150_300', 'acima_300'];
        const mensagemLower = mensagem.toLowerCase().trim();
        
        console.log(`[METRAGEM] Mensagem recebida: "${mensagem}" (normalizada: "${mensagemLower}")`);
        console.log(`[METRAGEM] Metragens válidas:`, metragens);
        
        // Mapear números digitados para IDs de metragem
        const mapeamentoNumeros = {
          '1': 'ate_50',
          '2': '50_150',
          '3': '150_300',
          '4': 'acima_300'
        };
        
        let metragemSelecionada = null;
        
        // Se digitou número, mapear para o ID correspondente
        if (mapeamentoNumeros[mensagemLower]) {
          metragemSelecionada = mapeamentoNumeros[mensagemLower];
          console.log(`[METRAGEM] Número digitado "${mensagemLower}" mapeado para "${metragemSelecionada}"`);
        } 
        // Se digitou o ID diretamente
        else if (metragens.includes(mensagemLower)) {
          metragemSelecionada = mensagemLower;
          console.log(`[METRAGEM] ID válido recebido: "${metragemSelecionada}"`);
        }
        
        if (!metragemSelecionada) {
          console.log(`[METRAGEM] Metragem inválida: ${mensagemLower}`);
          setProcessando(from, false);
          await enviarMensagem(from, '❌ Opção inválida. Por favor, selecione uma das opções da lista ou digite 1, 2, 3 ou 4.');
          return;
        }
        
        console.log(`[METRAGEM] Metragem válida: ${metragemSelecionada}`);
        atualizarSessao(from, { metragem: metragemSelecionada });
        proximaEtapa(from);
        
        setProcessando(from, false);
        marcarPerguntaEnviada(from);
        await enviarBotoes(from,
          '🛗 *O imóvel tem elevador?*',
          [
            { id: 'elevador_sim', title: 'Sim' },
            { id: 'elevador_nao', title: 'Não' }
          ]
        );
        console.log(`[METRAGEM] Botões de elevador enviados com sucesso`);
      } catch (error) {
        console.error(`[METRAGEM] Erro ao processar metragem:`, error);
        setProcessando(from, false);
        throw error;
      }
    }
    
    else if (etapa === PERGUNTAS.ELEVADOR) {
      const temElevador = mensagem.toLowerCase().includes('sim') || mensagem === 'elevador_sim';
      atualizarSessao(from, { 
        tem_elevador: temElevador,
        andar: temElevador ? 1 : 2
      });
      proximaEtapa(from);
      setProcessando(from, false);
      marcarPerguntaEnviada(from);
      
      await enviarBotoes(from,
        '📦 *Você precisa de embalagem e desmontagem de móveis?*',
        [
          { id: 'emb_sim', title: 'Sim, completa' },
          { id: 'emb_nao', title: 'Não preciso' }
        ]
      );
    }
    
    else if (etapa === PERGUNTAS.EMBALAGEM) {
      const precisaEmbalagem = mensagem.toLowerCase().includes('sim') || mensagem === 'emb_sim';
      atualizarSessao(from, { precisa_embalagem: precisaEmbalagem });
      proximaEtapa(from);
      setProcessando(from, false);
      marcarPerguntaEnviada(from);
      
      await enviarMensagem(from, '✅ *Perfeito!* Analisando sua rota e o porte da mudança...\n\nSua mudança parece ser de porte médio na região informada.\n\nNormalmente, mudanças desse tipo ficam em uma faixa de preço bem definida, dependendo da distância, dificuldade de acesso e volume transportado.\n\n💬 Para te mostrar a faixa real de preço baseada em centenas de mudanças parecidas e ainda te enviar cotações verificadas de empresas de mudança, me informe um contato rápido.\n\n📝 *Qual é o seu nome?*');
    }
    
    else if (etapa === PERGUNTAS.NOME) {
      atualizarSessao(from, { nome: mensagem });
      proximaEtapa(from);
      setProcessando(from, false);
      marcarPerguntaEnviada(from);
      await enviarMensagem(from, `Prazer, ${mensagem}! 😊\n\n📧 *Qual o seu e-mail?*`);
    }
    
    else if (etapa === PERGUNTAS.EMAIL) {
      if (!validarEmail(mensagem)) {
        setProcessando(from, false);
        await enviarMensagem(from, '❌ E-mail inválido. Por favor, digite um e-mail válido (ex: seuemail@exemplo.com)');
        return;
      }
      atualizarSessao(from, { email: mensagem });
      proximaEtapa(from);
      setProcessando(from, false);
      marcarPerguntaEnviada(from);
      await enviarMensagem(from, '📅 *Qual a data estimada da mudança?* _(opcional)_\n\n_(Digite no formato DDMMAAAA, exemplo: 25122025 para 25/12/2025, ou "pular" se não souber)_');
    }
    
    else if (etapa === PERGUNTAS.DATA) {
      const dataValidada = validarData(mensagem);
      if (dataValidada === false) {
        setProcessando(from, false);
        await enviarMensagem(from, '❌ Data inválida. Use o formato DDMMAAAA (exemplo: 25122025 para 25/12/2025) ou digite "pular".');
        return;
      }
      atualizarSessao(from, { data_estimada: dataValidada });
      proximaEtapa(from);
      setProcessando(from, false);
      marcarPerguntaEnviada(from);
      
      await enviarBotoes(from,
        '📝 *Gostaria de enviar uma lista de objetos ou informações adicionais para um orçamento mais preciso?*',
        [
          { id: 'lista_sim', title: 'Sim, enviar' },
          { id: 'lista_nao', title: 'Pular esta etapa' }
        ]
      );
    }
    
    else if (etapa === PERGUNTAS.LISTA_OBJETOS) {
      const querLista = mensagem.toLowerCase().includes('sim') || mensagem === 'lista_sim';
      atualizarSessao(from, { quer_lista: querLista });
      proximaEtapa(from);
      setProcessando(from, false);
      marcarPerguntaEnviada(from);
      
      if (querLista) {
        await enviarMensagem(from, '📝 *Ótimo! Envie a lista de objetos ou informações adicionais sobre sua mudança.*\n\n_Ex: Sofá de 3 lugares, mesa de jantar com 6 cadeiras, geladeira, fogão, guarda-roupa..._\n\n_💡 Você também pode incluir informações como: itens frágeis, objetos de grande porte, necessidade de desmontagem, etc._');
      } else {
        setProcessando(from, false);
        await finalizarOrcamento(from);
      }
    }
    
    else if (etapa === PERGUNTAS.LISTA_TEXTO) {
      atualizarSessao(from, { lista_objetos: mensagem });
      proximaEtapa(from);
      setProcessando(from, false);
      await finalizarOrcamento(from);
    }
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    setProcessando(from, false);
    await enviarMensagem(from, '❌ Desculpe, ocorreu um erro. Digite *oi* para começar novamente.');
    limparSessao(from);
  }
}

async function finalizarOrcamento(from) {
  const sessao = getSessao(from);
  if (!sessao) return;
  
  try {
    await enviarMensagem(from, '⏳ *Calculando o melhor orçamento para você...*\n\n_Isso pode levar alguns segundos._');
    
    // Calcular com IA
    const resultadoIA = await calcularOrcamentoComIA(sessao.dados);
    
    // Salvar no banco e obter lista de empresas notificadas
    let resultadoSalvamento = null;
    try {
      resultadoSalvamento = await salvarOrcamento(sessao.dados, resultadoIA);
      console.log('Orçamento salvo com sucesso:', resultadoSalvamento);
      console.log('🔖 Código do orçamento:', resultadoSalvamento?.codigo_orcamento);
    } catch (err) {
      console.error('❌ Erro ao salvar orçamento:', err);
      console.error('Stack trace:', err.stack);
      // Lança o erro para ser capturado pelo catch externo
      throw err;
    }
    
    // Formatar e enviar resultado
    const tipoImovelLabels = {
      casa: 'Casa',
      apartamento: 'Apartamento',
      empresa: 'Empresa'
    };
    
    const metragemLabels = {
      ate_50: 'Até 50 m²',
      '50_150': '50 a 150 m²',
      '150_300': '150 a 300 m²',
      acima_300: 'Acima de 300 m²'
    };
    
    const resultado = `
📋 *Dados do Orçamento*

✅ *ORÇAMENTO CALCULADO!*
${resultadoSalvamento && resultadoSalvamento.codigo_orcamento ? `\n🔖 *Código:* ${resultadoSalvamento.codigo_orcamento}\n` : ''}

📍 *Origem:* ${sessao.dados.origem ? `${sessao.dados.origem}${resultadoIA.cidadeOrigem && resultadoIA.estadoOrigem ? ` (${resultadoIA.cidadeOrigem}, ${resultadoIA.estadoOrigem})` : ''}` : `${resultadoIA.cidadeOrigem}, ${resultadoIA.estadoOrigem}`}
🎯 *Destino:* ${sessao.dados.destino ? `${sessao.dados.destino}${resultadoIA.cidadeDestino && resultadoIA.estadoDestino ? ` (${resultadoIA.cidadeDestino}, ${resultadoIA.estadoDestino})` : ''}` : `${resultadoIA.cidadeDestino}, ${resultadoIA.estadoDestino}`}

🏠 *Tipo:* ${tipoImovelLabels[sessao.dados.tipo_imovel] || sessao.dados.tipo_imovel}
📏 *Metragem:* ${metragemLabels[sessao.dados.metragem] || sessao.dados.metragem || 'Não informado'}
🚪 *Elevador:* ${sessao.dados.tem_elevador ? 'Sim' : 'Não'}
📦 *Embalagem:* ${sessao.dados.precisa_embalagem ? 'Sim, completa' : 'Não precisa'}

💰 *FAIXA DE PREÇO ESTIMADA:*
*R$ ${resultadoIA.precoMin.toLocaleString('pt-BR')} - R$ ${resultadoIA.precoMax.toLocaleString('pt-BR')}* (faixa estimada completa)

📏 *Distância:* ${resultadoIA.distanciaKm} km

🤖 *Análise:*
${resultadoIA.explicacao}

${(() => {
      if (!sessao.dados.data_estimada) return '';
      const dataFormatada = validarEFormatarData(sessao.dados.data_estimada);
      return dataFormatada ? `\n📅 *Data Estimada:* ${dataFormatada}\n` : '';
    })()}

Digite *nova cotação* para fazer outro orçamento.
    `.trim();
    
    // Enviar primeira mensagem com o resultado do orçamento
    await enviarMensagem(from, resultado);
    
    // Enviar segunda mensagem com a lista de empresas (se houver)
    if (resultadoSalvamento && resultadoSalvamento.hotsites_notificados >= 1 && resultadoSalvamento.empresasNotificadas && resultadoSalvamento.empresasNotificadas.length > 0) {
      const mensagemEmpresas = `✨ *Empresas parceiras que receberam seu orçamento:*\n\n${resultadoSalvamento.empresasNotificadas.map((empresa) => {
        // Compatibilidade: empresa pode ser string ou objeto
        const nomeEmpresa = typeof empresa === 'string' ? empresa : (empresa.nome || 'Empresa');
        const linkWhatsApp = typeof empresa === 'object' ? empresa.linkWhatsApp : null;
        
        // Prevenir que números no nome sejam clicáveis
        const nomeEmpresaFormatado = prevenirNumerosClicaveis(nomeEmpresa);
        
        const linha = `- ${nomeEmpresaFormatado}`;
        // Se tem link do WhatsApp, adicionar embaixo (apenas o link, sem texto extra)
        if (linkWhatsApp) {
          return `${linha}\n   ${linkWhatsApp}`;
        }
        return linha;
      }).join('\n\n')}\n\n💬 *Elas entrarão em contato em breve!*`;
      
      await enviarMensagem(from, mensagemEmpresas);
    } else {
      // Se não houver empresas, enviar mensagem genérica
      await enviarMensagem(from, '✨ *Empresas parceiras entrarão em contato em breve!*');
    }
    
    // ✅ Limpar sessão (pessoa não receberá mais respostas automáticas)
    setProcessando(from, false);
    limparSessao(from);
    
  } catch (error) {
    console.error('Erro ao finalizar orçamento:', error);
    setProcessando(from, false);
    await enviarMensagem(from, '❌ Desculpe, ocorreu um erro ao processar seu orçamento. Por favor, tente novamente mais tarde.');
    limparSessao(from);
  }
}

module.exports = {
  processarMensagem
};
