'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, CheckCircle2, XCircle, Settings, Eye, EyeOff, FileCode } from 'lucide-react'

interface WhatsAppBot {
  id: string
  nome: string
  numero_whatsapp: string
  ativo: boolean
  whatsapp_token?: string
  whatsapp_phone_id?: string
  verify_token?: string
  openai_api_key?: string
  supabase_url?: string
  supabase_service_key?: string
  perguntas?: any
  mensagem_inicial?: string
  mensagem_final?: string
  mensagem_erro?: string
  palavras_ativacao?: string[]
  descricao?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export default function BotsWhatsAppPage() {
  const [bots, setBots] = useState<WhatsAppBot[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBot, setEditingBot] = useState<WhatsAppBot | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<WhatsAppBot>>({})
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [loadingBot, setLoadingBot] = useState(false)

  useEffect(() => {
    loadBots()
  }, [])

  async function loadBots() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/bots-whatsapp')
      if (!response.ok) throw new Error('Erro ao carregar bots')
      const data = await response.json()
      setBots(data.bots || [])
    } catch (error: any) {
      console.error('Erro ao carregar bots:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit(bot: WhatsAppBot) {
    try {
      setLoadingBot(true)
      console.log('🔄 [Frontend] Carregando bot:', bot.id, bot.nome)
      
      // Buscar dados completos do bot (incluindo tokens que podem não estar na lista)
      const response = await fetch(`/api/admin/bots-whatsapp/${bot.id}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [Frontend] Erro na resposta:', response.status, errorData)
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ [Frontend] Dados recebidos:', {
        tem_bot: !!data.bot,
        nome: data.bot?.nome,
        numero: data.bot?.numero_whatsapp,
        tem_token: !!data.bot?.whatsapp_token,
        tem_phone_id: !!data.bot?.whatsapp_phone_id,
        tem_verify_token: !!data.bot?.verify_token,
        tem_openai_key: !!data.bot?.openai_api_key,
        tem_supabase_url: !!data.bot?.supabase_url,
        tem_supabase_key: !!data.bot?.supabase_service_key,
        tem_perguntas: !!data.bot?.perguntas
      })
      
      // Log completo do bot para debug
      console.log('📦 [Frontend] Bot completo:', JSON.stringify(data.bot, null, 2))
      
      if (!data.bot) {
        throw new Error('Dados do bot não encontrados na resposta')
      }
      
      const botCompleto = data.bot
      
      // Tratar valores null/undefined como string vazia
      const tratarValor = (valor: any) => {
        if (valor === null || valor === undefined) return ''
        return String(valor)
      }
      
      const formDataPreenchido = {
        nome: tratarValor(botCompleto.nome),
        numero_whatsapp: tratarValor(botCompleto.numero_whatsapp),
        ativo: botCompleto.ativo ?? true,
        descricao: tratarValor(botCompleto.descricao),
        whatsapp_token: tratarValor(botCompleto.whatsapp_token),
        whatsapp_phone_id: tratarValor(botCompleto.whatsapp_phone_id),
        verify_token: tratarValor(botCompleto.verify_token),
        openai_api_key: tratarValor(botCompleto.openai_api_key),
        supabase_url: tratarValor(botCompleto.supabase_url),
        supabase_service_key: tratarValor(botCompleto.supabase_service_key),
        mensagem_inicial: tratarValor(botCompleto.mensagem_inicial),
        mensagem_final: tratarValor(botCompleto.mensagem_final),
        mensagem_erro: tratarValor(botCompleto.mensagem_erro),
        palavras_ativacao: Array.isArray(botCompleto.palavras_ativacao) ? botCompleto.palavras_ativacao : [],
        observacoes: tratarValor(botCompleto.observacoes)
      }
      
      console.log('📝 [Frontend] FormData preenchido:', {
        nome: formDataPreenchido.nome,
        numero: formDataPreenchido.numero_whatsapp,
        tem_token: !!formDataPreenchido.whatsapp_token,
        token_length: formDataPreenchido.whatsapp_token?.length || 0,
        tem_phone_id: !!formDataPreenchido.whatsapp_phone_id,
        phone_id: formDataPreenchido.whatsapp_phone_id,
        tem_verify_token: !!formDataPreenchido.verify_token,
        verify_token: formDataPreenchido.verify_token,
        tem_openai_key: !!formDataPreenchido.openai_api_key,
        openai_key_preview: formDataPreenchido.openai_api_key ? `${formDataPreenchido.openai_api_key.substring(0, 10)}...` : '',
        tem_supabase_url: !!formDataPreenchido.supabase_url,
        supabase_url: formDataPreenchido.supabase_url,
        tem_supabase_key: !!formDataPreenchido.supabase_service_key,
        supabase_key_length: formDataPreenchido.supabase_service_key?.length || 0,
        tem_mensagem_inicial: !!formDataPreenchido.mensagem_inicial
      })
      
      // Log completo do formData para debug
      console.log('📋 [Frontend] FormData completo:', JSON.stringify(formDataPreenchido, null, 2))
      
      setEditingBot(botCompleto)
      setFormData(formDataPreenchido)
      setShowForm(true)
      
      // Scroll para o topo do modal após abrir
      setTimeout(() => {
        const modalContent = document.querySelector('.overflow-y-auto')
        if (modalContent) {
          modalContent.scrollTop = 0
        }
      }, 100)
    } catch (error: any) {
      console.error('❌ [Frontend] Erro ao carregar bot:', error)
      alert(`Erro ao carregar dados do bot: ${error.message}\n\nVerifique o console para mais detalhes.`)
    } finally {
      setLoadingBot(false)
    }
  }

  function handleNew() {
    setEditingBot(null)
    setFormData({
      nome: '',
      numero_whatsapp: '',
      ativo: true,
      palavras_ativacao: []
    })
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingBot(null)
    setFormData({})
  }

  async function handleSave() {
    try {
      const url = editingBot
        ? `/api/admin/bots-whatsapp/${editingBot.id}`
        : '/api/admin/bots-whatsapp'
      
      const method = editingBot ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar')
      }
      
      await loadBots()
      handleCancel()
      alert(editingBot ? 'Bot atualizado com sucesso!' : 'Bot criado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar este bot?')) return
    
    try {
      const response = await fetch(`/api/admin/bots-whatsapp/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Erro ao deletar')
      
      await loadBots()
      alert('Bot deletado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao deletar:', error)
      alert(`Erro: ${error.message}`)
    }
  }

  function addPalavraAtivacao() {
    const palavra = prompt('Digite a palavra de ativação:')
    if (palavra && palavra.trim()) {
      setFormData({
        ...formData,
        palavras_ativacao: [...(formData.palavras_ativacao || []), palavra.trim()]
      })
    }
  }

  function removePalavraAtivacao(index: number) {
    const novas = [...(formData.palavras_ativacao || [])]
    novas.splice(index, 1)
    setFormData({ ...formData, palavras_ativacao: novas })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando bots...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bots WhatsApp</h1>
          <p className="text-gray-600 mt-1">Gerencie configurações e perguntas dos bots</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Bot
        </button>
      </div>

      {/* Lista de Bots */}
      {bots.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Nenhum bot cadastrado ainda.</p>
          <button
            onClick={handleNew}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Criar primeiro bot
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{bot.nome}</h3>
                    {bot.ativo ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                        <XCircle className="w-4 h-4" />
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-1">
                    <strong>Número:</strong> {bot.numero_whatsapp}
                  </p>
                  {bot.descricao && (
                    <p className="text-gray-500 text-sm mt-2">{bot.descricao}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bot.palavras_ativacao && bot.palavras_ativacao.length > 0 && (
                      <div className="text-sm text-gray-500">
                        <strong>Ativação:</strong>{' '}
                        {bot.palavras_ativacao.slice(0, 5).join(', ')}
                        {bot.palavras_ativacao.length > 5 && '...'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = `/admin/bots-whatsapp/${bot.id}/perguntas`}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Editar Perguntas"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.location.href = `/admin/bots-whatsapp/${bot.id}/arquivos`}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Ver Arquivos"
                  >
                    <FileCode className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(bot)}
                    disabled={loadingBot}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Editar Configurações"
                  >
                    {loadingBot ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Edit2 className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(bot.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição/Criação */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBot ? 'Editar Bot' : 'Novo Bot'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.nome || ''}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Bot Principal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={formData.numero_whatsapp || ''}
                      onChange={(e) => setFormData({ ...formData, numero_whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="5511999999999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={formData.descricao || ''}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descrição do bot"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo ?? true}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                      Bot ativo
                    </label>
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
                    <div className="relative">
                      <input
                        type={showPasswords.whatsapp_token ? 'text' : 'password'}
                        value={formData.whatsapp_token || ''}
                        onChange={(e) => setFormData({ ...formData, whatsapp_token: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder="Token permanente do Facebook"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, whatsapp_token: !showPasswords.whatsapp_token })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.whatsapp_token ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone ID
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp_phone_id || ''}
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
                      value={formData.verify_token || ''}
                      onChange={(e) => setFormData({ ...formData, verify_token: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Token para verificação do webhook"
                    />
                  </div>
                </div>
              </div>

              {/* Configurações OpenAI */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Configurações OpenAI
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.openai_api_key ? 'text' : 'password'}
                      value={formData.openai_api_key || ''}
                      onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="sk-proj-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, openai_api_key: !showPasswords.openai_api_key })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.openai_api_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Configurações Supabase */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Configurações Supabase
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supabase URL
                    </label>
                    <input
                      type="text"
                      value={formData.supabase_url || ''}
                      onChange={(e) => setFormData({ ...formData, supabase_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://xxx.supabase.co"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supabase Service Key
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.supabase_service_key ? 'text' : 'password'}
                        value={formData.supabase_service_key || ''}
                        onChange={(e) => setFormData({ ...formData, supabase_service_key: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder="Service Key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, supabase_service_key: !showPasswords.supabase_service_key })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.supabase_service_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensagens do Bot */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Mensagens do Bot
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensagem Inicial
                    </label>
                    <textarea
                      value={formData.mensagem_inicial || ''}
                      onChange={(e) => setFormData({ ...formData, mensagem_inicial: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Mensagem de boas-vindas..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensagem Final
                    </label>
                    <textarea
                      value={formData.mensagem_final || ''}
                      onChange={(e) => setFormData({ ...formData, mensagem_final: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Mensagem antes de pedir nome..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensagem de Erro
                    </label>
                    <textarea
                      value={formData.mensagem_erro || ''}
                      onChange={(e) => setFormData({ ...formData, mensagem_erro: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Mensagem de erro..."
                    />
                  </div>
                </div>
              </div>

              {/* Palavras de Ativação */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex-1">
                    Palavras de Ativação
                  </h3>
                  <button
                    onClick={addPalavraAtivacao}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.palavras_ativacao?.map((palavra, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {palavra}
                      <button
                        onClick={() => removePalavraAtivacao(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                  {(!formData.palavras_ativacao || formData.palavras_ativacao.length === 0) && (
                    <p className="text-gray-500 text-sm">Nenhuma palavra cadastrada</p>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observações internas..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

