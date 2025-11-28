import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { formatDateTimeBR } from '@/lib/utils/date'

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

    // Converter executado_em para timezone de São Paulo se existir
    const responseData: any = {
      success: true,
      sucesso: data?.sucesso ?? true,
      emails_criados: data?.emails_criados ?? 0
    }
    
    // Formatar executado_em para o timezone de São Paulo
    if (data?.executado_em) {
      responseData.executado_em = formatDateTimeBR(data.executado_em)
    } else {
      // Se não veio do SQL, usar a data atual formatada
      responseData.executado_em = formatDateTimeBR(new Date())
    }

    return NextResponse.json(responseData)
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

