'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { CheckCircle2, Clock, AlertTriangle, XCircle, Mail, RefreshCw, Send, Search, Eye } from 'lucide-react'
import { formatDateTimeBR } from '@/lib/utils/date'

interface EmailCliente {
  id: string
  codigo_rastreamento: string
  orcamento_id: string
  codigo_orcamento?: string
  email_destinatario: string
  assunto?: string
  status_envio: string
  enviado_em?: string
  visualizado: boolean
  visualizado_em?: string
  metadata?: any
}

const statusColors = {
  enviado: 'bg-green-100 text-green-800 border-green-200',
  erro: 'bg-red-100 text-red-800 border-red-200',
  na_fila: 'bg-orange-100 text-orange-800 border-orange-200',
  enviando: 'bg-blue-100 text-blue-800 border-blue-200'
}

const statusLabels = {
  enviado: 'Enviado',
  erro: 'Erro',
  na_fila: 'Na Fila',
  enviando: 'Enviando'
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'enviado':
      return <CheckCircle2 className="w-4 h-4" />
    case 'na_fila':
      return <Clock className="w-4 h-4" />
    case 'enviando':
      return <Clock className="w-4 h-4 animate-spin" />
    case 'erro':
      return <AlertTriangle className="w-4 h-4" />
    default:
      return <XCircle className="w-4 h-4" />
  }
}

