import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET - Buscar todos os arquivos de um bot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('bot_files')
      .select('*')
      .eq('bot_id', resolvedParams.id)
      .order('file_path', { ascending: true })
    
    if (error) {
      console.error('Erro ao buscar arquivos:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao buscar arquivos' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ files: data || [] })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}

// POST - Criar ou atualizar arquivo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const supabase = createAdminClient()
    
    const { file_path, file_content, file_type, description } = body
    
    if (!file_path || !file_content) {
      return NextResponse.json(
        { error: 'file_path e file_content são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Upsert (inserir ou atualizar)
    const { data, error } = await supabase
      .from('bot_files')
      .upsert({
        bot_id: resolvedParams.id,
        file_path,
        file_content,
        file_type: file_type || 'javascript',
        description: description || null
      }, {
        onConflict: 'bot_id,file_path'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao salvar arquivo:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao salvar arquivo' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ file: data })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}


