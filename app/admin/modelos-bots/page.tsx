'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react'

interface ModeloBot {
  id: string
  nome: string
  descricao: string | null
  categoria: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export default function ModelosBotsPage() {
  const [modelos, setModelos] = useState<ModeloBot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModelos()
  }, [])

  async function loadModelos() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/modelos-bots')
      if (!response.ok) throw new Error('Erro ao carregar modelos')
      const data = await response.json()
      setModelos(data.modelos || [])
    } catch (error: any) {
      console.error('Erro ao carregar modelos:', error)
      alert(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando modelos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modelos de Bots</h1>
          <p className="text-gray-600 mt-1">Gerencie templates/modelos de bots reutilizáveis</p>
        </div>
        <button
          onClick={() => alert('Funcionalidade em desenvolvimento')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Modelo
        </button>
      </div>

      {/* Lista de Modelos */}
      {modelos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Nenhum modelo cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {modelos.map((modelo) => (
            <div
              key={modelo.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{modelo.nome}</h3>
                    {modelo.ativo ? (
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
                    {modelo.categoria && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {modelo.categoria}
                      </span>
                    )}
                  </div>
                  {modelo.descricao && (
                    <p className="text-gray-600 mb-2">{modelo.descricao}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Criado em: {new Date(modelo.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert('Funcionalidade em desenvolvimento')}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => alert('Funcionalidade em desenvolvimento')}
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
    </div>
  )
}


