import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  console.log('🧪 Testando conexão e função SQL...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Teste 1: Verificar se consegue acessar a tabela
    console.log('✅ Teste 1: Verificando tabela orcamentos...')
    const { data: countData, error: countError } = await supabase
      .from('orcamentos')
      .select('id', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Erro na tabela:', countError.message)
      return NextResponse.json({ 
        success: false, 
        step: 'tabela',
        error: countError.message 
      })
    }
    
    console.log('✅ Tabela acessível!')
    
    // Teste 2: Chamar a função SQL
    console.log('✅ Teste 2: Chamando função criar_orcamento_e_notificar...')
    const { data: funcData, error: funcError } = await supabase
      .rpc('criar_orcamento_e_notificar', {
        p_orcamento_data: {
          tipo: 'mudanca',
          nome_cliente: 'Teste API',
          email_cliente: 'teste@api.com',
          telefone_cliente: '11999999999',
          whatsapp: '11999999999',
          origem_completo: 'São Paulo, SP',
          destino_completo: 'Rio de Janeiro, RJ',
          estado_origem: 'SP',
          cidade_origem: 'São Paulo',
          estado_destino: 'RJ',
          cidade_destino: 'Rio de Janeiro',
          tipo_imovel: '2_quartos',
          tem_elevador: true,
          andar: 0,
          precisa_embalagem: true,
          distancia_km: 430,
          preco_min: 2800,
          preco_max: 3900,
          mensagem_ia: 'Teste via API',
          data_estimada: new Date().toISOString().split('T')[0],
          origem_formulario: 'teste'
        }
      })
    
    if (funcError) {
      console.error('❌ Erro na função:', funcError.message)
      return NextResponse.json({ 
        success: false, 
        step: 'funcao',
        error: funcError.message,
        details: funcError
      })
    }
    
    console.log('✅ Função executada com sucesso!')
    console.log('Resultado:', funcData)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teste concluído com sucesso',
      result: funcData 
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      success: false, 
      step: 'geral',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}




