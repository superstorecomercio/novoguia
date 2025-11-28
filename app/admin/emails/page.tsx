'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { CheckCircle2, Clock, AlertTriangle, XCircle, Mail, RefreshCw, Send, Search, ChevronDown, ChevronUp, Building2, Eye, X, Layers } from 'lucide-react'
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

// Interface para emails individuais (desagrupados)
interface EmailIndividual {
  id: string // ID do vínculo orcamentos_campanhas
  orcamento_id: string
  codigo_orcamento?: string
  nome_cliente: string
  email_cliente: string
  origem_completo: string
  destino_completo: string
  created_at: string
  // Dados da empresa
  empresa_id: string
  empresa_nome: string
  empresa_email: string
  status_envio_email: string
  tentativas_envio: number
  ultimo_erro_envio?: string
  email_enviado_em?: string
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
type ViewMode = 'agrupado' | 'individual'

export default function EmailsPage() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoEmail[]>([]) // Lista filtrada para exibição
  const [orcamentosCompletos, setOrcamentosCompletos] = useState<OrcamentoEmail[]>([]) // Lista completa para estatísticas
  const [emailsIndividuais, setEmailsIndividuais] = useState<EmailIndividual[]>([]) // Lista filtrada para exibição
  const [todosEmailsIndividuais, setTodosEmailsIndividuais] = useState<EmailIndividual[]>([]) // Lista completa para estatísticas
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('todos')
  const [viewMode, setViewMode] = useState<ViewMode>('agrupado') // Modo de visualização
  const [searchTerm, setSearchTerm] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50 // Limite de itens por página
  const [expandedOrcamentos, setExpandedOrcamentos] = useState<Set<string>>(new Set())
  const [previewEmail, setPreviewEmail] = useState<{
    assunto: string
    html: string
    texto: string
    codigo_rastreamento: string
    destinatario: string
    empresa: string
  } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'html' | 'texto'>('html')

  const supabase = getSupabase()

