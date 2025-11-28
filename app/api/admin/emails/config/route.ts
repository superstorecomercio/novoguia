import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Buscar configuração
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('chave', 'email_config')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    // Se não existe, retornar valores padrão
    if (!data) {
      return NextResponse.json({
        config: {
          provider: null,
          api_key: '',
          server_id: '',
          from_email: process.env.EMAIL_FROM || '',
          from_name: 'MudaTech',
          reply_to: process.env.EMAIL_REPLY_TO || '',
          test_email: process.env.EMAIL_TEST_TO || process.env.ADMIN_EMAIL || '',
          ativo: false,
          testado: false
        }
      })
    }

    // Garantir que o valor JSONB está sendo parseado corretamente
    const configValue = typeof data.valor === 'string' 
      ? JSON.parse(data.valor) 
      : data.valor

    // Garantir que todos os campos estão presentes
    // Se from_name for "contato" ou vazio, usar "MudaTech" como padrão
    let fromName = configValue.from_name || 'MudaTech'
    if (fromName.toLowerCase().trim() === 'contato' || fromName.trim() === '') {
      fromName = 'MudaTech'
    }
    
    const config = {
      provider: configValue.provider || null,
      api_key: configValue.api_key || '',
      server_id: configValue.server_id || '',
      from_email: configValue.from_email || '',
      from_name: fromName,
      reply_to: configValue.reply_to || '',
      test_email: configValue.test_email || process.env.EMAIL_TEST_TO || process.env.ADMIN_EMAIL || '',
      ativo: configValue.ativo || false,
      testado: configValue.testado || false,
      ultimo_teste: configValue.ultimo_teste || null,
      erro_teste: configValue.erro_teste || null
    }

    return NextResponse.json({
      config
    })

  } catch (error: any) {
    console.error('Erro ao buscar configuração:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar configuração' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    // Validações
    if (!config.provider) {
      return NextResponse.json(
        { error: 'Provedor é obrigatório' },
        { status: 400 }
      )
    }

    if (!config.api_key) {
      return NextResponse.json(
        { error: 'API Key é obrigatória' },
        { status: 400 }
      )
    }

    // Validação específica para SocketLabs
    if (config.provider === 'socketlabs' && !config.server_id) {
      return NextResponse.json(
        { error: 'Server ID é obrigatório para SocketLabs' },
        { status: 400 }
      )
    }

    if (!config.from_email) {
      return NextResponse.json(
        { error: 'Email remetente é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Preparar objeto de configuração completo (garantir que server_id está incluído)
    // Se from_name for "contato" ou vazio, usar "MudaTech" como padrão
    let fromName = config.from_name || 'MudaTech'
    if (fromName.toLowerCase().trim() === 'contato' || fromName.trim() === '') {
      fromName = 'MudaTech'
    }
    
    const configToSave = {
      provider: config.provider,
      api_key: config.api_key,
      server_id: config.server_id || null, // Incluir server_id mesmo se vazio
      from_email: config.from_email,
      from_name: fromName,
      reply_to: config.reply_to || '',
      test_email: config.test_email || null, // Email para modo de teste
      ativo: config.ativo || false,
      testado: config.testado || false,
      ultimo_teste: config.ultimo_teste || null,
      erro_teste: config.erro_teste || null
    }

    // Salvar ou atualizar configuração
    // Primeiro, verificar se existe
    const { data: existing } = await supabase
      .from('configuracoes')
      .select('id')
      .eq('chave', 'email_config')
      .single()

    let data, error
    if (existing) {
      // Atualizar
      const result = await supabase
        .from('configuracoes')
        .update({
          valor: configToSave,
          updated_at: new Date().toISOString()
        })
        .eq('chave', 'email_config')
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Inserir
      const result = await supabase
        .from('configuracoes')
        .insert({
          chave: 'email_config',
          valor: configToSave,
          descricao: 'Configuração de envio de emails'
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Erro ao salvar configuração:', error)
      throw error
    }

    // Garantir que o valor retornado está parseado corretamente
    const savedConfig = typeof data.valor === 'string' 
      ? JSON.parse(data.valor) 
      : data.valor

    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso',
      config: savedConfig
    })

  } catch (error: any) {
    console.error('Erro ao salvar configuração:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar configuração' },
      { status: 500 }
    )
  }
}

