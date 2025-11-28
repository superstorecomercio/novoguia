'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  RefreshCw,
  Filter,
  Download,
  Eye,
  X,
  Trash2
} from 'lucide-react'
import { formatDateTimeBR, formatDateTimeFullBR } from '@/lib/utils/date'

interface EmailLog {
  id: string
  codigo_rastreamento: string
  tipo_email: string
  email_destinatario: string
  assunto: string
  enviado_em: string
  orcamento_id?: string
  hotsite_id?: string
  metadata?: {
    provider?: string
    from?: string
    fromName?: string
    replyTo?: string
    to?: string
    subject?: string
    html_completo?: string
    html_preview?: string
    status_envio?: string
    erro_mensagem?: string
    erro_codigo?: string
    erro_stack?: string
    erro_completo?: any
    messageId?: string
    serverId?: string
    response?: any
    modo_teste?: boolean
    destinatario_original?: string | string[]
    destinatario_redirecionado?: string
  }
  orcamentos?: any
  hotsites?: any
}

type FilterStatus = 'todos' | 'enviado' | 'erro' | 'teste'
type FilterProvider = 'todos' | 'socketlabs' | 'resend' | 'sendgrid' | 'nodemailer'

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
  const [filterProvider, setFilterProvider] = useState<FilterProvider>('todos')
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [relatedSocketLabsLog, setRelatedSocketLabsLog] = useState<EmailLog | null>(null)
  const [loadingRelatedLog, setLoadingRelatedLog] = useState(false)
  const [socketLabsStatusMap, setSocketLabsStatusMap] = useState<Record<string, { status: string; hasError: boolean }>>({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 50
  const maxLogsDefault = 500 // Limite padrão de logs (últimos 500)

  const supabase = getSupabase()

  const loadLogs = async () => {
    try {
      setLoading(true)
      
      // Determinar se deve limitar aos últimos 500
      const hasSearch = searchTerm.trim().length > 0
      const hasFilters = filterStatus !== 'todos' || filterProvider !== 'todos'
      const shouldLimit = !hasSearch && !hasFilters // Limitar apenas se não houver busca nem filtros
      
      let query = supabase
        .from('email_tracking')
        .select(`
          *,
          orcamentos(*),
          hotsites(*)
        `, { count: 'exact' })
        // Filtrar logs do SocketLabs da lista principal
        // Eles aparecem automaticamente nos detalhes do email relacionado
        .neq('tipo_email', 'email_enviado')
        .not('codigo_rastreamento', 'like', 'SENT-%')
        .order('enviado_em', { ascending: false })

      // Aplicar limite padrão apenas se não houver busca ou filtros
      if (shouldLimit) {
        query = query.limit(maxLogsDefault)
      }

      // Aplicar filtros
      if (filterStatus === 'enviado') {
        query = query.contains('metadata', { status_envio: 'enviado' })
      } else if (filterStatus === 'erro') {
        query = query.contains('metadata', { status_envio: 'erro' })
      } else if (filterStatus === 'teste') {
        query = query.contains('metadata', { modo_teste: true })
      }

      if (filterProvider !== 'todos') {
        query = query.contains('metadata', { provider: filterProvider })
      }

      if (searchTerm.trim()) {
        // Buscar por código, email ou assunto
        query = query.or(`codigo_rastreamento.ilike.%${searchTerm}%,email_destinatario.ilike.%${searchTerm}%,assunto.ilike.%${searchTerm}%`)
      }

      // Paginação
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      
      // Se houver busca ou filtros, buscar todos e paginar no cliente
      // Se não, usar paginação do servidor
      let logsFinais: EmailLog[] = []
      
      if (hasSearch || hasFilters) {
        // Buscar todos os resultados (sem range)
        const { data: allData, error, count } = await query
        
        if (error) throw error
        
        // Se a busca for por um código de rastreamento (MT- ou SENT-), buscar logs relacionados
        let logsComRelacionados = allData || []
        if (searchTerm.trim() && (searchTerm.trim().startsWith('MT-') || searchTerm.trim().startsWith('SENT-') || searchTerm.trim().match(/^(MT|SENT|ERROR)-/i))) {
          // Encontrar o log correspondente
          const logEncontrado = logsComRelacionados.find((log: EmailLog) => 
            log.codigo_rastreamento.toUpperCase().includes(searchTerm.trim().toUpperCase())
          )
          
          if (logEncontrado) {
            // Buscar logs relacionados baseado em orcamento_id + hotsite_id ou email + assunto + tempo
            let queryRelacionados = supabase
              .from('email_tracking')
              .select(`
                *,
                orcamentos(*),
                hotsites(*)
              `)
              .order('enviado_em', { ascending: false })
            
            // Se o log encontrado tem orcamento_id e hotsite_id, buscar por esses campos
            // Verificar se orcamentos e hotsites são objetos ou se os IDs estão diretamente no log
            const orcamentoId = logEncontrado.orcamento_id || (logEncontrado.orcamentos as any)?.id
            const hotsiteId = logEncontrado.hotsite_id || (logEncontrado.hotsites as any)?.id
            
            if (orcamentoId && hotsiteId) {
              queryRelacionados = queryRelacionados
                .eq('orcamento_id', orcamentoId)
                .eq('hotsite_id', hotsiteId)
            } else {
              // Caso contrário, buscar por email_destinatario e assunto, e tempo próximo (5 minutos)
              const tempoEnvio = new Date(logEncontrado.enviado_em)
              const tempoInicio = new Date(tempoEnvio.getTime() - 5 * 60 * 1000) // 5 minutos antes
              const tempoFim = new Date(tempoEnvio.getTime() + 5 * 60 * 1000) // 5 minutos depois
              
              queryRelacionados = queryRelacionados
                .eq('email_destinatario', logEncontrado.email_destinatario)
                .eq('assunto', logEncontrado.assunto)
                .gte('enviado_em', tempoInicio.toISOString())
                .lte('enviado_em', tempoFim.toISOString())
            }
            
            const { data: logsRelacionados } = await queryRelacionados
            
            if (logsRelacionados && logsRelacionados.length > 0) {
              // Combinar logs, removendo duplicatas
              const idsExistentes = new Set(logsComRelacionados.map((l: EmailLog) => l.id))
              const novosLogs = logsRelacionados.filter((l: EmailLog) => !idsExistentes.has(l.id))
              logsComRelacionados = [...logsComRelacionados, ...novosLogs]
              
              // Ordenar por data de envio (mais recente primeiro)
              logsComRelacionados.sort((a: EmailLog, b: EmailLog) => 
                new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime()
              )
            }
          }
        }
        
        // Paginar no cliente
        const paginatedData = logsComRelacionados.slice(from, to + 1)
        logsFinais = paginatedData
        setLogs(paginatedData)
        setTotalPages(Math.ceil(logsComRelacionados.length / itemsPerPage))
      } else {
        // Paginação no servidor (já limitado aos últimos 500)
        query = query.range(from, to)
        const { data, error, count } = await query
        
        if (error) throw error
        
        logsFinais = data || []
        setLogs(data || [])
        const totalCount = Math.min(count || maxLogsDefault, maxLogsDefault)
        setTotalPages(Math.ceil(totalCount / itemsPerPage))
      }

      // Buscar status dos logs do SocketLabs relacionados para exibir na lista
      await buscarStatusSocketLabsRelacionados(logsFinais)
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      alert('Erro ao carregar logs de email')
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar status dos logs do SocketLabs relacionados
  const buscarStatusSocketLabsRelacionados = async (logs: EmailLog[]) => {
    try {
      const statusMap: Record<string, { status: string; hasError: boolean }> = {}

      // Buscar status do SocketLabs para cada log que tem orcamento_id e hotsite_id
      for (const log of logs) {
        if (getLogType(log) === 'email') {
          const orcamentoId = log.orcamento_id || (log.orcamentos as any)?.id
          const hotsiteId = log.hotsite_id || (log.hotsites as any)?.id

          if (orcamentoId && hotsiteId) {
            // Buscar log do SocketLabs relacionado
            const { data: socketLabsLog } = await supabase
              .from('email_tracking')
              .select('metadata')
              .eq('tipo_email', 'email_enviado')
              .eq('orcamento_id', orcamentoId)
              .eq('hotsite_id', hotsiteId)
              .maybeSingle()

            if (socketLabsLog) {
              const status = socketLabsLog.metadata?.status_envio || 'desconhecido'
              statusMap[log.id] = {
                status,
                hasError: status === 'erro'
              }
            }
          } else {
            // Tentar buscar por email e assunto se não tiver IDs
            const tempoEnvio = new Date(log.enviado_em)
            const tempoInicio = new Date(tempoEnvio.getTime() - 5 * 60 * 1000)
            const tempoFim = new Date(tempoEnvio.getTime() + 5 * 60 * 1000)

            const { data: socketLabsLog } = await supabase
              .from('email_tracking')
              .select('metadata')
              .eq('tipo_email', 'email_enviado')
              .eq('email_destinatario', log.email_destinatario)
              .eq('assunto', log.assunto)
              .gte('enviado_em', tempoInicio.toISOString())
              .lte('enviado_em', tempoFim.toISOString())
              .maybeSingle()

            if (socketLabsLog) {
              const status = socketLabsLog.metadata?.status_envio || 'desconhecido'
              statusMap[log.id] = {
                status,
                hasError: status === 'erro'
              }
            }
          }
        }
      }

      setSocketLabsStatusMap(statusMap)
    } catch (error) {
      console.error('Erro ao buscar status do SocketLabs:', error)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [page, filterStatus, filterProvider, searchTerm])

  // Buscar log do SocketLabs relacionado quando um "Detalhe do Email" for selecionado
  useEffect(() => {
    const buscarLogSocketLabsRelacionado = async () => {
      if (!selectedLog) {
        setRelatedSocketLabsLog(null)
        return
      }

      // Só buscar se for um "Detalhe do Email" (não SocketLabs)
      if (getLogType(selectedLog) === 'socketlabs') {
        setRelatedSocketLabsLog(null)
        return
      }

      setLoadingRelatedLog(true)
      try {
        let queryRelacionados = supabase
          .from('email_tracking')
          .select(`
            *,
            orcamentos(*),
            hotsites(*)
          `)
          .eq('tipo_email', 'email_enviado') // Logs do SocketLabs têm tipo_email = 'email_enviado'
          .order('enviado_em', { ascending: false })
          .limit(1)

        // Tentar buscar por orcamento_id + hotsite_id primeiro
        const orcamentoId = selectedLog.orcamento_id || (selectedLog.orcamentos as any)?.id
        const hotsiteId = selectedLog.hotsite_id || (selectedLog.hotsites as any)?.id

        console.log('🔍 [Buscar SocketLabs] Buscando log relacionado:', { orcamentoId, hotsiteId, email: selectedLog.email_destinatario, assunto: selectedLog.assunto })

        if (orcamentoId && hotsiteId) {
          queryRelacionados = queryRelacionados
            .eq('orcamento_id', orcamentoId)
            .eq('hotsite_id', hotsiteId)
        } else {
          // Caso contrário, buscar por email_destinatario e assunto, e tempo próximo (5 minutos)
          const tempoEnvio = new Date(selectedLog.enviado_em)
          const tempoInicio = new Date(tempoEnvio.getTime() - 5 * 60 * 1000) // 5 minutos antes
          const tempoFim = new Date(tempoEnvio.getTime() + 5 * 60 * 1000) // 5 minutos depois

          queryRelacionados = queryRelacionados
            .eq('email_destinatario', selectedLog.email_destinatario)
            .eq('assunto', selectedLog.assunto)
            .gte('enviado_em', tempoInicio.toISOString())
            .lte('enviado_em', tempoFim.toISOString())
        }

        const { data: logsRelacionados, error: queryError } = await queryRelacionados

        if (queryError) {
          console.error('❌ [Buscar SocketLabs] Erro na query:', queryError)
        }

        console.log('📥 [Buscar SocketLabs] Logs encontrados:', logsRelacionados?.length || 0, logsRelacionados)

        if (logsRelacionados && logsRelacionados.length > 0) {
          const logEncontrado = logsRelacionados[0] as EmailLog
          console.log('✅ [Buscar SocketLabs] Log encontrado:', {
            codigo: logEncontrado.codigo_rastreamento,
            metadata: logEncontrado.metadata,
            response: logEncontrado.metadata?.response,
            messageId: logEncontrado.metadata?.messageId
          })
          setRelatedSocketLabsLog(logEncontrado)
        } else {
          console.log('⚠️ [Buscar SocketLabs] Nenhum log relacionado encontrado')
          setRelatedSocketLabsLog(null)
        }
      } catch (error) {
        console.error('❌ [Buscar SocketLabs] Erro ao buscar log do SocketLabs relacionado:', error)
        setRelatedSocketLabsLog(null)
      } finally {
        setLoadingRelatedLog(false)
      }
    }

    buscarLogSocketLabsRelacionado()
  }, [selectedLog])

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'erro':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'enviando':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <Mail className="w-5 h-5 text-gray-600" />
    }
  }

  // Função para identificar o tipo de log
  const getLogType = (log: EmailLog): 'email' | 'socketlabs' => {
    // Log do SocketLabs: tipo_email === 'email_enviado' ou código começa com 'SENT-'
    if (log.tipo_email === 'email_enviado' || log.codigo_rastreamento.startsWith('SENT-')) {
      return 'socketlabs'
    }
    // Log do nosso sistema: tem HTML completo ou código começa com 'MT-' ou 'ERROR-'
    return 'email'
  }

  const getStatusBadge = (status?: string, log?: EmailLog) => {
    // Se não tiver status, verificar o tipo de log
    if (!status && log) {
      const logType = getLogType(log)
      if (logType === 'socketlabs') {
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Log SocketLabs</span>
      } else {
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Detalhe do Email</span>
      }
    }

    switch (status) {
      case 'enviado':
        // Se for log do SocketLabs, mostrar "Log SocketLabs", senão "Enviado"
        if (log && getLogType(log) === 'socketlabs') {
          return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Log SocketLabs</span>
        }
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Enviado</span>
      case 'erro':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Erro</span>
      case 'enviando':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Enviando</span>
      default:
        // Se não tiver status, verificar o tipo de log
        if (log) {
          const logType = getLogType(log)
          if (logType === 'socketlabs') {
            return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Log SocketLabs</span>
          } else {
            return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Detalhe do Email</span>
          }
        }
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Desconhecido</span>
    }
  }

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

  const stats = {
    total: logs.length,
    enviados: logs.filter(l => l.metadata?.status_envio === 'enviado').length,
    erros: logs.filter(l => l.metadata?.status_envio === 'erro').length,
    testes: logs.filter(l => l.metadata?.modo_teste === true).length
  }

  const handleLimparTodos = async () => {
    if (!confirm('⚠️⚠️⚠️ ATENÇÃO ⚠️⚠️⚠️\n\nIsso irá deletar TODOS os logs de envio de emails.\n\nEsta ação é IRREVERSÍVEL!\n\nDeseja realmente continuar?')) {
      return
    }

    if (!confirm('Última confirmação: Você tem CERTEZA que deseja deletar TODOS os logs?\n\nEsta ação NÃO pode ser desfeita!')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin/emails/logs/limpar-todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao deletar logs')
      }

      alert(`✅ Todos os logs foram deletados com sucesso!\n\n- Logs removidos: ${data.detalhes.logs_removidos}`)
      loadLogs() // Recarregar a lista (que estará vazia agora)
    } catch (error: any) {
      alert(`❌ Erro ao deletar logs: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs de Emails</h1>
          <p className="text-gray-500 mt-1">
            Visualize os últimos 500 emails enviados. Use a busca para encontrar logs mais antigos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={handleLimparTodos}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Todos os Logs
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Enviados</p>
              <p className="text-2xl font-bold text-green-600">{stats.enviados}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Erros</p>
              <p className="text-2xl font-bold text-red-600">{stats.erros}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Testes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.testes}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Busca Rápida por Código */}
      {searchTerm && searchTerm.match(/^(ERROR|TEST|SENT)-/i) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-900">
              <strong>Busca por código de rastreamento:</strong> {searchTerm}
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setPage(1)
              }}
              className="ml-auto text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Limpar busca
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar por código (ex: ERROR-1764182790706-2B1X4PH), email ou assunto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* Filtro de Status */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as FilterStatus)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="todos">Todos os Status</option>
              <option value="enviado">Enviados</option>
              <option value="erro">Erros</option>
              <option value="teste">Testes</option>
            </select>
          </div>

          {/* Filtro de Provedor */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterProvider}
              onChange={(e) => {
                setFilterProvider(e.target.value as FilterProvider)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="todos">Todos os Provedores</option>
              <option value="socketlabs">SocketLabs</option>
              <option value="resend">Resend</option>
              <option value="sendgrid">SendGrid</option>
              <option value="nodemailer">Nodemailer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto lg:overflow-visible">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinatário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assunto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhum log encontrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isError = log.metadata?.status_envio === 'erro'
                  const isHighlighted = searchTerm && log.codigo_rastreamento.toUpperCase().includes(searchTerm.toUpperCase())
                  // Encurtar código para exibição (mostrar apenas últimos caracteres)
                  const codigoShort = log.codigo_rastreamento.length > 20 
                    ? '...' + log.codigo_rastreamento.slice(-17)
                    : log.codigo_rastreamento
                  
                  return (
                  <tr 
                    key={log.id} 
                    className={`hover:bg-gray-50 ${isError ? 'bg-red-50' : ''} ${isHighlighted ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.metadata?.status_envio)}
                          {getStatusBadge(log.metadata?.status_envio, log)}
                        </div>
                        {/* Status do SocketLabs relacionado */}
                        {getLogType(log) === 'email' && socketLabsStatusMap[log.id] && (
                          <div className="flex items-center gap-1 mt-1">
                            {socketLabsStatusMap[log.id].hasError ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded border border-red-200">
                                <AlertTriangle className="w-3 h-3" />
                                Erro SocketLabs
                              </span>
                            ) : socketLabsStatusMap[log.id].status === 'enviado' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Enviado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded border border-gray-200">
                                <Clock className="w-3 h-3" />
                                {socketLabsStatusMap[log.id].status}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <code 
                        className={`text-xs font-mono px-2 py-1 rounded ${isHighlighted ? 'bg-blue-200 text-blue-900 font-bold' : 'bg-gray-100 text-gray-900'}`}
                        title={log.codigo_rastreamento}
                      >
                        {codigoShort}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-[200px] truncate" title={log.email_destinatario || '-'}>
                      {log.email_destinatario || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-[250px] truncate" title={log.assunto || '-'}>
                      {log.assunto || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                      {formatDateTimeBR(log.enviado_em)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                          isError 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 font-semibold' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        {isError ? 'Erro' : 'Ver'}
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full h-[95vh] lg:h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {getLogType(selectedLog) === 'socketlabs' ? 'Log SocketLabs' : 'Detalhe do Email'}
              </h2>
              <button
                onClick={() => {
                  setSelectedLog(null)
                  setRelatedSocketLabsLog(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  {getStatusIcon(selectedLog.metadata?.status_envio)}
                  <div>
                    <p className="font-medium text-gray-900">Tipo de Log</p>
                    {getStatusBadge(selectedLog.metadata?.status_envio, selectedLog)}
                  </div>
                </div>

                {/* Informações Básicas do Email */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">📧 Informações do Email</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">De (From)</label>
                      <p className="text-gray-900 font-medium">
                        {selectedLog.metadata?.fromName && `${selectedLog.metadata.fromName} `}
                        &lt;{selectedLog.metadata?.from || selectedLog.email_destinatario || '-'}&gt;
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Para (To)</label>
                      <p className="text-gray-900 font-medium">
                        {selectedLog.metadata?.destinatario_original 
                          ? (Array.isArray(selectedLog.metadata.destinatario_original) 
                              ? selectedLog.metadata.destinatario_original.join(', ')
                              : selectedLog.metadata.destinatario_original)
                          : selectedLog.email_destinatario || '-'}
                      </p>
                      {selectedLog.metadata?.destinatario_redirecionado && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Redirecionado para: {selectedLog.metadata.destinatario_redirecionado} (Modo Teste)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Reply To</label>
                      <p className="text-gray-900 font-medium">{selectedLog.metadata?.replyTo || selectedLog.email_destinatario || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Assunto</label>
                      <p className="text-gray-900 font-medium">{selectedLog.assunto || selectedLog.metadata?.subject || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Provedor</label>
                      <p className="text-gray-900 font-medium">{selectedLog.metadata?.provider || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Data/Hora</label>
                      <p className="text-gray-900 font-medium">{formatDateTimeFullBR(selectedLog.enviado_em)}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Código de Rastreamento</label>
                      <p className="text-gray-900 font-mono text-sm bg-white px-2 py-1 rounded border border-gray-300">
                        {selectedLog.codigo_rastreamento}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase block mb-1">Tipo de Email</label>
                      <p className="text-gray-900 font-medium">{getTipoEmailLabel(selectedLog.tipo_email || 'email_enviado')}</p>
                    </div>
                  </div>
                </div>

                {/* Corpo do Email - HTML Completo */}
                {(selectedLog.metadata?.html_completo || selectedLog.metadata?.html_preview) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">📄 Corpo do Email (HTML)</h3>
                    <div className="space-y-4">
                      {/* Visualização HTML */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Visualização HTML</label>
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                          <div 
                            className="bg-white p-6 max-h-96 overflow-y-auto"
                            dangerouslySetInnerHTML={{ 
                              __html: selectedLog.metadata?.html_completo || selectedLog.metadata?.html_preview || '' 
                            }}
                          />
                        </div>
                      </div>
                      {/* Código HTML */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Código HTML Completo</label>
                        <pre className="text-xs text-gray-800 bg-gray-50 p-4 rounded border border-gray-300 overflow-x-auto max-h-96 overflow-y-auto font-mono whitespace-pre-wrap">
                          {selectedLog.metadata?.html_completo || selectedLog.metadata?.html_preview || 'HTML não disponível'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Erro Detalhado */}
                {selectedLog.metadata?.status_envio === 'erro' && (
                  <div className="border-t border-red-200 pt-4">
                    <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Detalhes do Erro
                    </h3>
                    
                    {/* Resumo do Erro */}
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedLog.metadata.provider && (
                          <div>
                            <span className="text-xs font-semibold text-red-900 uppercase">Provedor:</span>
                            <p className="text-sm text-red-800 font-medium mt-1">{selectedLog.metadata.provider}</p>
                          </div>
                        )}
                        {selectedLog.metadata.erro_codigo && (
                          <div>
                            <span className="text-xs font-semibold text-red-900 uppercase">Código do Erro:</span>
                            <code className="block mt-1 text-sm text-red-800 bg-red-100 px-2 py-1 rounded font-mono">
                              {selectedLog.metadata.erro_codigo}
                            </code>
                          </div>
                        )}
                      </div>
                      {selectedLog.metadata.erro_mensagem && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <span className="text-xs font-semibold text-red-900 uppercase block mb-2">Mensagem de Erro:</span>
                          <p className="text-base text-red-900 font-medium bg-white p-3 rounded border border-red-200">
                            {selectedLog.metadata.erro_mensagem}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Análise do Erro */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-2">💡 Possíveis Causas:</h4>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        {selectedLog.metadata.erro_mensagem?.toLowerCase().includes('authentication') && (
                          <li>Credenciais inválidas (API Key ou Server ID incorretos)</li>
                        )}
                        {selectedLog.metadata.erro_mensagem?.toLowerCase().includes('unauthorized') && (
                          <li>API Key não autorizada ou expirada</li>
                        )}
                        {selectedLog.metadata.erro_mensagem?.toLowerCase().includes('invalid') && (
                          <li>Dados inválidos (email, formato, etc.)</li>
                        )}
                        {selectedLog.metadata.erro_mensagem?.toLowerCase().includes('rate limit') && (
                          <li>Limite de envio excedido - aguarde alguns minutos</li>
                        )}
                        {selectedLog.metadata.erro_mensagem?.toLowerCase().includes('network') && (
                          <li>Problema de conexão com o provedor</li>
                        )}
                        {selectedLog.metadata.provider === 'socketlabs' && (
                          <li>Verifique se o Server ID e API Key estão corretos no SocketLabs</li>
                        )}
                        {!selectedLog.metadata.erro_mensagem?.toLowerCase().includes('authentication') && 
                         !selectedLog.metadata.erro_mensagem?.toLowerCase().includes('unauthorized') && 
                         !selectedLog.metadata.erro_mensagem?.toLowerCase().includes('invalid') && (
                          <li>Erro desconhecido - verifique os detalhes completos abaixo</li>
                        )}
                      </ul>
                    </div>

                    {/* Detalhes Técnicos */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                      {selectedLog.metadata.erro_stack && (
                        <div>
                          <span className="text-sm font-medium text-red-900 block mb-2">Stack Trace:</span>
                          <pre className="text-xs text-red-800 bg-red-100 p-3 rounded overflow-x-auto font-mono max-h-40 overflow-y-auto">
                            {selectedLog.metadata.erro_stack}
                          </pre>
                        </div>
                      )}
                      {selectedLog.metadata.erro_completo && (
                        <div>
                          <span className="text-sm font-medium text-red-900 block mb-2">Erro Completo (JSON):</span>
                          <pre className="text-xs text-red-800 bg-red-100 p-3 rounded overflow-x-auto font-mono max-h-60 overflow-y-auto">
                            {JSON.stringify(selectedLog.metadata.erro_completo, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resposta do Provedor (Sucesso) - Para logs do SocketLabs */}
                {getLogType(selectedLog) === 'socketlabs' && selectedLog.metadata?.status_envio === 'enviado' && selectedLog.metadata?.response && (
                  <div className="border-t border-purple-200 pt-4">
                    <h3 className="font-medium text-purple-900 mb-2">📋 Recibo da Transação SocketLabs</h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="space-y-2 mb-3">
                        {selectedLog.metadata.response.transactionReceipt && (
                          <div>
                            <span className="text-xs font-semibold text-purple-700">Transaction Receipt:</span>
                            <p className="text-sm font-mono text-purple-900 bg-white px-2 py-1 rounded border border-purple-300 mt-1">
                              {selectedLog.metadata.response.transactionReceipt}
                            </p>
                          </div>
                        )}
                        {selectedLog.metadata.response.messageId && (
                          <div>
                            <span className="text-xs font-semibold text-purple-700">Message ID:</span>
                            <p className="text-sm font-mono text-purple-900 bg-white px-2 py-1 rounded border border-purple-300 mt-1">
                              {selectedLog.metadata.response.messageId}
                            </p>
                          </div>
                        )}
                      </div>
                      <details className="mt-3">
                        <summary className="text-xs font-medium text-purple-700 cursor-pointer hover:text-purple-900">
                          Ver Resposta Completa (JSON)
                        </summary>
                        <pre className="text-xs text-purple-800 font-mono overflow-x-auto mt-2 bg-white p-3 rounded border border-purple-300">
                          {JSON.stringify(selectedLog.metadata.response, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}

                {/* Informações do SocketLabs Relacionado - Quando visualizar "Detalhe do Email" */}
                {getLogType(selectedLog) === 'email' && (
                  <div className="border-t border-purple-200 pt-4">
                    <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                      📋 Log SocketLabs Relacionado
                      {loadingRelatedLog && <Clock className="w-4 h-4 animate-spin text-purple-600" />}
                    </h3>
                    {loadingRelatedLog ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-purple-700">Buscando log do SocketLabs relacionado...</p>
                      </div>
                    ) : relatedSocketLabsLog ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="space-y-4">
                          {/* Informações Básicas */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">Código do Log SocketLabs:</span>
                              <p className="text-sm font-mono text-purple-900 bg-white px-2 py-1 rounded border border-purple-300 break-all">
                                {relatedSocketLabsLog.codigo_rastreamento}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">Data/Hora:</span>
                              <p className="text-sm text-purple-900 bg-white px-2 py-1 rounded border border-purple-300">
                                {formatDateTimeFullBR(relatedSocketLabsLog.enviado_em)}
                              </p>
                            </div>
                          </div>

                          {/* Informações do Email */}
                          <div className="border-t border-purple-200 pt-3">
                            <h4 className="text-sm font-semibold text-purple-900 mb-2">📧 Informações do Email</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {relatedSocketLabsLog.metadata?.from && (
                                <div>
                                  <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">De (From):</span>
                                  <p className="text-purple-900 bg-white px-2 py-1 rounded border border-purple-300">
                                    {relatedSocketLabsLog.metadata.fromName && `${relatedSocketLabsLog.metadata.fromName} `}
                                    &lt;{relatedSocketLabsLog.metadata.from}&gt;
                                  </p>
                                </div>
                              )}
                              {relatedSocketLabsLog.email_destinatario && (
                                <div>
                                  <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">Para (To):</span>
                                  <p className="text-purple-900 bg-white px-2 py-1 rounded border border-purple-300">
                                    {relatedSocketLabsLog.email_destinatario}
                                  </p>
                                </div>
                              )}
                              {relatedSocketLabsLog.metadata?.replyTo && (
                                <div>
                                  <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">Reply To:</span>
                                  <p className="text-purple-900 bg-white px-2 py-1 rounded border border-purple-300">
                                    {relatedSocketLabsLog.metadata.replyTo}
                                  </p>
                                </div>
                              )}
                              {relatedSocketLabsLog.metadata?.provider && (
                                <div>
                                  <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">Provedor:</span>
                                  <p className="text-purple-900 bg-white px-2 py-1 rounded border border-purple-300">
                                    {relatedSocketLabsLog.metadata.provider}
                                  </p>
                                </div>
                              )}
                              {relatedSocketLabsLog.metadata?.serverId && (
                                <div>
                                  <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">Server ID:</span>
                                  <p className="text-purple-900 bg-white px-2 py-1 rounded border border-purple-300">
                                    {relatedSocketLabsLog.metadata.serverId}
                                  </p>
                                </div>
                              )}
                              {relatedSocketLabsLog.assunto && (
                                <div className="md:col-span-2">
                                  <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">Assunto:</span>
                                  <p className="text-purple-900 bg-white px-2 py-1 rounded border border-purple-300">
                                    {relatedSocketLabsLog.assunto}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Recibo da Transação */}
                          <div className="border-t border-purple-200 pt-3">
                            <h4 className="text-sm font-semibold text-purple-900 mb-2">📋 Recibo da Transação SocketLabs</h4>
                            <div className="space-y-2">
                              {(relatedSocketLabsLog.metadata?.response?.transactionReceipt || relatedSocketLabsLog.metadata?.messageId) && (
                                <div>
                                  <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">Transaction Receipt:</span>
                                  <p className="text-sm font-mono text-purple-900 bg-white px-2 py-1 rounded border border-purple-300 break-all">
                                    {relatedSocketLabsLog.metadata?.response?.transactionReceipt || relatedSocketLabsLog.metadata?.messageId || 'N/A'}
                                  </p>
                                </div>
                              )}
                              {relatedSocketLabsLog.metadata?.response?.messageId && 
                               relatedSocketLabsLog.metadata?.response?.messageId !== relatedSocketLabsLog.metadata?.response?.transactionReceipt && (
                                <div>
                                  <span className="text-xs font-semibold text-purple-700 uppercase block mb-1">Message ID:</span>
                                  <p className="text-sm font-mono text-purple-900 bg-white px-2 py-1 rounded border border-purple-300 break-all">
                                    {relatedSocketLabsLog.metadata.response.messageId}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Metadata Completa (JSON) */}
                          <details className="mt-3">
                            <summary className="text-xs font-medium text-purple-700 cursor-pointer hover:text-purple-900">
                              Ver Metadata Completa (JSON)
                            </summary>
                            <pre className="text-xs text-purple-800 font-mono overflow-x-auto mt-2 bg-white p-3 rounded border border-purple-300 max-h-60 overflow-y-auto">
                              {JSON.stringify(relatedSocketLabsLog.metadata || {}, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600">Nenhum log do SocketLabs relacionado encontrado para este email.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Metadata Completa */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Metadata Completa</h3>
                  <pre className="text-xs text-gray-800 bg-gray-50 p-4 rounded overflow-x-auto font-mono max-h-60 overflow-y-auto">
                    {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                  </pre>
                </div>

                {/* Relacionamentos */}
                {(selectedLog.orcamentos || selectedLog.hotsites) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Relacionamentos</h3>
                    {selectedLog.orcamentos && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">Orçamento:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {selectedLog.orcamentos.codigo_orcamento || selectedLog.orcamentos.id}
                        </span>
                      </div>
                    )}
                    {selectedLog.hotsites && (
                      <div>
                        <span className="text-sm text-gray-500">Empresa:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {selectedLog.hotsites.nome_exibicao || selectedLog.hotsites.id}
                        </span>
                      </div>
                    )}
                  </div>
                )}
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

