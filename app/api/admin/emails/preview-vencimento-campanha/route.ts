import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { processEmailTemplate } from '@/lib/email/template-service'

/**
 * API para gerar preview do email de vencimento de campanha
 * POST /api/admin/emails/preview-vencimento-campanha
 * 
 * Recebe email_tracking_id e retorna o email processado com as variáveis substituídas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailTrackingId } = body

    if (!emailTrackingId) {
      return NextResponse.json(
        { error: 'emailTrackingId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Buscar email_tracking com dados da campanha e hotsite
    const { data: emailTracking, error: emailError } = await supabase
      .from('email_tracking')
      .select(`
        id,
        campanha_id,
        hotsite_id,
        tipo_email,
        campanhas (
          id,
          data_fim,
          valor_mensal,
          planos (
            id,
            nome,
            preco
          ),
          hotsites (
            id,
            nome_exibicao,
            email
          )
        )
      `)
      .eq('id', emailTrackingId)
      .single()

    if (emailError || !emailTracking) {
      return NextResponse.json(
        { error: 'Email tracking não encontrado' },
        { status: 404 }
      )
    }

    const campanha = (emailTracking as any).campanhas
    const hotsite = campanha?.hotsites
    const plano = campanha?.planos

    if (!campanha || !hotsite) {
      return NextResponse.json(
        { error: 'Dados da campanha ou hotsite não encontrados' },
        { status: 404 }
      )
    }

    // Preparar variáveis para o template
    const dataFim = campanha?.data_fim ? new Date(campanha.data_fim) : null
    const diasRestantes = dataFim 
      ? Math.ceil((dataFim.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // Buscar dados do plano
    const nomePlano = plano?.nome || 'Sem plano'
    // Usar o preço do plano, não o valor_mensal da campanha
    const valorPlano = plano?.preco || 0
    const valorPlanoFormatado = valorPlano > 0 
      ? `R$ ${valorPlano.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'Não informado'

    const variables = {
      nome_empresa: hotsite.nome_exibicao,
      empresa_nome: hotsite.nome_exibicao,
      empresa_email: hotsite.email,
      campanha_nome: hotsite.nome_exibicao || 'Campanha',
      nome_campanha: hotsite.nome_exibicao || 'Campanha',
      nome_plano: nomePlano,
      valor_plano: valorPlanoFormatado,
      data_fim: dataFim ? dataFim.toLocaleDateString('pt-BR') : '',
      data_vencimento: dataFim ? dataFim.toLocaleDateString('pt-BR') : '',
      dias_restantes: diasRestantes.toString()
    }

    // Determinar tipo de template
    const tipoTemplate = emailTracking.tipo_email === 'campanha_vencendo_hoje' 
      ? 'campanha_vencendo_hoje' 
      : 'campanha_vencendo_1dia'

    // Processar template
    const templateResult = await processEmailTemplate(tipoTemplate, variables, {
      campanha_id: emailTracking.campanha_id,
      hotsite_id: emailTracking.hotsite_id,
      tipo_email: emailTracking.tipo_email
    })

    if (!templateResult || !templateResult.assunto || !templateResult.html) {
      return NextResponse.json(
        { error: 'Template não encontrado ou inativo' },
        { status: 404 }
      )
    }

    // Converter HTML para texto simples (remover tags)
    const texto = templateResult.html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()

    return NextResponse.json({
      success: true,
      assunto: templateResult.assunto,
      html: templateResult.html,
      texto: texto
    })

  } catch (error: any) {
    console.error('Erro ao gerar preview:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar preview do email' },
      { status: 500 }
    )
  }
}

