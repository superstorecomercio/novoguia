import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle2, Clock, AlertTriangle, XCircle, Eye } from 'lucide-react'
import OrcamentosFilter from '@/app/components/admin/OrcamentosFilter'
import { Suspense } from 'react'
import { formatDateOnlyBR, formatTimeOnlyBR, formatDateTimeBR } from '@/lib/utils/date'

export const dynamic = 'force-dynamic'

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
  erro: 'bg-red-100 text-red-800'
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

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = createServerClient()

  // Construir query base
  let query = supabase
    .from('orcamentos')
    .select('*')

  // Aplicar filtros se houver
  const search = resolvedSearchParams?.search?.trim()
  const searchType = resolvedSearchParams?.type || 'nome'

  try {
    if (search) {
      if (searchType === 'nome') {
        query = query.ilike('nome_cliente', `%${search}%`)
      } else if (searchType === 'codigo') {
        query = query.ilike('codigo_orcamento', `%${search}%`)
      } else if (searchType === 'data') {
        // Tentar parsear a data em diferentes formatos
        let year: number | undefined, month: number | undefined, day: number | undefined
        
        // Formato DD/MM/AAAA ou DD-MM-AAAA
        const dateMatch = search.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
        if (dateMatch) {
          [, day, month, year] = dateMatch.map(Number)
        } else {
          // Tentar formato AAAA-MM-DD
          const isoMatch = search.match(/(\d{4})-(\d{2})-(\d{2})/)
          if (isoMatch) {
            [, year, month, day] = isoMatch.map(Number)
          } else {
            console.warn('Data inválida para busca:', search)
            // Não aplicar filtro se não conseguir parsear
          }
        }

        if (year !== undefined && month !== undefined && day !== undefined) {
          // Criar datas no timezone local e converter para UTC corretamente
          // Isso garante que 24/11 no Brasil seja buscado corretamente
          const startDate = new Date(year, month - 1, day, 0, 0, 0, 0)
          const endDate = new Date(year, month - 1, day, 23, 59, 59, 999)
          
          // Verificar se as datas são válidas
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn('Data inválida para busca:', search)
          } else {
            // Converter para ISO string (UTC)
            // O toISOString() já faz a conversão correta considerando o timezone local
            const startISO = startDate.toISOString()
            const endISO = endDate.toISOString()
            
            // Filtrar por created_at (data que o orçamento foi criado/enviado)
            query = query
              .gte('created_at', startISO)
              .lte('created_at', endISO)
          }
        }
      }
    }

    // Buscar orçamentos
    const { data: orcamentos, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    // Se não houver dados, retornar array vazio
    const orcamentosData = orcamentos || []

    if (error) {
      console.error('Erro ao buscar orçamentos:', error)
      // Continuar mesmo com erro, retornando array vazio
    }

    // Estatísticas
    const total = orcamentosData.length
    const naFila = orcamentosData.filter((o: Orcamento) => o.status_envio_email === 'na_fila').length
    const enviados = orcamentosData.filter((o: Orcamento) => o.status_envio_email === 'enviado').length
    const comErro = orcamentosData.filter((o: Orcamento) => o.status_envio_email === 'erro').length

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orçamentos</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Gerencie todos os orçamentos recebidos</p>
          </div>
        </div>

        {/* Filtro de Pesquisa */}
        <Suspense fallback={<div className="bg-white rounded-lg border border-gray-200 p-4">Carregando filtro...</div>}>
          <OrcamentosFilter />
        </Suspense>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                {orcamentosData && orcamentosData.length > 0 ? (
                  orcamentosData.map((orcamento: Orcamento) => (
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
                      {orcamento.distancia_km && (
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {orcamento.distancia_km} km
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
      </div>

      {/* Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {orcamentosData && orcamentosData.length > 0 ? (
          orcamentosData.map((orcamento: Orcamento) => (
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
                  {orcamento.distancia_km && (
                    <p className="text-xs text-gray-500 mt-1">📍 {orcamento.distancia_km} km</p>
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
  } catch (error) {
    console.error('Erro ao carregar orçamentos:', error)
    // Retornar página com erro
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Gerencie todos os orçamentos recebidos</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erro ao carregar orçamentos. Por favor, tente novamente.</p>
        </div>
      </div>
    )
  }
}

