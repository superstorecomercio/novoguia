import { createServerClient } from '@/lib/supabase/server'

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'nodemailer' | 'socketlabs' | null
  api_key: string
  server_id?: string // Para SocketLabs
  from_email: string
  from_name: string
  reply_to: string
  ativo: boolean
  testado: boolean
  ultimo_teste?: string
  erro_teste?: string
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    // Usar createAdminClient para garantir acesso à tabela configuracoes
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'email_config')
      .single()

    console.log('📧 [getEmailConfig] Busca no banco:', {
      encontrou: !!data,
      error: error?.message,
      valor_tipo: typeof data?.valor,
      valor_preview: data?.valor ? JSON.stringify(data.valor).substring(0, 200) : 'null'
    })

    if (error || !data) {
      console.log('📧 [getEmailConfig] Usando fallback de variáveis de ambiente')
      // Fallback para variáveis de ambiente
      return {
        provider: (process.env.EMAIL_PROVIDER as any) || null,
        api_key: process.env.SOCKETLABS_API_KEY || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || '',
        server_id: process.env.SOCKETLABS_SERVER_ID,
        from_email: process.env.EMAIL_FROM || '',
        from_name: process.env.EMAIL_FROM_NAME || 'MudaTech',
        reply_to: process.env.EMAIL_REPLY_TO || '',
        ativo: !!(process.env.SOCKETLABS_API_KEY || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY),
        testado: false
      }
    }

    // Parsear o valor JSONB corretamente
    const configValue = typeof data.valor === 'string' 
      ? JSON.parse(data.valor) 
      : data.valor

    console.log('📧 [getEmailConfig] Config parseada:', {
      provider: configValue.provider,
      from_email: configValue.from_email,
      from_name: configValue.from_name,
      ativo: configValue.ativo
    })

    // Garantir que todos os campos estão presentes com valores padrão
    // Se from_name for "contato" ou vazio, usar "MudaTech" como padrão
    let fromName = configValue.from_name || 'MudaTech'
    if (fromName.toLowerCase().trim() === 'contato' || fromName.trim() === '') {
      fromName = 'MudaTech'
    }
    
    const finalConfig = {
      provider: configValue.provider || null,
      api_key: configValue.api_key || '',
      server_id: configValue.server_id || '',
      from_email: configValue.from_email || '',
      from_name: fromName,
      reply_to: configValue.reply_to || '',
      ativo: configValue.ativo || false,
      testado: configValue.testado || false,
      ultimo_teste: configValue.ultimo_teste || undefined,
      erro_teste: configValue.erro_teste || undefined
    }

    console.log('📧 [getEmailConfig] Config final:', {
      provider: finalConfig.provider,
      from_email: finalConfig.from_email,
      from_name: finalConfig.from_name,
      ativo: finalConfig.ativo
    })

    return finalConfig
  } catch (error) {
    console.error('❌ [getEmailConfig] Erro ao buscar configuração de email:', error)
    return null
  }
}

