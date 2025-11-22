import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckCircle2, Clock, AlertTriangle, XCircle, Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Orcamento {
  id: string
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

export default async function OrcamentosPage() {
  const supabase = createServerClient()

  // Buscar orçamentos
  const { data: orcamentos, error } = await supabase
    .from('orcamentos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Erro ao buscar orçamentos:', error)
  }

  // Estatísticas
  const total = orcamentos?.length || 0
  const naFila = orcamentos?.filter(o => o.status_envio_email === 'na_fila').length || 0
  const enviados = orcamentos?.filter(o => o.status_envio_email === 'enviado').length || 0
  const comErro = orcamentos?.filter(o => o.status_envio_email === 'erro').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 mt-1">Gerencie todos os orçamentos recebidos</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Na Fila</p>
              <p className="text-2xl font-bold text-orange-600">{naFila}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Enviados</p>
              <p className="text-2xl font-bold text-green-600">{enviados}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Com Erro</p>
              <p className="text-2xl font-bold text-red-600">{comErro}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Envio Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotsites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orcamentos && orcamentos.length > 0 ? (
                orcamentos.map((orcamento: Orcamento) => (
                  <tr key={orcamento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {orcamento.nome_cliente}
                      </div>
                      <div className="text-sm text-gray-500">{orcamento.email_cliente}</div>
                      <div className="text-sm text-gray-500">{orcamento.whatsapp}</div>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {orcamento.tipo_imovel?.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {orcamento.preco_min?.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        R$ {orcamento.preco_max?.toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[orcamento.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[orcamento.status as keyof typeof statusLabels] || orcamento.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                        {orcamento.hotsites_notificados || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                      <div className="text-xs">
                        {new Date(orcamento.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/orcamentos/${orcamento.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
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

