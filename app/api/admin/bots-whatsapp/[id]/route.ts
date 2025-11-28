import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET - Buscar bot específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = createAdminClient()
    
    console.log('🔍 [API] Buscando bot com ID:', resolvedParams.id)
    
    const { data, error } = await supabase
      .from('whatsapp_bots')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()
    
    if (error) {
      console.error('❌ [API] Erro ao buscar bot:', error)
      return NextResponse.json(
        { error: error.message || 'Bot não encontrado', details: error },
        { status: 404 }
      )
    }
    
    console.log('✅ [API] Bot encontrado:', {
      id: data?.id,
      nome: data?.nome,
      numero: data?.numero_whatsapp,
      tem_token: !!data?.whatsapp_token,
      tem_perguntas: !!data?.perguntas
    })
    
    return NextResponse.json({ bot: data })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar bot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const supabase = createAdminClient()
    
    const updateData: any = {}
    
    if (body.nome !== undefined) updateData.nome = body.nome
    if (body.numero_whatsapp !== undefined) updateData.numero_whatsapp = body.numero_whatsapp
    if (body.ativo !== undefined) updateData.ativo = body.ativo
    if (body.whatsapp_token !== undefined) updateData.whatsapp_token = body.whatsapp_token || null
    if (body.whatsapp_phone_id !== undefined) updateData.whatsapp_phone_id = body.whatsapp_phone_id || null
    if (body.verify_token !== undefined) updateData.verify_token = body.verify_token || null
    if (body.openai_api_key !== undefined) updateData.openai_api_key = body.openai_api_key || null
    if (body.supabase_url !== undefined) updateData.supabase_url = body.supabase_url || null
    if (body.supabase_service_key !== undefined) updateData.supabase_service_key = body.supabase_service_key || null
    if (body.perguntas !== undefined) updateData.perguntas = body.perguntas
    if (body.mensagem_inicial !== undefined) updateData.mensagem_inicial = body.mensagem_inicial
    if (body.mensagem_final !== undefined) updateData.mensagem_final = body.mensagem_final
    if (body.mensagem_erro !== undefined) updateData.mensagem_erro = body.mensagem_erro
    if (body.palavras_ativacao !== undefined) updateData.palavras_ativacao = body.palavras_ativacao
    if (body.descricao !== undefined) updateData.descricao = body.descricao || null
    if (body.observacoes !== undefined) updateData.observacoes = body.observacoes || null
    
    const { data, error } = await supabase
      .from('whatsapp_bots')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao atualizar bot:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar bot' },
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

// DELETE - Deletar bot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('whatsapp_bots')
      .delete()
      .eq('id', resolvedParams.id)
    
    if (error) {
      console.error('Erro ao deletar bot:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar bot' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}

