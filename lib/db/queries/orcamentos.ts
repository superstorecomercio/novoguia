import { createServerClient } from '../../supabase/server';
import { type Orcamento } from '../../../app/types';
import { logger } from '@/lib/utils/logger';

/**
 * Interface para dados da calculadora de orçamento
 */
export interface OrcamentoCalculadoraData {
  // Dados do Cliente
  nome: string;
  email: string;
  whatsapp: string;
  dataEstimada?: string;
  
  // Origem e Destino
  origem: string; // Texto completo
  destino: string; // Texto completo
  estadoOrigem?: string;
  cidadeOrigem?: string;
  estadoDestino?: string;
  cidadeDestino?: string;
  
  // Detalhes da Mudança
  tipoImovel: 'kitnet' | '1_quarto' | '2_quartos' | '3_mais' | '3_quartos' | '4_quartos' | 'comercial';
  temElevador: boolean;
  andar: number;
  precisaEmbalagem: boolean;
  
  // Resultado do Cálculo
  distanciaKm?: number;
  precoMin?: number;
  precoMax?: number;
  mensagemIA?: string;
  
  // Lista de Objetos (opcional)
  listaObjetos?: string;
  arquivoListaUrl?: string;
  arquivoListaNome?: string;
  
  // Metadados
  origemFormulario?: string;
  userAgent?: string;
  ipCliente?: string;
}

/**
 * Cria um orçamento usando a função SQL que notifica empresas automaticamente
 */
