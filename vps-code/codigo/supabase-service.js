const { createClient } = require('@supabase/supabase-js');
const { validarEFormatarTelefone } = require('./telefone-validator');
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
  criarLinkWhatsApp = async (telefone, dados) => {
    const telefoneFormatado = validarEFormatarTelefone(telefone);
    if (!telefoneFormatado) {
      throw new Error(`Telefone inválido: ${telefone}`);
    }
    return `https://wa.me/${telefoneFormatado}`;
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
      'casa': 'casa',
      'apartamento': 'apartamento',
      'empresa': 'empresa'
    };
    
    // Mapear metragem
    const metragemMap = {
      'ate_50': 'ate_50',
      '50_150': '50_150',
      '150_300': '150_300',
      'acima_300': 'acima_300'
    };

    // ✅ Preparar dados com nomes CORRETOS (snake_case + sufixos)
    const orcamentoData = {
      nome_cliente: dados.nome,                    // ✅ _cliente
      email_cliente: dados.email,                  // ✅ _cliente
      telefone_cliente: dados.whatsapp,            // ✅ telefone_cliente
      whatsapp: dados.whatsapp,                    // ✅ mantém também
      data_estimada: dados.data_estimada || null,  // ✅ snake_case
      
      // Textos completos: usar endereço original digitado pelo usuário (pode ser rua completa ou apenas cidade)
      origem_completo: dados.origem || (resultadoIA.cidadeOrigem && resultadoIA.estadoOrigem 
        ? `${resultadoIA.cidadeOrigem}, ${resultadoIA.estadoOrigem}`
        : resultadoIA.cidadeOrigem || 'Não informado'),
      destino_completo: dados.destino || (resultadoIA.cidadeDestino && resultadoIA.estadoDestino
        ? `${resultadoIA.cidadeDestino}, ${resultadoIA.estadoDestino}`
        : resultadoIA.cidadeDestino || 'Não informado'),
      
      // Dados extraídos pela IA (snake_case)
      // SEMPRE preencher cidade - usar resultado da IA ou fallback para o texto original
      estado_origem: resultadoIA.estadoOrigem || null,
      cidade_origem: resultadoIA.cidadeOrigem || dados.origem || 'Não informado',  // Fallback para texto original se IA não identificar
      endereco_origem: resultadoIA.enderecoOrigem || null,  // Endereço completo se houver
      estado_destino: resultadoIA.estadoDestino || null,
      cidade_destino: resultadoIA.cidadeDestino || dados.destino || 'Não informado',  // Fallback para texto original se IA não identificar
      endereco_destino: resultadoIA.enderecoDestino || null,  // Endereço completo se houver
      
      // Detalhes da mudança (snake_case)
      tipo_imovel: tipoImovelMap[dados.tipo_imovel] || dados.tipo_imovel,  // ✅ snake_case
      metragem: metragemMap[dados.metragem] || dados.metragem || null,  // ✅ snake_case
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
    // IMPORTANTE: A função SQL espera o parâmetro 'p_dados', não 'p_orcamento_data'
    const { data, error } = await supabase.rpc('criar_orcamento_e_notificar', {
      p_dados: orcamentoData
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
    let codigoOrcamento = resultado.codigo_orcamento || null;
    
    console.log('📋 Resultado completo da função SQL:', JSON.stringify(resultado, null, 2));
    console.log('📋 Código do orçamento retornado:', codigoOrcamento);
    console.log('📋 Tipo do código:', typeof codigoOrcamento);
    
    // Se o código não veio, tentar buscar diretamente do banco
    if (!codigoOrcamento) {
      console.warn('⚠️ Código não retornado pela função SQL. Buscando diretamente do banco...');
      try {
        const { data: orcamentoData, error: orcamentoError } = await supabase
          .from('orcamentos')
          .select('codigo_orcamento')
          .eq('id', resultado.orcamento_id)
          .single();
        
        if (!orcamentoError && orcamentoData && orcamentoData.codigo_orcamento) {
          console.log('✅ Código encontrado diretamente no banco:', orcamentoData.codigo_orcamento);
          // Atualizar o código no resultado E na variável
          codigoOrcamento = orcamentoData.codigo_orcamento;
          resultado.codigo_orcamento = orcamentoData.codigo_orcamento;
        } else {
          console.error('❌ Erro ao buscar código do banco:', orcamentoError);
        }
      } catch (err) {
        console.error('❌ Erro ao buscar código do banco:', err);
      }
    }

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
                  // Passar dados completos (dados da sessão + resultadoIA + código) para criar URL curta
                  // Usar resultado.codigo_orcamento que pode ter sido atualizado pelo fallback
                  const codigoParaLink = resultado.codigo_orcamento || codigoOrcamento || null;
                  const dadosCompletos = {
                    ...dados,
                    ...resultadoIA,
                    codigo_orcamento: codigoParaLink
                  };
                  
                  // Tentar criar link WhatsApp encurtado
                  try {
                    linkWhatsApp = await criarLinkWhatsApp(dadosEmpresa.telefone1, dadosCompletos);
                    console.log(`✅ Link WhatsApp encurtado criado para ${nome}: ${linkWhatsApp}`);
                  } catch (linkErr) {
                    // Se falhar ao criar/encurtar URL, não enviar link (apenas nome da empresa)
                    console.error(`❌ Erro ao criar link WhatsApp para ${nome}:`, linkErr.message);
                    console.log(`⚠️ Empresa ${nome} será exibida sem link`);
                    linkWhatsApp = null; // Não enviar link se houver erro
                  }
                } else {
                  // Fallback: criar URL direta sem mensagem (muito mais curta)
                  const telefoneFormatado = validarEFormatarTelefone(dadosEmpresa.telefone1);
                  if (telefoneFormatado) {
                    try {
                      linkWhatsApp = `https://wa.me/${telefoneFormatado}`;
                      console.log(`Link WhatsApp (sem mensagem) criado para ${nome}`);
                    } catch (err) {
                      console.error(`Erro ao criar link direto para ${nome}:`, err.message);
                      linkWhatsApp = null; // Não enviar link se houver erro
                    }
                  } else {
                    console.warn(`Telefone inválido para ${nome}: ${dadosEmpresa.telefone1}`);
                    linkWhatsApp = null; // Não enviar link se telefone inválido
                  }
                }
              } catch (err) {
                console.error(`Erro ao processar link WhatsApp para ${nome}:`, err);
                // Em caso de erro, não enviar link (apenas nome da empresa)
                linkWhatsApp = null;
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

    // Usar o código atualizado (pode ter sido buscado diretamente do banco)
    const codigoFinal = resultado.codigo_orcamento || codigoOrcamento || null;
    
    console.log('📋 Código final que será retornado:', codigoFinal);
    
    return {
      orcamento_id: resultado.orcamento_id,
      hotsites_notificados: resultado.hotsites_notificados || 0,
      campanhas_ids: campanhasIds,
      codigo_orcamento: codigoFinal,
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
  
  const tipoImovel = tipoImovelLabels[dados.tipo_imovel] || dados.tipo_imovel || 'Não informado';
  const metragem = metragemLabels[dados.metragem] || dados.metragem || 'Não informado';
  
  // Mensagem mais curta para caber no limite do WhatsApp
  let mensagem = `Olá! Recebi um orçamento de mudança.\n\n`;
  mensagem += `*Dados:*\n`;
  mensagem += `👤 ${dados.nome || 'Não informado'}\n`;
  mensagem += `📍 ${resultadoIA.cidadeOrigem || ''}, ${resultadoIA.estadoOrigem || ''} → ${resultadoIA.cidadeDestino || ''}, ${resultadoIA.estadoDestino || ''}\n`;
  mensagem += `🏠 ${tipoImovel}\n`;
  mensagem += `📏 ${metragem}\n`;
  mensagem += `📏 ${resultadoIA.distanciaKm || 0} km\n`;
  mensagem += `💰 R$ ${(resultadoIA.precoMin || 0).toLocaleString('pt-BR')} - R$ ${(resultadoIA.precoMax || 0).toLocaleString('pt-BR')}\n`;
  mensagem += `\nGostaria de uma cotação personalizada.`;
  
  return mensagem;
}

module.exports = {
  salvarOrcamento
};
