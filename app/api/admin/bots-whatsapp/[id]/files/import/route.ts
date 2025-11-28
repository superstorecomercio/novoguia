import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// POST - Importar arquivos reais do diretório vps-code/codigo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = createAdminClient()
    
    // Verificar se o bot existe
    const { data: bot, error: botError } = await supabase
      .from('whatsapp_bots')
      .select('id, numero_whatsapp')
      .eq('id', resolvedParams.id)
      .single()
    
    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot não encontrado' },
        { status: 404 }
      )
    }
    
    // Lista de arquivos para importar
    const filesToImport = [
      { path: 'server.js', type: 'javascript', description: 'Servidor principal do bot - gerencia webhook e rotas' },
      { path: 'message-handler.js', type: 'javascript', description: 'Lógica principal de processamento de mensagens e fluxo conversacional' },
      { path: 'sessions.js', type: 'javascript', description: 'Gerencia sessões de conversa e estado do bot' },
      { path: 'whatsapp.js', type: 'javascript', description: 'Funções para enviar mensagens, botões e listas via WhatsApp API' },
      { path: 'openai-service.js', type: 'javascript', description: 'Serviço para calcular orçamentos usando IA (OpenAI GPT)' },
      { path: 'supabase-service.js', type: 'javascript', description: 'Serviço para salvar orçamentos no banco de dados Supabase' },
      { path: 'date-validator.js', type: 'javascript', description: 'Funções para validar e formatar datas em formato brasileiro' },
      { path: 'telefone-validator.js', type: 'javascript', description: 'Funções para validar e formatar números de telefone para WhatsApp' },
      { path: 'url-shortener.js', type: 'javascript', description: 'Serviço para encurtar URLs de links do WhatsApp' },
      { path: 'package.json', type: 'json', description: 'Arquivo de dependências do projeto Node.js' }
    ]
    
    const results = []
    const basePath = join(process.cwd(), 'vps-code', 'codigo')
    
    for (const fileInfo of filesToImport) {
      try {
        const filePath = join(basePath, fileInfo.path)
        
        // Ler conteúdo do arquivo
        let fileContent = ''
        try {
          fileContent = readFileSync(filePath, 'utf-8')
        } catch (readError: any) {
          results.push({
            file: fileInfo.path,
            success: false,
            error: `Arquivo não encontrado: ${readError.message}`
          })
          continue
        }
        
        // Salvar no banco
        const { data, error } = await supabase
          .from('bot_files')
          .upsert({
            bot_id: resolvedParams.id,
            file_path: fileInfo.path,
            file_content: fileContent,
            file_type: fileInfo.type,
            description: fileInfo.description
          }, {
            onConflict: 'bot_id,file_path'
          })
          .select()
          .single()
        
        if (error) {
          results.push({
            file: fileInfo.path,
            success: false,
            error: error.message
          })
        } else {
          results.push({
            file: fileInfo.path,
            success: true,
            size: fileContent.length
          })
        }
      } catch (error: any) {
        results.push({
          file: fileInfo.path,
          success: false,
          error: error.message
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    return NextResponse.json({
      success: true,
      message: `Importação concluída: ${successCount} sucesso, ${errorCount} erros`,
      results
    })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro inesperado' },
      { status: 500 }
    )
  }
}


