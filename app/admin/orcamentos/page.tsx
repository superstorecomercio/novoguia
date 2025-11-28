'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { CheckCircle2, Clock, AlertTriangle, XCircle, Eye, Calendar } from 'lucide-react'
import OrcamentosFilter from '@/app/components/admin/OrcamentosFilter'
import { formatDateOnlyBR, formatTimeOnlyBR, formatDateTimeBR } from '@/lib/utils/date'

interface Orcamento {
  id: string
  codigo_orcamento?: string
  nome_cliente: string
  email_cliente: string
  whatsapp: string
  origem_completo: string
  destino_completo: string
  estado_destino: string
  tipo_imovel: string
  preco_min: number
  preco_max: number
  distancia_km: number
  data_estimada: string
  status: string
  status_envio_email: string
  tentativas_envio: number
  hotsites_notificados: number
  created_at: string
  na_fila_count?: number // Contagem de vínculos na fila
  enviados_count?: number // Contagem de vínculos enviados
  erro_count?: number // Contagem de vínculos com erro
}

const statusColors = {
  novo: 'bg-blue-100 text-blue-800',
  processando: 'bg-yellow-100 text-yellow-800',
  enviado_empresas: 'bg-green-100 text-green-800',
  respondido: 'bg-purple-100 text-purple-800',
  fechado: 'bg-gray-100 text-gray-800'
}

const statusEnvioColors = {
  na_fila: 'bg-orange-100 text-orange-800',
  enviando: 'bg-blue-100 text-blue-800',
  enviado: 'bg-green-100 text-green-800',
  erro: 'bg-red-100 text-red-800',
  sem_empresas: 'bg-yellow-100 text-yellow-800'
}

const statusLabels = {
  novo: 'Novo',
  processando: 'Processando',
  enviado_empresas: 'Enviado',
  respondido: 'Respondido',
  fechado: 'Fechado'
}

const statusEnvioLabels = {
  na_fila: 'Na Fila',
  enviando: 'Enviando',
  enviado: 'Enviado',
  erro: 'Erro',
  sem_empresas: 'Sem Empresas'
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
    case 'sem_empresas':
      return <AlertTriangle className="w-4 h-4" />
    default:
      return <XCircle className="w-4 h-4" />
  }
}

