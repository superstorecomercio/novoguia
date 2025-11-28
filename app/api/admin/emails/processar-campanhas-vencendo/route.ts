import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * API Route para processar campanhas vencendo e adicionar emails à fila
 * POST /api/admin/emails/processar-campanhas-vencendo
 * 
 * Identifica campanhas que vencem hoje ou em 1 dia e cria registros de email_tracking na fila
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Executar função SQL que processa campanhas vencendo
    const { data, error } = await supabase.rpc('processar_campanhas_vencendo')

    if (error) {
      console.error('Erro ao processar campanhas vencendo:', error)
      return NextResponse.json(
        { 
          error: 'Erro ao processar campanhas vencendo',
          details: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error: any) {
    console.error('Erro ao processar campanhas vencendo:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar campanhas vencendo',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Retorna informações sobre a função
 */
export async function GET() {
  return NextResponse.json({
    description: 'Processa campanhas que vencem hoje ou em 1 dia e adiciona emails à fila',
    method: 'POST',
    endpoint: '/api/admin/emails/processar-campanhas-vencendo'
  })
}

