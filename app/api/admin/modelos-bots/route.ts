import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET - Listar modelos
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('modelos_bots')
      .select('*')
      .order('nome', { ascending: true })
    
    if (error) {
      console.error('Erro ao buscar modelos:', error)
      return NextResponse.json(
        { error: error.message || 'Erro ao buscar modelos' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ modelos: data || [] })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}


