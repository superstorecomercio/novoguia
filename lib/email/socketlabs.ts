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

    // SocketLabs retorna um objeto com transactionReceipt
    return {
      success: true,
      messageId: response.transactionReceipt || response.messageId || 'sent'
    }
  } catch (error: any) {
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

