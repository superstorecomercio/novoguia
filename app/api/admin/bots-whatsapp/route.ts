import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET - Listar todos os bots
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('whatsapp_bots')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar bots:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar bots WhatsApp' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ bots: data || [] })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}

// POST - Criar novo bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('whatsapp_bots')
      .insert({
        nome: body.nome,
        numero_whatsapp: body.numero_whatsapp,
        ativo: body.ativo ?? true,
        whatsapp_token: body.whatsapp_token || null,
        whatsapp_phone_id: body.whatsapp_phone_id || null,
        verify_token: body.verify_token || null,
        openai_api_key: body.openai_api_key || null,
        supabase_url: body.supabase_url || null,
        supabase_service_key: body.supabase_service_key || null,
        perguntas: body.perguntas || null,
        mensagem_inicial: body.mensagem_inicial || null,
        mensagem_final: body.mensagem_final || null,
        mensagem_erro: body.mensagem_erro || null,
        palavras_ativacao: body.palavras_ativacao || null,
        descricao: body.descricao || null,
        observacoes: body.observacoes || null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar bot:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao criar bot WhatsApp' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ bot: data }, { status: 201 })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}


