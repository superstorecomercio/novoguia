import { NextResponse } from 'next/server'
import { getTestEmailLogs, getTestEmailStats, clearTestEmailLogs } from '@/lib/email/test-mode'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Buscar diretamente do banco para debug
    const supabase = createAdminClient()
    
    // Primeiro, tentar buscar todos os logs de teste
    const { data: allTestLogs, error: allError } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('tipo_email', 'teste_configuracao') // Usar tipo_email ao invés de template_tipo
      .order('enviado_em', { ascending: false })
      .limit(100)
    
    console.log('📧 [API LOGS] Buscando logs de teste...')
    console.log('📧 [API LOGS] Query direta retornou:', allTestLogs?.length || 0, 'logs')
    
    if (allError) {
      console.error('❌ Erro na query direta:', allError)
    }
    
    // Também buscar por metadata
    const { data: metadataLogs, error: metadataError } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('status_envio', 'enviado')
      .contains('metadata', { modo_teste: true })
      .order('enviado_em', { ascending: false })
      .limit(100)
    
    console.log('📧 [API LOGS] Query por metadata retornou:', metadataLogs?.length || 0, 'logs')
    
    // Combinar resultados (remover duplicatas)
    const combinedLogs = [...(allTestLogs || []), ...(metadataLogs || [])]
    const uniqueLogs = combinedLogs.filter((log, index, self) => 
      index === self.findIndex(l => l.id === log.id)
    )
    
    // Usar função helper para converter
    const logs = await getTestEmailLogs()
    const stats = await getTestEmailStats()
    
    console.log('📧 [API LOGS] Função getTestEmailLogs retornou:', logs.length, 'logs')
    
    return NextResponse.json({
      logs: logs.length > 0 ? logs : uniqueLogs.map(item => ({
        to: item.metadata?.destinatario_original || [item.destinatario_email],
        subject: item.assunto || '',
        html: item.metadata?.html_preview || '',
        from: item.metadata?.from || '',
        fromName: item.metadata?.fromName,
        timestamp: item.enviado_em || new Date().toISOString(),
        provider: item.metadata?.provider || 'unknown'
      })),
      stats: stats || {
        total: uniqueLogs.length,
        uniqueRecipients: new Set(uniqueLogs.map(l => l.destinatario_email)).size,
        providers: [...new Set(uniqueLogs.map(l => l.metadata?.provider).filter(Boolean))],
        lastEmail: uniqueLogs[0] || null
      }
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar logs:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar logs', logs: [], stats: null },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Limpar cache em memória
    clearTestEmailLogs()
    
    // Limpar logs de teste do banco (opcional - você pode querer manter histórico)
    // const supabase = createAdminClient()
    // await supabase
    //   .from('email_tracking')
    //   .delete()
    //   .eq('status_envio', 'enviado')
    //   .or('template_tipo.eq.teste_configuracao,metadata->modo_teste.eq.true')
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao limpar logs' },
      { status: 500 }
    )
  }
}

