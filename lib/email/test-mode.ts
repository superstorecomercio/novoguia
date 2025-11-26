// Modo de teste para emails - intercepta envios e não envia para clientes reais

interface TestEmailLog {
  to: string | string[]
  subject: string
  html: string
  from: string
  fromName?: string
  timestamp: string
  provider: string
}

// Armazena emails enviados em modo de teste (em memória - cache)
const testEmailLogs: TestEmailLog[] = []

// Cache da configuração do modo de teste (atualizado via API)
let testModeConfig: { enabled: boolean } | null = null
let configLoaded = false

/**
 * Define a configuração do modo de teste (chamado pela API)
 */
export function setTestModeConfig(enabled: boolean, testEmail?: string) {
  testModeConfig = { enabled, testEmail }
  configLoaded = true
}

/**
 * Carrega a configuração do banco de dados (chamado na inicialização)
 */
export async function loadTestModeConfig() {
  if (configLoaded) return // Já carregado

  try {
    // Tentar carregar do banco via import dinâmico para evitar dependência circular
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = createAdminClient()

    // Buscar configuração do modo de teste
    const { data: testModeData } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'email_test_mode')
      .single()

    // Buscar configuração de email para obter test_email
    const { data: emailConfigData } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'email_config')
      .single()

    if (testModeData?.valor?.enabled !== undefined) {
      const emailConfig = emailConfigData?.valor
      const testEmail = emailConfig?.test_email || process.env.EMAIL_TEST_TO || process.env.ADMIN_EMAIL
      
      testModeConfig = { 
        enabled: testModeData.valor.enabled,
        testEmail: testEmail || undefined
      }
      configLoaded = true
    }
  } catch (error) {
    // Se não conseguir carregar, usar lógica padrão
    console.log('Não foi possível carregar configuração do modo de teste do banco, usando padrão')
  }
}

/**
 * Verifica se está em modo de teste
 * Prioridade:
 * 1. Configuração do banco de dados (se disponível e carregada)
 * 2. Variável de ambiente EMAIL_TEST_MODE
 * 3. NODE_ENV === 'development' (apenas se não houver configuração explícita)
 */
export function isTestMode(): boolean {
  // 1. Verificar configuração do banco (se disponível)
  if (testModeConfig !== null) {
    return testModeConfig.enabled
  }
  
  // 2. Verificar variável de ambiente (sobrescreve desenvolvimento)
  if (process.env.EMAIL_TEST_MODE === 'true' || process.env.EMAIL_TEST_MODE === '1') {
    return true
  }
  
  if (process.env.EMAIL_TEST_MODE === 'false' || process.env.EMAIL_TEST_MODE === '0') {
    return false
  }
  
  // 3. Verificar se está em desenvolvimento (apenas se não houver configuração explícita)
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  return false
}

/**
 * Obtém o email de teste (redireciona todos os emails para este)
 * Prioridade:
 * 1. Email configurado no banco de dados (via email_config.test_email)
 * 2. Variável de ambiente EMAIL_TEST_TO
 * 3. Variável de ambiente ADMIN_EMAIL
 * 4. Email padrão
 */
export function getTestEmail(): string {
  // 1. Verificar se há email configurado no cache
  if (testModeConfig?.testEmail) {
    return testModeConfig.testEmail
  }
  
  // 2. Verificar variáveis de ambiente
  if (process.env.EMAIL_TEST_TO) {
    return process.env.EMAIL_TEST_TO
  }
  
  if (process.env.ADMIN_EMAIL) {
    return process.env.ADMIN_EMAIL
  }
  
  // 3. Email padrão
  return 'test@mudatech.com.br'
}

/**
 * Intercepta o envio de email em modo de teste
 */
