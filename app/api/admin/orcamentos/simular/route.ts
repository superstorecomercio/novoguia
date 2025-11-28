import { NextRequest, NextResponse } from 'next/server'
import { criarOrcamentoENotificar } from '@/lib/db/queries/orcamentos'

/**
 * API Route para simular criação de orçamento
 * POST /api/admin/orcamentos/simular
 * 
 * Cria um orçamento de teste com dados fictícios para testar o fluxo completo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Dados padrão para simulação (podem ser sobrescritos pelo body)
    // IMPORTANTE: Usar os mesmos nomes de campos que a função criarOrcamentoENotificar espera
    const dadosOrcamento = {
      nome: body.nome || 'Cliente Teste',
      email: body.email || 'teste@exemplo.com',
      whatsapp: body.whatsapp || '5511999999999',
      origem: body.origem || 'São Paulo, SP',
      destino: body.destino || 'Rio de Janeiro, RJ',
      estadoOrigem: body.estadoOrigem || 'SP',
      cidadeOrigem: body.cidadeOrigem || 'São Paulo',
      estadoDestino: body.estadoDestino || 'RJ',
      cidadeDestino: body.cidadeDestino || 'Rio de Janeiro',
      tipoImovel: body.tipoImovel || 'apartamento',
      temElevador: body.temElevador || false,
      andar: body.andar || 1,
      precisaEmbalagem: body.precisaEmbalagem || false,
      distanciaKm: body.distanciaKm || 430,
      precoMin: body.precoMin || 2500,
      precoMax: body.precoMax || 5500,
      mensagemIA: body.mensagemIA || 'Simulação de orçamento de mudança entre São Paulo e Rio de Janeiro. Distância aproximada de 430km.',
      listaObjetos: body.listaObjetos || 'Sofá, mesa, geladeira, fogão',
      dataEstimada: body.dataEstimada || '2026-01-15', // Data no formato YYYY-MM-DD
      origemFormulario: 'simulacao_admin',
      userAgent: 'Admin Simulator',
      ipCliente: null,
      // Campos adicionais que podem ser necessários
      enderecoOrigem: body.enderecoOrigem || null,
      enderecoDestino: body.enderecoDestino || null
    }

    console.log('🧪 [Simulação] Criando orçamento de teste:', dadosOrcamento)

    // Chamar função que cria orçamento e notifica empresas
    const resultado = await criarOrcamentoENotificar(dadosOrcamento)

    console.log('✅ [Simulação] Orçamento criado:', {
      id: resultado.orcamentoId,
      hotsites: resultado.hotsitesNotificados,
      ids: resultado.hotsitesIds
    })

    return NextResponse.json({
      success: true,
      message: 'Orçamento de teste criado com sucesso!',
      orcamento: {
        id: resultado.orcamentoId,
        hotsites_notificados: resultado.hotsitesNotificados,
        campanhas_ids: resultado.hotsitesIds,
        dados: dadosOrcamento
      },
      links: {
        detalhes: `/admin/orcamentos/${resultado.orcamentoId}`,
        fila_emails: '/admin/emails',
        fila_emails_clientes: '/admin/emails/clientes'
      }
    })
  } catch (error: any) {
    console.error('❌ [Simulação] Erro ao criar orçamento:', error)
    return NextResponse.json(
      {
        error: 'Erro ao criar orçamento de teste',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Retorna informações sobre a simulação
 */
export async function GET() {
  return NextResponse.json({
    description: 'Simula a criação de um orçamento com dados fictícios',
    method: 'POST',
    endpoint: '/api/admin/orcamentos/simular',
    exemplo: {
      nome: 'Cliente Teste',
      email: 'teste@exemplo.com',
      whatsapp: '5511999999999',
      origem: 'São Paulo, SP',
      destino: 'Rio de Janeiro, RJ',
      estadoOrigem: 'SP',
      cidadeOrigem: 'São Paulo',
      estadoDestino: 'RJ',
      cidadeDestino: 'Rio de Janeiro',
      tipoImovel: 'apartamento',
      distanciaKm: 430,
      precoMin: 2500,
      precoMax: 5500,
      dataEstimada: '2026-01-15'
    },
    nota: 'Todos os campos são opcionais. Se não fornecidos, serão usados valores padrão.'
  })
}