export const criarOrcamentoENotificar = async (
  dados: OrcamentoCalculadoraData
): Promise<{
  orcamentoId: string;
  hotsitesNotificados: number;
  hotsitesIds: string[];
}> => {
  const supabase = createServerClient();
  
  // Extrair estado do texto de destino
  const estadoDestino = dados.estadoDestino || extrairEstadoDoTexto(dados.destino);
  const estadoOrigem = dados.estadoOrigem || extrairEstadoDoTexto(dados.origem);
  
  logger.info('db-orcamentos', `🔍 Criando orçamento. Estados: ${estadoOrigem} → ${estadoDestino}`, {
    nome: dados.nome,
    email: dados.email,
    origem: dados.origem,
    destino: dados.destino,
    estadoOrigem: dados.estadoOrigem,
    cidadeOrigem: dados.cidadeOrigem,
    estadoDestino: dados.estadoDestino,
    cidadeDestino: dados.cidadeDestino,
  });
  
  // Validar que estado de destino existe (obrigatório)
  if (!estadoDestino) {
    throw new Error('Estado de destino é obrigatório. Não foi possível extrair do texto: ' + dados.destino);
  }
  
  // ✅ Construir textos formatados com os dados da IA
  const origemFormatado = dados.cidadeOrigem && dados.estadoOrigem
    ? `${dados.cidadeOrigem}, ${dados.estadoOrigem}`
    : dados.origem;
  
  const destinoFormatado = dados.cidadeDestino && dados.estadoDestino
    ? `${dados.cidadeDestino}, ${dados.estadoDestino}`
    : dados.destino;

  const orcamentoData = {
    tipo: 'mudanca',
    nome_cliente: dados.nome,
    email_cliente: dados.email,
    telefone_cliente: dados.whatsapp,
    whatsapp: dados.whatsapp,
    origem_completo: origemFormatado, // ✅ Texto formatado pela IA
    destino_completo: destinoFormatado, // ✅ Texto formatado pela IA
    estado_origem: estadoOrigem,
    cidade_origem: dados.cidadeOrigem || dados.origem,
    estado_destino: estadoDestino,
    cidade_destino: dados.cidadeDestino || dados.destino,
    tipo_imovel: dados.tipoImovel,
    tem_elevador: dados.temElevador,
    andar: dados.andar,
    precisa_embalagem: dados.precisaEmbalagem,
    distancia_km: dados.distanciaKm,
    preco_min: dados.precoMin,
    preco_max: dados.precoMax,
    mensagem_ia: dados.mensagemIA,
    lista_objetos: dados.listaObjetos,
    arquivo_lista_url: dados.arquivoListaUrl,
    arquivo_lista_nome: dados.arquivoListaNome,
    data_estimada: dados.dataEstimada || null, // ✅ NULL se não selecionado
    origem_formulario: dados.origemFormulario || 'calculadora',
    user_agent: dados.userAgent,
    ip_cliente: dados.ipCliente,
  };
  
  logger.debug('db-orcamentos', '📤 Enviando dados para RPC criar_orcamento_e_notificar', orcamentoData);
  
  const { data, error } = await supabase
    .rpc('criar_orcamento_e_notificar', {
      p_dados: orcamentoData
    });
  
  if (error) {
    logger.error('db-orcamentos', '❌ Erro RPC criar_orcamento_e_notificar', new Error(error.message), {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    // Cria um erro mais descritivo
    const errorMessage = `Erro ao salvar orçamento: ${error.message}${error.hint ? ` (${error.hint})` : ''}`;
    throw new Error(errorMessage);
  }
  
  if (!data || data.length === 0) {
    const erro = new Error('Nenhum resultado retornado da função SQL');
    logger.error('db-orcamentos', '❌ Nenhum resultado retornado da função SQL', erro);
    throw erro;
  }
  
  const resultado = data[0];
  
  logger.info('db-orcamentos', '✅ Orçamento criado com sucesso', {
    orcamentoId: resultado.orcamento_id,
    hotsitesNotificados: resultado.hotsites_notificados,
    campanhasIds: resultado.campanhas_ids,
  });
  
  return {
    orcamentoId: resultado.orcamento_id,
    hotsitesNotificados: resultado.hotsites_notificados || 0,
    hotsitesIds: resultado.campanhas_ids || [] // ✅ CORRIGIDO: era campanhas_ids, não hotsites_ids
  };
};

/**
 * Função auxiliar para extrair sigla do estado de um texto
 */
function extrairEstadoDoTexto(texto: string): string | undefined {
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  for (const estado of estados) {
    if (texto.toUpperCase().includes(estado)) {
      return estado;
    }
  }
  
  return undefined;
}

/**
 * Cria um novo orçamento (método legado - manter compatibilidade)
 */
export const createOrcamento = async (
  orcamento: Omit<Orcamento, 'id' | 'createdAt'>
): Promise<Orcamento> => {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('orcamentos')
    .insert({
      tipo: orcamento.tipo,
      nome_cliente: orcamento.nomeCliente,
      email_cliente: orcamento.emailCliente,
      telefone_cliente: orcamento.telefoneCliente,
      preferencia_contato: orcamento.preferenciaContato || null,
      estado_origem: orcamento.estadoOrigem || null,
      cidade_origem: orcamento.cidadeOrigem,
      endereco_origem: orcamento.enderecoOrigem || null,
      bairro_origem: orcamento.bairroOrigem || null,
      tipo_origem: orcamento.tipoOrigem || null,
      estado_destino: orcamento.estadoDestino || null,
      cidade_destino: orcamento.cidadeDestino,
      endereco_destino: orcamento.enderecoDestino || null,
      bairro_destino: orcamento.bairroDestino || null,
      tipo_destino: orcamento.tipoDestino || null,
      descricao: orcamento.descricao || null,
      comodos: orcamento.comodos || null,
      precisa_embalagem: orcamento.precisaEmbalagem || null,
      pecas: orcamento.pecas || null,
      tempo_armazenamento: orcamento.tempoArmazenamento || null,
      o_que_precisa: orcamento.oQuePrecisa || null,
      data_estimada: orcamento.dataEstimada,
      ip_cliente: orcamento.ipCliente || null,
      status: orcamento.status || 'pendente',
      empresa_id: orcamento.empresaId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar orçamento:', error);
    throw error;
  }

  return {
    id: data.id,
    tipo: data.tipo,
    nomeCliente: data.nome_cliente,
    emailCliente: data.email_cliente,
    telefoneCliente: data.telefone_cliente,
    preferenciaContato: data.preferencia_contato,
    estadoOrigem: data.estado_origem,
    cidadeOrigem: data.cidade_origem,
    enderecoOrigem: data.endereco_origem,
    bairroOrigem: data.bairro_origem,
    tipoOrigem: data.tipo_origem,
    estadoDestino: data.estado_destino,
    cidadeDestino: data.cidade_destino,
    enderecoDestino: data.endereco_destino,
    bairroDestino: data.bairro_destino,
    tipoDestino: data.tipo_destino,
    descricao: data.descricao,
    comodos: data.comodos,
    precisaEmbalagem: data.precisa_embalagem,
    pecas: data.pecas,
    tempoArmazenamento: data.tempo_armazenamento,
    oQuePrecisa: data.o_que_precisa,
    dataEstimada: data.data_estimada,
    ipCliente: data.ip_cliente,
    status: data.status,
    empresaId: data.empresa_id,
    createdAt: data.created_at,
  };
};

/**
 * Busca empresas que atendem origem OU destino
 * e cria relacionamentos em orcamento_empresas
 */
export const relacionarOrcamentoComEmpresas = async (
  orcamentoId: string,
  empresaIds?: string[],
  cidadeOrigem?: string,
  cidadeDestino?: string,
  estadoOrigem?: string,
  estadoDestino?: string
): Promise<void> => {
  const supabase = createServerClient();
  const empresasIdsFinal: string[] = [];

  // Se empresaIds foram fornecidos diretamente, usar eles
  if (empresaIds && empresaIds.length > 0) {
    empresasIdsFinal.push(...empresaIds);
  } else {
    // Caso contrário, buscar empresas que atendem origem OU destino
  
    // Empresas da cidade de origem
    if (cidadeOrigem) {
      const cidadeSlug = cidadeOrigem.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
      const { data: cidadeOrigemData } = await supabase
        .from('cidades')
        .select('id')
        .eq('slug', cidadeSlug)
        .single();

      if (cidadeOrigemData) {
        const { data: empresasOrigem } = await supabase
          .from('empresas')
          .select('id')
          .eq('cidade_id', cidadeOrigemData.id)
          .eq('ativo', true);

        if (empresasOrigem) {
          empresasIdsFinal.push(...empresasOrigem.map((e) => e.id));
        }
      }
    }

    // Empresas da cidade de destino
    if (cidadeDestino) {
      const cidadeSlug = cidadeDestino.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
      const { data: cidadeDestinoData } = await supabase
        .from('cidades')
        .select('id')
        .eq('slug', cidadeSlug)
        .single();

      if (cidadeDestinoData) {
        const { data: empresasDestino } = await supabase
          .from('empresas')
          .select('id')
          .eq('cidade_id', cidadeDestinoData.id)
          .eq('ativo', true);

        if (empresasDestino) {
          empresasIdsFinal.push(...empresasDestino.map((e) => e.id));
        }
      }
    }
  }

  // Remover duplicatas
  const empresasUnicas = [...new Set(empresasIdsFinal)];

  // Criar relacionamentos
  if (empresasUnicas.length > 0) {
    const relacionamentos = empresasUnicas.map((empresaId) => ({
      orcamento_id: orcamentoId,
      empresa_id: empresaId,
      enviado_em: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('orcamento_empresas')
      .insert(relacionamentos);

    if (error) {
      console.error('Erro ao relacionar orçamento com empresas:', error);
      throw error;
    }
  }
};

