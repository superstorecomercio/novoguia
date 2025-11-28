'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileCode, Eye, EyeOff } from 'lucide-react'

interface BotFile {
  id: string
  bot_id: string
  file_path: string
  file_content: string
  file_type: string
  description: string | null
  created_at: string
  updated_at: string
}

export default function ArquivosBotPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string
  
  const [files, setFiles] = useState<BotFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<BotFile | null>(null)
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({})
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [botId])

  async function loadFiles() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/bots-whatsapp/${botId}/files`)
      if (!response.ok) throw new Error('Erro ao carregar arquivos')
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error: any) {
      console.error('Erro:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function toggleFile(fileId: string) {
    setExpandedFiles(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }))
  }

  function getFileIcon(filePath: string) {
    if (filePath.endsWith('.js')) return '📜'
    if (filePath.endsWith('.json')) return '📋'
    if (filePath.endsWith('.md')) return '📝'
    return '📄'
  }

  function getLanguageClass(filePath: string) {
    if (filePath.endsWith('.js')) return 'language-javascript'
    if (filePath.endsWith('.json')) return 'language-json'
    if (filePath.endsWith('.md')) return 'language-markdown'
    return 'language-text'
  }

  async function handleImportFiles() {
    if (!confirm('Deseja importar o conteúdo real dos arquivos da pasta vps-code/codigo?')) {
      return
    }
    
    try {
      setImporting(true)
      const response = await fetch(`/api/admin/bots-whatsapp/${botId}/files/import`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao importar arquivos')
      }
      
      const data = await response.json()
      
      alert(`Importação concluída!\n\n${data.message}\n\nArquivos importados: ${data.results.filter((r: any) => r.success).length}`)
      
      // Recarregar arquivos
      await loadFiles()
    } catch (error: any) {
      console.error('Erro:', error)
      alert(`Erro ao importar arquivos: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando arquivos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Arquivos do Bot</h1>
          <p className="text-gray-600 mt-1">Visualize os arquivos de código do bot</p>
        </div>
      </div>

      {/* Lista de Arquivos */}
      {files.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <FileCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Nenhum arquivo encontrado</p>
          <p className="text-gray-400 text-sm">
            Os arquivos do bot ainda não foram importados para o banco de dados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Header do Arquivo */}
              <div
                className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleFile(file.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.file_path)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{file.file_path}</h3>
                      {file.description && (
                        <p className="text-sm text-gray-500 mt-1">{file.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Atualizado em: {new Date(file.updated_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {file.file_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {file.file_content.length.toLocaleString('pt-BR')} caracteres
                    </span>
                    {expandedFiles[file.id] ? (
                      <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Conteúdo do Arquivo (Expandido) */}
              {expandedFiles[file.id] && (
                <div className="p-4 bg-gray-900 max-h-[600px] overflow-y-auto">
                  <pre className="text-sm text-gray-100 whitespace-pre-wrap break-words">
                    <code className={getLanguageClass(file.file_path)}>
                      {file.file_content || '(Arquivo vazio)'}
                    </code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botão de Importar */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Importar Arquivos Reais</h3>
              <p className="text-sm text-gray-600 mt-1">
                Importe o conteúdo real dos arquivos da pasta vps-code/codigo
              </p>
            </div>
            <button
              onClick={handleImportFiles}
              disabled={importing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importando...' : 'Importar Arquivos'}
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Informação:</strong> Esta é uma visualização somente leitura dos arquivos do bot.
          As alterações nos arquivos não são sincronizadas automaticamente com o servidor VPS.
        </p>
      </div>
    </div>
  )
}

