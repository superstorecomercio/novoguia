const { PERGUNTAS, criarSessao, getSessao, atualizarSessao, proximaEtapa, limparSessao } = require('./sessions');
const { enviarMensagem, enviarBotoes, enviarLista, enviarTyping } = require('./whatsapp');
const { calcularOrcamentoComIA } = require('./openai-service');
const { salvarOrcamento } = require('./supabase-service');

// ✅ Palavras-chave para ativar o bot
const PALAVRAS_ATIVACAO = [
  'oi', 'olá', 'ola', 'hey', 'hi', 'hello',
  'orçamento', 'orcamento', 'cotação', 'cotacao',
  'mudança', 'mudanca', 'mudar',
  'iniciar', 'começar', 'comecar', 'start',
  'nova cotação', 'nova cotacao', 'novo orçamento', 'novo orcamento'
];

function ehMensagemAtivacao(mensagem) {
  const msgLower = mensagem.toLowerCase().trim();
  return PALAVRAS_ATIVACAO.some(palavra => msgLower.includes(palavra));
}

// Validações
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validarData(data) {
  if (!data || data.toLowerCase() === 'pular' || data.toLowerCase() === 'não sei') {
    return null; // Data opcional
  }
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(data)) {
    // Tentar outros formatos comuns
    const dateFormats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/    // DD-MM-YYYY
    ];
    
    for (let format of dateFormats) {
      const match = data.match(format);
      if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`; // Converter para YYYY-MM-DD
      }
    }
    return false;
  }
  
  const dataObj = new Date(data);
  const hoje = new Date();
  return dataObj >= hoje ? data : false;
}

async function processarMensagem(from, mensagem) {
  try {
    // ⚡ ENVIAR TYPING IMEDIATAMENTE (melhora percepção de velocidade)
  //  enviarTyping(from).catch(() => {});
    
    let sessao = getSessao(from);
    
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
      await enviarMensagem(from, '👋 Olá! Sou a *Julia*!\n\nVou calcular o valor da sua mudança agora — e o melhor: o preço aparece na hora, em poucos segundos. No final, também te mostro quais empresas estão disponíveis para seu trajeto.\n\n📍 *Para começar, me diga: de onde você está saindo?*');
      console.log(`✅ Mensagem enviada com sucesso para ${from}`);
      return;
    }

    // ✅ A PARTIR DAQUI: Pessoa está em conversa ativa
    const etapa = sessao.etapaAtual;
    
    if (etapa === PERGUNTAS.ORIGEM) {
      atualizarSessao(from, { origem: mensagem });
      proximaEtapa(from);
      await enviarMensagem(from, '✅ Ótimo!\n\n🎯 *E para onde você está se mudando?*');
    }
    
    else if (etapa === PERGUNTAS.DESTINO) {
      atualizarSessao(from, { destino: mensagem });
      proximaEtapa(from);
      
      await enviarLista(from, 
        '🏠 *Qual o tipo do seu imóvel?*',
        'Selecionar tipo',
        [
          {
            title: 'Tipo de Imóvel',
            rows: [
              { id: 'kitnet', title: 'Kitnet', description: 'Pequeno porte' },
              { id: '1_quarto', title: 'Apartamento 1 quarto', description: 'Pequeno a médio' },
              { id: '2_quartos', title: 'Apartamento 2 quartos', description: 'Médio porte' },
              { id: '3_mais', title: 'Apartamento 3+ quartos', description: 'Grande porte' },
              { id: 'comercial', title: 'Comercial', description: 'Escritório/Loja' }
            ]
          }
        ]
      );
    }
    
    else if (etapa === PERGUNTAS.TIPO_IMOVEL) {
      const tipos = ['kitnet', '1_quarto', '2_quartos', '3_mais', 'comercial'];
      if (!tipos.includes(mensagem.toLowerCase())) {
        await enviarMensagem(from, '❌ Opção inválida. Por favor, selecione uma das opções da lista.');
        return;
      }
      atualizarSessao(from, { tipo_imovel: mensagem.toLowerCase() });
      proximaEtapa(from);
      
      await enviarBotoes(from,
        '🛗 *O imóvel tem elevador?*',
        [
          { id: 'elevador_sim', title: 'Sim' },
          { id: 'elevador_nao', title: 'Não' }
        ]
      );
    }
    
    else if (etapa === PERGUNTAS.ELEVADOR) {
      const temElevador = mensagem.toLowerCase().includes('sim') || mensagem === 'elevador_sim';
      atualizarSessao(from, { 
        tem_elevador: temElevador,
        andar: temElevador ? 1 : 2
      });
      proximaEtapa(from);
      
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
      
      await enviarMensagem(from, '✅ *Perfeito!* Analisando sua rota e o porte da mudança...\n\nSua mudança parece ser de porte médio na região informada.\n\nNormalmente, mudanças desse tipo ficam em uma faixa de preço bem definida, dependendo da distância, dificuldade de acesso e volume transportado.\n\n💬 Para te mostrar a faixa real de preço baseada em centenas de mudanças parecidas e ainda te enviar cotações verificadas de empresas de mudança, me informe um contato rápido.\n\n📝 *Qual é o seu nome?*');
    }
    
    else if (etapa === PERGUNTAS.NOME) {
      atualizarSessao(from, { nome: mensagem });
      proximaEtapa(from);
      await enviarMensagem(from, `Prazer, ${mensagem}! 😊\n\n📧 *Qual o seu e-mail?*`);
    }
    
    else if (etapa === PERGUNTAS.EMAIL) {
      if (!validarEmail(mensagem)) {
        await enviarMensagem(from, '❌ E-mail inválido. Por favor, digite um e-mail válido (ex: seuemail@exemplo.com)');
        return;
      }
      atualizarSessao(from, { email: mensagem });
      proximaEtapa(from);
      await enviarMensagem(from, '📅 *Qual a data estimada da mudança?* _(opcional)_\n\n_(Digite no formato DD/MM/AAAA ou "pular" se não souber)_');
    }
    
    else if (etapa === PERGUNTAS.DATA) {
      const dataValidada = validarData(mensagem);
      if (dataValidada === false) {
        await enviarMensagem(from, '❌ Data inválida. Use o formato DD/MM/AAAA ou digite "pular".');
        return;
      }
      atualizarSessao(from, { data_estimada: dataValidada });
      proximaEtapa(from);
      
      await enviarBotoes(from,
        '📝 *Antes de calcular, você gostaria de enviar uma lista de objetos para um orçamento mais preciso?*',
        [
          { id: 'lista_sim', title: 'Sim, quero' },
          { id: 'lista_nao', title: 'Não precisa' }
        ]
      );
    }
    
    else if (etapa === PERGUNTAS.LISTA_OBJETOS) {
      const querLista = mensagem.toLowerCase().includes('sim') || mensagem === 'lista_sim';
      atualizarSessao(from, { quer_lista: querLista });
      proximaEtapa(from);
      
      if (querLista) {
        await enviarMensagem(from, '📝 *Perfeito! Descreva os objetos que serão transportados.*\n\n_Ex: Sofá de 3 lugares, mesa de jantar com 6 cadeiras, geladeira, fogão, guarda-roupa..._');
      } else {
        await finalizarOrcamento(from);
      }
    }
    
    else if (etapa === PERGUNTAS.LISTA_TEXTO) {
      atualizarSessao(from, { lista_objetos: mensagem });
      proximaEtapa(from);
      await finalizarOrcamento(from);
    }
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
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
    } catch (err) {
      console.error('❌ Erro ao salvar orçamento:', err);
      console.error('Stack trace:', err.stack);
      // Lança o erro para ser capturado pelo catch externo
      throw err;
    }
    
    // Formatar e enviar resultado
    const tipoImovelLabels = {
      kitnet: 'Kitnet',
      '1_quarto': 'Apartamento 1 quarto',
      '2_quartos': 'Apartamento 2 quartos',
      '3_mais': 'Apartamento 3+ quartos ou Casa',
      comercial: 'Mudança Comercial'
    };
    
    const resultado = `
✅ *ORÇAMENTO CALCULADO!*

👤 *Cliente:* ${sessao.dados.nome}
📧 *Email:* ${sessao.dados.email}

📍 *Origem:* ${resultadoIA.cidadeOrigem}, ${resultadoIA.estadoOrigem}
🎯 *Destino:* ${resultadoIA.cidadeDestino}, ${resultadoIA.estadoDestino}

🏠 *Tipo:* ${tipoImovelLabels[sessao.dados.tipo_imovel]}
🚪 *Elevador:* ${sessao.dados.tem_elevador ? 'Sim' : 'Não'}
📦 *Embalagem:* ${sessao.dados.precisa_embalagem ? 'Sim, completa' : 'Não precisa'}

💰 *FAIXA DE PREÇO ESTIMADA:*
*R$ ${resultadoIA.precoMin.toLocaleString('pt-BR')} - R$ ${resultadoIA.precoMax.toLocaleString('pt-BR')}*

📏 *Distância:* ${resultadoIA.distanciaKm} km

🤖 *Análise:*
${resultadoIA.explicacao}

${sessao.dados.lista_objetos ? `\n📝 *Lista de Objetos:*\n${sessao.dados.lista_objetos}\n` : ''}
${sessao.dados.data_estimada ? `\n📅 *Data Estimada:* ${new Date(sessao.dados.data_estimada).toLocaleDateString('pt-BR')}\n` : ''}
━━━━━━━━━━━━━━━━━
${resultadoSalvamento && resultadoSalvamento.hotsites_notificados >= 1 && resultadoSalvamento.empresasNotificadas && resultadoSalvamento.empresasNotificadas.length > 0
  ? (() => {
      // Limitar a 5 empresas para não exceder limite do WhatsApp (4096 caracteres)
      const empresasExibir = resultadoSalvamento.empresasNotificadas.slice(0, 5);
      const totalEmpresas = resultadoSalvamento.empresasNotificadas.length;
      const temMais = totalEmpresas > 5;
      
      let texto = `✨ *Empresas parceiras que receberam seu orçamento:*\n\n`;
      texto += empresasExibir.map((empresa, index) => {
        // Compatibilidade: empresa pode ser string ou objeto
        const nomeEmpresa = typeof empresa === 'string' ? empresa : (empresa.nome || 'Empresa');
        const linkWhatsApp = typeof empresa === 'object' ? empresa.linkWhatsApp : null;
        
        const linha = `${index + 1}. ${nomeEmpresa}`;
        // Se tem link do WhatsApp, adicionar embaixo (apenas o link, sem texto extra)
        if (linkWhatsApp) {
          return `${linha}\n   ${linkWhatsApp}`;
        }
        return linha;
      }).join('\n\n');
      
      if (temMais) {
        texto += `\n\n... e mais ${totalEmpresas - 5} empresa(s)`;
      }
      
      texto += `\n\n💬 *Elas entrarão em contato em breve!*`;
      
      return texto;
    })()
  : `✨ *Empresas parceiras entrarão em contato em breve!*`}

Digite *nova cotação* para fazer outro orçamento.
    `.trim();
    
    await enviarMensagem(from, resultado);
    
    // ✅ Limpar sessão (pessoa não receberá mais respostas automáticas)
    limparSessao(from);
    
  } catch (error) {
    console.error('Erro ao finalizar orçamento:', error);
    await enviarMensagem(from, '❌ Desculpe, ocorreu um erro ao processar seu orçamento. Por favor, tente novamente mais tarde.');
    limparSessao(from);
  }
}

module.exports = {
  processarMensagem
};
