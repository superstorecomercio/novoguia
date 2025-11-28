import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { orcamentoId, empresaId } = await request.json()

    console.log('🔄 [Recolocar Fila] Recebido:', { orcamentoId, empresaId })

    if (!orcamentoId) {
      return NextResponse.json(
        { error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Se empresaId foi fornecido, recolocar apenas essa empresa
    if (empresaId) {
      // Verificar se o vínculo existe
      const { data: vinculo, error: vinculoError } = await supabase
        .from('orcamentos_campanhas')
        .select('id, status_envio_email')
        .eq('id', empresaId)
        .eq('orcamento_id', orcamentoId)
        .single()

      if (vinculoError || !vinculo) {
        return NextResponse.json(
          { error: 'Vínculo empresa-orçamento não encontrado' },
          { status: 404 }
        )
      }

      // Recolocar na fila (resetar status, limpar erro e resetar tentativas)
      const { error: updateError } = await supabase
        .from('orcamentos_campanhas')
        .update({
          status_envio_email: 'na_fila',
          ultimo_erro_envio: null,
          tentativas_envio: 0,
          ultima_tentativa_envio: null
        })
        .eq('id', empresaId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Erro ao recolocar empresa na fila' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Empresa recolocada na fila com sucesso'
      })
    }

    // Se não foi fornecido empresaId, recolocar TODAS as empresas do orçamento
    // (exceto as que já estão 'na_fila' ou 'enviando')
    const { data: vinculos, error: vinculosError } = await supabase
      .from('orcamentos_campanhas')
      .select('id, status_envio_email')
      .eq('orcamento_id', orcamentoId)
      .in('status_envio_email', ['enviado', 'erro'])

    if (vinculosError) {
      console.error('❌ [Recolocar Fila] Erro ao buscar vínculos:', vinculosError)
      return NextResponse.json(
        { error: 'Erro ao buscar empresas: ' + vinculosError.message },
        { status: 500 }
      )
    }

    console.log('📊 [Recolocar Fila] Vínculos encontrados:', vinculos?.length || 0)

    if (!vinculos || vinculos.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma empresa para recolocar na fila (todas já estão na fila ou enviando)' },
        { status: 400 }
      )
    }

    // Recolocar todas na fila (resetar status, limpar erro e resetar tentativas)
    const ids = vinculos.map(v => v.id)
    console.log('🔄 [Recolocar Fila] Atualizando vínculos:', ids)
    
    const { data: updated, error: updateError } = await supabase
      .from('orcamentos_campanhas')
      .update({
        status_envio_email: 'na_fila',
        ultimo_erro_envio: null,
        tentativas_envio: 0,
        ultima_tentativa_envio: null
      })
      .in('id', ids)
      .select('id')

    if (updateError) {
      console.error('❌ [Recolocar Fila] Erro ao atualizar:', updateError)
      return NextResponse.json(
        { error: 'Erro ao recolocar empresas na fila: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ [Recolocar Fila] Vínculos atualizados:', updated?.length || 0)

    return NextResponse.json({
      success: true,
      message: `${vinculos.length} empresa(s) recolocada(s) na fila com sucesso`,
      empresasRecolocadas: vinculos.length
    })

  } catch (error: any) {
    console.error('Erro ao recolocar na fila:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao recolocar na fila' },
      { status: 500 }
    )
  }
}

