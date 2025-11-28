import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getEmailConfig } from '@/lib/email/config'
import { processEmailTemplate, saveEmailTracking } from '@/lib/email/template-service'
import { isTestMode } from '@/lib/email/test-mode'
import { importEmailService } from '@/lib/email/dynamic-import'

/**
 * Rota para enviar emails pendentes (orçamentos para empresas)
 * POST /api/admin/emails/enviar-pendentes
 * 
 * Busca orçamentos com empresas em status 'na_fila' ou 'erro' (com menos de 3 tentativas)
 * e envia os emails automaticamente.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Buscar configuração de email
    const emailConfig = await getEmailConfig()
    
    // Verificar se está em modo teste
    const testMode = await isTestMode()
    
    console.log('📧 [Enviar Pendentes] Configuração:', {
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
    // Em modo teste, podemos usar um provider padrão ou permitir sem provider
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
      
      // Se não tem dados necessários E não está ativo, bloquear
      if (!temDadosNecessarios && !emailConfig.ativo) {
        return NextResponse.json(
          { error: 'Configuração de email incompleta ou inativa. Configure e ative em /admin/emails/configuracao' },
          { status: 400 }
        )
      }
      
      // Se tem dados necessários mas não está ativo, apenas avisar (mas permitir)
      if (temDadosNecessarios && !emailConfig.ativo) {
        console.warn('⚠️ [Enviar Pendentes] Configuração tem dados mas não está marcada como ativa. Permitindo envio mesmo assim.')
      }
    }
    
    // Em modo teste, se não tiver provider, usar um padrão para processar templates
    if (testMode && (!emailConfig.provider || emailConfig.provider === null)) {
      // Em modo teste, não precisa de provider real, mas vamos usar socketlabs como padrão
      emailConfig.provider = 'socketlabs'
      emailConfig.api_key = emailConfig.api_key || 'test-key'
    }

    // Buscar empresas na fila ou com erro (menos de 3 tentativas)
    const { data: todosVinculos, error: vinculosError } = await supabase
      .from('orcamentos_campanhas')
      .select(`
        id,
        orcamento_id,
        hotsite_id,
        status_envio_email,
        tentativas_envio,
        ultimo_erro_envio,
        hotsites (
          id,
          nome_exibicao,
          email
        ),
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
          tipo_imovel,
          metragem,
          distancia_km,
          preco_min,
          preco_max,
          data_estimada,
          lista_objetos
        )
      `)
      .or('status_envio_email.eq.na_fila,and(status_envio_email.eq.erro,tentativas_envio.lt.3)')
      .order('created_at', { ascending: true }) // Processar os mais antigos primeiro

    if (vinculosError) {
      console.error('Erro ao buscar vínculos:', vinculosError)
      return NextResponse.json(
        { error: 'Erro ao buscar emails pendentes' },
        { status: 500 }
      )
    }

    if (!todosVinculos || todosVinculos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum email pendente para enviar',
        enviados: 0,
        erros: 0,
        total: 0,
        lotes: 0
      })
    }

    // Dividir em lotes de 50 emails
    const TAMANHO_LOTE = 50
    const lotes: typeof todosVinculos[] = []
    for (let i = 0; i < todosVinculos.length; i += TAMANHO_LOTE) {
      lotes.push(todosVinculos.slice(i, i + TAMANHO_LOTE))
    }

    console.log(`📦 [Enviar Pendentes] Processando ${todosVinculos.length} emails em ${lotes.length} lote(s)`)

    if (vinculosError) {
      console.error('Erro ao buscar vínculos:', vinculosError)
      return NextResponse.json(
        { error: 'Erro ao buscar emails pendentes' },
        { status: 500 }
      )
    }

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
      total: todosVinculos.length,
      lotes: lotes.length,
      detalhes: [] as Array<{ empresa: string; status: string; erro?: string; lote?: number }>
    }

    // Processar em lotes
    for (let indiceLote = 0; indiceLote < lotes.length; indiceLote++) {
      const lote = lotes[indiceLote]
      const numeroLote = indiceLote + 1
      
      console.log(`📦 [Lote ${numeroLote}/${lotes.length}] Processando ${lote.length} emails...`)

      // Processar cada vínculo do lote
      for (const vinculo of lote) {
      const hotsite = vinculo.hotsites as any
      const orcamento = vinculo.orcamentos as any

      if (!hotsite?.email || !orcamento) {
        resultados.erros++
        const erroMsg = 'Dados incompletos (hotsite ou orçamento não encontrado)'
        resultados.detalhes.push({
          empresa: hotsite?.nome_exibicao || 'N/A',
          status: 'erro',
          erro: erroMsg
        })
        
        // Salvar erro no tracking também
        try {
          await saveEmailTracking({
            codigo_rastreamento: `ERROR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            orcamento_id: vinculo.orcamento_id || undefined,
            hotsite_id: vinculo.hotsite_id || '00000000-0000-0000-0000-000000000000',
            tipo_email: 'orcamento_empresa',
            email_destinatario: hotsite?.email || 'N/A',
            assunto: 'Erro ao enviar orçamento',
            metadata: {
              provider: emailConfig.provider,
              status_envio: 'erro',
              erro_mensagem: erroMsg,
              testMode: testMode,
              lote: numeroLote,
              total_lotes: lotes.length,
              processado_em: new Date().toISOString()
            }
          })
        } catch (trackError) {
          console.error('Erro ao salvar tracking de erro:', trackError)
        }
        
        continue
      }

      try {
        // Atualizar status para "enviando"
        await supabase
          .from('orcamentos_campanhas')
          .update({
            status_envio_email: 'enviando',
            tentativas_envio: (vinculo.tentativas_envio || 0) + 1,
            ultima_tentativa_envio: new Date().toISOString()
          })
          .eq('id', vinculo.id)

        // Funções auxiliares de formatação
        const formatarTelefone = (telefone: string | null | undefined): string => {
          if (!telefone) return 'Não informado'
          // Remover todos os caracteres não numéricos
          const numeros = telefone.replace(/\D/g, '')
          if (numeros.length === 0) return 'Não informado'
          
          // Se já está formatado, retornar como está (mas garantir formato correto)
          if (telefone.includes('(') && telefone.includes(')')) {
            // Já está formatado, mas vamos garantir que está no formato correto
            const nums = numeros
            if (nums.length === 10) {
              return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
            } else if (nums.length === 11) {
              return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
            }
          }
          
          // Formatar baseado no número de dígitos
          if (numeros.length === 10) {
            // Telefone fixo: (XX) XXXX-XXXX
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
          } else if (numeros.length === 11) {
            // Celular: (XX) XXXXX-XXXX
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
          } else if (numeros.length > 11) {
            // Pode ter código do país, remover e formatar
            const semPais = numeros.slice(-11) // Últimos 11 dígitos
            return `(${semPais.slice(0, 2)}) ${semPais.slice(2, 7)}-${semPais.slice(7)}`
          }
          
          return telefone // Retorna original se não conseguir formatar
        }

        const formatarMetragem = (metragem: number | string | null | undefined): string => {
          if (!metragem) return 'Não informado'
          const num = typeof metragem === 'string' ? parseFloat(metragem) : metragem
          if (isNaN(num) || num <= 0) return 'Não informado'
          return `${num.toLocaleString('pt-BR')} m²`
        }

        const formatarData = (data: string | Date | null | undefined): string => {
          if (!data) return 'Não informado'
          
          // Se for string no formato YYYY-MM-DD (data DATE do PostgreSQL), tratar como data local
          if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
            const [ano, mes, dia] = data.split('-').map(Number)
            return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`
          }
          
          // Para outros formatos, usar conversão padrão
          try {
            const dataObj = typeof data === 'string' ? new Date(data) : data
            if (isNaN(dataObj.getTime())) return 'Não informado'
            return dataObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
          } catch {
            return 'Não informado'
          }
        }

        // Preparar variáveis para o template
        const tipoImovelLabels: Record<string, string> = {
          casa: 'Casa',
          apartamento: 'Apartamento',
          empresa: 'Empresa',
          '1_quarto': '1 Quarto',
          '2_quartos': '2 Quartos',
          '3_quartos': '3 Quartos',
          '4_quartos': '4 Quartos'
        }

        const tipoImovel = tipoImovelLabels[orcamento.tipo_imovel] || orcamento.tipo_imovel

        // Preparar número do WhatsApp do cliente para o link
        const whatsappCliente = orcamento.telefone_cliente || orcamento.whatsapp || ''
        // Remover caracteres não numéricos e garantir formato internacional
        const whatsappNumeros = whatsappCliente.replace(/\D/g, '')
        // Se não começar com 55 (código do Brasil), adicionar
        const whatsappFormatado = whatsappNumeros.startsWith('55') 
          ? whatsappNumeros 
          : `55${whatsappNumeros}`
        // Criar URL do WhatsApp com mensagem pré-formatada
        // Formatar origem e destino para mensagem WhatsApp
        const origemFormatada = (() => {
          const origem = orcamento.origem_completo || '';
          const cidadeEstado = orcamento.cidade_origem && orcamento.estado_origem 
            ? `${orcamento.cidade_origem}, ${orcamento.estado_origem}` 
            : '';
          if (origem && cidadeEstado && origem.trim() !== cidadeEstado.trim()) {
            return `${origem} (${cidadeEstado})`;
          }
          return origem || cidadeEstado || 'Não informado';
        })();
        const destinoFormatado = (() => {
          const destino = orcamento.destino_completo || '';
          const cidadeEstado = orcamento.cidade_destino && orcamento.estado_destino 
            ? `${orcamento.cidade_destino}, ${orcamento.estado_destino}` 
            : '';
          if (destino && cidadeEstado && destino.trim() !== cidadeEstado.trim()) {
            return `${destino} (${cidadeEstado})`;
          }
          return destino || cidadeEstado || 'Não informado';
        })();
        
        const mensagemWhatsApp = encodeURIComponent(
          `Olá ${orcamento.nome_cliente}! Vi seu orçamento de mudança de ${origemFormatada} para ${destinoFormatado} e gostaria de ajudar.`
        )
        const urlWhatsApp = whatsappNumeros 
          ? `https://wa.me/${whatsappFormatado}?text=${mensagemWhatsApp}`
          : '#'

        const variables = {
          codigo_orcamento: orcamento.codigo_orcamento || '',
          nome_cliente: orcamento.nome_cliente,
          email_cliente: orcamento.email_cliente,
          telefone_cliente: formatarTelefone(whatsappCliente),
          origem_completo: origemFormatada,
          destino_completo: destinoFormatado,
          tipo_imovel: tipoImovel,
          metragem: formatarMetragem(orcamento.metragem),
          distancia_km: orcamento.distancia_km?.toString() || '0',
          preco_min: orcamento.preco_min?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
          preco_max: orcamento.preco_max?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00',
          data_estimada: formatarData(orcamento.data_estimada),
          lista_objetos: orcamento.lista_objetos || '',
          url_whatsapp: urlWhatsApp,
          empresa_nome: hotsite.nome_exibicao,
          empresa_email: hotsite.email
        }

        // Processar template
        // IMPORTANTE: Passar orcamento_id e hotsite_id para reutilizar código de rastreamento existente
        const templateResult = await processEmailTemplate('orcamento_empresa', variables, {
          orcamento_id: orcamento.id,
          hotsite_id: hotsite.id,
          tipo_email: 'orcamento_empresa'
        })
        if (!templateResult) {
          throw new Error('Template de email não encontrado ou inativo')
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

        // Enviar email
        // replyTo será o email da empresa (destinatária) para que respostas voltem para ela
        // IMPORTANTE: Passar orcamento_id e hotsite_id no metadata para relacionar logs
        const sendResult = await emailService.sendEmail(
          {
            to: hotsite.email,
            subject: templateResult.assunto,
            html: templateResult.html,
            from: emailConfig.from_email,
            fromName: emailConfig.from_name,
            replyTo: hotsite.email, // Email da empresa destinatária
            metadata: {
              orcamento_id: orcamento.id,
              hotsite_id: hotsite.id
            }
          },
          serviceConfig
        )

        if (sendResult.success) {
          // Atualizar status para "enviado"
          await supabase
            .from('orcamentos_campanhas')
            .update({
              status_envio_email: 'enviado',
              email_enviado_em: new Date().toISOString(),
              ultimo_erro_envio: null
            })
            .eq('id', vinculo.id)

          // Salvar tracking com HTML completo e todas as informações
          await saveEmailTracking({
            codigo_rastreamento: templateResult.codigoRastreamento,
            orcamento_id: orcamento.id,
            hotsite_id: hotsite.id,
            tipo_email: 'orcamento_empresa',
            email_destinatario: hotsite.email,
            assunto: templateResult.assunto,
            metadata: {
              provider: emailConfig.provider,
              messageId: sendResult.messageId,
              testMode: sendResult.testMode || false,
              lote: numeroLote,
              total_lotes: lotes.length,
              processado_em: new Date().toISOString(),
              // Informações completas do email
              from: emailConfig.from_email,
              fromName: emailConfig.from_name,
              replyTo: hotsite.email, // Email da empresa destinatária
              to: hotsite.email,
              subject: templateResult.assunto,
              html_completo: templateResult.html, // HTML completo do email
              html_preview: templateResult.html.substring(0, 500) // Preview para listagem
            }
          })

          resultados.enviados++
          resultados.detalhes.push({
            empresa: hotsite.nome_exibicao,
            status: 'enviado',
            lote: numeroLote
          })
        } else {
          throw new Error(sendResult.error || 'Erro desconhecido ao enviar email')
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido'
        
        // Atualizar status para "erro"
        await supabase
          .from('orcamentos_campanhas')
          .update({
            status_envio_email: 'erro',
            ultimo_erro_envio: errorMessage
          })
          .eq('id', vinculo.id)

        // Salvar erro no tracking também
        try {
          // Tentar gerar código de rastreamento mesmo em caso de erro
          const codigoRastreamento = `ERROR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
          
          await saveEmailTracking({
            codigo_rastreamento: codigoRastreamento,
            orcamento_id: orcamento?.id,
            hotsite_id: hotsite?.id || '00000000-0000-0000-0000-000000000000',
            tipo_email: 'orcamento_empresa',
            email_destinatario: hotsite?.email || 'N/A',
            assunto: 'Erro ao enviar orçamento',
            metadata: {
              provider: emailConfig.provider,
              status_envio: 'erro',
              erro_mensagem: errorMessage,
              erro_codigo: error.code || 'UNKNOWN',
              testMode: testMode,
              lote: numeroLote,
              total_lotes: lotes.length,
              processado_em: new Date().toISOString(),
              from: emailConfig.from_email,
              fromName: emailConfig.from_name,
              replyTo: hotsite?.email || emailConfig.from_email,
              to: hotsite?.email || 'N/A',
              subject: 'Erro ao enviar orçamento',
              html_completo: '',
              html_preview: ''
            }
          })
        } catch (trackError) {
          console.error('Erro ao salvar tracking de erro:', trackError)
        }

        resultados.erros++
        resultados.detalhes.push({
          empresa: hotsite?.nome_exibicao || 'N/A',
          status: 'erro',
          erro: errorMessage,
          lote: numeroLote
        })
      }
    }

      // Aguardar 500ms entre lotes (exceto no último lote)
      if (indiceLote < lotes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processados ${resultados.total} emails em ${resultados.lotes} lote(s): ${resultados.enviados} enviados, ${resultados.erros} erros`,
      ...resultados
    })

  } catch (error: any) {
    console.error('Erro ao enviar emails pendentes:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar envio de emails' },
      { status: 500 }
    )
  }
}
