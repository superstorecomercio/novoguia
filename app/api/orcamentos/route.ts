import { NextRequest, NextResponse } from 'next/server';
import { criarOrcamentoENotificar } from '../../../lib/db/queries/orcamentos';
import { type OrcamentoFormData } from '../../types';

/**
 * API Route para criar orçamento
 * POST /api/orcamentos
 * 
 * ✅ Usa função RPC criar_orcamento_e_notificar que automaticamente:
 * - Cria o orçamento
 * - Busca campanhas ativas no estado destino
 * - Cria vínculos em orcamentos_campanhas
 * - Retorna hotsites_notificados
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const formData = body as OrcamentoFormData;

    console.log('📋 [API Orçamentos] Recebendo dados:', {
      nome: formData.nomeCliente,
      origem: formData.cidadeOrigem,
      destino: formData.cidadeDestino,
    });

    // Validar dados obrigatórios
    if (!formData.nomeCliente || !formData.emailCliente || !formData.telefoneCliente) {
      return NextResponse.json(
        { error: 'Nome, email e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    if (!formData.cidadeOrigem || !formData.cidadeDestino) {
      return NextResponse.json(
        { error: 'Cidade de origem e destino são obrigatórias' },
        { status: 400 }
      );
    }

    if (!formData.estadoDestino) {
      return NextResponse.json(
        { error: 'Estado de destino é obrigatório' },
        { status: 400 }
      );
    }

    // Obter IP do cliente
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               null;

    // Obter User Agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Montar lista de objetos se disponível
    let listaObjetos = '';
    if (formData.comodos && Array.isArray(formData.comodos)) {
      listaObjetos = formData.comodos.join(', ');
    }
    if (formData.pecas && Array.isArray(formData.pecas) && formData.pecas.length > 0) {
      listaObjetos += (listaObjetos ? ', ' : '') + formData.pecas.join(', ');
    }
    if (formData.descricao) {
      listaObjetos += (listaObjetos ? '. ' : '') + formData.descricao;
    }

    // Preparar dados para função RPC
    const dadosOrcamento = {
      nome: formData.nomeCliente,
      email: formData.emailCliente,
      whatsapp: formData.telefoneCliente,
      origem: `${formData.cidadeOrigem}${formData.enderecoOrigem ? ', ' + formData.enderecoOrigem : ''}, ${formData.estadoOrigem || ''}`,
      destino: `${formData.cidadeDestino}${formData.enderecoDestino ? ', ' + formData.enderecoDestino : ''}, ${formData.estadoDestino}`,
      estadoOrigem: formData.estadoOrigem,
      cidadeOrigem: formData.cidadeOrigem,
      estadoDestino: formData.estadoDestino,
      cidadeDestino: formData.cidadeDestino,
      tipoImovel: formData.tipoOrigem as any || 'apartamento',
      temElevador: false, // Formulário simples não tem essa info
      andar: 0, // Formulário simples não tem essa info
      precisaEmbalagem: formData.precisaEmbalagem || false,
      listaObjetos: listaObjetos || null,
      dataEstimada: formData.dataEstimada || new Date().toISOString().split('T')[0],
      origemFormulario: 'formulario_simples',
      userAgent: userAgent,
      ipCliente: ip,
    };

    console.log('🚀 [API Orçamentos] Chamando criarOrcamentoENotificar...');
    console.log('📦 Dados:', {
      ...dadosOrcamento,
      listaObjetos: dadosOrcamento.listaObjetos?.substring(0, 50) + '...'
    });

    // ✅ Usar função RPC que cria vínculos automaticamente
    const resultado = await criarOrcamentoENotificar(dadosOrcamento);

    console.log('✅ [API Orçamentos] Orçamento criado:', {
      id: resultado.orcamentoId,
      hotsites: resultado.hotsitesNotificados,
      ids: resultado.hotsitesIds
    });

    // TODO: Enviar emails para empresas
    // await sendEmailsToEmpresas(resultado.orcamentoId);

    // TODO: Enviar email de confirmação para cliente
    // await sendConfirmationEmail(formData.emailCliente, resultado.orcamentoId);

    return NextResponse.json({
      success: true,
      orcamentoId: resultado.orcamentoId,
      hotsitesNotificados: resultado.hotsitesNotificados,
      message: `Orçamento criado com sucesso! ${resultado.hotsitesNotificados} empresas foram notificadas.`,
    });

  } catch (error: any) {
    console.error('❌ [API Orçamentos] Erro ao criar orçamento:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar orçamento', 
        details: error.message,
        hint: 'Verifique se o script CORRIGIR_ORCAMENTOS_COMPLETO.sql foi executado no Supabase'
      },
      { status: 500 }
    );
  }
}

