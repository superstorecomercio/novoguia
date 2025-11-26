'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { CheckCircle2, Clock, AlertTriangle, XCircle, Mail, RefreshCw, Send, Search, ChevronDown, ChevronUp, Building2 } from 'lucide-react'
import Link from 'next/link'
import { formatDateTimeBR } from '@/lib/utils/date'

interface EmpresaEnvio {
  id: string
  hotsite_id: string
  hotsite_nome: string
  hotsite_email: string
  status_envio_email: string
  tentativas_envio: number
  ultimo_erro_envio?: string
  email_enviado_em?: string
}

interface OrcamentoEmail {
  id: string
  codigo_orcamento?: string
  nome_cliente: string
  email_cliente: string
  origem_completo: string
  destino_completo: string
  created_at: string
  empresas: EmpresaEnvio[]
  resumo: {
    total: number
    na_fila: number
    enviando: number
    enviados: number
    com_erro: number
    todas_enviadas: boolean
  }
}

const statusEnvioColors = {
  na_fila: 'bg-orange-100 text-orange-800 border-orange-200',
  enviando: 'bg-blue-100 text-blue-800 border-blue-200',
  enviado: 'bg-green-100 text-green-800 border-green-200',
  erro: 'bg-red-100 text-red-800 border-red-200'
}

