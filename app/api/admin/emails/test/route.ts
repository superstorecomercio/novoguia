import { NextRequest, NextResponse } from 'next/server'
import { isTestMode, getTestEmail } from '@/lib/email/test-mode'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { provider, api_key, server_id, from_email, from_name, test_email } = await request.json()

    if (!provider || !api_key || !from_email) {
      return NextResponse.json(
        { error: 'Provider, API Key e From Email são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação específica para SocketLabs
    if (provider === 'socketlabs' && !server_id) {
      return NextResponse.json(
        { error: 'Server ID é obrigatório para SocketLabs' },
        { status: 400 }
      )
    }

    // Verificar se está em modo de teste
    const testModeActive = isTestMode()
    
    // Determinar email de destino
    let testEmailTo: string
    if (testModeActive) {
      // Se modo de teste ativo, usar email de teste configurado
      testEmailTo = test_email || getTestEmail()
    } else {
      // Se não está em modo de teste, usar email do admin ou from_email
      testEmailTo = process.env.ADMIN_EMAIL || test_email || from_email
    }

    // Importar o serviço de email apropriado
    let emailService
    try {
      if (provider === 'socketlabs') {
        emailService = await import('@/lib/email/socketlabs')
      } else if (provider === 'resend') {
        emailService = await import('@/lib/email/resend')
      } else if (provider === 'sendgrid') {
        emailService = await import('@/lib/email/sendgrid')
      } else if (provider === 'nodemailer') {
        emailService = await import('@/lib/email/nodemailer')
      } else {
        return NextResponse.json(
          { error: 'Provedor não suportado' },
          { status: 400 }
        )
      }
    } catch (importError) {
      // Se o módulo não existe, retornar erro informativo
      return NextResponse.json(
        { 
          error: `Serviço de email não implementado. Veja a documentação em /docs/INTEGRACAO_EMAIL.md`,
          hint: 'Você precisa implementar o serviço de email primeiro'
        },
        { status: 501 }
      )
    }

    // Configuração específica por provedor
    let config: any = { apiKey: api_key }
    if (provider === 'socketlabs') {
      config = { serverId: server_id, apiKey: api_key }
    }
    
    // HTML do email de teste
    const testModeWarning = testModeActive ? `
      <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <strong style="color: #92400e;">⚠️ MODO DE TESTE ATIVO</strong>
        <p style="color: #78350f; margin: 5px 0 0 0; font-size: 14px;">
          Este email foi enviado em modo de teste. Em produção, este email seria enviado normalmente.
        </p>
      </div>
    ` : ''
    
    const result = await emailService.sendEmail({
      to: testEmailTo,
      subject: 'Teste de Configuração - MudaTech',
      html: `
        ${testModeWarning}
        <h2>Email de Teste</h2>
        <p>Este é um email de teste da configuração de envio de emails do MudaTech.</p>
        <p>Se você recebeu este email, a configuração está funcionando corretamente!</p>
        <hr>
        <p><strong>Detalhes do teste:</strong></p>
        <ul>
          <li><strong>Provedor:</strong> ${provider}</li>
          <li><strong>Remetente:</strong> ${from_email}</li>
          <li><strong>Destinatário:</strong> ${testEmailTo}</li>
          <li><strong>Modo de Teste:</strong> ${testModeActive ? 'Ativo (email interceptado)' : 'Desativado (email enviado normalmente)'}</li>
        </ul>
        <hr>
        <p><small>Enviado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small></p>
      `,
      from: from_email,
      fromName: from_name
    }, config)

    // Mensagem de resposta baseada no modo de teste
    let message: string
    if (testModeActive) {
      message = `Email de teste interceptado em modo de teste. Verifique os logs em /admin/emails/test-mode. Email seria enviado para: ${testEmailTo}`
    } else {
      message = `Email de teste enviado com sucesso para ${testEmailTo}`
    }

    return NextResponse.json({
      success: true,
      message,
      testMode: testModeActive,
      recipient: testEmailTo,
      result
    })

  } catch (error: any) {
    console.error('Erro ao testar email:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao enviar email de teste',
        details: error.details || error.response?.body || null
      },
      { status: 500 }
    )
  }
}

