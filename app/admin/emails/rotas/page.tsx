'use client'

import { useState } from 'react'
import { Send, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface RotaInfo {
  id: string
  nome: string
  descricao: string
  endpoint: string
  metodo: 'POST'
  body?: any
  frequencia?: string
}

const rotas: RotaInfo[] = [
  {
    id: 'enviar-pendentes',
    nome: 'Enviar Emails Pendentes',
    descricao: 'Envia emails de orçamentos para empresas que estão na fila ou com erro (menos de 3 tentativas). Processa até 50 emails por execução.',
    endpoint: '/api/admin/emails/enviar-pendentes',
    metodo: 'POST',
    frequencia: 'A cada 10 minutos (via cron)'
  },
  {
    id: 'enviar-clientes-pendentes',
    nome: 'Enviar Emails para Clientes (Fila)',
    descricao: 'Processa e envia emails de confirmação de orçamento para clientes que estão na fila (status: na_fila). Processa até 50 emails por execução.',
    endpoint: '/api/admin/emails/enviar-clientes-pendentes',
    metodo: 'POST',
    frequencia: 'A cada 10 minutos (via cron)'
  },
  {
    id: 'enviar-prospeccao',
    nome: 'Enviar Prospecção de Clientes',
    descricao: 'Envia emails de ofertas e promoções para potenciais clientes (prospecção).',
    endpoint: '/api/admin/emails/enviar-prospeccao-clientes',
    metodo: 'POST',
    body: { emails: ['array de emails'] }
  },
  {
    id: 'enviar-ativacao',
    nome: 'Enviar Ativação de Campanha',
    descricao: 'Envia email de notificação quando uma campanha é ativada.',
    endpoint: '/api/admin/emails/enviar-ativacao-campanha',
    metodo: 'POST',
    body: { campanhaId: 'string (obrigatório)' }
  },
  {
    id: 'enviar-vencimento',
    nome: 'Enviar Vencimento de Campanha',
    descricao: 'Envia emails que estão na fila de vencimento (vencendo hoje ou vencendo em 1 dia). Processa até 50 emails por execução.',
    endpoint: '/api/admin/emails/enviar-vencimento-campanha',
    metodo: 'POST',
    frequencia: 'A cada 10 minutos (via cron)'
  },
  {
    id: 'processar-campanhas-vencendo',
    nome: 'Processar Campanhas Vencendo',
    descricao: 'Identifica campanhas que vencem hoje ou em 1 dia e adiciona emails à fila de envio. Evita duplicatas verificando se já existe um email criado hoje.',
    endpoint: '/api/admin/emails/processar-campanhas-vencendo',
    metodo: 'POST',
    frequencia: 'Diariamente (recomendado: 1x por dia, de manhã)'
  }
]

export default function RotasEmailsPage() {
  const [executando, setExecutando] = useState<Set<string>>(new Set())
  const [resultados, setResultados] = useState<Record<string, any>>({})

  const executarRota = async (rota: RotaInfo) => {
    setExecutando(prev => new Set(prev).add(rota.id))

    try {
      const body: any = {}

      // Preparar body baseado no tipo de rota
      if (rota.id === 'enviar-prospeccao') {
        const emailsInput = prompt('Digite os emails separados por vírgula:')
        if (!emailsInput) {
          setExecutando(prev => {
            const next = new Set(prev)
            next.delete(rota.id)
            return next
          })
          return
        }
        body.emails = emailsInput.split(',').map(e => e.trim()).filter(e => e)
      } else if (rota.id === 'enviar-ativacao') {
        const campanhaId = prompt('Digite o ID da campanha:')
        if (!campanhaId) {
          setExecutando(prev => {
            const next = new Set(prev)
            next.delete(rota.id)
            return next
          })
          return
        }
        body.campanhaId = campanhaId
      }
      // Rota enviar-vencimento não precisa de input, apenas executa

      const response = await fetch(rota.endpoint, {
        method: rota.metodo,
        headers: {
          'Content-Type': 'application/json'
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : '{}'
      })

      const data = await response.json()

      setResultados(prev => ({
        ...prev,
        [rota.id]: {
          success: response.ok,
          data,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error: any) {
      setResultados(prev => ({
        ...prev,
        [rota.id]: {
          success: false,
          error: error.message || 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setExecutando(prev => {
        const next = new Set(prev)
        next.delete(rota.id)
        return next
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rotas de Envio de Emails</h1>
        <p className="text-gray-500 mt-1">
          Gerencie e execute manualmente as rotas de envio de emails. 
          <span className="text-orange-600 font-medium"> Em modo de teste, os emails não serão enviados realmente.</span>
        </p>
      </div>

      {/* Aviso sobre Modo de Teste */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">
              Modo de Teste
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Se o modo de teste estiver ativo, todos os emails serão interceptados e não serão enviados realmente. 
              Verifique o status em <a href="/admin/emails/test-mode" className="underline font-medium">Modo de Teste</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Rotas */}
      <div className="space-y-4">
        {rotas.map((rota) => {
          const estaExecutando = executando.has(rota.id)
          const resultado = resultados[rota.id]

          return (
            <div
              key={rota.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{rota.nome}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {rota.metodo}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{rota.descricao}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Endpoint:</span>
                      <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-800 font-mono">
                        {rota.endpoint}
                      </code>
                    </div>
                    {rota.frequencia && (
                      <div>
                        <span className="font-medium text-gray-700">Frequência:</span>
                        <span className="ml-2 text-gray-600">{rota.frequencia}</span>
                      </div>
                    )}
                    {rota.body && (
                      <div>
                        <span className="font-medium text-gray-700">Body (JSON):</span>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(rota.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Resultado da Execução */}
                  {resultado && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      resultado.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        {resultado.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${
                            resultado.success ? 'text-green-900' : 'text-red-900'
                          }`}>
                            {resultado.success ? 'Executado com sucesso' : 'Erro na execução'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(resultado.timestamp).toLocaleString('pt-BR')}
                          </p>
                          <pre className="mt-2 text-xs overflow-x-auto">
                            {JSON.stringify(resultado.data || resultado.error, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => executarRota(rota)}
                    disabled={estaExecutando}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      estaExecutando
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {estaExecutando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Executando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Executar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Configuração de Cron Jobs
            </p>
            <p className="text-sm text-blue-700 mt-1">
              As rotas podem ser configuradas para execução automática via cron jobs na Vercel. 
              A configuração será feita posteriormente através do arquivo <code className="bg-white px-1 rounded">vercel.json</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