export async function interceptTestEmail(
  options: {
    to: string | string[]
    subject: string
    html: string
    from: string
    fromName?: string
  },
  provider: string
): Promise<{ success: boolean; messageId?: string; error?: string; testMode?: boolean }> {
  const testEmail = getTestEmail()
  const originalTo = Array.isArray(options.to) ? options.to : [options.to]
  
  // Log do email original
  const log: TestEmailLog = {
    to: originalTo,
    subject: options.subject,
    html: options.html,
    from: options.from,
    fromName: options.fromName,
    timestamp: new Date().toISOString(),
    provider
  }
  
  // Adicionar ao cache em memória
  testEmailLogs.push(log)
  
  // Limitar logs em memória a 100 emails (evitar consumo excessivo de memória)
  if (testEmailLogs.length > 100) {
    testEmailLogs.shift()
  }
  
  // Salvar no banco de dados (email_tracking)
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = createAdminClient()
    
    // Gerar código de rastreamento único
    const codigoRastreamento = `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    
    const { data, error } =     await supabase.from('email_tracking').insert({
      codigo_rastreamento: codigoRastreamento,
      tipo_email: 'teste_configuracao', // Usar tipo_email ao invés de template_tipo
      email_destinatario: Array.isArray(originalTo) ? originalTo.join(', ') : originalTo, // Usar email_destinatario
      assunto: options.subject,
      metadata: {
        modo_teste: true,
        destinatario_original: originalTo,
        destinatario_redirecionado: testEmail,
        provider,
        from: options.from,
        fromName: options.fromName,
        html_preview: options.html.substring(0, 500) // Salvar preview do HTML
      }
    }).select()
    
    if (error) {
      console.error('❌ Erro ao salvar log de teste no banco:', error)
      console.error('Detalhes:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Log de teste salvo no banco:', codigoRastreamento)
    }
  } catch (error) {
    // Se falhar ao salvar no banco, apenas logar (não quebrar o fluxo)
    console.error('❌ Erro ao salvar log de teste no banco:', error)
  }
  
  // Adicionar aviso no HTML do email
  const testModeWarning = `
    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
      <strong style="color: #92400e;">⚠️ MODO DE TESTE</strong>
      <p style="color: #78350f; margin: 5px 0 0 0; font-size: 14px;">
        Este email foi interceptado em modo de teste.<br>
        <strong>Destinatário original:</strong> ${originalTo.join(', ')}<br>
        <strong>Enviado para:</strong> ${testEmail}
      </p>
    </div>
  `
  
  const modifiedHtml = testModeWarning + options.html
  
  // Retornar sucesso simulado (não envia realmente)
  console.log('📧 [TEST MODE] Email interceptado:')
  console.log('   Para:', originalTo.join(', '))
  console.log('   Assunto:', options.subject)
  console.log('   Redirecionado para:', testEmail)
  console.log('   Provider:', provider)
  
  return {
    success: true,
    messageId: `test-${Date.now()}`,
    testMode: true
  }
}

/**
 * Obtém logs de emails em modo de teste (do banco de dados)
 */
export async function getTestEmailLogs(): Promise<TestEmailLog[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = createAdminClient()
    
    // Buscar logs de teste do banco - usar tipo_email ao invés de template_tipo
    const { data, error } = await supabase
      .from('email_tracking')
      .select('*')
      .or('tipo_email.eq.teste_configuracao,and(status_envio.eq.enviado,metadata->modo_teste.eq.true)')
      .order('enviado_em', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('Erro ao buscar logs de teste:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      // Fallback para cache em memória
      return [...testEmailLogs]
    }
    
    console.log(`📧 [TEST MODE] Encontrados ${data?.length || 0} logs de teste no banco`)
    
    // Converter para formato TestEmailLog
    const logs = (data || []).map(item => {
      // A tabela usa email_destinatario, não destinatario_email
      const emailDestinatario = item.email_destinatario || item.destinatario_email || ''
      const destinatarios = item.metadata?.destinatario_original || 
                           (emailDestinatario.includes(',') ? emailDestinatario.split(',').map(e => e.trim()) : [emailDestinatario])
      
      return {
        to: Array.isArray(destinatarios) ? destinatarios : [destinatarios],
        subject: item.assunto || '',
        html: item.metadata?.html_preview || '', // Usar preview se disponível
        from: item.metadata?.from || '',
        fromName: item.metadata?.fromName,
        timestamp: item.enviado_em || new Date().toISOString(),
        provider: item.metadata?.provider || 'unknown'
      }
    })
    
    return logs
  } catch (error) {
    console.error('Erro ao buscar logs de teste:', error)
    // Fallback para cache em memória
    return [...testEmailLogs]
  }
}

/**
 * Limpa logs de emails de teste
 */
export function clearTestEmailLogs(): void {
  testEmailLogs.length = 0
}

/**
 * Obtém estatísticas de emails de teste
 */
export async function getTestEmailStats() {
  const logs = await getTestEmailLogs()
  const uniqueRecipients = new Set<string>()
  
  logs.forEach(log => {
    const recipients = Array.isArray(log.to) ? log.to : [log.to]
    recipients.forEach(email => uniqueRecipients.add(email))
  })
  
  return {
    total: logs.length,
    uniqueRecipients: uniqueRecipients.size,
    providers: [...new Set(logs.map(log => log.provider))],
    lastEmail: logs[logs.length - 1] || null
  }
}