type PeriodFilter = '5dias' | '15dias' | 'personalizado'

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchType, setSearchType] = useState<'nome' | 'codigo' | 'data'>('nome')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('5dias')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Calcular datas baseadas no filtro de período
  const getDateRange = () => {
    const now = new Date()
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    
    if (periodFilter === '5dias') {
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 5)
      startDate.setHours(0, 0, 0, 0)
      return { start: startDate.toISOString(), end: endDate.toISOString() }
    } else if (periodFilter === '15dias') {
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 15)
      startDate.setHours(0, 0, 0, 0)
      return { start: startDate.toISOString(), end: endDate.toISOString() }
    } else if (periodFilter === 'personalizado' && customStartDate && customEndDate) {
      const start = new Date(customStartDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(customEndDate)
      end.setHours(23, 59, 59, 999)
      return { start: start.toISOString(), end: end.toISOString() }
    }
    return null
  }

  const fetchOrcamentos = async () => {
    try {
      setLoading(true)
      const supabase = getSupabase()
      
      // Buscar orçamentos com contagem de vínculos na fila
      let query = supabase
        .from('orcamentos')
        .select(`
          *,
          orcamentos_campanhas(
            id,
            status_envio_email
          )
        `)

      // IMPORTANTE: Se houver busca, ignorar filtro de período (busca independente)
      // Se não houver busca, aplicar filtro de período normalmente
      const hasSearch = search.trim() !== ''
      
      if (!hasSearch) {
        // Aplicar filtro de período apenas se não houver busca
        const dateRange = getDateRange()
        if (dateRange) {
          query = query
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end)
        }
      }

      // Aplicar filtros de busca (independente do período)
      if (hasSearch) {
        if (searchType === 'nome') {
          query = query.ilike('nome_cliente', `%${search.trim()}%`)
        } else if (searchType === 'codigo') {
          // Buscar por código (converter para maiúsculas para melhor correspondência)
          const searchTerm = search.trim().toUpperCase()
          query = query.ilike('codigo_orcamento', `%${searchTerm}%`)
        } else if (searchType === 'data') {
          // Tentar parsear a data em diferentes formatos
          let year: number | undefined, month: number | undefined, day: number | undefined
          
          const dateMatch = search.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
          if (dateMatch) {
            [, day, month, year] = dateMatch.map(Number)
          } else {
            const isoMatch = search.match(/(\d{4})-(\d{2})-(\d{2})/)
            if (isoMatch) {
              [, year, month, day] = isoMatch.map(Number)
            }
          }

          if (year !== undefined && month !== undefined && day !== undefined) {
            const startDate = new Date(year, month - 1, day, 0, 0, 0, 0)
            const endDate = new Date(year, month - 1, day, 23, 59, 59, 999)
            
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              query = query
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
            }
          }
        }
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })

      if (error) throw error

      // Processar dados: calcular status baseado nos vínculos
      const orcamentosProcessados = (data || []).map((orcamento: any) => {
        const vinculos = orcamento.orcamentos_campanhas || []
        const naFilaCount = vinculos.filter((v: any) => v.status_envio_email === 'na_fila').length
        const enviadosCount = vinculos.filter((v: any) => v.status_envio_email === 'enviado').length
        const erroCount = vinculos.filter((v: any) => v.status_envio_email === 'erro').length
        const enviandoCount = vinculos.filter((v: any) => v.status_envio_email === 'enviando').length
        const totalVinculos = vinculos.length
        
        // Calcular status geral do orçamento baseado nos vínculos
        let statusEnvioEmail = 'na_fila' // padrão
        if (totalVinculos === 0) {
          // Se não há vínculos, verificar se não há empresas disponíveis
          if (orcamento.hotsites_notificados === 0) {
            statusEnvioEmail = 'sem_empresas'
          } else {
            statusEnvioEmail = orcamento.status_envio_email || 'na_fila'
          }
        } else if (enviadosCount === totalVinculos) {
          statusEnvioEmail = 'enviado'
        } else if (erroCount > 0 && naFilaCount === 0 && enviadosCount === 0) {
          statusEnvioEmail = 'erro'
        } else if (enviandoCount > 0) {
          statusEnvioEmail = 'enviando'
        } else if (enviadosCount > 0 || erroCount > 0) {
          // Parcial: alguns enviados/erro, mas não todos
          statusEnvioEmail = enviadosCount > erroCount ? 'enviado' : 'erro'
        }
        
        // Remover o campo orcamentos_campanhas do objeto final
        const { orcamentos_campanhas, ...orcamentoLimpo } = orcamento
        
        return {
          ...orcamentoLimpo,
          status_envio_email: statusEnvioEmail, // Sobrescrever com status calculado
          na_fila_count: naFilaCount,
          enviados_count: enviadosCount,
          erro_count: erroCount
        }
      })

      setOrcamentos(orcamentosProcessados)
      setCurrentPage(1) // Resetar página ao buscar
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error)
      setOrcamentos([])
    } finally {
      setLoading(false)
    }
  }

  // Buscar quando o período mudar (apenas se não houver busca ativa)
  useEffect(() => {
    if (!search.trim()) {
      fetchOrcamentos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFilter, customStartDate, customEndDate])

  // Buscar quando a busca mudar (independente do período)
  useEffect(() => {
    fetchOrcamentos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, searchType])

  // Paginação
  const totalPages = Math.ceil(orcamentos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrcamentos = orcamentos.slice(startIndex, endIndex)

  // Estatísticas baseadas em todos os orçamentos (não apenas os paginados)
  const total = orcamentos.length
  // Contar orçamentos que têm pelo menos um vínculo na fila (excluindo sem_empresas)
  const naFila = orcamentos.filter((o: any) => 
    o.status_envio_email !== 'sem_empresas' && (o.na_fila_count || 0) > 0
  ).length
  const enviados = orcamentos.filter((o: Orcamento) => o.status_envio_email === 'enviado').length
  const comErro = orcamentos.filter((o: Orcamento) => o.status_envio_email === 'erro').length
  const semEmpresas = orcamentos.filter((o: Orcamento) => o.status_envio_email === 'sem_empresas' || o.hotsites_notificados === 0).length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Gerencie todos os orçamentos recebidos</p>
        </div>
      </div>

      {/* Filtro de Período */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Período:</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPeriodFilter('5dias')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodFilter === '5dias'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Últimos 5 dias
            </button>
            <button
              onClick={() => setPeriodFilter('15dias')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodFilter === '15dias'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Últimos 15 dias
            </button>
            <button
              onClick={() => setPeriodFilter('personalizado')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodFilter === 'personalizado'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Intervalo Personalizado
            </button>
          </div>
          {periodFilter === 'personalizado' && (
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Data inicial"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Data final"
              />
            </div>
          )}
        </div>
      </div>

      {/* Filtro de Pesquisa */}
      <OrcamentosFilter 
        search={search}
        setSearch={setSearch}
        searchType={searchType}
        setSearchType={setSearchType}
        onSearch={fetchOrcamentos}
      />

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{total}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Na Fila</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{naFila}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Enviados</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{enviados}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Com Erro</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{comErro}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Sem Empresas</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{semEmpresas}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Orçamentos - Desktop */}
        <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rota
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Envio Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hotsites
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <Clock className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                      Carregando...
                    </td>
                  </tr>
                ) : paginatedOrcamentos && paginatedOrcamentos.length > 0 ? (
                  paginatedOrcamentos.map((orcamento: Orcamento) => (
                  <tr key={orcamento.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {orcamento.codigo_orcamento && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-2 font-mono">
                            {orcamento.codigo_orcamento}
                          </span>
                        )}
                        {orcamento.nome_cliente}
                      </div>
                      <div className="text-sm text-gray-500">{orcamento.email_cliente}</div>
                      <div className="text-sm text-gray-500">{orcamento.whatsapp}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {orcamento.origem_completo}
                      </div>
                      <div className="text-sm text-gray-500">↓</div>
                      <div className="text-sm text-gray-900">
                        {orcamento.destino_completo}
                      </div>
                      {orcamento.distancia_km != null && orcamento.distancia_km > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {orcamento.distancia_km.toLocaleString('pt-BR')} km
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {orcamento.tipo_imovel?.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {orcamento.preco_min?.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        R$ {orcamento.preco_max?.toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[orcamento.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[orcamento.status as keyof typeof statusLabels] || orcamento.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusEnvioColors[orcamento.status_envio_email as keyof typeof statusEnvioColors] || 'bg-gray-100 text-gray-800'}`}>
                          <StatusIcon status={orcamento.status_envio_email} />
                          {statusEnvioLabels[orcamento.status_envio_email as keyof typeof statusEnvioLabels] || orcamento.status_envio_email}
                        </span>
                      </div>
                      {orcamento.tentativas_envio > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {orcamento.tentativas_envio} tentativa(s)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                        {orcamento.hotsites_notificados || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateOnlyBR(orcamento.created_at)}
                      <div className="text-xs">
                        {formatTimeOnlyBR(orcamento.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm w-40">
                      <Link
                        href={`/admin/orcamentos/${orcamento.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Nenhum orçamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Paginação Desktop */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(endIndex, orcamentos.length)} de {orcamentos.length} orçamentos
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Clock className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : paginatedOrcamentos && paginatedOrcamentos.length > 0 ? (
          paginatedOrcamentos.map((orcamento: Orcamento) => (
            <div key={orcamento.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {orcamento.nome_cliente}
                  </h3>
                  {orcamento.codigo_orcamento && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-2 font-mono mt-1">
                      {orcamento.codigo_orcamento}
                    </span>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[orcamento.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabels[orcamento.status as keyof typeof statusLabels] || orcamento.status}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div>
                  <span className="text-xs text-gray-500">Rota:</span>
                  <p className="text-sm font-medium text-gray-900">{orcamento.origem_completo}</p>
                  <p className="text-xs text-gray-500">↓</p>
                  <p className="text-sm font-medium text-gray-900">{orcamento.destino_completo}</p>
                  {orcamento.distancia_km != null && orcamento.distancia_km > 0 && (
                    <p className="text-xs text-gray-500 mt-1">📍 {orcamento.distancia_km.toLocaleString('pt-BR')} km</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium text-gray-900">
                    {orcamento.tipo_imovel?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Preço:</span>
                  <span className="font-medium text-gray-900">
                    R$ {orcamento.preco_min?.toLocaleString('pt-BR')} - R$ {orcamento.preco_max?.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900 text-xs truncate ml-2">
                    {orcamento.email_cliente}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">WhatsApp:</span>
                  <span className="font-medium text-gray-900 text-xs">
                    {orcamento.whatsapp}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Envio Email:</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusEnvioColors[orcamento.status_envio_email as keyof typeof statusEnvioColors] || 'bg-gray-100 text-gray-800'}`}>
                    <StatusIcon status={orcamento.status_envio_email} />
                    {statusEnvioLabels[orcamento.status_envio_email as keyof typeof statusEnvioLabels] || orcamento.status_envio_email}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Hotsites:</span>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    {orcamento.hotsites_notificados || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium text-gray-900 text-xs">
                    {formatDateTimeBR(orcamento.created_at)}
                  </span>
                </div>
              </div>

              <Link
                href={`/admin/orcamentos/${orcamento.id}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium text-sm"
              >
                <Eye className="w-4 h-4" />
                Ver Detalhes
              </Link>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Nenhum orçamento encontrado</p>
          </div>
        )}
        {/* Paginação Mobile */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3">
            <div className="text-sm text-gray-600 text-center">
              Página {currentPage} de {totalPages} ({orcamentos.length} orçamentos)
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info sobre envio automático */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Envio Automático de Emails
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Os emails são enviados automaticamente a cada 10 minutos para orçamentos na fila. 
              Sistema tentará até 3 vezes em caso de erro.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

