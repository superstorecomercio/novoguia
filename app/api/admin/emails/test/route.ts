import { NextRequest, NextResponse } from 'next/server'
import { isTestMode, getTestEmail } from '@/lib/email/test-mode'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Declarar variáveis no escopo da função para que estejam disponíveis no catch
  let testEmailTo: string = ''
  let provider: string = ''
  let from_email: string = ''
  let from_name: string = ''
  let test_email: string = ''
  let server_id: string = ''
  let testModeActive: boolean = false
  
  try {
    const body = await request.json()
    provider = body.provider || ''
    const api_key = body.api_key || ''
    server_id = body.server_id || ''
    from_email = body.from_email || ''
    from_name = body.from_name || ''
    test_email = body.test_email || ''

    if (!provider || !api_key || !from_email) {
      return NextResponse.json(
        { error: 'Provider, API Key e From Email são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação específica para SocketLabs
    if (provider === 'socketlabs') {
      if (!server_id) {
        return NextResponse.json(
          { error: 'Server ID é obrigatório para SocketLabs' },
          { status: 400 }
        )
      }
      
      // Validar formato do Server ID (deve ser numérico)
      const serverIdNum = parseInt(server_id, 10)
      if (isNaN(serverIdNum)) {
        return NextResponse.json(
          { error: `Server ID deve ser um número válido. Recebido: ${server_id}` },
          { status: 400 }
        )
      }
      
      // Validar formato da API Key (deve ter pelo menos 20 caracteres)
      if (!api_key || api_key.length < 20) {
        return NextResponse.json(
          { error: 'API Key inválida. A chave do SocketLabs deve ter pelo menos 20 caracteres' },
          { status: 400 }
        )
      }
      
      // Validar formato do email do remetente
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(from_email)) {
        return NextResponse.json(
          { error: `Email do remetente inválido: ${from_email}` },
          { status: 400 }
        )
      }
    }

    // Verificar se está em modo de teste (usar versão assíncrona para garantir configuração correta)
    // Forçar recarregamento da configuração para garantir que está atualizada
    const { loadTestModeConfig } = await import('@/lib/email/test-mode')
    await loadTestModeConfig()
    testModeActive = await isTestMode()
    console.log('📧 [Test API] Modo de teste ativo?', testModeActive)
    
    if (testModeActive) {
      console.warn('⚠️ [Test API] ATENÇÃO: Modo de teste está ATIVO. O email será interceptado e NÃO será enviado realmente!')
    }
    
    // Determinar email de destino
    if (testModeActive) {
      // Se modo de teste ativo, usar email de teste configurado
      testEmailTo = test_email || getTestEmail()
    } else {
      // Se não está em modo de teste, usar email do admin ou from_email
      testEmailTo = process.env.ADMIN_EMAIL || test_email || from_email
    }

    // Importar o serviço de email apropriado usando helper dinâmico
    let emailService
    try {
      // Validar provedor
      if (!['socketlabs', 'resend', 'sendgrid', 'nodemailer'].includes(provider)) {
        return NextResponse.json(
          { error: 'Provedor não suportado' },
          { status: 400 }
        )
      }
      
      // Usar helper que constrói o caminho dinamicamente para evitar análise estática
      const { importEmailService } = await import('@/lib/email/dynamic-import')
      emailService = await importEmailService(provider as any)
    } catch (importError: any) {
      // Tratar erros específicos de módulo não encontrado
      const errorMessage = importError?.message || ''
      const errorCode = importError?.code || ''
      
      if (
        errorCode === 'MODULE_NOT_FOUND' || 
        errorMessage.includes('Cannot find module') ||
        errorMessage.includes('Failed to resolve module')
      ) {
        const packageMap: Record<string, string> = {
          resend: 'resend',
          sendgrid: '@sendgrid/mail',
          nodemailer: 'nodemailer',
          socketlabs: '@socketlabs/email'
        }
        
        const packageName = packageMap[provider] || provider
        
        return NextResponse.json(
          { 
            error: `Pacote "${packageName}" não instalado. Execute: npm install ${packageName}`,
            hint: 'Instale o pacote necessário para usar este provedor'
          },
          { status: 400 }
        )
      }
      
      // Outros erros
      return NextResponse.json(
        { 
          error: `Erro ao importar serviço de email: ${importError.message || 'Erro desconhecido'}`,
          hint: 'Verifique se o provedor está correto e se os pacotes necessários estão instalados'
        },
        { status: 500 }
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
    
    // NÃO criar log aqui - o sendEmail() ou interceptTestEmail() já criam o log
    // Isso evita duplicação de logs
    const supabase = createAdminClient()
    
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

    // O log já foi criado pelo sendEmail() ou interceptTestEmail()
    // Não precisamos atualizar aqui, pois eles já salvam tudo necessário

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
    
    // Salvar log de erro
    try {
      const supabase = createAdminClient()
      const codigoRastreamento = `ERROR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      
      // Determinar email de destino para o log (pode não estar definido se erro ocorreu antes)
      const emailDestinatario = testEmailTo || test_email || from_email || 'N/A'
      
      await supabase.from('email_tracking').insert({
        codigo_rastreamento: codigoRastreamento,
        tipo_email: 'teste_configuracao',
        email_destinatario: emailDestinatario,
        assunto: 'Teste de Configuração - MudaTech (ERRO)',
        enviado_em: new Date().toISOString(),
        metadata: {
          provider,
          from: from_email,
          fromName: from_name,
          serverId: server_id,
          modo_teste: testModeActive,
          status_envio: 'erro',
          erro_mensagem: error.message || 'Erro desconhecido',
          erro_codigo: error.code || 'UNKNOWN',
          erro_stack: error.stack || null,
          erro_completo: {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack,
            details: error.details,
            response: error.response?.body || null
          }
        }
      })
    } catch (logError) {
      console.error('Erro ao salvar log de erro:', logError)
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao enviar email de teste',
        details: error.details || error.response?.body || null,
        hint: 'Verifique os logs em /admin/emails/logs para mais detalhes'
      },
      { status: 500 }
    )
  }
}

