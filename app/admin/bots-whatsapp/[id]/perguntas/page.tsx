'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

interface Pergunta {
  texto: string
  tipo: 'texto' | 'botoes' | 'lista'
  opcoes?: Array<{ id: string; titulo: string; descricao?: string }>
}

interface PerguntasData {
  origem?: Pergunta
  destino?: Pergunta
  tipo_imovel?: Pergunta
  metragem?: Pergunta
  elevador?: Pergunta
  embalagem?: Pergunta
  nome?: Pergunta
  email?: Pergunta
  data?: Pergunta
  lista_objetos?: Pergunta
  lista_texto?: Pergunta
}

const PERGUNTAS_ORDEM = [
  'origem',
  'destino',
  'tipo_imovel',
  'metragem',
  'elevador',
  'embalagem',
  'nome',
  'email',
  'data',
  'lista_objetos',
  'lista_texto'
]

const PERGUNTAS_LABELS: Record<string, string> = {
  origem: 'Origem',
  destino: 'Destino',
  tipo_imovel: 'Tipo de Imóvel',
  metragem: 'Metragem',
  elevador: 'Elevador',
  embalagem: 'Embalagem',
  nome: 'Nome',
  email: 'Email',
  data: 'Data',
  lista_objetos: 'Lista de Objetos (Opção)',
  lista_texto: 'Lista de Objetos (Texto)'
}

export default function PerguntasBotPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string
  
  const [perguntas, setPerguntas] = useState<PerguntasData>({})
  const [mensagemInicial, setMensagemInicial] = useState('')
  const [mensagemFinal, setMensagemFinal] = useState('')
  const [mensagemErro, setMensagemErro] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPerguntas()
  }, [botId])

  async function loadPerguntas() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/bots-whatsapp/${botId}`)
      if (!response.ok) throw new Error('Erro ao carregar bot')
      const data = await response.json()
      setPerguntas(data.bot.perguntas || {})
      setMensagemInicial(data.bot.mensagem_inicial || '')
      setMensagemFinal(data.bot.mensagem_final || '')
      setMensagemErro(data.bot.mensagem_erro || '')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/bots-whatsapp/${botId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perguntas,
          mensagem_inicial: mensagemInicial,
          mensagem_final: mensagemFinal,
          mensagem_erro: mensagemErro
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar')
      }
      
      alert('Configurações salvas com sucesso!')
      router.push('/admin/bots-whatsapp')
    } catch (error: any) {
      console.error('Erro:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  function updatePergunta(key: string, field: keyof Pergunta, value: any) {
    setPerguntas({
      ...perguntas,
      [key]: {
        ...(perguntas[key as keyof PerguntasData] || {}),
        [field]: value
      }
    })
  }

  function addOpcao(key: string) {
    const pergunta = perguntas[key as keyof PerguntasData]
    if (!pergunta) return
    
    const novasOpcoes = [...(pergunta.opcoes || []), { id: '', titulo: '', descricao: '' }]
    updatePergunta(key, 'opcoes', novasOpcoes)
  }

  function removeOpcao(key: string, index: number) {
    const pergunta = perguntas[key as keyof PerguntasData]
    if (!pergunta || !pergunta.opcoes) return
    
    const novasOpcoes = pergunta.opcoes.filter((_, i) => i !== index)
    updatePergunta(key, 'opcoes', novasOpcoes)
  }

  function updateOpcao(key: string, index: number, field: string, value: string) {
    const pergunta = perguntas[key as keyof PerguntasData]
    if (!pergunta || !pergunta.opcoes) return
    
    const novasOpcoes = [...pergunta.opcoes]
    novasOpcoes[index] = { ...novasOpcoes[index], [field]: value }
    updatePergunta(key, 'opcoes', novasOpcoes)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando perguntas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/bots-whatsapp')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documentação e Edição de Perguntas</h1>
            <p className="text-gray-600 mt-1">Visualize e edite todas as perguntas do bot de forma organizada</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Mensagens do Bot */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💬 Mensagens do Bot</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem Inicial (Boas-vindas)
          </label>
          <textarea
            value={mensagemInicial}
            onChange={(e) => setMensagemInicial(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Mensagem de boas-vindas quando o bot é ativado..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta mensagem é enviada quando o usuário ativa o bot (ex: digita "oi")
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem Final (Antes de pedir nome)
          </label>
          <textarea
            value={mensagemFinal}
            onChange={(e) => setMensagemFinal(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Mensagem antes de pedir o nome do cliente..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta mensagem é enviada após coletar todas as informações técnicas, antes de pedir o nome
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem de Erro
          </label>
          <textarea
            value={mensagemErro}
            onChange={(e) => setMensagemErro(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Mensagem exibida quando ocorre um erro..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta mensagem é enviada quando ocorre um erro no processamento
          </p>
        </div>
      </div>

      {/* Documentação Visual */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Fluxo Completo do Bot - Todas as Perguntas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PERGUNTAS_ORDEM.map((key, index) => {
            const pergunta = perguntas[key as keyof PerguntasData]
            const tipo = pergunta?.tipo || 'texto'
            const tipoIcon = tipo === 'texto' ? '💬' : tipo === 'botoes' ? '🔘' : '📋'
            const tipoLabel = tipo === 'texto' ? 'Texto' : tipo === 'botoes' ? 'Botões' : 'Lista'
            
            return (
              <div
                key={key}
                className="bg-white rounded-lg border-2 border-blue-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">{index + 1}</span>
                    <span className="text-lg">{tipoIcon}</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                    {tipoLabel}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{PERGUNTAS_LABELS[key]}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {pergunta?.texto || 'Pergunta não configurada'}
                </p>
                {pergunta?.opcoes && pergunta.opcoes.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      {pergunta.opcoes.length} {pergunta.opcoes.length === 1 ? 'opção' : 'opções'}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Editor de Perguntas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">✏️ Editor de Perguntas</h2>
        <div className="space-y-6">
          {PERGUNTAS_ORDEM.map((key) => {
          const pergunta = perguntas[key as keyof PerguntasData] || { texto: '', tipo: 'texto' }
          
          return (
            <div key={key} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {PERGUNTAS_LABELS[key]}
              </h3>
              
              <div className="space-y-4">
                {/* Texto da Pergunta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto da Pergunta
                  </label>
                  <textarea
                    value={pergunta.texto || ''}
                    onChange={(e) => updatePergunta(key, 'texto', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite a pergunta..."
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={pergunta.tipo || 'texto'}
                    onChange={(e) => updatePergunta(key, 'tipo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="texto">Texto Livre</option>
                    <option value="botoes">Botões</option>
                    <option value="lista">Lista</option>
                  </select>
                </div>

                {/* Opções (para botões e lista) */}
                {(pergunta.tipo === 'botoes' || pergunta.tipo === 'lista') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Opções
                      </label>
                      <button
                        onClick={() => addOpcao(key)}
                        className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {pergunta.opcoes?.map((opcao, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={opcao.id}
                              onChange={(e) => updateOpcao(key, index, 'id', e.target.value)}
                              placeholder="ID (ex: elevador_sim)"
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              value={opcao.titulo}
                              onChange={(e) => updateOpcao(key, index, 'titulo', e.target.value)}
                              placeholder="Título"
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              value={opcao.descricao || ''}
                              onChange={(e) => updateOpcao(key, index, 'descricao', e.target.value)}
                              placeholder="Descrição (opcional)"
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeOpcao(key, index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!pergunta.opcoes || pergunta.opcoes.length === 0) && (
                        <p className="text-gray-500 text-sm">Nenhuma opção cadastrada</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}

