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
}

interface ConfigOptions {
  serverId: string
  apiKey: string
}

export async function sendEmail(
  options: EmailOptions,
  config: ConfigOptions
): Promise<{ success: boolean; messageId?: string; error?: string; testMode?: boolean }> {
  // Interceptar em modo de teste
  if (isTestMode()) {
    return interceptTestEmail(options, 'socketlabs')
  }

  try {
    // Dynamic import para evitar erro se o pacote não estiver instalado
    // @ts-ignore - Dynamic import pode não estar disponível e tipos podem não existir
    const { SocketLabsClient, EmailAddress, BasicMessage } = await import('@socketlabs/email')
    
    const client = new SocketLabsClient(config.serverId, config.apiKey)

    const message = new BasicMessage()
    message.subject = options.subject
    message.htmlBody = options.html
    
    // From
    message.from = new EmailAddress(options.from, options.fromName)
    
    // To (pode ser array ou string)
    const toArray = Array.isArray(options.to) ? options.to : [options.to]
    message.to = toArray.map(email => new EmailAddress(email))
    
    // Reply To
    if (options.replyTo) {
      message.replyTo = new EmailAddress(options.replyTo)
    }

    const response = await client.send(message)

    // Salvar log do email enviado no banco de dados
    try {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const supabase = createAdminClient()
      
      // Gerar código de rastreamento único
      const codigoRastreamento = `SENT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      
      await supabase.from('email_tracking').insert({
        codigo_rastreamento: codigoRastreamento,
        tipo_email: 'email_enviado', // Usar tipo_email ao invés de template_tipo
        email_destinatario: Array.isArray(options.to) ? options.to.join(', ') : options.to, // Usar email_destinatario
        assunto: options.subject,
        metadata: {
          provider: 'socketlabs',
          from: options.from,
          fromName: options.fromName,
          messageId: response.transactionReceipt || response.messageId,
          modo_teste: false,
          status_envio: 'enviado' // Salvar status no metadata já que não há coluna status_envio
        }
      })
    } catch (error) {
      // Se falhar ao salvar log, apenas registrar (não quebrar o envio)
      console.error('Erro ao salvar log de email:', error)
    }

    // SocketLabs retorna um objeto com transactionReceipt
    return {
      success: true,
      messageId: response.transactionReceipt || response.messageId || 'sent'
    }
  } catch (error: any) {
    // Salvar log de erro no banco de dados
    try {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const supabase = createAdminClient()
      
      const codigoRastreamento = `ERROR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      
      await supabase.from('email_tracking').insert({
        codigo_rastreamento: codigoRastreamento,
        tipo_email: 'email_erro', // Usar tipo_email ao invés de template_tipo
        email_destinatario: Array.isArray(options.to) ? options.to.join(', ') : options.to, // Usar email_destinatario
        assunto: options.subject,
        metadata: {
          provider: 'socketlabs',
          from: options.from,
          fromName: options.fromName,
          errorCode: error.code,
          modo_teste: false,
          status_envio: 'erro', // Salvar status no metadata
          erro_mensagem: error.message || error.errorMessage || 'Erro desconhecido'
        }
      })
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
      error: error.message || error.errorMessage || 'Erro desconhecido ao enviar email'
    }
  }
}

