import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { importEmailService } from '@/lib/email/dynamic-import'
import { processEmailTemplate } from '@/lib/email/template-service'
import { getEmailConfig } from '@/lib/email/config'
import { isTestMode } from '@/lib/email/test-mode'
import { formatDateOnlyBR } from '@/lib/utils/date'

/**
 * API Route para enviar emails pendentes para clientes
 * POST /api/admin/emails/enviar-clientes-pendentes
 * 
 * Processa emails do tipo 'orcamento_cliente' que estão na fila (status_envio_email = 'na_fila')
 * Envia até 50 emails por execução
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const testMode = await isTestMode()

    // Buscar configuração de email
    const emailConfig = await getEmailConfig()
    
    // Verificar se está em modo teste
    console.log('📧 [Enviar Clientes Pendentes] Configuração:', {
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
    // Se tiver provider, api_key e from_email, permitir mesmo se não estiver marcado como ativo
    if (!testMode) {
      const temDadosNecessarios = emailConfig.provider && 
                                   emailConfig.api_key && 
                                   emailConfig.api_key.trim() !== '' &&
                                   emailConfig.from_email && 
                                   emailConfig.from_email.trim() !== '';
      
      if (!temDadosNecessarios) {
        return NextResponse.json(
          { 
            error: 'Configuração de email incompleta',
            message: 'Configure o provedor de email, API key e email remetente em /admin/emails/configuracao'
          },
          { status: 400 }
        )
      }
      
      // Se estiver inativo mas tem dados, apenas avisar
      if (!emailConfig.ativo) {
        console.warn('⚠️ [Enviar Clientes Pendentes] Configuração de email está inativa, mas dados estão presentes. Continuando...')
      }
    }
    
    // Em modo teste, usar provider padrão se não tiver
    if (testMode && (!emailConfig.provider || emailConfig.provider === null)) {
      emailConfig.provider = 'socketlabs'
      emailConfig.api_key = emailConfig.api_key || 'test-key'
    }

    // Buscar emails de clientes na fila (máximo 50 por execução)
    const { data: emailsPendentes, error: errorBuscar } = await supabase
      .from('email_tracking')
      .select(`
        id,
        codigo_rastreamento,
        orcamento_id,
        email_destinatario,
        assunto,
        metadata,
        orcamentos (
          id,
          codigo_orcamento,
          nome_cliente,
          email_cliente,
          telefone_cliente,
          whatsapp,
          origem_completo,
          destino_completo,
          cidade_origem,
          estado_origem,
          cidade_destino,
          estado_destino,
          endereco_origem,
          endereco_destino,
          distancia_km,
          tipo_imovel,
          metragem,
          data_estimada,
          preco_min,
          preco_max,
          lista_objetos
        )
      `)
      .eq('tipo_email', 'orcamento_cliente')
      .eq('status_envio_email', 'na_fila')
      .limit(50)

    if (errorBuscar) {
      console.error('❌ Erro ao buscar emails pendentes:', errorBuscar)
      return NextResponse.json(
        { error: 'Erro ao buscar emails pendentes', details: errorBuscar.message },
        { status: 500 }
      )
    }

    console.log(`📧 [Enviar Clientes Pendentes] Encontrados ${emailsPendentes?.length || 0} emails na fila`)
    
    if (!emailsPendentes || emailsPendentes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum email de cliente pendente na fila',
        enviados: 0,
        erros: 0
      })
    }
    
    console.log(`📧 Processando ${emailsPendentes.length} emails de clientes pendentes...`)

    // Importar serviço de email dinamicamente
    const emailService = await importEmailService(emailConfig.provider || 'socketlabs')
    
    let enviados = 0
    let erros = 0
    const detalhesErros: string[] = []

    // Processar cada email
    for (const emailTracking of emailsPendentes) {
      try {
        const orcamento = emailTracking.orcamentos as any
        
        if (!orcamento) {
          console.error(`❌ Orçamento não encontrado para email ${emailTracking.id}`)
          erros++
          detalhesErros.push(`Email ${emailTracking.id}: Orçamento não encontrado`)
          
          // Atualizar status para erro
          await supabase
            .from('email_tracking')
            .update({ 
              status_envio_email: 'erro',
              metadata: {
                ...emailTracking.metadata,
                erro: 'Orçamento não encontrado'
              }
            })
            .eq('id', emailTracking.id)
          
          continue
        }

        // Atualizar status para "enviando"
        await supabase
          .from('email_tracking')
          .update({ status_envio_email: 'enviando' })
          .eq('id', emailTracking.id)

        // Formatar dados para o template
        const formatarTelefone = (telefone: string | null) => {
          if (!telefone) return 'Não informado'
          const numeros = telefone.replace(/\D/g, '')
          if (numeros.length === 11) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
          } else if (numeros.length === 10) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
          }
          return telefone
        }

        const formatarMetragem = (metragem: string | null) => {
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

        // Buscar empresas relacionadas a este orçamento (mesma lógica do preview)
        console.log(`🔍 Buscando empresas para orçamento ${orcamento.id}...`)
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
          .eq('orcamento_id', orcamento.id)

        if (vinculosError) {
          console.error('❌ Erro ao buscar empresas:', vinculosError)
        }

        // Coletar empresas únicas (mesma lógica do preview)
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
        
        console.log(`🏢 Orçamento ${orcamento.id}: ${empresas.length} empresas encontradas`, {
          orcamentoId: orcamento.id,
          empresasCount: empresas.length,
          empresas: empresas.map((e: any) => ({ id: e.id, nome: e.nome_exibicao }))
        })
        
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

        // Processar template
        console.log('📧 Processando template orcamento_cliente para:', emailTracking.email_destinatario)
        const templateResult = await processEmailTemplate(
          'orcamento_cliente',
          {
            codigo_orcamento: orcamento.codigo_orcamento || 'N/A',
            nome_cliente: orcamento.nome_cliente || 'Cliente',
            email_cliente: orcamento.email_cliente || '',
            telefone_cliente: formatarTelefone(orcamento.telefone_cliente || orcamento.whatsapp),
            origem_completo: origemFormatada,
            destino_completo: destinoFormatada,
            distancia_km: orcamento.distancia_km ? orcamento.distancia_km.toLocaleString('pt-BR') : 'Não calculado',
            tipo_imovel: orcamento.tipo_imovel || 'Não informado',
            metragem: formatarMetragem(orcamento.metragem),
            data_estimada: orcamento.data_estimada ? formatDateOnlyBR(orcamento.data_estimada) : 'Não informado',
            preco_min: orcamento.preco_min ? orcamento.preco_min.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não calculado',
            preco_max: orcamento.preco_max ? orcamento.preco_max.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Não calculado',
            lista_objetos: orcamento.lista_objetos || 'Não informado',
            lista_empresas: listaEmpresasHtml,
            codigo_rastreamento: emailTracking.codigo_rastreamento
          },
          {
            orcamento_id: orcamento.id,
            tipo_email: 'orcamento_cliente'
          }
        )

        if (!templateResult) {
          console.error('❌ Template orcamento_cliente não encontrado ou inativo')
          throw new Error('Template de email não encontrado ou inativo. Verifique se o template orcamento_cliente existe e está ativo.')
        }

        if (!templateResult.assunto || !templateResult.html) {
          console.error('❌ Template result inválido:', {
            existe: !!templateResult,
            temAssunto: !!templateResult?.assunto,
            temHtml: !!templateResult?.html,
            assunto: templateResult?.assunto,
            htmlLength: templateResult?.html?.length
          })
          throw new Error('Erro ao processar template de email: assunto ou HTML não gerados')
        }

        console.log('✅ Template processado com sucesso:', {
          assunto: templateResult.assunto.substring(0, 50),
          htmlLength: templateResult.html.length
        })

        // Enviar email
        const serviceConfig = emailConfig.provider === 'socketlabs' 
          ? { apiKey: emailConfig.api_key, serverId: emailConfig.server_id }
          : { apiKey: emailConfig.api_key }

        const sendResult = await emailService.sendEmail(
          {
            to: emailTracking.email_destinatario,
            subject: templateResult.assunto,
            html: templateResult.html,
            from: emailConfig.from_email,
            fromName: emailConfig.from_name || 'MudaTech',
            replyTo: emailConfig.reply_to || emailConfig.from_email
          },
          serviceConfig,
          {
            orcamento_id: orcamento.id,
            tipo_email: 'orcamento_cliente'
          }
        )

        if (sendResult.success) {
          // Atualizar status para "enviado"
          await supabase
            .from('email_tracking')
            .update({ 
              status_envio_email: 'enviado',
              enviado_em: new Date().toISOString()
            })
            .eq('id', emailTracking.id)

          enviados++
          console.log(`✅ Email enviado para cliente: ${emailTracking.email_destinatario}`)
        } else {
          throw new Error(sendResult.error || 'Erro desconhecido ao enviar email')
        }

      } catch (error: any) {
        console.error(`❌ Erro ao enviar email ${emailTracking.id}:`, error)
        erros++
        detalhesErros.push(`Email ${emailTracking.id} (${emailTracking.email_destinatario}): ${error.message}`)

        // Atualizar status para "erro"
        await supabase
          .from('email_tracking')
          .update({ 
            status_envio_email: 'erro',
            metadata: {
              ...emailTracking.metadata,
              erro: error.message,
              tentativa_em: new Date().toISOString()
            }
          })
          .eq('id', emailTracking.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído: ${enviados} enviados, ${erros} erros`,
      enviados,
      erros,
      total: emailsPendentes.length,
      detalhesErros: erros > 0 ? detalhesErros : undefined
    })

  } catch (error: any) {
    console.error('❌ Erro ao processar emails de clientes:', error)
    return NextResponse.json(
      {
        error: 'Erro ao processar emails de clientes',
        details: error.message
      },
      { status: 500 }
    )
  }
}

