import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials, createVerificationCode } from '@/lib/auth/admin-auth'
import { getEmailConfig } from '@/lib/email/config'
import { importEmailService } from '@/lib/email/dynamic-import'

/**
 * POST /api/admin/auth/login
 * Primeira etapa: Verifica credenciais e envia código de verificação por email
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar credenciais
    const result = await verifyAdminCredentials(email, password)
    
    if (!result.success || !result.admin) {
      return NextResponse.json(
        { error: result.error || 'Credenciais inválidas' },
        { status: 401 }
      )
    }
    
    // Criar código de verificação
    const code = await createVerificationCode(result.admin.id)
    
    // Enviar código por email
    try {
      const emailConfig = await getEmailConfig()
      
      console.log('[Auth Login] Configuração de email:', {
        existe: !!emailConfig,
        provider: emailConfig?.provider,
        from_email: emailConfig?.from_email,
        ativo: emailConfig?.ativo
      })
      
      if (!emailConfig) {
        console.error('[Auth Login] Configuração de email não encontrada')
        return NextResponse.json(
          { 
            error: 'Configuração de email não encontrada. Configure em /admin/emails/configuracao',
            details: 'A configuração de email é necessária para enviar códigos de verificação.'
          },
          { status: 500 }
        )
      }
      
      if (!emailConfig.from_email || emailConfig.from_email.trim() === '') {
        console.error('[Auth Login] Email de origem não configurado')
        return NextResponse.json(
          { 
            error: 'Email de origem não configurado. Configure em /admin/emails/configuracao',
            details: 'O campo "Email de Origem" é obrigatório.'
          },
          { status: 500 }
        )
      }
      
      if (!emailConfig.provider) {
        console.error('[Auth Login] Provedor de email não configurado')
        return NextResponse.json(
          { 
            error: 'Provedor de email não configurado. Configure em /admin/emails/configuracao',
            details: 'Selecione um provedor de email (SocketLabs, Resend, SendGrid ou Nodemailer).'
          },
          { status: 500 }
        )
      }
      
      if (!emailConfig.api_key || emailConfig.api_key.trim() === '') {
        console.error('[Auth Login] API Key não configurada')
        return NextResponse.json(
          { 
            error: 'API Key não configurada. Configure em /admin/emails/configuracao',
            details: 'A chave de API do provedor de email é obrigatória.'
          },
          { status: 500 }
        )
      }
      
      console.log('[Auth Login] Importando serviço de email:', emailConfig.provider)
      const emailService = await importEmailService(
        emailConfig.provider as 'socketlabs' | 'resend' | 'sendgrid' | 'nodemailer'
      )
      
      if (!emailService) {
        console.error('[Auth Login] Serviço de email não disponível')
        return NextResponse.json(
          { 
            error: 'Serviço de email não disponível',
            details: `O provedor ${emailConfig.provider} não está disponível. Verifique se o pacote está instalado.`
          },
          { status: 500 }
        )
      }
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Código de Verificação - MudaTech Admin</h2>
          <p>Olá ${result.admin.nome},</p>
          <p>Seu código de verificação para acesso ao painel administrativo é:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Este código expira em 10 minutos.</p>
          <p style="color: #6b7280; font-size: 14px;">Se você não solicitou este código, ignore este email.</p>
        </div>
      `
      
      // Preparar configuração do serviço
      const serviceConfig: any = {
        apiKey: emailConfig.api_key
      }
      
      // Para SocketLabs, adicionar serverId
      if (emailConfig.provider === 'socketlabs' && emailConfig.server_id) {
        serviceConfig.serverId = emailConfig.server_id
      }
      
      console.log('[Auth Login] Enviando email para:', result.admin.email)
      const sendResult = await emailService.sendEmail(
        {
          to: result.admin.email,
          subject: 'Código de Verificação - MudaTech Admin',
          html: emailBody,
          from: emailConfig.from_email,
          fromName: emailConfig.from_name || 'MudaTech Admin'
        },
        serviceConfig
      )
      
      console.log('[Auth Login] Resultado do envio:', {
        success: sendResult.success,
        error: sendResult.error,
        messageId: sendResult.messageId
      })
      
      if (!sendResult.success) {
        console.error('[Auth Login] Erro ao enviar email:', sendResult.error)
        return NextResponse.json(
          { 
            error: 'Erro ao enviar código de verificação por email',
            details: sendResult.error || 'Erro desconhecido ao enviar email'
          },
          { status: 500 }
        )
      }
    } catch (emailError: any) {
      console.error('[Auth Login] Erro ao enviar email de verificação:', {
        message: emailError.message,
        stack: emailError.stack,
        error: emailError
      })
      return NextResponse.json(
        { 
          error: 'Erro ao enviar código de verificação por email',
          details: emailError.message || 'Erro desconhecido'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Código de verificação enviado por email',
      adminId: result.admin.id,
      primeiroLogin: result.admin.primeiro_login
    })
  } catch (error: any) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

