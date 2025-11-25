const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Importar url-shortener com tratamento de erro
let criarLinkWhatsApp = null;
try {
  const urlShortener = require('./url-shortener');
  criarLinkWhatsApp = urlShortener.criarLinkWhatsApp;
  console.log('✅ Módulo url-shortener carregado com sucesso');
} catch (err) {
  console.error('Erro ao carregar url-shortener:', err);
  // Fallback: função que retorna URL direta sem mensagem (muito mais curta)
  criarLinkWhatsApp = (telefone, dados) => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    return `https://wa.me/${telefoneLimpo}`;
  };
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function salvarOrcamento(dados, resultadoIA) {
  try {
    console.log('Iniciando salvarOrcamento...', {
      nome: dados.nome,
      origem: dados.origem,
      destino: dados.destino
    });
    // Mapear tipo de imóvel
    const tipoImovelMap = {
      'kitnet': 'kitnet',
      '1_quarto': '1_quarto',
      '2_quartos': '2_quartos',
      '3_mais': '3_mais',
      'comercial': 'comercial'
    };

    // ✅ Preparar dados com nomes CORRETOS (snake_case + sufixos)
    const orcamentoData = {
      nome_cliente: dados.nome,                    // ✅ _cliente
      email_cliente: dados.email,                  // ✅ _cliente
      telefone_cliente: dados.whatsapp,            // ✅ telefone_cliente
      whatsapp: dados.whatsapp,                    // ✅ mantém também
      data_estimada: dados.data_estimada || null,  // ✅ snake_case
      
      // Textos originais com _completo
      origem_completo: dados.origem,               // ✅ _completo
      destino_completo: dados.destino,             // ✅ _completo
      
      // Dados extraídos pela IA (snake_case)
      estado_origem: resultadoIA.estadoOrigem,     // ✅ snake_case
      cidade_origem: resultadoIA.cidadeOrigem,     // ✅ snake_case
      estado_destino: resultadoIA.estadoDestino,   // ✅ snake_case
      cidade_destino: resultadoIA.cidadeDestino,   // ✅ snake_case
      
      // Detalhes da mudança (snake_case)
      tipo_imovel: tipoImovelMap[dados.tipo_imovel] || dados.tipo_imovel,  // ✅ snake_case
      tem_elevador: dados.tem_elevador,            // ✅ snake_case
      andar: dados.andar || 1,
      precisa_embalagem: dados.precisa_embalagem,  // ✅ snake_case
      
      // Resultado do cálculo da IA (snake_case)
      distancia_km: resultadoIA.distanciaKm,       // ✅ snake_case
      preco_min: resultadoIA.precoMin,             // ✅ snake_case
      preco_max: resultadoIA.precoMax,             // ✅ snake_case
      mensagem_ia: resultadoIA.explicacao,         // ✅ snake_case
      
      // Lista de objetos (snake_case)
      lista_objetos: dados.lista_objetos || null,  // ✅ snake_case
      
      // Metadados (snake_case)
      origem_formulario: 'whatsapp',               // ✅ snake_case
      user_agent: 'WhatsApp Bot API',              // ✅ snake_case
      ip_cliente: null                             // ✅ snake_case
    };

    console.log('Chamando função SQL com payload:', orcamentoData);

    // ✅ Passar como um único objeto JSONB
    const { data, error } = await supabase.rpc('criar_orcamento_e_notificar', {
      p_orcamento_data: orcamentoData
    });

    if (error) {
      console.error('Erro ao chamar função SQL:', error);
      throw error;
    }

    console.log('Orçamento criado e empresas notificadas:', data);

    // Verificar se retornou dados
    if (!data || !data[0]) {
      console.warn('Nenhum dado retornado da função SQL');
      return {
        orcamento_id: null,
        hotsites_notificados: 0,
        campanhas_ids: [],
        empresasNotificadas: []
      };
    }

    const resultado = data[0];
    const campanhasIds = resultado.campanhas_ids || [];

    // Buscar nomes das empresas notificadas
    let empresasNotificadas = [];
    if (campanhasIds.length > 0) {
      try {
        console.log('Buscando nomes das empresas para campanhas:', campanhasIds);
        
        const { data: campanhas, error: campanhasError } = await supabase
          .from('campanhas')
          .select(`
            id,
            hotsite:hotsites!hotsite_id(
              id,
              nome_exibicao,
              telefone1
            )
          `)
          .in('id', campanhasIds);

        if (campanhasError) {
          console.error('Erro ao buscar campanhas:', campanhasError);
        } else if (campanhas && campanhas.length > 0) {
          console.log('Campanhas encontradas:', JSON.stringify(campanhas, null, 2));
          
          // Extrair empresas com telefone (Map para evitar duplicatas)
          const empresasMap = new Map(); // nome => { nome, telefone1, linkWhatsApp }
          
          for (const campanha of campanhas) {
            // Verificar se hotsite existe
            if (campanha.hotsite) {
              // Supabase pode retornar como objeto ou array
              let hotsite = null;
              if (Array.isArray(campanha.hotsite)) {
                hotsite = campanha.hotsite[0];
              } else if (typeof campanha.hotsite === 'object') {
                hotsite = campanha.hotsite;
              }
              
              if (hotsite && hotsite.nome_exibicao) {
                const nome = hotsite.nome_exibicao;
                const telefone1 = hotsite.telefone1;
                
                // Se já existe, manter o que tem telefone (prioridade)
                if (!empresasMap.has(nome) || (telefone1 && !empresasMap.get(nome).telefone1)) {
                  empresasMap.set(nome, {
                    nome: nome,
                    telefone1: telefone1 || null
                  });
                }
              }
            }
          }
          
          // Converter Map para array e criar links do WhatsApp
          empresasNotificadas = [];
          
          // Processar empresas de forma sequencial para evitar problemas com async/await
          for (const [nome, dadosEmpresa] of empresasMap) {
            let linkWhatsApp = null;
            
            // Se tem telefone, criar link do WhatsApp
            if (dadosEmpresa.telefone1) {
              try {
                if (criarLinkWhatsApp) {
                  // Passar dados completos (dados da sessão + resultadoIA) para criar URL curta
                  const dadosCompletos = {
                    ...dados,
                    ...resultadoIA
                  };
                  
                  // criarLinkWhatsApp agora recebe dados completos e cria URL curta usando rota própria
                  linkWhatsApp = criarLinkWhatsApp(dadosEmpresa.telefone1, dadosCompletos);
                  console.log(`Link WhatsApp curto criado para ${nome}: ${linkWhatsApp}`);
                } else {
                  // Fallback: criar URL direta sem mensagem (muito mais curta)
                  const telefoneLimpo = dadosEmpresa.telefone1.replace(/\D/g, '');
                  linkWhatsApp = `https://wa.me/${telefoneLimpo}`;
                  console.log(`Link WhatsApp (sem mensagem) criado para ${nome}`);
                }
              } catch (err) {
                console.error(`Erro ao processar link WhatsApp para ${nome}:`, err);
                // Fallback: criar URL direta sem mensagem
                const telefoneLimpo = dadosEmpresa.telefone1.replace(/\D/g, '');
                linkWhatsApp = `https://wa.me/${telefoneLimpo}`;
              }
            }
            
            empresasNotificadas.push({
              nome: nome,
              telefone1: dadosEmpresa.telefone1,
              linkWhatsApp: linkWhatsApp
            });
          }
          console.log(`Total de empresas únicas encontradas: ${empresasNotificadas.length}`);
        } else {
          console.warn('Nenhuma campanha encontrada para os IDs:', campanhasIds);
        }
      } catch (err) {
        console.error('Erro ao buscar nomes das empresas:', err);
        console.error('Stack trace:', err.stack);
        // Não falha se não conseguir buscar nomes - retorna array vazio
      }
    }

    console.log('Orçamento salvo com sucesso:', {
      orcamento_id: resultado.orcamento_id,
      hotsites_notificados: resultado.hotsites_notificados || 0,
      empresas_count: empresasNotificadas.length
    });

    return {
      orcamento_id: resultado.orcamento_id,
      hotsites_notificados: resultado.hotsites_notificados || 0,
      campanhas_ids: campanhasIds,
      empresasNotificadas: empresasNotificadas
    };
    
  } catch (error) {
    console.error('❌ Erro ao salvar orçamento:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

/**
 * Cria mensagem pré-formatada para WhatsApp
 */
function criarMensagemWhatsApp(dados, resultadoIA) {
  const tipoImovelLabels = {
    kitnet: 'Kitnet',
    '1_quarto': 'Apartamento 1 quarto',
    '2_quartos': 'Apartamento 2 quartos',
    '3_mais': 'Apartamento 3+ quartos ou Casa',
    comercial: 'Mudança Comercial'
  };
  
  const tipoImovel = tipoImovelLabels[dados.tipo_imovel] || dados.tipo_imovel || 'Não informado';
  
  // Mensagem mais curta para caber no limite do WhatsApp
  let mensagem = `Olá! Recebi um orçamento de mudança.\n\n`;
  mensagem += `*Dados:*\n`;
  mensagem += `👤 ${dados.nome || 'Não informado'}\n`;
  mensagem += `📍 ${resultadoIA.cidadeOrigem || ''}, ${resultadoIA.estadoOrigem || ''} → ${resultadoIA.cidadeDestino || ''}, ${resultadoIA.estadoDestino || ''}\n`;
  mensagem += `🏠 ${tipoImovel}\n`;
  mensagem += `📏 ${resultadoIA.distanciaKm || 0} km\n`;
  mensagem += `💰 R$ ${(resultadoIA.precoMin || 0).toLocaleString('pt-BR')} - R$ ${(resultadoIA.precoMax || 0).toLocaleString('pt-BR')}\n`;
  mensagem += `\nGostaria de uma cotação personalizada.`;
  
  return mensagem;
}

module.exports = {
  salvarOrcamento
};
