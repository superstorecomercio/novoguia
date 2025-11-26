'use client'

import { useState, useEffect } from 'react'
import { Mail, Trash2, Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { formatDateTimeBR } from '@/lib/utils/date'

export default function TestModePage() {
  const [logs, setLogs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [testModeActive, setTestModeActive] = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    checkTestMode()
    loadLogs()
    
    // Atualizar logs a cada 2 segundos
    const interval = setInterval(loadLogs, 2000)
    return () => clearInterval(interval)
  }, [])

  const checkTestMode = async () => {
    // Verificar se está em modo de teste via API (busca do banco de dados)
    try {
      const response = await fetch('/api/admin/emails/test-mode/status')
      const data = await response.json()
      setTestModeActive(data.active || false)
    } catch (error) {
      console.error('Erro ao verificar modo de teste:', error)
      // Fallback: verificar variáveis públicas
      setTestModeActive(
        process.env.NEXT_PUBLIC_EMAIL_TEST_MODE === 'true'
      )
    }
  }

  const handleToggleTestMode = async () => {
    try {
      setToggling(true)
      const response = await fetch('/api/admin/emails/test-mode/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !testModeActive })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar modo de teste')
      }

      setTestModeActive(data.enabled)
      alert(data.message || (data.enabled ? 'Modo de teste ativado' : 'Modo de teste desativado'))
    } catch (error: any) {
      alert(`Erro: ${error.message}`)
    } finally {
      setToggling(false)
    }
  }

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/admin/emails/test-mode/logs')
      const data = await response.json()
      setLogs(data.logs || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  const handleClearLogs = async () => {
    if (confirm('Tem certeza que deseja limpar todos os logs de teste?')) {
      try {
        await fetch('/api/admin/emails/test-mode/logs', { method: 'DELETE' })
        loadLogs()
        setSelectedLog(null)
      } catch (error) {
        console.error('Erro ao limpar logs:', error)
        alert('Erro ao limpar logs')
      }
    }
  }

  // formatDate removido - usando formatDateTimeBR do utils

  if (!testModeActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modo de Teste de Emails</h1>
          <p className="text-gray-500 mt-1">Visualize e gerencie emails interceptados em modo de teste</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                Modo de Teste Não Está Ativo
              </h2>
              <p className="text-sm text-yellow-700 mb-4">
                Para ativar o modo de teste e interceptar emails, você pode:
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-2">Opção 1: Ativar via Interface (Recomendado)</p>
                  <p className="text-sm text-yellow-700 mb-2">
                    Use o botão abaixo para ativar o modo de teste diretamente. A configuração será salva no banco de dados.
                  </p>
                  <button
                    onClick={handleToggleTestMode}
                    disabled={toggling}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {toggling ? 'Aguarde...' : 'Ativar Modo de Teste'}
                  </button>
                </div>
                <div className="border-t border-yellow-300 pt-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">Opção 2: Variáveis de Ambiente</p>
                  <p className="text-sm text-yellow-700 mb-2">
                    Adicione no arquivo <code className="bg-yellow-100 px-2 py-1 rounded">.env.local</code>:
                  </p>
                  <pre className="bg-yellow-100 p-4 rounded-lg text-sm overflow-x-auto">
{`EMAIL_TEST_MODE=true
EMAIL_TEST_TO=seu-email@exemplo.com`}
                  </pre>
                  <p className="text-xs text-yellow-600 mt-2">
                    Ou simplesmente execute em modo de desenvolvimento (<code>npm run dev</code>) - o modo de teste será ativado automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Modo de Teste de Emails</h1>
        <p className="text-gray-500 mt-1">Visualize e gerencie emails interceptados em modo de teste</p>
      </div>

      {/* Aviso de Modo de Teste */}
      <div className={`border rounded-lg p-4 ${
        testModeActive 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {testModeActive ? (
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                testModeActive ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {testModeActive ? '✅ Modo de Teste Ativo' : '❌ Modo de Teste Desativado'}
              </p>
              <p className={`text-sm mt-1 ${
                testModeActive ? 'text-blue-700' : 'text-gray-600'
              }`}>
                {testModeActive 
                  ? 'Todos os emails estão sendo interceptados e não serão enviados para clientes reais.'
                  : 'Os emails serão enviados normalmente para os clientes. Ative o modo de teste para interceptar.'
                }
                {testModeActive && stats?.lastEmail && (
                  <span className="block mt-2">
                    <strong>Último email interceptado:</strong> {formatDate(stats.lastEmail.timestamp)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleTestMode}
            disabled={toggling}
            className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              testModeActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {toggling ? (
              'Aguarde...'
            ) : testModeActive ? (
              'Desativar Modo de Teste'
            ) : (
              'Ativar Modo de Teste'
            )}
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Total de Emails</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Destinatários Únicos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.uniqueRecipients}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Provedores</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {stats.providers.join(', ') || 'Nenhum'}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <button
              onClick={handleClearLogs}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Logs
            </button>
          </div>
        </div>
      )}

      {/* Lista de Emails */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Emails Interceptados</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum email interceptado ainda.</p>
              <p className="text-sm mt-2">Os emails aparecerão aqui quando forem enviados.</p>
            </div>
          ) : (
            logs.map((log, index) => {
              const recipients = Array.isArray(log.to) ? log.to : [log.to]
              return (
                <div
                  key={index}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {log.provider}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-1">{log.subject}</p>
                      <p className="text-sm text-gray-600">
                        <strong>Para:</strong> {recipients.join(', ')}
                      </p>
                      {log.fromName && (
                        <p className="text-sm text-gray-600">
                          <strong>De:</strong> {log.fromName} &lt;{log.from}&gt;
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedLog(log)
                      }}
                      className="ml-4 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Detalhes do Email</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Assunto</label>
                  <p className="mt-1 text-gray-900">{selectedLog.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Para</label>
                  <p className="mt-1 text-gray-900">
                    {Array.isArray(selectedLog.to) ? selectedLog.to.join(', ') : selectedLog.to}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">De</label>
                  <p className="mt-1 text-gray-900">
                    {selectedLog.fromName ? `${selectedLog.fromName} <${selectedLog.from}>` : selectedLog.from}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Data/Hora</label>
                  <p className="mt-1 text-gray-900">{formatDateTimeBR(selectedLog.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Provedor</label>
                  <p className="mt-1 text-gray-900">{selectedLog.provider}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Conteúdo HTML</label>
                  <div className="mt-1 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedLog.html }} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">HTML Bruto</label>
                  <pre className="mt-1 border border-gray-200 rounded-lg p-4 bg-gray-50 text-xs overflow-auto max-h-64">
                    {selectedLog.html}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

