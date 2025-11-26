// Serviço de email usando Nodemailer (SMTP)
// Para usar: npm install nodemailer

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
  apiKey?: string
  host: string
  port: number
  user: string
  pass: string
  secure?: boolean
}

export async function sendEmail(
  options: EmailOptions,
  config: ConfigOptions
): Promise<{ success: boolean; messageId?: string; error?: string; testMode?: boolean }> {
  // Interceptar em modo de teste
  if (isTestMode()) {
    return interceptTestEmail(options, 'nodemailer')
  }

  try {
    // Dynamic import para evitar erro se o pacote não estiver instalado
    // Usar string dinâmica para evitar que o bundler tente resolver em tempo de build
    const nodemailerModule = await import(/* webpackIgnore: true */ 'nodemailer' as any).catch(() => null)
    if (!nodemailerModule) {
      return {
        success: false,
        error: 'Pacote "nodemailer" não instalado. Execute: npm install nodemailer'
      }
    }
    const nodemailer = nodemailerModule.default || nodemailerModule
    
    const transporter = nodemailer.default.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure || config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass
      }
    })

    const info = await transporter.sendMail({
      from: options.fromName 
        ? `${options.fromName} <${options.from}>`
        : options.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo
    })

    return {
      success: true,
      messageId: info.messageId
    }
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return {
        success: false,
        error: 'Pacote "nodemailer" não instalado. Execute: npm install nodemailer'
      }
    }
    
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao enviar email'
    }
  }
}

