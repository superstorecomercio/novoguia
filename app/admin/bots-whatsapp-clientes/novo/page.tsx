'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface ModeloBot {
  id: string
  nome: string
  descricao: string | null
}

export default function NovoBotClientePage() {
  const router = useRouter()
  const [modelos, setModelos] = useState<ModeloBot[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    numero_whatsapp: '',
    modelo_id: '',
    whatsapp_token: '',
    whatsapp_phone_id: '',
    verify_token: '',
    openai_api_key: '',
    supabase_url: '',
    supabase_service_key: '',
    email_notificacao: '',
    notificar_whatsapp: false,
    whatsapp_notificacao: '',
    ativo: true
  })

  useEffect(() => {
    loadModelos()
  }, [])

  async function loadModelos() {
    try {
      const response = await fetch('/api/admin/modelos-bots')
      if (!response.ok) throw new Error('Erro ao carregar modelos')
      const data = await response.json()
      setModelos(data.modelos || [])
    } catch (error: any) {
      console.error('Erro:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.nome || !formData.numero_whatsapp) {
      alert('Nome e número do WhatsApp são obrigatórios')
      return
    }

    if (!formData.modelo_id) {
      alert('Selecione um modelo')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin/bots-whatsapp-clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar bot')
      }

      const data = await response.json()
      alert('Bot cliente criado com sucesso!')
      router.push('/admin/bots-whatsapp-clientes')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/bots-whatsapp-clientes"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Bot Cliente</h1>
          <p className="text-gray-600 mt-1">Crie um novo bot para uma empresa cliente</p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Informações Básicas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Bot *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Bot Mudanças São Paulo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número WhatsApp *
              </label>
              <input
                type="text"
                value={formData.numero_whatsapp}
                onChange={(e) => setFormData({ ...formData, numero_whatsapp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="5511999999999"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo *
              </label>
              <select
                value={formData.modelo_id}
                onChange={(e) => setFormData({ ...formData, modelo_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione um modelo</option>
                {modelos.map((modelo) => (
                  <option key={modelo.id} value={modelo.id}>
                    {modelo.nome} {modelo.descricao && `- ${modelo.descricao}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                O modelo define as perguntas e fluxo conversacional do bot
              </p>
            </div>
          </div>
        </div>

        {/* Configurações WhatsApp */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Configurações WhatsApp Business API
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Token
              </label>
              <input
                type="password"
                value={formData.whatsapp_token}
                onChange={(e) => setFormData({ ...formData, whatsapp_token: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Token permanente do Facebook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone ID
              </label>
              <input
                type="text"
                value={formData.whatsapp_phone_id}
                onChange={(e) => setFormData({ ...formData, whatsapp_phone_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="871455159388695"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verify Token
              </label>
              <input
                type="text"
                value={formData.verify_token}
                onChange={(e) => setFormData({ ...formData, verify_token: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Token para verificação do webhook"
              />
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Notificações
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email para Notificações
              </label>
              <input
                type="email"
                value={formData.email_notificacao}
                onChange={(e) => setFormData({ ...formData, email_notificacao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="empresa@exemplo.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email que receberá notificações quando o bot receber contatos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notificar_whatsapp"
                checked={formData.notificar_whatsapp}
                onChange={(e) => setFormData({ ...formData, notificar_whatsapp: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="notificar_whatsapp" className="text-sm font-medium text-gray-700">
                Notificar também via WhatsApp
              </label>
            </div>
            {formData.notificar_whatsapp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número WhatsApp para Notificações
                </label>
                <input
                  type="text"
                  value={formData.whatsapp_notificacao}
                  onChange={(e) => setFormData({ ...formData, whatsapp_notificacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5511999999999"
                />
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link
            href="/admin/bots-whatsapp-clientes"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Criando...' : 'Criar Bot'}
          </button>
        </div>
      </form>
    </div>
  )
}


