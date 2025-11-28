'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, FileCode, Settings } from 'lucide-react'
import Link from 'next/link'

interface WhatsAppBot {
  id: string
  nome: string
  numero_whatsapp: string
  ativo: boolean
  email_notificacao?: string
  notificar_whatsapp?: boolean
  whatsapp_notificacao?: string
  modelo_id?: string
  modelo_nome?: string
  created_at: string
}

export default function BotsWhatsAppClientesPage() {
  const [bots, setBots] = useState<WhatsAppBot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBots()
  }, [])

  async function loadBots() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/bots-whatsapp-clientes')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando bots clientes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bots WhatsApp - Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie bots de empresas clientes</p>
        </div>
        <Link
          href="/admin/bots-whatsapp-clientes/novo"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Bot Cliente
        </Link>
      </div>

      {/* Lista de Bots */}
      {bots.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Nenhum bot cliente cadastrado ainda.</p>
          <Link
            href="/admin/bots-whatsapp-clientes/novo"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
          >
            Criar primeiro bot cliente
          </Link>
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
                  {bot.modelo_nome && (
                    <p className="text-gray-600 mb-1">
                      <strong>Modelo:</strong> {bot.modelo_nome}
                    </p>
                  )}
                  {bot.email_notificacao && (
                    <p className="text-gray-600 mb-1">
                      <strong>Email Notificação:</strong> {bot.email_notificacao}
                    </p>
                  )}
                  {bot.notificar_whatsapp && bot.whatsapp_notificacao && (
                    <p className="text-gray-600 mb-1">
                      <strong>WhatsApp Notificação:</strong> {bot.whatsapp_notificacao}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/bots-whatsapp/${bot.id}/perguntas`}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Editar Perguntas"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/admin/bots-whatsapp/${bot.id}/arquivos`}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Ver Arquivos"
                  >
                    <FileCode className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/admin/bots-whatsapp-clientes/${bot.id}/editar`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


