// Serviço de email usando SocketLabs
// Para usar: npm install @socketlabs/email

import { isTestMode, interceptTestEmail, getTestEmail } from './test-mode'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from: string
  fromName?: string
  replyTo?: string
  // Informações adicionais para relacionar logs
  metadata?: {
    orcamento_id?: string
    hotsite_id?: string
    campanha_id?: string
  }
}

interface ConfigOptions {
  serverId: string | number  // Aceita string ou number, mas será convertido para number
  apiKey: string
}

export async function sendEmail(
  options: EmailOptions,
  config: ConfigOptions
): Promise<{ success: boolean; messageId?: string; error?: string; testMode?: boolean }> {
  // Interceptar em modo de teste (usar versão assíncrona para garantir configuração correta)
  const testMode = await isTestMode()
  console.log('📧 [SocketLabs] Verificando modo de teste:', testMode)
  
  if (testMode) {
    console.log('⚠️ [SocketLabs] Modo de teste ATIVO - Email será interceptado')
    return interceptTestEmail(options, 'socketlabs')
  }
  
  console.log('✅ [SocketLabs] Modo de teste DESATIVADO - Email será enviado realmente')

  // Validação de campos obrigatórios
  if (!config.serverId || !config.apiKey) {
    return {
      success: false,
      error: 'Server ID e API Key são obrigatórios para SocketLabs'
    }
  }

  if (!options.from || !options.to) {
    return {
      success: false,
      error: 'Remetente (from) e destinatário (to) são obrigatórios'
    }
  }

  if (!options.subject || !options.html) {
    return {
      success: false,
      error: 'Assunto (subject) e corpo HTML são obrigatórios'
    }
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(options.from)) {
    return {
      success: false,
      error: `Email do remetente inválido: ${options.from}`
    }
  }

  const toArray = Array.isArray(options.to) ? options.to : [options.to]
  for (const email of toArray) {
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: `Email do destinatário inválido: ${email}`
      }
    }
  }

  // Validar e converter Server ID ANTES de importar o módulo
  const serverIdNum = parseInt(String(config.serverId), 10)
  if (isNaN(serverIdNum)) {
    return {
      success: false,
      error: `Server ID deve ser um número válido. Recebido: ${config.serverId}`
    }
  }

  // Validar e limpar API Key ANTES de importar o módulo
  if (!config.apiKey || typeof config.apiKey !== 'string' || config.apiKey.trim().length === 0) {
    return {
      success: false,
      error: 'API Key é obrigatória e deve ser uma string válida'
    }
  }
  const cleanApiKey = config.apiKey.trim()

  try {
    // Dynamic import para evitar erro se o pacote não estiver instalado
    // @ts-ignore - Módulo opcional, pode não estar instalado (ignorar erro de tipo durante build)
    const { SocketLabsClient, EmailAddress, BasicMessage } = await import('@socketlabs/email')
    
    console.log('📧 [SocketLabs] Iniciando envio:', {
      serverId: serverIdNum,
      serverIdType: typeof serverIdNum,
      apiKeyLength: cleanApiKey.length,
      apiKeyPrefix: cleanApiKey.substring(0, 5) + '...',
      apiKeySuffix: '...' + cleanApiKey.substring(cleanApiKey.length - 5),
      from: options.from,
      to: toArray,
      subject: options.subject.substring(0, 50)
    })

    // IMPORTANTE: SocketLabsClient espera Server ID como NUMBER e API Key como string limpa
    // @ts-expect-error - SocketLabsClient pode aceitar number ou string, tipos podem variar
    const client = new SocketLabsClient(serverIdNum, cleanApiKey)

    // Criar mensagem usando BasicMessage (formato oficial do SocketLabs)
    const message = new BasicMessage()
    message.subject = options.subject
    message.htmlBody = options.html
    
    // From - EmailAddress com nome opcional
    message.from = new EmailAddress(options.from, options.fromName)
    
    // To - Array de EmailAddress (suporta múltiplos destinatários)
    message.to = toArray.map(email => new EmailAddress(email))
    
    // Reply To (opcional)
    if (options.replyTo) {
      if (!emailRegex.test(options.replyTo)) {
        return {
          success: false,
          error: `Email de resposta (replyTo) inválido: ${options.replyTo}`
        }
      }
      message.replyTo = new EmailAddress(options.replyTo)
    }

    // Log da mensagem antes de enviar (sem dados sensíveis)
    console.log('📧 [SocketLabs] Enviando mensagem:', {
      to: toArray.length + ' destinatário(s)',
      from: options.from,
      subject: options.subject.substring(0, 50),
      hasHtml: !!options.html,
      hasReplyTo: !!options.replyTo
    })
    
    const response = await client.send(message)
    console.log('📧 [SocketLabs] Resposta recebida:', JSON.stringify(response, null, 2))

    // Verificar se a resposta contém erro (SocketLabs pode retornar erro mesmo com sucesso HTTP)
    if (response.errorCode) {
      const errorMsg = response.message || `Erro do SocketLabs: ${response.errorCode}`
      console.error('❌ [SocketLabs] Erro na resposta:', errorMsg)
      
      // Salvar log de erro
      try {
        const { createAdminClient } = await import('@/lib/supabase/server')
        const supabase = createAdminClient()
        
        const codigoRastreamento = `ERROR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
        
        await supabase.from('email_tracking').insert({
          codigo_rastreamento: codigoRastreamento,
          tipo_email: 'email_erro',
          email_destinatario: toArray.join(', '),
          assunto: options.subject,
          enviado_em: new Date().toISOString(),
          metadata: {
            provider: 'socketlabs',
            from: options.from,
            fromName: options.fromName,
            serverId: config.serverId,
            status_envio: 'erro',
            erro_codigo: response.errorCode,
            erro_mensagem: errorMsg,
            response: response
          }
        })
      } catch (logError) {
        console.error('Erro ao salvar log:', logError)
      }
      
      return {
        success: false,
        error: errorMsg
      }
    }

    // Salvar log detalhado do email enviado no banco de dados
    try {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const supabase = createAdminClient()
      
      // Gerar código de rastreamento único
      const codigoRastreamento = `SENT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      
      const logData = {
        codigo_rastreamento: codigoRastreamento,
        tipo_email: 'email_enviado',
        email_destinatario: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        assunto: options.subject,
        enviado_em: new Date().toISOString(),
        // Incluir orcamento_id e hotsite_id se disponíveis
        orcamento_id: options.metadata?.orcamento_id || null,
        hotsite_id: options.metadata?.hotsite_id || null,
        campanha_id: options.metadata?.campanha_id || null,
        metadata: {
          provider: 'socketlabs',
          from: options.from,
          fromName: options.fromName,
          replyTo: options.replyTo,
          messageId: response.transactionReceipt || response.messageId,
          serverId: serverIdNum, // Usar o número convertido
          modo_teste: false,
          status_envio: 'enviado',
          response: {
            transactionReceipt: response.transactionReceipt,
            messageId: response.messageId,
            responseCode: (response as any).responseCode,
            errorCode: response.errorCode
          }
        }
      }
      
      const { error: insertError } = await supabase.from('email_tracking').insert(logData)
      
      if (insertError) {
        console.error('Erro ao salvar log de email:', insertError)
        // Não quebrar o envio se falhar ao salvar log
      } else {
        console.log('✅ Log de email salvo:', codigoRastreamento)
      }
    } catch (logError) {
      // Se falhar ao salvar log, apenas registrar (não quebrar o envio)
      console.error('Erro ao salvar log de email:', logError)
    }

    // SocketLabs retorna um objeto com transactionReceipt
    return {
      success: true,
      messageId: response.transactionReceipt || response.messageId || 'sent'
    }
  } catch (error: any) {
    // Log detalhado do erro para debug
    console.error('❌ [SocketLabs] Erro capturado:', {
      name: error.name,
      message: error.message,
      code: error.code,
      errorCode: error.errorCode,
      statusCode: error.statusCode,
      status: error.status,
      response: error.response,
      stack: error.stack?.substring(0, 500),
      originalError: error.toString()
    })
    
    // Extrair informações do erro de forma mais detalhada
    let errorMessage = 'Erro desconhecido ao enviar email'
    let errorCode = 'UNKNOWN'
    let errorDetails: any = {}

    // Tentar extrair mensagem de erro de diferentes formatos
    if (error.message) {
      errorMessage = error.message
    } else if (error.errorMessage) {
      errorMessage = error.errorMessage
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    // Verificar se é erro de autenticação (fazer isso DEPOIS de extrair a mensagem)
    if (errorMessage.includes('Authentication validation failed') || 
        errorMessage.includes('missing or invalid ServerId or ApiKey') ||
        (errorMessage.includes('ServerId') && errorMessage.includes('ApiKey'))) {
      return {
        success: false,
        error: 'Erro de autenticação: Server ID ou API Key inválidos. Verifique se as credenciais estão corretas no painel de configuração.'
      }
    }

    // Tentar extrair código de erro
    if (error.code) {
      errorCode = error.code
    } else if (error.errorCode) {
      errorCode = error.errorCode
    } else if (error.statusCode) {
      errorCode = `HTTP_${error.statusCode}`
      errorMessage = `${errorMessage} (Status: ${error.statusCode})`
    }

    // Extrair detalhes adicionais
    if (error.response) {
      errorDetails.response = typeof error.response === 'object' 
        ? JSON.stringify(error.response) 
        : error.response
    }
    if (error.request) {
      errorDetails.request = 'Request object present'
    }
    if (error.config) {
      errorDetails.config = {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers ? 'Headers present' : null
      }
    }

    // Mensagens de erro específicas baseadas no código
    const errorMessagesMap: Record<string, string> = {
      '401': 'Não autorizado - Verifique se a API Key está correta',
      '403': 'Acesso negado - Verifique as permissões da API Key',
      '400': 'Requisição inválida - Verifique os campos obrigatórios',
      '404': 'Endpoint não encontrado - Verifique o Server ID',
      '429': 'Limite de taxa excedido - Aguarde alguns minutos',
      '500': 'Erro interno do SocketLabs - Tente novamente mais tarde',
      'MODULE_NOT_FOUND': 'Pacote "@socketlabs/email" não instalado. Execute: npm install @socketlabs/email',
      'ECONNREFUSED': 'Não foi possível conectar ao SocketLabs - Verifique sua conexão',
      'ETIMEDOUT': 'Timeout ao conectar ao SocketLabs - Tente novamente',
      'ENOTFOUND': 'Servidor SocketLabs não encontrado - Verifique sua conexão'
    }

    // Aplicar mensagem de erro específica se disponível
    if (errorMessagesMap[errorCode]) {
      errorMessage = `${errorMessagesMap[errorCode]}. ${errorMessage}`
    }

    // Salvar log detalhado de erro no banco de dados
    try {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const supabase = createAdminClient()
      
      const codigoRastreamento = `ERROR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      
      const logData = {
        codigo_rastreamento: codigoRastreamento,
        tipo_email: 'email_erro',
        email_destinatario: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        assunto: options.subject,
        enviado_em: new Date().toISOString(),
        // Incluir orcamento_id e hotsite_id se disponíveis
        orcamento_id: options.metadata?.orcamento_id || null,
        hotsite_id: options.metadata?.hotsite_id || null,
        campanha_id: options.metadata?.campanha_id || null,
        metadata: {
          provider: 'socketlabs',
          from: options.from,
          fromName: options.fromName,
          replyTo: options.replyTo,
          serverId: serverIdNum, // Usar o número convertido
          modo_teste: false,
          status_envio: 'erro',
          erro_codigo: errorCode,
          erro_mensagem: errorMessage,
          erro_stack: error.stack || null,
          erro_completo: {
            name: error.name,
            message: errorMessage,
            code: errorCode,
            stack: error.stack || null,
            statusCode: error.statusCode || null,
            status: error.status || null,
            response: errorDetails.response || null,
            request: errorDetails.request || null,
            config: errorDetails.config || null,
            originalError: error.toString()
          }
        }
      }
      
      const { error: insertError } = await supabase.from('email_tracking').insert(logData)
      
      if (insertError) {
        console.error('Erro ao salvar log de erro:', insertError)
      } else {
        console.error('❌ Log de erro salvo:', codigoRastreamento, errorMessage)
      }
    } catch (logError) {
      console.error('Erro ao salvar log de erro:', logError)
    }
    
    if (error.code === 'MODULE_NOT_FOUND') {
      return {
        success: false,
        error: 'Pacote "@socketlabs/email" não instalado. Execute: npm install @socketlabs/email'
      }
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

