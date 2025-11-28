import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * API Route para diagnosticar campanhas vencendo
 * GET /api/admin/emails/diagnostico-campanhas-vencendo
 * 
 * Retorna informações sobre campanhas que deveriam estar vencendo hoje ou amanhã
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Query para verificar campanhas que vencem hoje ou amanhã
    const { data: campanhas, error: campanhasError } = await supabase
      .from('campanhas')
      .select(`
        id,
        ativo,
        data_fim,
        hotsite:hotsites!hotsite_id(
          id,
          email,
          nome_exibicao
        )
      `)
      .eq('ativo', true)
      .not('data_fim', 'is', null)
      .order('data_fim', { ascending: true })

    if (campanhasError) {
      return NextResponse.json(
        { 
          error: 'Erro ao buscar campanhas',
          details: campanhasError.message 
        },
        { status: 500 }
      )
    }

    // Obter data atual no timezone de São Paulo
    // Usar Intl.DateTimeFormat para obter a data correta no timezone de SP
    const hoje = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const hojeSPStr = formatter.format(hoje) // Retorna YYYY-MM-DD
    
    // Calcular amanhã
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)
    const amanhaSPStr = formatter.format(amanha)

    // Filtrar campanhas que vencem hoje ou amanhã
    const campanhasVencendo = campanhas?.filter(c => {
      if (!c.data_fim) return false
      const dataFim = c.data_fim.split('T')[0] // Remover hora se houver
      return dataFim === hojeSPStr || dataFim === amanhaSPStr
    }) || []

    // Mapear todas as campanhas ativas com informações detalhadas
    const todasCampanhasDetalhadas = campanhas?.map(c => {
      const dataFim = c.data_fim ? c.data_fim.split('T')[0] : null
      const venceHoje = dataFim === hojeSPStr
      const venceAmanha = dataFim === amanhaSPStr
      const temEmail = !!(c.hotsite?.email && c.hotsite.email.trim() !== '')
      
      return {
        campanha_id: c.id,
        data_fim: c.data_fim,
        data_fim_formatada: dataFim,
        ativo: c.ativo,
        hotsite_email: c.hotsite?.email || null,
        hotsite_nome: c.hotsite?.nome_exibicao || null,
        tem_email_preenchido: temEmail,
        vence_hoje: venceHoje,
        vence_amanha: venceAmanha,
        deveria_ir_para_fila: (venceHoje || venceAmanha) && temEmail,
        diferenca_dias: dataFim ? Math.floor((new Date(dataFim).getTime() - new Date(hojeSPStr).getTime()) / (1000 * 60 * 60 * 24)) : null
      }
    }) || []

    // Verificar se já existem emails criados hoje
    const { data: emailsExistentes, error: emailsError } = await supabase
      .from('email_tracking')
      .select('campanha_id, tipo_email, created_at, status_envio_email')
      .not('campanha_id', 'is', null)
      .in('tipo_email', ['campanha_vencendo_hoje', 'campanha_vencendo_1dia'])
      .order('created_at', { ascending: false })
      .limit(50)

    // Verificar quais campanhas têm email preenchido
    const campanhasComEmail = campanhasVencendo.filter(c => 
      c.hotsite && c.hotsite.email && c.hotsite.email.trim() !== ''
    )

    // Verificar quais campanhas já têm email criado hoje
    const campanhasComEmailCriado = campanhasVencendo.filter(c => {
      if (!emailsExistentes) return false
      return emailsExistentes.some(e => {
        if (e.campanha_id !== c.id) return false
        if (!e.created_at) return false
        // Formatar data de criação no timezone de SP
        const createdDateStr = formatter.format(new Date(e.created_at))
        return createdDateStr === hojeSPStr
      })
    })

    return NextResponse.json({
      diagnostico: {
        data_atual_utc: new Date().toISOString(),
        data_atual_sp: hojeSPStr,
        data_amanha_sp: amanhaSPStr,
        total_campanhas_ativas: campanhas?.length || 0,
        campanhas_vencendo_hoje_ou_amanha: campanhasVencendo.length,
        campanhas_com_email_preenchido: campanhasComEmail.length,
        campanhas_com_email_ja_criado: campanhasComEmailCriado.length,
        campanhas_que_deveriam_ir_para_fila: campanhasComEmail.length - campanhasComEmailCriado.length
      },
      todas_campanhas_ativas: todasCampanhasDetalhadas,
      campanhas_vencendo: campanhasVencendo.map(c => ({
        campanha_id: c.id,
        data_fim: c.data_fim,
        ativo: c.ativo,
        hotsite_email: c.hotsite?.email || null,
        hotsite_nome: c.hotsite?.nome_exibicao || null,
        tem_email_preenchido: !!(c.hotsite?.email && c.hotsite.email.trim() !== ''),
        ja_tem_email_criado: campanhasComEmailCriado.some(cc => cc.id === c.id)
      })),
      emails_existentes: emailsExistentes?.map(e => ({
        campanha_id: e.campanha_id,
        tipo_email: e.tipo_email,
        created_at: e.created_at,
        status_envio_email: e.status_envio_email
      })) || []
    })
  } catch (error: any) {
    console.error('Erro no diagnóstico:', error)
    return NextResponse.json(
      { 
        error: 'Erro no diagnóstico',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

