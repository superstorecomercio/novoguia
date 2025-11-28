import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getEmailConfig } from '@/lib/email/config'
import { processEmailTemplate } from '@/lib/email/template-service'
import { importEmailService } from '@/lib/email/dynamic-import'
import { isTestMode } from '@/lib/email/test-mode'

/**
 * Rota para enviar emails de aviso de vencimento de campanha que estão na fila
 * POST /api/admin/emails/enviar-vencimento-campanha
 * 
 * Busca emails na fila com tipo 'campanha_vencendo_hoje' ou 'campanha_vencendo_1dia'
 * e envia os emails
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Buscar configuração de email
    const emailConfig = await getEmailConfig()
    const testMode = await isTestMode()
    
    // Verificar se está em modo teste
    console.log('📧 [Enviar Vencimento] Configuração:', {
      existe: !!emailConfig,
      from_email: emailConfig?.from_email,
      provider: emailConfig?.provider,
      ativo: emailConfig?.ativo,
      testMode
    })
    
    // Em modo teste, permitir mesmo se inativo, mas precisa ter dados básicos
    if (!emailConfig) {
      return NextResponse.json(
        { error: 'Configuração de email não encontrada. Configure em /admin/emails/configuracao' },
        { status: 400 }
      )
    }
    
    // Validar dados mínimos necessários (from_email é obrigatório sempre)
    if (!emailConfig.from_email || emailConfig.from_email.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Email de origem não configurado. Configure em /admin/emails/configuracao',
          debug: { from_email: emailConfig.from_email, provider: emailConfig.provider }
        },
        { status: 400 }
      )
    }
    
    // Provider é obrigatório apenas se não estiver em modo teste
    if (!testMode && (!emailConfig.provider || emailConfig.provider === null)) {
      return NextResponse.json(
        { error: 'Provedor de email não configurado. Configure em /admin/emails/configuracao' },
        { status: 400 }
      )
    }
    
    // Se não está em modo teste, verificar se tem os dados necessários
    if (!testMode) {
      const temDadosNecessarios = emailConfig.provider && 
                                   emailConfig.api_key && 
                                   emailConfig.api_key.trim() !== '' &&
                                   emailConfig.from_email && 
                                   emailConfig.from_email.trim() !== '';
      
      // Se não tem dados necessários E não está ativo, bloquear
      if (!temDadosNecessarios && !emailConfig.ativo) {
        return NextResponse.json(
          { error: 'Configuração de email incompleta ou inativa. Configure e ative em /admin/emails/configuracao' },
          { status: 400 }
        )
      }
      
      // Se tem dados necessários mas não está ativo, apenas avisar (mas permitir)
      if (temDadosNecessarios && !emailConfig.ativo) {
        console.warn('⚠️ [Enviar Vencimento] Configuração tem dados mas não está marcada como ativa. Permitindo envio mesmo assim.')
      }
    }
    
    // Em modo teste, se não tiver provider, usar um padrão para processar templates
    if (testMode && (!emailConfig.provider || emailConfig.provider === null)) {
      emailConfig.provider = 'socketlabs'
      emailConfig.api_key = emailConfig.api_key || 'test-key'
    }

    // Buscar emails na fila de vencimento (vencendo hoje ou 1 dia antes)
    // Primeiro, buscar os emails na fila
    let query = supabase
      .from('email_tracking')
      .select(`
        id,
        codigo_rastreamento,
        campanha_id,
        hotsite_id,
        tipo_email,
        email_destinatario,
        assunto,
        metadata,
        status_envio_email
      `)
      .in('tipo_email', ['campanha_vencendo_hoje', 'campanha_vencendo_1dia'])
      .limit(50)

    // Filtrar por status (na_fila ou null)
    query = query.or('status_envio_email.is.null,status_envio_email.eq.na_fila')

    const { data: emailsFila, error: emailsError } = await query

    if (emailsError) {
      console.error('❌ [Enviar Vencimento] Erro ao buscar emails na fila:', emailsError)
      return NextResponse.json(
        { 
          error: 'Erro ao buscar emails na fila de vencimento',
          details: emailsError.message,
          code: emailsError.code
        },
        { status: 500 }
      )
    }

    // Se não há emails, retornar sucesso vazio
    if (!emailsFila || emailsFila.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum email na fila de vencimento encontrado',
        enviados: 0
      })
    }

    // Buscar dados das campanhas e hotsites separadamente
    const campanhaIds = emailsFila.map(e => e.campanha_id).filter(Boolean) as string[]
    const hotsiteIds = emailsFila.map(e => e.hotsite_id).filter(Boolean) as string[]

    // Buscar campanhas com planos
    const { data: campanhas, error: campanhasError } = await supabase
      .from('campanhas')
      .select(`
        id,
        data_fim,
        hotsite_id,
        valor_mensal,
        planos (
          id,
          nome,
          preco
        )
      `)
      .in('id', campanhaIds)

    if (campanhasError) {
      console.error('❌ [Enviar Vencimento] Erro ao buscar campanhas:', campanhasError)
    }

    // Buscar hotsites
    const { data: hotsites, error: hotsitesError } = await supabase
      .from('hotsites')
      .select(`
        id,
        nome_exibicao,
        email
      `)
      .in('id', hotsiteIds)

    if (hotsitesError) {
      console.error('❌ [Enviar Vencimento] Erro ao buscar hotsites:', hotsitesError)
    }

    // Criar mapas para acesso rápido
    const campanhasMap = new Map((campanhas || []).map(c => [c.id, c]))
    const hotsitesMap = new Map((hotsites || []).map(h => [h.id, h]))

    // Combinar dados
    const emailsComDados = emailsFila.map(emailTracking => {
      const campanha = emailTracking.campanha_id ? campanhasMap.get(emailTracking.campanha_id) : null
      const hotsite = emailTracking.hotsite_id ? hotsitesMap.get(emailTracking.hotsite_id) : null
      
      return {
        ...emailTracking,
        campanha,
        hotsite
      }
    })

    // Importar serviço de email
    const emailService = await importEmailService(emailConfig.provider!)
    if (!emailService) {
      return NextResponse.json(
        { error: `Serviço de email ${emailConfig.provider} não disponível` },
        { status: 500 }
      )
    }

    const resultados = {
      enviados: 0,
      erros: 0,
      detalhes: [] as Array<{ empresa: string; status: string; erro?: string }>
    }

    // Preparar configuração do serviço
    const serviceConfig: any = {
      apiKey: emailConfig.api_key,
      from: emailConfig.from_email,
      fromName: emailConfig.from_name,
      replyTo: emailConfig.reply_to || emailConfig.from_email
    }

    if (emailConfig.provider === 'socketlabs' && emailConfig.server_id) {
      serviceConfig.serverId = emailConfig.server_id
    }

    // Processar cada email da fila
    for (const emailTracking of emailsComDados) {
      const campanha = emailTracking.campanha
      const hotsite = emailTracking.hotsite

      if (!hotsite?.email) {
        resultados.erros++
        resultados.detalhes.push({
          empresa: hotsite?.nome_exibicao || 'N/A',
          status: 'erro',
          erro: 'Hotsite não possui email cadastrado'
        })
        continue
      }

      try {
        // Buscar template baseado no tipo de email
        const tipoTemplate = emailTracking.tipo_email === 'campanha_vencendo_hoje' 
          ? 'campanha_vencendo_hoje' 
          : 'campanha_vencendo_1dia'

        // Preparar variáveis para o template
        const dataFim = campanha?.data_fim ? new Date(campanha.data_fim) : null
        const diasRestantes = dataFim 
          ? Math.ceil((dataFim.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 0

        // Buscar dados do plano
        const plano = (campanha as any)?.planos
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

        console.log('📧 [Enviar Vencimento] Variáveis do template:', variables)

        // Processar template
        const templateResult = await processEmailTemplate(tipoTemplate, variables, {
          campanha_id: emailTracking.campanha_id,
          hotsite_id: emailTracking.hotsite_id,
          tipo_email: emailTracking.tipo_email
        })

        if (!templateResult || !templateResult.assunto || !templateResult.html) {
          resultados.erros++
          resultados.detalhes.push({
            empresa: hotsite.nome_exibicao,
            status: 'erro',
            erro: 'Template de email não encontrado ou inativo'
          })
          continue
        }

        // Enviar email
        const sendResult = await emailService.sendEmail(
          {
            to: hotsite.email,
            subject: templateResult.assunto,
            html: templateResult.html,
            from: emailConfig.from_email,
            fromName: emailConfig.from_name,
            replyTo: emailConfig.reply_to || emailConfig.from_email,
            metadata: {
              campanha_id: emailTracking.campanha_id,
              hotsite_id: emailTracking.hotsite_id,
              tipo_email: emailTracking.tipo_email
            }
          },
          serviceConfig,
          {
            campanha_id: emailTracking.campanha_id,
            hotsite_id: emailTracking.hotsite_id,
            tipo_email: emailTracking.tipo_email
          }
        )

        if (sendResult.success) {
          // Atualizar status do email_tracking
          const { error: updateError } = await supabase
            .from('email_tracking')
            .update({
              status_envio_email: 'enviado',
              enviado_em: new Date().toISOString(),
              metadata: {
                ...(emailTracking.metadata || {}),
                provider: emailConfig.provider,
                messageId: sendResult.messageId,
                testMode: sendResult.testMode || false,
                enviado_em: new Date().toISOString()
              }
            })
            .eq('id', emailTracking.id)

          if (updateError) {
            console.error('❌ [Enviar Vencimento] Erro ao atualizar status:', updateError)
            throw new Error(`Erro ao atualizar status: ${updateError.message}`)
          }

          console.log('✅ [Enviar Vencimento] Email enviado e status atualizado para:', emailTracking.id)

          resultados.enviados++
          resultados.detalhes.push({
            empresa: hotsite.nome_exibicao,
            status: 'enviado'
          })
        } else {
          throw new Error(sendResult.error || 'Erro desconhecido ao enviar email')
        }
      } catch (error: any) {
        // Atualizar status para erro
        await supabase
          .from('email_tracking')
          .update({
            status_envio_email: 'erro',
            metadata: {
              ...(emailTracking.metadata || {}),
              erro: error.message || 'Erro desconhecido',
              tentativa_em: new Date().toISOString()
            }
          })
          .eq('id', emailTracking.id)

        resultados.erros++
        resultados.detalhes.push({
          empresa: hotsite?.nome_exibicao || 'N/A',
          status: 'erro',
          erro: error.message || 'Erro desconhecido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processados ${emailsFila.length} emails da fila: ${resultados.enviados} enviados, ${resultados.erros} erros`,
      ...resultados
    })

  } catch (error: any) {
    console.error('Erro ao enviar emails de vencimento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar envio de emails' },
      { status: 500 }
    )
  }
}
