import { NextRequest, NextResponse } from 'next/server';
import { createOrcamento, relacionarOrcamentoComEmpresas } from '../../../lib/db/queries/orcamentos';
import { type OrcamentoFormData } from '../../types';

/**
 * API Route para criar orçamento
 * POST /api/orcamentos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formData = body as OrcamentoFormData;

    // Validar dados obrigatórios
    if (!formData.nomeCliente || !formData.emailCliente || !formData.telefoneCliente) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    if (!formData.cidadeOrigem || !formData.cidadeDestino || !formData.dataEstimada) {
      return NextResponse.json(
        { error: 'Dados de origem, destino ou data faltando' },
        { status: 400 }
      );
    }

    // Obter IP do cliente
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Converter OrcamentoFormData para formato do banco
    const orcamentoData = {
      tipo: formData.tipo,
      nomeCliente: formData.nomeCliente,
      emailCliente: formData.emailCliente,
      telefoneCliente: formData.telefoneCliente,
      preferenciaContato: formData.preferenciaContato || ['email'],
      estadoOrigem: formData.estadoOrigem,
      cidadeOrigem: formData.cidadeOrigem,
      enderecoOrigem: formData.enderecoOrigem,
      bairroOrigem: formData.bairroOrigem,
      tipoOrigem: formData.tipoOrigem,
      estadoDestino: formData.estadoDestino,
      cidadeDestino: formData.cidadeDestino,
      enderecoDestino: formData.enderecoDestino,
      bairroDestino: formData.bairroDestino,
      tipoDestino: formData.tipoDestino,
      descricao: formData.descricao,
      comodos: formData.comodos,
      precisaEmbalagem: formData.precisaEmbalagem,
      pecas: formData.pecas,
      tempoArmazenamento: formData.tempoArmazenamento,
      oQuePrecisa: formData.oQuePrecisa,
      dataEstimada: formData.dataEstimada,
      ipCliente: ip,
      status: 'pendente' as const,
      empresaId: formData.empresaId,
    };

    // Criar orçamento no banco
    const orcamento = await createOrcamento(orcamentoData);

    if (!orcamento.id) {
      throw new Error('Orçamento criado mas ID não retornado');
    }

    // Relacionar orçamento com empresas
    if (formData.empresaId) {
      // Se foi especificada uma empresa específica, relacionar apenas com ela
      await relacionarOrcamentoComEmpresas(
        orcamento.id,
        [formData.empresaId]
      );
    } else {
      // Buscar empresas que atendem origem OU destino baseado no tipo de serviço
      await relacionarOrcamentoComEmpresas(
        orcamento.id,
        undefined, // empresaIds
        formData.cidadeOrigem,
        formData.cidadeDestino,
        formData.estadoOrigem,
        formData.estadoDestino
      );
    }

    // TODO: Enviar emails para empresas
    // await sendEmailsToEmpresas(orcamento.id);

    // TODO: Enviar email de confirmação para cliente
    // await sendConfirmationEmail(formData.emailCliente, orcamento.id);

    return NextResponse.json({
      success: true,
      orcamentoId: orcamento.id,
      message: 'Orçamento criado com sucesso',
    });

  } catch (error: any) {
    console.error('Erro ao criar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar orçamento', details: error.message },
      { status: 500 }
    );
  }
}