  const fetchOrcamentos = async () => {
    try {
      setLoading(true)
      
      // Buscar orçamentos com empresas relacionadas
      // EXCLUIR orçamentos sem empresas (status_envio_email = 'sem_empresas')
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
          status_envio_email,
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
        .neq('status_envio_email', 'sem_empresas') // Excluir orçamentos sem empresas
        .order('created_at', { ascending: false })
        .limit(200)

      if (searchTerm) {
        query = query.or(`nome_cliente.ilike.%${searchTerm}%,email_cliente.ilike.%${searchTerm}%,codigo_orcamento.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Processar dados e calcular resumo
      const orcamentosProcessados: OrcamentoEmail[] = (data || []).map((orc: any) => {
        const empresas: EmpresaEnvio[] = (orc.orcamentos_campanhas || []).map((oc: any) => {
          // Se status_envio_email for null/undefined, considerar como 'na_fila'
          // Mas apenas se realmente não houver status definido
          const status = oc.status_envio_email || 'na_fila'
          
          // Identificar se é email manual (nome começa com "E-mail Manual:")
          const nomeHotsite = oc.hotsites?.nome_exibicao || 'N/A'
          const isEmailManual = nomeHotsite.startsWith('E-mail Manual:')
          
          return {
            id: oc.id,
            hotsite_id: oc.hotsite_id,
            hotsite_nome: isEmailManual ? nomeHotsite : (oc.hotsites?.nome_exibicao || 'N/A'),
            hotsite_email: oc.hotsites?.email || 'N/A',
            status_envio_email: status,
            tentativas_envio: oc.tentativas_envio || 0,
            ultimo_erro_envio: oc.ultimo_erro_envio,
            email_enviado_em: oc.email_enviado_em
          }
        })

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

      // Criar lista de emails individuais (desagrupados) - TODOS os emails
      const todosEmailsIndividuais: EmailIndividual[] = []
      orcamentosProcessados.forEach(orc => {
        orc.empresas.forEach(empresa => {
          todosEmailsIndividuais.push({
            id: empresa.id,
            orcamento_id: orc.id,
            codigo_orcamento: orc.codigo_orcamento,
            nome_cliente: orc.nome_cliente,
            email_cliente: orc.email_cliente,
            origem_completo: orc.origem_completo,
            destino_completo: orc.destino_completo,
            created_at: orc.created_at,
            empresa_id: empresa.hotsite_id,
            empresa_nome: empresa.hotsite_nome,
            empresa_email: empresa.hotsite_email,
            status_envio_email: empresa.status_envio_email,
            tentativas_envio: empresa.tentativas_envio,
            ultimo_erro_envio: empresa.ultimo_erro_envio,
            email_enviado_em: empresa.email_enviado_em
          })
        })
      })

      // Filtrar emails individuais por tab (para modo individual)
      let filteredEmails: EmailIndividual[] = todosEmailsIndividuais
      if (activeTab === 'na_fila') {
        filteredEmails = todosEmailsIndividuais.filter(e => e.status_envio_email === 'na_fila')
      } else if (activeTab === 'enviado') {
        filteredEmails = todosEmailsIndividuais.filter(e => e.status_envio_email === 'enviado')
      } else if (activeTab === 'erro') {
        filteredEmails = todosEmailsIndividuais.filter(e => e.status_envio_email === 'erro')
      } else if (activeTab === 'parcial') {
        // Para parcial, precisamos verificar o orçamento completo
        const orcamentosComParcial = orcamentosProcessados.filter(o => 
          o.resumo.enviados > 0 && 
          o.resumo.enviados < o.resumo.total &&
          !o.resumo.todas_enviadas
        )
        const orcamentosIds = new Set(orcamentosComParcial.map(o => o.id))
        filteredEmails = todosEmailsIndividuais.filter(e => orcamentosIds.has(e.orcamento_id))
      } else if (activeTab === 'todos') {
        // Todos os emails individuais
        filteredEmails = todosEmailsIndividuais
      }

      // Filtrar orçamentos agrupados por tab (para modo agrupado)
      // EXCLUIR orçamentos sem empresas (total === 0)
      let filtered = orcamentosProcessados.filter(o => o.resumo.total > 0)
      if (activeTab === 'na_fila') {
        filtered = orcamentosProcessados.filter(o => o.resumo.total > 0 && o.resumo.na_fila > 0)
      } else if (activeTab === 'enviado') {
        filtered = orcamentosProcessados.filter(o => o.resumo.total > 0 && o.resumo.todas_enviadas)
      } else if (activeTab === 'erro') {
        filtered = orcamentosProcessados.filter(o => o.resumo.total > 0 && o.resumo.com_erro > 0)
      } else if (activeTab === 'parcial') {
        filtered = orcamentosProcessados.filter(o => 
          o.resumo.total > 0 &&
          o.resumo.enviados > 0 && 
          o.resumo.enviados < o.resumo.total &&
          !o.resumo.todas_enviadas
        )
      } else if (activeTab === 'todos') {
        // Todos os orçamentos (mas excluir os sem empresas)
        filtered = orcamentosProcessados.filter(o => o.resumo.total > 0)
      }

      // IMPORTANTE: Salvar as listas completas e filtradas separadamente
      setOrcamentos(filtered) // Lista filtrada para exibição
      setOrcamentosCompletos(orcamentosProcessados) // Lista completa para estatísticas
      setEmailsIndividuais(filteredEmails) // Lista filtrada para exibição
      setTodosEmailsIndividuais(todosEmailsIndividuais) // Lista completa para estatísticas
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrcamentos()
    setCurrentPage(1) // Resetar página ao mudar filtro
  }, [activeTab, searchTerm, viewMode])

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
      console.log('🔄 [Frontend] Recolocando na fila:', { orcamentoId, empresaId })
      
      const response = await fetch('/api/admin/emails/recolocar-fila', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orcamentoId, empresaId })
      })

      const data = await response.json()
      console.log('📥 [Frontend] Resposta da API:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao recolocar na fila')
      }

      alert(data.message || 'Orçamento recolocado na fila com sucesso!')
      fetchOrcamentos()
    } catch (error: any) {
      console.error('❌ [Frontend] Erro ao recolocar na fila:', error)
      alert(`Erro ao recolocar na fila: ${error.message}`)
    } finally {
      setProcessing(null)
    }
  }

  const handlePreviewEmail = async (orcamentoId: string, empresaId: string) => {
    try {
      setLoadingPreview(`${orcamentoId}-${empresaId}`)
      const response = await fetch('/api/admin/emails/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orcamentoId, empresaId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar preview')
      }

      setPreviewEmail({
        assunto: data.assunto,
        html: data.html,
        texto: data.texto || 'Erro ao converter HTML para texto',
        codigo_rastreamento: data.codigo_rastreamento || 'N/A',
        destinatario: data.destinatario,
        empresa: data.empresa
      })
    } catch (error: any) {
      alert(`Erro ao visualizar email: ${error.message}`)
    } finally {
      setLoadingPreview(null)
    }
  }

  // Estatísticas: Modo agrupado mostra orçamentos, modo individual mostra emails
  // IMPORTANTE: Usar listas COMPLETAS para calcular estatísticas, não as filtradas
  const stats = {
    todos: viewMode === 'agrupado' 
      ? orcamentosCompletos.length 
      : todosEmailsIndividuais.length,
    na_fila: viewMode === 'agrupado'
      ? orcamentosCompletos.filter(o => o.resumo.na_fila > 0).length
      : todosEmailsIndividuais.filter(e => e.status_envio_email === 'na_fila').length,
    enviado: viewMode === 'agrupado'
      ? orcamentosCompletos.filter(o => o.resumo.todas_enviadas).length
      : todosEmailsIndividuais.filter(e => e.status_envio_email === 'enviado').length,
    erro: viewMode === 'agrupado'
      ? orcamentosCompletos.filter(o => o.resumo.com_erro > 0).length
      : todosEmailsIndividuais.filter(e => e.status_envio_email === 'erro').length,
    parcial: viewMode === 'agrupado'
      ? orcamentosCompletos.filter(o => 
          o.resumo.enviados > 0 && 
          o.resumo.enviados < o.resumo.total &&
          !o.resumo.todas_enviadas
        ).length
      : todosEmailsIndividuais.filter(e => {
          // Encontrar o orçamento deste email na lista completa
          const orc = orcamentosCompletos.find(o => o.id === e.orcamento_id)
          if (!orc) return false
          // Verificar se o orçamento é parcial (alguns enviados, mas não todos)
          return orc.resumo.enviados > 0 && 
                 orc.resumo.enviados < orc.resumo.total &&
                 !orc.resumo.todas_enviadas
        }).length
  }
  
  // Paginação - limitar a 50 itens por página
  const getPaginatedEmails = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return emailsIndividuais.slice(startIndex, endIndex)
  }
  
  const getPaginatedOrcamentos = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return orcamentos.slice(startIndex, endIndex)
  }
  
  const totalPagesEmails = Math.ceil(emailsIndividuais.length / itemsPerPage)
  const totalPagesOrcamentos = Math.ceil(orcamentos.length / itemsPerPage)

  const tabs: { id: TabType; label: string; count: number; description: string }[] = [
    { 
      id: 'todos', 
      label: 'Todos', 
      count: stats.todos,
      description: viewMode === 'agrupado' ? 'Agrupado por Orçamento' : 'Todos os Emails'
    },
    { 
      id: 'na_fila', 
      label: 'Na Fila', 
      count: stats.na_fila,
      description: viewMode === 'agrupado' ? 'Agrupado por Orçamento' : 'Emails Individuais'
    },
    { 
      id: 'parcial', 
      label: 'Parcial', 
      count: stats.parcial,
      description: viewMode === 'agrupado' ? 'Agrupado por Orçamento' : 'Emails Individuais'
    },
    { 
      id: 'enviado', 
      label: 'Todos Enviados', 
      count: stats.enviado,
      description: viewMode === 'agrupado' ? 'Agrupado por Orçamento' : 'Emails Individuais'
    },
    { 
      id: 'erro', 
      label: 'Com Erro', 
      count: stats.erro,
      description: viewMode === 'agrupado' ? 'Agrupado por Orçamento' : 'Emails Individuais'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Envio de Emails</h1>
          <p className="text-gray-500 mt-1">Gerencie o envio de emails por empresa</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={async () => {
              if (!confirm('⚠️ ATENÇÃO: Isso irá resetar TODOS os dados de envio de emails para o estado inicial (na_fila).\n\nDeseja continuar?')) {
                return
              }
              
              const limparLogs = confirm('Deseja também limpar os logs de email_tracking?')
              
              try {
                const response = await fetch('/api/admin/emails/limpar-dados', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ limparLogs })
                })
                
                const data = await response.json()
                
                if (!response.ok) {
                  throw new Error(data.error || 'Erro ao limpar dados')
                }
                
                alert(`✅ Dados resetados com sucesso!\n\n- Registros resetados: ${data.detalhes.registros_resetados}\n${limparLogs ? `- Logs removidos: ${data.detalhes.logs_removidos}` : ''}`)
                fetchOrcamentos()
              } catch (error: any) {
                alert(`❌ Erro ao limpar dados: ${error.message}`)
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Limpar Dados de Envio
          </button>
          <button
            onClick={async () => {
              if (!confirm('⚠️⚠️⚠️ ATENÇÃO CRÍTICA ⚠️⚠️⚠️\n\nIsso irá:\n1. Limpar TODOS os logs de email\n2. Resetar TODOS os dados de envio\n3. DELETAR TODOS OS ORÇAMENTOS\n\nEsta ação é IRREVERSÍVEL!\n\nDeseja realmente continuar?')) {
                return
              }
              
              if (!confirm('Última confirmação: Você tem CERTEZA que deseja deletar TODOS os orçamentos?\n\nEsta ação NÃO pode ser desfeita!')) {
                return
              }
              
              try {
                const response = await fetch('/api/admin/emails/limpar-tudo', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                })
                
                const data = await response.json()
                
                if (!data.success && data.detalhes?.erros?.length > 0) {
                  const mensagemErros = data.detalhes.erros.join('\n')
                  alert(`⚠️ Limpeza concluída com alguns erros:\n\n${mensagemErros}\n\nResultados:\n- Logs removidos: ${data.detalhes.logs_removidos}\n- Registros resetados: ${data.detalhes.registros_resetados}\n- Orçamentos removidos: ${data.detalhes.orcamentos_removidos}`)
                } else if (!data.success) {
                  throw new Error(data.error || 'Erro ao limpar tudo')
                } else {
                  alert(`✅ Limpeza completa realizada com sucesso!\n\n- Logs removidos: ${data.detalhes.logs_removidos}\n- Registros resetados: ${data.detalhes.registros_resetados}\n- Orçamentos removidos: ${data.detalhes.orcamentos_removidos}`)
                }
                
                fetchOrcamentos()
              } catch (error: any) {
                alert(`❌ Erro ao limpar tudo: ${error.message}`)
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <XCircle className="w-4 h-4" />
            Limpar TUDO (Incluindo Orçamentos)
          </button>
          <Link
            href="/admin/emails/configuracao"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Mail className="w-4 h-4" />
            Configurar API
          </Link>
        </div>
      </div>

      {/* Toggle de Modo de Visualização */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Modo de Visualização</h3>
            <p className="text-xs text-gray-500 mt-1">
              Escolha como visualizar os emails: agrupados por orçamento ou individuais
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('agrupado')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'agrupado'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-4 h-4 inline-block mr-2" />
              Agrupado por Orçamento
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'individual'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail className="w-4 h-4 inline-block mr-2" />
              Individual (Sem Agrupamento)
            </button>
          </div>
        </div>
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{tab.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tab.description}</p>
              </div>
              <div className={`p-2 rounded-lg ${
                tab.id === 'na_fila' ? 'bg-orange-100' :
                tab.id === 'enviado' ? 'bg-green-100' :
                tab.id === 'erro' ? 'bg-red-100' :
                tab.id === 'parcial' ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                <Mail className={`w-5 h-5 ${
                  tab.id === 'na_fila' ? 'text-orange-600' :
                  tab.id === 'enviado' ? 'text-green-600' :
                  tab.id === 'erro' ? 'text-red-600' :
                  tab.id === 'parcial' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
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

      {/* Lista de Emails (Individual ou Agrupado) */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Clock className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : (viewMode === 'individual' && emailsIndividuais.length === 0) || (viewMode === 'agrupado' && orcamentos.length === 0) ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum registro encontrado</p>
        </div>
      ) : viewMode === 'individual' ? (
        /* Lista Individual - Cada email separado */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'todos' && 'Todos os Emails'}
                  {activeTab === 'na_fila' && 'Emails na Fila'}
                  {activeTab === 'enviado' && 'Emails Enviados'}
                  {activeTab === 'erro' && 'Emails com Erro'}
                  {activeTab === 'parcial' && 'Emails Parciais'}
                  {' '}({emailsIndividuais.length} total)
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Cada linha representa um email individual
                </p>
              </div>
              {totalPagesEmails > 1 && (
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPagesEmails} ({getPaginatedEmails().length} de {emailsIndividuais.length} emails)
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orçamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rota</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedEmails().map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {email.codigo_orcamento ? (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded font-mono">
                          {email.codigo_orcamento}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 font-mono">{email.orcamento_id.slice(0, 8)}...</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{email.nome_cliente}</div>
                      <div className="text-xs text-gray-500">{email.email_cliente}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{email.empresa_nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{email.empresa_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">
                        <div>{email.origem_completo}</div>
                        <div className="text-gray-400">↓</div>
                        <div>{email.destino_completo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreviewEmail(email.orcamento_id, email.id)}
                          disabled={loadingPreview === `${email.orcamento_id}-${email.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium disabled:opacity-50 hover:bg-gray-700"
                          title="Visualizar email"
                        >
                          <Eye className="w-3 h-3" />
                          {loadingPreview === `${email.orcamento_id}-${email.id}` ? '...' : 'Ver'}
                        </button>
                        <button
                          onClick={() => handleEnviarEmail(email.orcamento_id, email.id)}
                          disabled={processing === `${email.orcamento_id}-${email.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          Enviar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Paginação para emails individuais */}
          {totalPagesEmails > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, emailsIndividuais.length)} de {emailsIndividuais.length} emails
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
                  {currentPage} / {totalPagesEmails}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPagesEmails, p + 1))}
                  disabled={currentPage === totalPagesEmails}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {getPaginatedOrcamentos().map((orcamento) => {
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
                              onClick={() => {
                                const totalEmails = orcamento.resumo.na_fila + orcamento.resumo.com_erro
                                if (!confirm(`⚠️ ATENÇÃO\n\nVocê está prestes a enviar ${totalEmails} email(s) para ${orcamento.resumo.total} empresa(s) relacionadas a este orçamento.\n\nDeseja continuar?`)) {
                                  return
                                }
                                handleEnviarEmail(orcamento.id)
                              }}
                              disabled={processing?.startsWith(orcamento.id) || false}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              Enviar Todos
                            </button>
                          )}
                          {orcamento.resumo.todas_enviadas && (
                            <button
                              onClick={() => {
                                if (!confirm(`⚠️ ATENÇÃO\n\nVocê está prestes a recolocar ${orcamento.resumo.total} email(s) na fila de envio.\n\nIsso irá resetar o status de envio para todas as empresas deste orçamento.\n\nDeseja continuar?`)) {
                                  return
                                }
                                handleRecolocarFila(orcamento.id)
                              }}
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
                              <button
                                onClick={() => handlePreviewEmail(orcamento.id, empresa.id)}
                                disabled={loadingPreview === `${orcamento.id}-${empresa.id}`}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium disabled:opacity-50 hover:bg-gray-700"
                                title="Visualizar email"
                              >
                                <Eye className="w-3 h-3" />
                                {loadingPreview === `${orcamento.id}-${empresa.id}` ? '...' : 'Ver'}
                              </button>
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
          {/* Paginação para orçamentos agrupados */}
          {totalPagesOrcamentos > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, orcamentos.length)} de {orcamentos.length} orçamentos
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
                  {currentPage} / {totalPagesOrcamentos}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPagesOrcamentos, p + 1))}
                  disabled={currentPage === totalPagesOrcamentos}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Preview do Email */}
      {previewEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">Preview do Email</h2>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    <strong>Para:</strong> {previewEmail.destinatario} ({previewEmail.empresa})
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Assunto:</strong> {previewEmail.assunto}
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Código de Rastreamento:</p>
                    <code className="text-sm font-mono text-blue-700 bg-white px-2 py-1 rounded border border-blue-300">
                      {previewEmail.codigo_rastreamento}
                    </code>
                    <p className="text-xs text-blue-600 mt-1">
                      Este código será incluído no email para rastreamento
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Abas de Visualização */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setPreviewMode('html')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  previewMode === 'html'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Visualização HTML
              </button>
              <button
                onClick={() => setPreviewMode('texto')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  previewMode === 'texto'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Texto Puro (Sem HTML)
              </button>
            </div>

            {/* Conteúdo do Email */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {previewMode === 'html' ? (
                <div 
                  className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: previewEmail.html }}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                    {previewEmail.texto}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
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
