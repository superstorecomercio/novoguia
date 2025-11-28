import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET - Listar bots clientes
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('whatsapp_bots')
      .select('*')
      .eq('tipo', 'cliente')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar bots clientes:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao buscar bots' },
        { status: 400 }
      )
    }
    
    // Buscar nomes dos modelos
    const modeloIds = (data || []).filter((bot: any) => bot.modelo_id).map((bot: any) => bot.modelo_id)
    let modelosMap: Record<string, string> = {}
    
    if (modeloIds.length > 0) {
      const { data: modelos } = await supabase
        .from('modelos_bots')
        .select('id, nome')
        .in('id', modeloIds)
      
      if (modelos) {
        modelosMap = modelos.reduce((acc: Record<string, string>, modelo: any) => {
          acc[modelo.id] = modelo.nome
          return acc
        }, {})
      }
    }
    
    // Formatar dados
    const bots = (data || []).map((bot: any) => ({
      ...bot,
      modelo_nome: bot.modelo_id ? modelosMap[bot.modelo_id] || null : null
    }))
    
    return NextResponse.json({ bots })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}

// POST - Criar novo bot cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()
    
    // Validar campos obrigatórios
    if (!body.nome || !body.numero_whatsapp) {
      return NextResponse.json(
        { error: 'Nome e número do WhatsApp são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Se tem modelo_id, buscar configurações do modelo
    let botData: any = {
      nome: body.nome,
      numero_whatsapp: body.numero_whatsapp,
      tipo: 'cliente',
      ativo: body.ativo ?? true,
      whatsapp_token: body.whatsapp_token || null,
      whatsapp_phone_id: body.whatsapp_phone_id || null,
      verify_token: body.verify_token || null,
      openai_api_key: body.openai_api_key || null,
      supabase_url: body.supabase_url || null,
      supabase_service_key: body.supabase_service_key || null,
      email_notificacao: body.email_notificacao || null,
      notificar_whatsapp: body.notificar_whatsapp ?? false,
      whatsapp_notificacao: body.whatsapp_notificacao || null,
      modelo_id: body.modelo_id || null
    }
    
    // Se tem modelo_id, copiar configurações do modelo
    if (body.modelo_id) {
      const { data: modelo, error: modeloError } = await supabase
        .from('modelos_bots')
        .select('*')
        .eq('id', body.modelo_id)
        .single()
      
      if (!modeloError && modelo) {
        botData.mensagem_inicial = modelo.mensagem_inicial
        botData.mensagem_final = modelo.mensagem_final
        botData.mensagem_erro = modelo.mensagem_erro
        botData.palavras_ativacao = modelo.palavras_ativacao
        botData.perguntas = modelo.perguntas
      }
    }
    
    const { data, error } = await supabase
      .from('whatsapp_bots')
      .insert(botData)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar bot cliente:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao criar bot' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ bot: data })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}

