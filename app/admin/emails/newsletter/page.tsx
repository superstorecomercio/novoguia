'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { CheckCircle2, Clock, AlertTriangle, XCircle, Mail, RefreshCw, Send, Search, Newspaper } from 'lucide-react'
import { formatDateTimeBR } from '@/lib/utils/date'

interface EmailNewsletter {
  id: string
  codigo_rastreamento: string
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

export default function EmailsNewsletterPage() {
  const [emails, setEmails] = useState<EmailNewsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const supabase = getSupabase()

  const fetchEmails = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('email_tracking')
        .select(`
          id,
          codigo_rastreamento,
          email_destinatario,
          assunto,
          enviado_em,
          visualizado,
          visualizado_em,
          metadata
        `)
        .eq('tipo_email', 'newsletter')
        .order('enviado_em', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`email_destinatario.ilike.%${searchTerm}%,codigo_rastreamento.ilike.%${searchTerm}%,assunto.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      const emailsProcessados: EmailNewsletter[] = (data || []).map((email: any) => ({
        id: email.id,
        codigo_rastreamento: email.codigo_rastreamento,
        email_destinatario: email.email_destinatario,
        assunto: email.assunto,
        status_envio: email.metadata?.status_envio || 'enviado',
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
          <h1 className="text-3xl font-bold text-gray-900">Fila de Emails - Newsletter</h1>
          <p className="text-gray-500 mt-1">Emails de newsletter enviados aos clientes</p>
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
            placeholder="Buscar por email, assunto ou código de rastreamento..."
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
          <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEmails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
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
    </div>
  )
}

