// Serviço de email usando SendGrid
// Para usar: npm install @sendgrid/mail

import { isTestMode, interceptTestEmail } from './test-mode'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from: string
  fromName?: string
  replyTo?: string
}

interface ConfigOptions {
  apiKey: string
}

export async function sendEmail(
  options: EmailOptions,
  config: ConfigOptions
): Promise<{ success: boolean; messageId?: string; error?: string; testMode?: boolean }> {
  // Interceptar em modo de teste
  if (isTestMode()) {
    return interceptTestEmail(options, 'sendgrid')
  }

  try {
    // Dynamic import para evitar erro se o pacote não estiver instalado
    // Usar string dinâmica para evitar que o bundler tente resolver em tempo de build
    const sgMailModule = await import(/* webpackIgnore: true */ '@sendgrid/mail' as any).catch(() => null)
    if (!sgMailModule) {
      return {
        success: false,
        error: 'Pacote "@sendgrid/mail" não instalado. Execute: npm install @sendgrid/mail'
      }
    }
    const sgMail = sgMailModule.default || sgMailModule
    
    sgMail.default.setApiKey(config.apiKey)

    const msg = {
      to: Array.isArray(options.to) ? options.to : [options.to],
      from: options.fromName 
        ? `${options.fromName} <${options.from}>`
        : options.from,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo
    }

    const [response] = await sgMail.default.send(msg)

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string
    }
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return {
        success: false,
        error: 'Pacote "@sendgrid/mail" não instalado. Execute: npm install @sendgrid/mail'
      }
    }
    
    const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || 'Erro ao enviar email'
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

