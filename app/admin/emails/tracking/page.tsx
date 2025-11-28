'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { Search, Eye, Mail, Calendar, Building2, FileText, AlertCircle } from 'lucide-react'
import { formatDateTimeBR, formatDateTimeFullBR } from '@/lib/utils/date'

interface TrackingData {
  id: string
  codigo_rastreamento: string
  tipo_email: string // Campo correto da tabela
  email_destinatario: string // Campo correto da tabela
  assunto: string
  enviado_em: string
  visualizado?: boolean
  visualizado_em?: string | null
  metadata?: any // Status e erro ficam no metadata
  orcamentos?: any
  campanhas?: any
  hotsites?: any
}

export default function EmailTrackingPage() {
  const [trackings, setTrackings] = useState<TrackingData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchCode, setSearchCode] = useState('')
  const [selectedTracking, setSelectedTracking] = useState<TrackingData | null>(null)

  const supabase = getSupabase()

  useEffect(() => {
    loadTrackings()
  }, [])

  const loadTrackings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('email_tracking')
        .select(`
          *,
          orcamentos(*),
          campanhas(*),
          hotsites(*)
        `)
        .order('enviado_em', { ascending: false })
        .limit(500) // Aumentar limite para ver mais emails

      if (error) throw error
      setTrackings(data || [])
    } catch (error) {
      console.error('Erro ao carregar trackings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      loadTrackings()
      return
    }

    try {
      setLoading(true)
      const codigoBusca = searchCode.trim().toUpperCase()
      
      // Usar ilike para busca case-insensitive e permitir busca parcial
      const { data, error } = await supabase
        .from('email_tracking')
        .select(`
          *,
          orcamentos(*),
          campanhas(*),
          hotsites(*)
        `)
        .ilike('codigo_rastreamento', `%${codigoBusca}%`)
        .order('enviado_em', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Erro na busca:', error)
        throw error
      }
      
      setTrackings(data || [])
    } catch (error) {
      console.error('Erro ao buscar tracking:', error)
      setTrackings([])
    } finally {
      setLoading(false)
    }
  }

  // formatDate removido - usando formatDateTimeBR do utils

  const getTipoEmailLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      orcamento_empresa: 'Orçamento para Empresa',
      campanha_vencendo_1dia: 'Campanha Vencendo (1 dia)',
      campanha_vencendo_hoje: 'Campanha Vencendo (Hoje)',
      campanha_ativada: 'Campanha Ativada',
      campanha_desativada: 'Campanha Desativada',
      teste_configuracao: 'Teste de Configuração',
      email_enviado: 'Email Enviado',
      email_erro: 'Erro no Envio'
    }
    return labels[tipo] || tipo
  }
  
  const getStatusBadge = (status: string, erro?: string) => {
    if (status === 'enviado') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Enviado</span>
    }
    if (status === 'erro') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full" title={erro}>Erro</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rastreamento de Emails</h1>
        <p className="text-gray-500 mt-1">Rastreie emails enviados e identifique se foram repassados</p>
      </div>

      {/* Aviso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Como funciona o rastreamento
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Cada email enviado para empresas contém um código único de rastreamento. 
              Se um cliente te passar um email que recebeu de uma empresa, você pode buscar pelo código 
              para identificar qual empresa repassou o orçamento.
            </p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Digite o código de rastreamento (ex: MT-ABC12345)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
          {searchCode && (
            <button
              onClick={() => {
                setSearchCode('')
                loadTrackings()
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Trackings */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinatário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enviado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : trackings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                trackings.map((tracking) => (
                  <tr key={tracking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {tracking.codigo_rastreamento}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTipoEmailLabel(tracking.tipo_email || 'email_enviado')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tracking.email_destinatario || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tracking.hotsites?.nome_exibicao || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTimeBR(tracking.enviado_em)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tracking.metadata?.status_envio || 'enviado', tracking.metadata?.erro_mensagem)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedTracking(tracking)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedTracking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Detalhes do Rastreamento</h2>
              <button
                onClick={() => setSelectedTracking(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Código de Rastreamento</label>
                  <p className="mt-1 text-lg font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded">
                    {selectedTracking.codigo_rastreamento}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo de Email</label>
                  <p className="mt-1 text-gray-900">{getTipoEmailLabel(selectedTracking.tipo_email || 'email_enviado')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Destinatário</label>
                  <p className="mt-1 text-gray-900">{selectedTracking.email_destinatario || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Assunto</label>
                  <p className="mt-1 text-gray-900">{selectedTracking.assunto}</p>
                </div>
                {selectedTracking.hotsites && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Empresa</label>
                    <p className="mt-1 text-gray-900">{selectedTracking.hotsites.nome_exibicao}</p>
                  </div>
                )}
                {selectedTracking.orcamentos && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Orçamento</label>
                    <p className="mt-1 text-gray-900">
                      {selectedTracking.orcamentos.codigo_orcamento || selectedTracking.orcamentos.id}
                    </p>
                  </div>
                )}
                {selectedTracking.campanhas && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Campanha</label>
                    <p className="mt-1 text-gray-900">{selectedTracking.campanhas.nome}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Enviado em</label>
                  <p className="mt-1 text-gray-900">{formatDateTimeBR(selectedTracking.enviado_em)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1">
                    {selectedTracking.visualizado ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        Visualizado em {selectedTracking.visualizado_em ? formatDateTimeBR(selectedTracking.visualizado_em) : ''}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                        Não visualizado
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedTracking(null)}
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