const statusEnvioLabels = {
  na_fila: 'Na Fila',
  enviando: 'Enviando',
  enviado: 'Enviado',
  erro: 'Erro'
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

type TabType = 'todos' | 'na_fila' | 'enviado' | 'erro' | 'parcial'

export default function EmailsPage() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedOrcamentos, setExpandedOrcamentos] = useState<Set<string>>(new Set())

  const supabase = getSupabase()

  const fetchOrcamentos = async () => {
    try {
      setLoading(true)
      
      // Buscar orçamentos com empresas relacionadas
      let query = supabase
        .from('orcamentos')
        .select(`
          id,
          codigo_orcamento,
          nome_cliente,
          email_cliente,
          origem_completo,
          destino_completo,
          created_at,
          orcamentos_campanhas (
            id,
            hotsite_id,
            status_envio_email,
            tentativas_envio,
            ultimo_erro_envio,
            email_enviado_em,
            hotsites (
              id,
              nome_exibicao,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (searchTerm) {
        query = query.or(`nome_cliente.ilike.%${searchTerm}%,email_cliente.ilike.%${searchTerm}%,codigo_orcamento.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Processar dados e calcular resumo
      const orcamentosProcessados: OrcamentoEmail[] = (data || []).map((orc: any) => {
        const empresas: EmpresaEnvio[] = (orc.orcamentos_campanhas || []).map((oc: any) => ({
          id: oc.id,
          hotsite_id: oc.hotsite_id,
          hotsite_nome: oc.hotsites?.nome_exibicao || 'N/A',
          hotsite_email: oc.hotsites?.email || 'N/A',
          status_envio_email: oc.status_envio_email || 'na_fila',
          tentativas_envio: oc.tentativas_envio || 0,
          ultimo_erro_envio: oc.ultimo_erro_envio,
          email_enviado_em: oc.email_enviado_em
        }))

        const resumo = {
          total: empresas.length,
          na_fila: empresas.filter(e => e.status_envio_email === 'na_fila').length,
          enviando: empresas.filter(e => e.status_envio_email === 'enviando').length,
          enviados: empresas.filter(e => e.status_envio_email === 'enviado').length,
          com_erro: empresas.filter(e => e.status_envio_email === 'erro').length,
          todas_enviadas: empresas.length > 0 && empresas.every(e => e.status_envio_email === 'enviado')
        }

        return {
          id: orc.id,
          codigo_orcamento: orc.codigo_orcamento,
          nome_cliente: orc.nome_cliente,
          email_cliente: orc.email_cliente,
          origem_completo: orc.origem_completo,
          destino_completo: orc.destino_completo,
          created_at: orc.created_at,
          empresas,
          resumo
        }
      })

      // Filtrar por tab
      let filtered = orcamentosProcessados
      if (activeTab === 'na_fila') {
        filtered = orcamentosProcessados.filter(o => o.resumo.na_fila > 0)
      } else if (activeTab === 'enviado') {
        filtered = orcamentosProcessados.filter(o => o.resumo.todas_enviadas)
      } else if (activeTab === 'erro') {
        filtered = orcamentosProcessados.filter(o => o.resumo.com_erro > 0)
      } else if (activeTab === 'parcial') {
        filtered = orcamentosProcessados.filter(o => 
          o.resumo.enviados > 0 && 
          o.resumo.enviados < o.resumo.total &&
          !o.resumo.todas_enviadas
        )
      }

      setOrcamentos(filtered)
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrcamentos()
  }, [activeTab, searchTerm])

  const toggleExpand = (orcamentoId: string) => {
    const newExpanded = new Set(expandedOrcamentos)
    if (newExpanded.has(orcamentoId)) {
      newExpanded.delete(orcamentoId)
    } else {
      newExpanded.add(orcamentoId)
    }
    setExpandedOrcamentos(newExpanded)
  }

  const handleEnviarEmail = async (orcamentoId: string, empresaId?: string) => {
    try {
      setProcessing(`${orcamentoId}-${empresaId || 'all'}`)
      const response = await fetch('/api/admin/emails/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orcamentoId, empresaId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar email')
      }

      alert('Email enviado com sucesso!')
      fetchOrcamentos()
    } catch (error: any) {
      alert(`Erro ao enviar email: ${error.message}`)
    } finally {
      setProcessing(null)
    }
  }

  const handleRecolocarFila = async (orcamentoId: string, empresaId?: string) => {
    try {
      setProcessing(`${orcamentoId}-${empresaId || 'all'}`)
      const response = await fetch('/api/admin/emails/recolocar-fila', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orcamentoId, empresaId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao recolocar na fila')
      }

      alert('Orçamento recolocado na fila com sucesso!')
      fetchOrcamentos()
    } catch (error: any) {
      alert(`Erro ao recolocar na fila: ${error.message}`)
    } finally {
      setProcessing(null)
    }
  }

  const stats = {
    todos: orcamentos.length,
    na_fila: orcamentos.reduce((sum, o) => sum + o.resumo.na_fila, 0),
    enviado: orcamentos.filter(o => o.resumo.todas_enviadas).length,
    erro: orcamentos.reduce((sum, o) => sum + o.resumo.com_erro, 0),
    parcial: orcamentos.filter(o => o.resumo.enviados > 0 && o.resumo.enviados < o.resumo.total).length
  }

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'todos', label: 'Todos', count: stats.todos },
    { id: 'na_fila', label: 'Na Fila', count: stats.na_fila },
    { id: 'parcial', label: 'Parcial', count: stats.parcial },
    { id: 'enviado', label: 'Todos Enviados', count: stats.enviado },
    { id: 'erro', label: 'Com Erro', count: stats.erro }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Envio de Emails</h1>
          <p className="text-gray-500 mt-1">Gerencie o envio de emails por empresa</p>
        </div>
        <Link
          href="/admin/emails/configuracao"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Mail className="w-4 h-4" />
          Configurar API
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'border-blue-500 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{tab.label}</p>
                <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
              </div>
              <div className={`p-3 rounded-lg ${
                tab.id === 'na_fila' ? 'bg-orange-100' :
                tab.id === 'enviado' ? 'bg-green-100' :
                tab.id === 'erro' ? 'bg-red-100' :
                tab.id === 'parcial' ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                <Mail className={`w-6 h-6 ${
                  tab.id === 'na_fila' ? 'text-orange-600' :
                  tab.id === 'enviado' ? 'text-green-600' :
                  tab.id === 'erro' ? 'text-red-600' :
                  tab.id === 'parcial' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, email ou código do orçamento..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de Orçamentos */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Clock className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum orçamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orcamentos.map((orcamento) => {
            const isExpanded = expandedOrcamentos.has(orcamento.id)
            const statusGeral = orcamento.resumo.todas_enviadas 
              ? 'enviado' 
              : orcamento.resumo.com_erro > 0 
                ? 'erro' 
                : orcamento.resumo.enviados > 0 
                  ? 'parcial' 
                  : 'na_fila'

            return (
              <div key={orcamento.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header do Orçamento */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {orcamento.codigo_orcamento && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded font-mono">
                            {orcamento.codigo_orcamento}
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">{orcamento.nome_cliente}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          statusEnvioColors[statusGeral as keyof typeof statusEnvioColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          <StatusIcon status={statusGeral} />
                          {statusGeral === 'parcial' ? 'Parcial' : statusEnvioLabels[statusGeral as keyof typeof statusEnvioLabels] || statusGeral}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Email:</span> {orcamento.email_cliente}</p>
                        <p><span className="font-medium">Rota:</span> {orcamento.origem_completo} → {orcamento.destino_completo}</p>
                        <p><span className="font-medium">Data:</span> {formatDateTimeBR(orcamento.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {/* Resumo de Status */}
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-gray-600">Total: <strong>{orcamento.resumo.total}</strong></span>
                          {orcamento.resumo.na_fila > 0 && (
                            <span className="text-orange-600">Fila: <strong>{orcamento.resumo.na_fila}</strong></span>
                          )}
                          {orcamento.resumo.enviados > 0 && (
                            <span className="text-green-600">Enviados: <strong>{orcamento.resumo.enviados}</strong></span>
                          )}
                          {orcamento.resumo.com_erro > 0 && (
                            <span className="text-red-600">Erro: <strong>{orcamento.resumo.com_erro}</strong></span>
                          )}
                        </div>
                        {/* Ações Gerais */}
                        <div className="flex gap-2">
                          {!orcamento.resumo.todas_enviadas && (
                            <button
                              onClick={() => handleEnviarEmail(orcamento.id)}
                              disabled={processing?.startsWith(orcamento.id) || false}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              Enviar Todos
                            </button>
                          )}
                          {orcamento.resumo.todas_enviadas && (
                            <button
                              onClick={() => handleRecolocarFila(orcamento.id)}
                              disabled={processing?.startsWith(orcamento.id) || false}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Recolocar Todos
                            </button>
                          )}
                          <button
                            onClick={() => toggleExpand(orcamento.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isExpanded ? 'Ocultar' : 'Ver'} Empresas
                          </button>
                          <Link
                            href={`/admin/orcamentos/${orcamento.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium"
                          >
                            Detalhes
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista de Empresas (Expandida) */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Empresas ({orcamento.empresas.length})
                      </h4>
                      <div className="space-y-2">
                        {orcamento.empresas.map((empresa) => (
                          <div
                            key={empresa.id}
                            className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                                  statusEnvioColors[empresa.status_envio_email as keyof typeof statusEnvioColors] || 'bg-gray-100'
                                }`}>
                                  <StatusIcon status={empresa.status_envio_email} />
                                  {statusEnvioLabels[empresa.status_envio_email as keyof typeof statusEnvioLabels] || empresa.status_envio_email}
                                </span>
                                <span className="font-medium text-gray-900">{empresa.hotsite_nome}</span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <p>Email: {empresa.hotsite_email}</p>
                                {empresa.tentativas_envio > 0 && (
                                  <p>Tentativas: {empresa.tentativas_envio} / 3</p>
                                )}
                                {empresa.email_enviado_em && (
                                  <p className="text-green-600">
                                    Enviado em: {formatDateTimeBR(empresa.email_enviado_em)}
                                  </p>
                                )}
                                {empresa.ultimo_erro_envio && (
                                  <p className="text-red-600 font-mono text-xs bg-red-50 p-2 rounded mt-1">
                                    Erro: {empresa.ultimo_erro_envio}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {empresa.status_envio_email !== 'enviando' && empresa.status_envio_email !== 'enviado' && (
                                <button
                                  onClick={() => handleEnviarEmail(orcamento.id, empresa.id)}
                                  disabled={processing === `${orcamento.id}-${empresa.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium disabled:opacity-50"
                                >
                                  <Send className="w-3 h-3" />
                                  Enviar
                                </button>
                              )}
                              {(empresa.status_envio_email === 'enviado' || empresa.status_envio_email === 'erro') && (
                                <button
                                  onClick={() => handleRecolocarFila(orcamento.id, empresa.id)}
                                  disabled={processing === `${orcamento.id}-${empresa.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded text-xs font-medium disabled:opacity-50"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Recolocar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