export default function EmailsClientesPage() {
  const [emails, setEmails] = useState<EmailCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewEmail, setPreviewEmail] = useState<{ 
    assunto: string
    html: string
    texto: string
    socketlabs_status?: {
      status: string
      hasError: boolean
      transactionReceipt?: string
      messageId?: string
      erro?: string
      enviado_em?: string
    } | null
  } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null)
  const itemsPerPage = 50

  const supabase = getSupabase()

  const handleVerPreview = async (orcamentoId: string) => {
    setLoadingPreview(orcamentoId)
    try {
      const response = await fetch('/api/admin/emails/preview-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orcamentoId })
      })
      const data = await response.json()
      if (data.success) {
        setPreviewEmail({
          assunto: data.assunto,
          html: data.html,
          texto: data.texto
        })
      } else {
        alert('Erro ao gerar preview: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error: any) {
      alert('Erro ao gerar preview: ' + error.message)
    } finally {
      setLoadingPreview(null)
    }
  }

  const fetchEmails = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('email_tracking')
        .select(`
          id,
          codigo_rastreamento,
          orcamento_id,
          email_destinatario,
          assunto,
          status_envio_email,
          enviado_em,
          created_at,
          visualizado,
          visualizado_em,
          metadata,
          orcamentos (
            codigo_orcamento
          )
        `)
        .eq('tipo_email', 'orcamento_cliente')
        .order('created_at', { ascending: false, nullsFirst: false })
        .order('enviado_em', { ascending: false, nullsFirst: true })

      if (searchTerm) {
        query = query.or(`email_destinatario.ilike.%${searchTerm}%,codigo_rastreamento.ilike.%${searchTerm}%,orcamentos.codigo_orcamento.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      const emailsProcessados: EmailCliente[] = (data || []).map((email: any) => ({
        id: email.id,
        codigo_rastreamento: email.codigo_rastreamento,
        orcamento_id: email.orcamento_id,
        codigo_orcamento: email.orcamentos?.codigo_orcamento,
        email_destinatario: email.email_destinatario,
        assunto: email.assunto,
        status_envio: email.status_envio_email || email.metadata?.status_envio || 'na_fila',
        enviado_em: email.enviado_em,
        visualizado: email.visualizado,
        visualizado_em: email.visualizado_em,
        metadata: email.metadata
      }))

      setEmails(emailsProcessados)
    } catch (error) {
      console.error('Erro ao buscar emails:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [searchTerm])

  const paginatedEmails = emails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(emails.length / itemsPerPage)

  const stats = {
    total: emails.length,
    enviados: emails.filter(e => e.status_envio === 'enviado').length,
    na_fila: emails.filter(e => e.status_envio === 'na_fila').length,
    erro: emails.filter(e => e.status_envio === 'erro').length,
    visualizados: emails.filter(e => e.visualizado).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fila de Emails - Clientes</h1>
          <p className="text-gray-500 mt-1">Emails enviados aos clientes que preencheram orçamentos</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-5 h-5" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Enviados</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.enviados}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Na Fila</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.na_fila}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">Erro</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.erro}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Mail className="w-5 h-5" />
            <span className="text-sm font-medium">Visualizados</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.visualizados}</p>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email, código de rastreamento ou código do orçamento..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de Emails */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Carregando emails...</p>
        </div>
      ) : paginatedEmails.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum email encontrado</p>
          {searchTerm && (
            <p className="text-gray-400 text-sm mt-2">
              Tente ajustar os termos de busca
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código Orçamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Destinatário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assunto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enviado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visualizado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código Rastreamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEmails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {email.codigo_orcamento ? (
                          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded font-mono">
                            {email.codigo_orcamento}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{email.email_destinatario}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{email.assunto || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[email.status_envio as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          <StatusIcon status={email.status_envio} />
                          {statusLabels[email.status_envio as keyof typeof statusLabels] || email.status_envio}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {email.enviado_em ? formatDateTimeBR(email.enviado_em) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {email.visualizado ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            {email.visualizado_em ? formatDateTimeBR(email.visualizado_em) : 'Sim'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Não</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                          {email.codigo_rastreamento}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {email.orcamento_id && (
                          <button
                            onClick={() => handleVerPreview(email.orcamento_id!)}
                            disabled={loadingPreview === email.orcamento_id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingPreview === email.orcamento_id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Carregando...
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                Ver
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-4">
              <div className="text-sm text-gray-700">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, emails.length)} de {emails.length} emails
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Preview */}
      {previewEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Preview do Email</h2>
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Status do SocketLabs */}
              {previewEmail.socketlabs_status && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status SocketLabs:</label>
                  <div className={`border rounded-lg p-4 ${
                    previewEmail.socketlabs_status.hasError 
                      ? 'bg-red-50 border-red-200' 
                      : previewEmail.socketlabs_status.status === 'enviado' || previewEmail.socketlabs_status.status === 'sent'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {previewEmail.socketlabs_status.hasError ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      <span className={`font-semibold ${
                        previewEmail.socketlabs_status.hasError ? 'text-red-800' : 'text-green-800'
                      }`}>
                        {previewEmail.socketlabs_status.hasError ? 'Erro no Envio' : 'Enviado com Sucesso'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-gray-600">Status: </span>
                        <span className="font-medium text-gray-900">{previewEmail.socketlabs_status.status}</span>
                      </div>
                      {previewEmail.socketlabs_status.transactionReceipt && (
                        <div>
                          <span className="text-gray-600">Transaction Receipt: </span>
                          <code className="text-xs bg-white px-2 py-1 rounded font-mono">{previewEmail.socketlabs_status.transactionReceipt}</code>
                        </div>
                      )}
                      {previewEmail.socketlabs_status.messageId && (
                        <div>
                          <span className="text-gray-600">Message ID: </span>
                          <code className="text-xs bg-white px-2 py-1 rounded font-mono">{previewEmail.socketlabs_status.messageId}</code>
                        </div>
                      )}
                      {previewEmail.socketlabs_status.erro && (
                        <div className="mt-2">
                          <span className="text-red-600 font-medium">Erro: </span>
                          <span className="text-red-800">{previewEmail.socketlabs_status.erro}</span>
                        </div>
                      )}
                      {previewEmail.socketlabs_status.enviado_em && (
                        <div>
                          <span className="text-gray-600">Enviado em: </span>
                          <span className="text-gray-900">{formatDateTimeBR(previewEmail.socketlabs_status.enviado_em)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto:</label>
                <div className="text-gray-900 font-medium">{previewEmail.assunto}</div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo HTML:</label>
                <div 
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewEmail.html }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Versão Texto:</label>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap">
                  {previewEmail.texto}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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

