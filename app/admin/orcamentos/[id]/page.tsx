import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, User, MapPin, Home, Package, Calendar, DollarSign, Mail, Phone, CheckCircle2, Clock, AlertTriangle, Building2, FileText, Truck, Send } from 'lucide-react'
import { notFound } from 'next/navigation'
import { formatDateTimeFullBR, formatDateOnlyBR } from '@/lib/utils/date'
import EnviarEmailManual from './EnviarEmailManual'

export const dynamic = 'force-dynamic'

interface Hotsite {
  id: string
  nome_exibicao: string
  email: string
  telefone1: string | null
  telefone2: string | null
  telefone3: string | null
  estado: string
  cidade: string
}

export default async function OrcamentoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  // Aguardar params no Next.js 15+
  const resolvedParams = await params
  const supabase = createServerClient()

  // Buscar orçamento (incluindo novos campos de endereço)
  const { data: orcamento, error } = await supabase
    .from('orcamentos')
    .select('*, cidade_origem, estado_origem, endereco_origem, cidade_destino, estado_destino, endereco_destino')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !orcamento) {
    notFound()
  }

  // Buscar hotsites relacionados via orcamentos_campanhas com status de envio
  const { data: hotsitesRelacionados } = await supabase
    .from('orcamentos_campanhas')
    .select(`
      id,
      respondido_em,
      created_at,
      status,
      status_envio_email,
      tentativas_envio,
      ultimo_erro_envio,
      hotsites (
        id,
        nome_exibicao,
        email,
        telefone1,
        telefone2,
        telefone3,
        estado,
        cidade
      )
    `)
    .eq('orcamento_id', resolvedParams.id)

  // Calcular status real baseado nos vínculos (mesma lógica da lista)
  let statusEnvioCalculado = orcamento.status_envio_email || 'na_fila'
  if (hotsitesRelacionados && hotsitesRelacionados.length > 0) {
    const naFilaCount = hotsitesRelacionados.filter((v: any) => v.status_envio_email === 'na_fila').length
    const enviadosCount = hotsitesRelacionados.filter((v: any) => v.status_envio_email === 'enviado').length
    const erroCount = hotsitesRelacionados.filter((v: any) => v.status_envio_email === 'erro').length
    const enviandoCount = hotsitesRelacionados.filter((v: any) => v.status_envio_email === 'enviando').length
    const totalVinculos = hotsitesRelacionados.length

    if (totalVinculos === 0) {
      // Se não há vínculos, verificar se não há empresas disponíveis
      if (orcamento.hotsites_notificados === 0) {
        statusEnvioCalculado = 'sem_empresas'
      } else {
        statusEnvioCalculado = orcamento.status_envio_email || 'na_fila'
      }
    } else if (enviadosCount === totalVinculos) {
      statusEnvioCalculado = 'enviado'
    } else if (erroCount > 0 && naFilaCount === 0 && enviadosCount === 0) {
      statusEnvioCalculado = 'erro'
    } else if (enviandoCount > 0) {
      statusEnvioCalculado = 'enviando'
    } else if (enviadosCount > 0 || erroCount > 0) {
      // Parcial: alguns enviados/erro, mas não todos
      statusEnvioCalculado = enviadosCount > erroCount ? 'enviado' : 'erro'
    } else {
      statusEnvioCalculado = 'na_fila'
    }
  } else {
    // Se não há vínculos, verificar se não há empresas disponíveis
    if (orcamento.hotsites_notificados === 0) {
      statusEnvioCalculado = 'sem_empresas'
    }
  }

  const statusEnvioColors = {
    na_fila: 'bg-orange-100 text-orange-800 border-orange-200',
    enviando: 'bg-blue-100 text-blue-800 border-blue-200',
    enviado: 'bg-green-100 text-green-800 border-green-200',
    erro: 'bg-red-100 text-red-800 border-red-200',
    sem_empresas: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const statusEnvioLabels = {
    na_fila: 'Na Fila de Envio',
    enviando: 'Enviando Emails',
    enviado: 'Emails Enviados',
    erro: 'Erro no Envio',
    sem_empresas: 'Sem Empresas Disponíveis'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orcamentos"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalhes do Orçamento</h1>
            {orcamento.codigo_orcamento && (
              <p className="text-gray-500 mt-1">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded font-mono">
                  {orcamento.codigo_orcamento}
                </span>
              </p>
            )}
            <p className="text-gray-500 mt-1 text-sm">ID: {resolvedParams.id.slice(0, 8)}...</p>
          </div>
        </div>
      </div>

      {/* Status de Envio */}
      <div className={`rounded-lg border-2 p-6 ${statusEnvioColors[statusEnvioCalculado as keyof typeof statusEnvioColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg">
            {statusEnvioCalculado === 'enviado' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : statusEnvioCalculado === 'erro' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {statusEnvioLabels[statusEnvioCalculado as keyof typeof statusEnvioLabels] || statusEnvioCalculado}
                </h3>
                <p className="text-sm mt-1">
                  {statusEnvioCalculado === 'na_fila' && 
                    'Este orçamento está aguardando envio automático de emails para as empresas.'
                  }
                  {statusEnvioCalculado === 'enviando' && 
                    'Emails estão sendo enviados para as empresas neste momento.'
                  }
                  {statusEnvioCalculado === 'enviado' && 
                    `Emails enviados com sucesso para ${hotsitesRelacionados?.filter((v: any) => v.status_envio_email === 'enviado').length || 0} de ${hotsitesRelacionados?.length || 0} hotsite(s).`
                  }
                  {statusEnvioCalculado === 'erro' && 
                    'Ocorreu um erro ao enviar os emails. O sistema tentará novamente.'
                  }
                  {statusEnvioCalculado === 'sem_empresas' && 
                    `Não há empresas ativas com campanhas no estado de destino (${orcamento.estado_destino || 'N/A'}). Este orçamento não pode ser enviado automaticamente.`
                  }
                </p>
                {orcamento.tentativas_envio > 0 && (
                  <p className="text-sm mt-2">
                    Tentativas de envio: {orcamento.tentativas_envio} de 3
                  </p>
                )}
                {orcamento.ultimo_erro_envio && (
                  <p className="text-sm mt-2 font-mono">
                    Último erro: {orcamento.ultimo_erro_envio}
                  </p>
                )}
              </div>
              <EnviarEmailManual orcamentoId={resolvedParams.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Análise Completa da IA - Destaque Principal */}
      {orcamento.mensagem_ia && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🤖 Análise Completa da Inteligência Artificial
          </h2>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="prose prose-base max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
              {orcamento.mensagem_ia}
            </div>
          </div>
        </div>
      )}

      {/* Estimativa de Preço - Compacta */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Estimativa de Preço
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600">Faixa Estimada</p>
            <p className="text-xl font-bold text-gray-900">
              R$ {orcamento.preco_min?.toLocaleString('pt-BR')} - R$ {orcamento.preco_max?.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Distância</p>
            <p className="text-lg font-semibold text-gray-900">{orcamento.distancia_km} km</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Cliente */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Dados do Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Nome</label>
                <p className="text-gray-900 font-medium">{orcamento.nome_cliente}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {orcamento.email_cliente}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">WhatsApp</label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {(() => {
                    const telefone = orcamento.whatsapp || orcamento.telefone_cliente || ''
                    if (!telefone) return 'Não informado'
                    const numeros = telefone.replace(/\D/g, '')
                    if (numeros.length === 10) {
                      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
                    } else if (numeros.length === 11) {
                      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
                    }
                    return telefone
                  })()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Data Desejada</label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {orcamento.data_estimada 
                    ? formatDateOnlyBR(orcamento.data_estimada)
                    : 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          {/* Dados da Mudança */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Dados da Mudança
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm text-gray-500">Origem</label>
                  <p className="text-gray-900 font-medium">
                    {orcamento.cidade_origem && orcamento.estado_origem 
                      ? `${orcamento.cidade_origem}, ${orcamento.estado_origem}`
                      : orcamento.origem_completo || 'Não informado'}
                  </p>
                </div>
                <div className="text-gray-400 text-xl">→</div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm text-gray-500">Destino</label>
                  <p className="text-gray-900 font-medium">
                    {orcamento.cidade_destino && orcamento.estado_destino 
                      ? `${orcamento.cidade_destino}, ${orcamento.estado_destino}`
                      : orcamento.destino_completo || 'Não informado'}
                  </p>
                </div>
                {orcamento.distancia_km != null && orcamento.distancia_km > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                    <p className="text-xs text-blue-700">Distância</p>
                    <p className="text-lg font-bold text-blue-900">{orcamento.distancia_km.toLocaleString('pt-BR')} km</p>
                  </div>
                )}
              </div>
              {/* Exibir endereço completo se houver endereço (rua, número) ou se origem_completo/destino_completo for diferente de cidade, estado */}
              {(() => {
                const temEnderecoOrigem = orcamento.endereco_origem || 
                  (orcamento.origem_completo && 
                   orcamento.cidade_origem && 
                   orcamento.estado_origem &&
                   orcamento.origem_completo.trim().toLowerCase() !== `${orcamento.cidade_origem}, ${orcamento.estado_origem}`.trim().toLowerCase());
                
                const temEnderecoDestino = orcamento.endereco_destino || 
                  (orcamento.destino_completo && 
                   orcamento.cidade_destino && 
                   orcamento.estado_destino &&
                   orcamento.destino_completo.trim().toLowerCase() !== `${orcamento.cidade_destino}, ${orcamento.estado_destino}`.trim().toLowerCase());
                
                if (temEnderecoOrigem || temEnderecoDestino) {
                  return (
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      {temEnderecoOrigem && (
                        <div>
                          <label className="text-xs text-gray-500">📍 Endereço Completo - Origem</label>
                          <p className="text-sm text-gray-700">
                            {orcamento.endereco_origem || orcamento.origem_completo}
                          </p>
                        </div>
                      )}
                      {temEnderecoDestino && (
                        <div>
                          <label className="text-xs text-gray-500">📍 Endereço Completo - Destino</label>
                          <p className="text-sm text-gray-700">
                            {orcamento.endereco_destino || orcamento.destino_completo}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Detalhes do Imóvel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Detalhes do Imóvel
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Tipo de Imóvel</label>
                <p className="text-gray-900 font-medium capitalize">
                  {orcamento.tipo_imovel?.replace('_', ' ')}
                </p>
              </div>
              {(orcamento as any).metragem && (
                <div>
                  <label className="text-sm text-gray-500">Metragem</label>
                  <p className="text-gray-900 font-medium">
                    {(() => {
                      const metragem = (orcamento as any).metragem
                      if (!metragem) return 'Não informado'
                      const num = typeof metragem === 'string' ? parseFloat(metragem) : metragem
                      if (isNaN(num) || num <= 0) return 'Não informado'
                      return `${num.toLocaleString('pt-BR')} m²`
                    })()}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500">Elevador</label>
                <p className="text-gray-900 font-medium">
                  {orcamento.tem_elevador ? 'Sim' : 'Não'}
                </p>
              </div>
              {!orcamento.tem_elevador && (
                <div>
                  <label className="text-sm text-gray-500">Andar</label>
                  <p className="text-gray-900 font-medium">{orcamento.andar}º</p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500">Precisa Embalagem</label>
                <p className="text-gray-900 font-medium">
                  {orcamento.precisa_embalagem ? 'Sim' : 'Não'}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Objetos - Destaque */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300 p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-700" />
              Lista de Objetos a Transportar
            </h2>
            {orcamento.lista_objetos ? (
              <>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                    {orcamento.lista_objetos}
                  </div>
                </div>
                {orcamento.arquivo_lista_url && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <a
                      href={orcamento.arquivo_lista_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      {orcamento.arquivo_lista_nome || 'Baixar arquivo anexado'}
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-gray-500 italic">Não enviado</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Hotsites Relacionados */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Hotsites Notificados ({orcamento.hotsites_notificados || 0})
            </h2>
            {hotsitesRelacionados && hotsitesRelacionados.length > 0 ? (
              <div className="space-y-3">
                {hotsitesRelacionados.map((rel: any) => {
                  const statusEnvio = rel.status_envio_email || 'na_fila'
                  const statusColors = {
                    na_fila: 'bg-orange-100 text-orange-800',
                    enviando: 'bg-blue-100 text-blue-800',
                    enviado: 'bg-green-100 text-green-800',
                    erro: 'bg-red-100 text-red-800'
                  }
                  const statusLabels = {
                    na_fila: 'Na Fila',
                    enviando: 'Enviando',
                    enviado: 'Enviado',
                    erro: 'Erro'
                  }
                  const statusIcons = {
                    na_fila: Clock,
                    enviando: Clock,
                    enviado: CheckCircle2,
                    erro: AlertTriangle
                  }
                  const StatusIcon = statusIcons[statusEnvio as keyof typeof statusIcons] || Clock
                  
                  return (
                    <div
                      key={rel.id || rel.hotsites.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {rel.hotsites.nome_exibicao === 'E-mail Manual' 
                              ? `E-mail Manual: ${rel.hotsites.email || 'N/A'}`
                              : rel.hotsites.nome_exibicao}
                          </p>
                          {rel.hotsites.nome_exibicao !== 'E-mail Manual' && (
                            <p className="text-xs text-gray-500 mt-1">
                              {rel.hotsites.cidade} - {rel.hotsites.estado}
                            </p>
                          )}
                          {rel.hotsites.email && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {rel.hotsites.email}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[statusEnvio as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusLabels[statusEnvio as keyof typeof statusLabels] || statusEnvio}
                          </span>
                          {rel.respondido_em && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              Respondeu
                            </div>
                          )}
                        </div>
                      </div>
                      {rel.ultimo_erro_envio && (
                        <p className="text-xs text-red-600 mt-2 font-mono">
                          Erro: {rel.ultimo_erro_envio}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum hotsite relacionado</p>
            )}
          </div>

          {/* Metadados */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Metadados</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-500">Criado em</label>
                <p className="text-gray-900 font-medium">
                  {formatDateTimeFullBR(orcamento.created_at)}
                </p>
              </div>
              <div>
                <label className="text-gray-500">Origem</label>
                <p className="text-gray-900 font-medium">
                  {orcamento.origem_formulario || 'calculadora'}
                </p>
              </div>
              {orcamento.ip_cliente && (
                <div>
                  <label className="text-gray-500">IP</label>
                  <p className="text-gray-900 font-medium font-mono text-xs">
                    {orcamento.ip_cliente}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

