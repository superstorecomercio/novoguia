import { createServerClient } from '../../supabase/server';
import { type Orcamento } from '../../../app/types';

/**
 * Cria um novo orçamento
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

