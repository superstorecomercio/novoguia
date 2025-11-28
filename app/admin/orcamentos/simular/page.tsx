'use client'

import { useState } from 'react'
import { Play, Loader2, CheckCircle2, XCircle, ExternalLink, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SimularOrcamentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [erro, setErro] = useState<string | null>(null)
  
  // Campos do formulário
  const [formData, setFormData] = useState({
    nome: 'Cliente Teste',
    email: 'junior@guiademudancas.com.br',
    whatsapp: '5511999999999',
    origem: 'São Paulo, SP',
    destino: 'São Paulo, SP',
    estadoOrigem: 'SP',
    cidadeOrigem: 'São Paulo',
    estadoDestino: 'SP',
    cidadeDestino: 'São Paulo',
    tipoImovel: 'apartamento',
    temElevador: false,
    andar: 1,
    precisaEmbalagem: false,
    distanciaKm: 430,
    precoMin: 2500,
    precoMax: 5500,
    mensagemIA: 'Simulação de orçamento de mudança em São Paulo, SP.',
    listaObjetos: 'Sofá, mesa, geladeira, fogão',
    dataEstimada: '2026-01-15'
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSimular = async () => {
    setLoading(true)
    setErro(null)
    setResultado(null)

    try {
      const response = await fetch('/api/admin/orcamentos/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao simular orçamento')
      }

      setResultado(data)
    } catch (error: any) {
      setErro(error.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const copiarId = () => {
    if (resultado?.orcamento?.id) {
      navigator.clipboard.writeText(resultado.orcamento.id)
      alert('ID copiado!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Simular Criação de Orçamento</h1>
        <p className="text-gray-500 mt-1">
          Crie um orçamento de teste sem precisar usar o bot do WhatsApp
        </p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dados do Orçamento</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Dados do Cliente</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              type="text"
              value={formData.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5511999999999"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Estimada</label>
            <input
              type="date"
              value={formData.dataEstimada}
              onChange={(e) => handleChange('dataEstimada', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Origem e Destino */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Origem e Destino</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origem Completo</label>
            <input
              type="text"
              value={formData.origem}
              onChange={(e) => handleChange('origem', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destino Completo</label>
            <input
              type="text"
              value={formData.destino}
              onChange={(e) => handleChange('destino', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Origem</label>
            <input
              type="text"
              value={formData.estadoOrigem}
              onChange={(e) => handleChange('estadoOrigem', e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={2}
              placeholder="SP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade Origem</label>
            <input
              type="text"
              value={formData.cidadeOrigem}
              onChange={(e) => handleChange('cidadeOrigem', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Destino</label>
            <input
              type="text"
              value={formData.estadoDestino}
              onChange={(e) => handleChange('estadoDestino', e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={2}
              placeholder="RJ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade Destino</label>
            <input
              type="text"
              value={formData.cidadeDestino}
              onChange={(e) => handleChange('cidadeDestino', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Detalhes */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Detalhes da Mudança</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Imóvel</label>
            <select
              value={formData.tipoImovel}
              onChange={(e) => handleChange('tipoImovel', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distância (km)</label>
            <input
              type="number"
              value={formData.distanciaKm}
              onChange={(e) => handleChange('distanciaKm', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Mínimo (R$)</label>
            <input
              type="number"
              value={formData.precoMin}
              onChange={(e) => handleChange('precoMin', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Máximo (R$)</label>
            <input
              type="number"
              value={formData.precoMax}
              onChange={(e) => handleChange('precoMax', parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Lista de Objetos</label>
            <textarea
              value={formData.listaObjetos}
              onChange={(e) => handleChange('listaObjetos', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.temElevador}
                onChange={(e) => handleChange('temElevador', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Tem Elevador</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.precisaEmbalagem}
                onChange={(e) => handleChange('precisaEmbalagem', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Precisa Embalagem</span>
            </label>
          </div>
        </div>

        {/* Botão */}
        <div className="mt-6">
          <button
            onClick={handleSimular}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Simulando...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Simular Criação de Orçamento
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Orçamento Criado com Sucesso!
              </h3>
              <div className="space-y-2 text-sm text-green-800">
                <p>
                  <strong>ID do Orçamento:</strong>{' '}
                  <code className="bg-green-100 px-2 py-1 rounded font-mono">
                    {resultado.orcamento.id}
                  </code>
                  <button
                    onClick={copiarId}
                    className="ml-2 text-green-600 hover:text-green-800"
                    title="Copiar ID"
                  >
                    <Copy className="w-4 h-4 inline" />
                  </button>
                </p>
                <p>
                  <strong>Empresas Notificadas:</strong> {resultado.orcamento.hotsites_notificados}
                </p>
                <p>
                  <strong>Campanhas Vinculadas:</strong> {resultado.orcamento.campanhas_ids?.length || 0}
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <a
                  href={resultado.links.detalhes}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ver Detalhes
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={resultado.links.fila_emails}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fila de Emails
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={resultado.links.fila_emails_clientes}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Fila Emails Clientes
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao Simular</h3>
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

