import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { processEmailTemplate } from '@/lib/email/template-service'
import { htmlToTextServer } from '@/lib/utils/html-to-text'
import { formatDateOnlyBR } from '@/lib/utils/date'

export async function POST(request: NextRequest) {
  try {
    const { orcamentoId } = await request.json()

    if (!orcamentoId) {
      return NextResponse.json(
        { error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Buscar orçamento completo
    const { data: orcamento, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', orcamentoId)
      .single()

    if (orcamentoError || !orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    // Buscar empresas relacionadas (hotsites notificados)
    const { data: vinculos, error: vinculosError } = await supabase
      .from('orcamentos_campanhas')
      .select(`
        hotsite_id,
        hotsites (
          id,
          nome_exibicao,
          email,
          telefone1,
          telefone2,
          telefone3,
          cidade,
          estado
        )
      `)
      .eq('orcamento_id', orcamentoId)

    if (vinculosError) {
      console.error('Erro ao buscar empresas:', vinculosError)
    }

    // Coletar empresas únicas
    const empresasMap = new Map<string, any>()
    if (vinculos) {
      vinculos.forEach((vinculo: any) => {
        if (vinculo.hotsites && typeof vinculo.hotsites === 'object' && !Array.isArray(vinculo.hotsites)) {
          const hotsiteId = vinculo.hotsites.id || vinculo.hotsite_id
          if (hotsiteId && !empresasMap.has(hotsiteId)) {
            empresasMap.set(hotsiteId, vinculo.hotsites)
          }
        }
      })
    }

    const empresas = Array.from(empresasMap.values())

    // Funções auxiliares de formatação
    const formatarTelefone = (telefone: string | null | undefined): string => {
      if (!telefone) return 'Não informado'
      const numeros = telefone.replace(/\D/g, '')
      if (numeros.length === 0) return 'Não informado'
      
      if (numeros.length === 10) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
      } else if (numeros.length === 11) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
      } else if (numeros.length > 11) {
        const semPais = numeros.slice(-11)
        return `(${semPais.slice(0, 2)}) ${semPais.slice(2, 7)}-${semPais.slice(7)}`
      }
      
      return telefone
    }

    const formatarMetragem = (metragem: string | null): string => {
      if (!metragem) return 'Não informado'
      const map: Record<string, string> = {
        'ate_50': 'Até 50 m²',
        '50_150': '50 a 150 m²',
        '150_300': '150 a 300 m²',
        'acima_300': 'Acima de 300 m²'
      }
      return map[metragem] || metragem
    }

    const origemFormatada = orcamento.endereco_origem && orcamento.cidade_origem && orcamento.estado_origem
      ? `${orcamento.endereco_origem} (${orcamento.cidade_origem}, ${orcamento.estado_origem})`
      : orcamento.origem_completo || `${orcamento.cidade_origem || ''}, ${orcamento.estado_origem || ''}`.trim()

    const destinoFormatada = orcamento.endereco_destino && orcamento.cidade_destino && orcamento.estado_destino
      ? `${orcamento.endereco_destino} (${orcamento.cidade_destino}, ${orcamento.estado_destino})`
      : orcamento.destino_completo || `${orcamento.cidade_destino || ''}, ${orcamento.estado_destino || ''}`.trim()

    // Formatar lista de empresas em HTML
    let listaEmpresasHtml = ''
    if (empresas && empresas.length > 0) {
      listaEmpresasHtml = '<div style="margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 8px;">'
      listaEmpresasHtml += '<h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">🏢 Empresas Notificadas</h3>'
      listaEmpresasHtml += '<ul style="list-style: none; padding: 0; margin: 0;">'
      
      empresas.forEach((empresa: any) => {
        listaEmpresasHtml += '<li style="padding: 15px; margin-bottom: 10px; background: white; border-left: 4px solid #667eea; border-radius: 5px;">'
        listaEmpresasHtml += `<strong style="color: #1f2937; font-size: 16px; display: block; margin-bottom: 8px;">${empresa.nome_exibicao || 'Empresa'}</strong>`
        
        if (empresa.cidade && empresa.estado) {
          listaEmpresasHtml += `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">📍 ${empresa.cidade}, ${empresa.estado}</p>`
        }
        
        if (empresa.email) {
          listaEmpresasHtml += `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">📧 <a href="mailto:${empresa.email}" style="color: #667eea; text-decoration: none;">${empresa.email}</a></p>`
        }
        
        const telefones = [empresa.telefone1, empresa.telefone2, empresa.telefone3].filter(t => t)
        if (telefones.length > 0) {
          listaEmpresasHtml += `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">📞 ${telefones.map(t => formatarTelefone(t)).join(' | ')}</p>`
        }
        
        listaEmpresasHtml += '</li>'
      })
      
      listaEmpresasHtml += '</ul>'
      listaEmpresasHtml += '</div>'
    } else {
      listaEmpresasHtml = '<div style="margin-top: 20px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">'
      listaEmpresasHtml += '<p style="color: #92400e; margin: 0; font-size: 14px;">⚠️ Nenhuma empresa disponível no momento para atender sua região.</p>'
      listaEmpresasHtml += '</div>'
    }

    const variables = {
      codigo_orcamento: orcamento.codigo_orcamento || '',
      nome_cliente: orcamento.nome_cliente,
      email_cliente: orcamento.email_cliente,
      telefone_cliente: formatarTelefone(orcamento.telefone_cliente || orcamento.whatsapp),
      origem_completo: origemFormatada,
      destino_completo: destinoFormatada,
      distancia_km: orcamento.distancia_km?.toString() || '0',
      tipo_imovel: orcamento.tipo_imovel === 'apartamento' ? 'Apartamento' : orcamento.tipo_imovel === 'casa' ? 'Casa' : orcamento.tipo_imovel || 'Não informado',
      metragem: formatarMetragem(orcamento.metragem),
      data_estimada: formatDateOnlyBR(orcamento.data_estimada),
      preco_min: orcamento.preco_min?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
      preco_max: orcamento.preco_max?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
      lista_objetos: orcamento.lista_objetos || 'Não informado',
      lista_empresas: listaEmpresasHtml,
      codigo_rastreamento: 'PREVIEW-' + Date.now()
    }

    // Processar template
    const resultado = await processEmailTemplate('orcamento_cliente', variables, {
      orcamento_id: orcamentoId,
      tipo_email: 'orcamento_cliente'
    })

    if (!resultado) {
      return NextResponse.json(
        { error: 'Template de email não encontrado ou inativo' },
        { status: 404 }
      )
    }

    // Converter HTML para texto puro
    const texto = htmlToTextServer(resultado.html)

    // Buscar status do SocketLabs relacionado (se o email já foi enviado)
    let socketLabsStatus: {
      status: string
      hasError: boolean
      transactionReceipt?: string
      messageId?: string
      erro?: string
      enviado_em?: string
    } | null = null

    try {
      // Buscar log do SocketLabs relacionado ao email do cliente
      const { data: socketLabsLog } = await supabase
        .from('email_tracking')
        .select('metadata, enviado_em, assunto')
        .eq('tipo_email', 'email_enviado')
        .eq('orcamento_id', orcamentoId)
        .eq('email_destinatario', orcamento.email_cliente)
        .maybeSingle()

      if (socketLabsLog) {
        const status = socketLabsLog.metadata?.status_envio || socketLabsLog.metadata?.response?.status || 'desconhecido'
        socketLabsStatus = {
          status,
          hasError: status === 'erro' || status === 'error' || !!socketLabsLog.metadata?.erro,
          transactionReceipt: socketLabsLog.metadata?.transactionReceipt || socketLabsLog.metadata?.response?.transactionReceipt,
          messageId: socketLabsLog.metadata?.messageId || socketLabsLog.metadata?.response?.messageId,
          erro: socketLabsLog.metadata?.erro || socketLabsLog.metadata?.erro_mensagem,
          enviado_em: socketLabsLog.enviado_em
        }
      }
    } catch (error) {
      console.error('Erro ao buscar status do SocketLabs:', error)
    }

    return NextResponse.json({
      success: true,
      assunto: resultado.assunto,
      html: resultado.html,
      texto: texto || 'Erro ao converter HTML para texto',
      codigo_rastreamento: resultado.codigoRastreamento,
      destinatario: orcamento.email_cliente,
      empresas_count: empresas.length,
      socketlabs_status: socketLabsStatus
    })

  } catch (error: any) {
    console.error('Erro ao gerar preview do email:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar preview do email' },
      { status: 500 }
    )
  }
}

