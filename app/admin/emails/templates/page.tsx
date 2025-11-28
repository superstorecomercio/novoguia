'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { Save, Eye, Edit2, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Constantes para exibir chaves duplas no JSX
const VAR_START = '{{'
const VAR_END = '}}'

interface EmailTemplate {
  id: string
  tipo: string
  nome: string
  assunto: string
  corpo_html: string
  variaveis: string[]
  ativo: boolean
  created_at: string
  updated_at: string
}

const TIPOS_TEMPLATE = [
  { tipo: 'orcamento_empresa', nome: 'Orçamento para Empresa', descricao: 'Enviado quando um novo orçamento é criado' },
  { tipo: 'orcamento_cliente', nome: 'Orçamento para Cliente', descricao: 'Enviado ao cliente que preencheu o orçamento, com detalhes e lista de empresas' },
  { tipo: 'campanha_vencendo_1dia', nome: 'Campanha Vencendo (1 dia antes)', descricao: 'Enviado 1 dia antes do vencimento' },
  { tipo: 'campanha_vencendo_hoje', nome: 'Campanha Vencendo (Hoje)', descricao: 'Enviado no dia do vencimento' },
  { tipo: 'campanha_ativada', nome: 'Campanha Ativada', descricao: 'Enviado ao ativar uma campanha' },
  { tipo: 'campanha_desativada', nome: 'Campanha Desativada', descricao: 'Enviado ao desativar uma campanha' }
]

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const supabase = getSupabase()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('tipo')

      if (error) {
        // Se a tabela não existe, mostrar mensagem amigável
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Tabela email_templates não encontrada. Execute a migration 033_criar_tabela_email_templates.sql')
          setTemplates([])
          return
        }
        throw error
      }

      // Se não existem templates, criar os padrões
      if (!data || data.length === 0) {
        // Os templates padrão serão criados pela migration
        setTemplates([])
      } else {
        setTemplates(data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error)
      // Mostrar erro mais detalhado
      if (error?.message) {
        console.error('Detalhes do erro:', error.message)
        console.error('Código do erro:', error.code)
      }
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (template: EmailTemplate) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('email_templates')
        .update({
          assunto: template.assunto,
          corpo_html: template.corpo_html,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)

      if (error) throw error

      alert('Template salvo com sucesso!')
      setEditing(null)
      loadTemplates()
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = (template: EmailTemplate) => {
    // Gerar preview com dados de exemplo
    const exemploVars: any = {
      codigo_orcamento: 'MD-1234-5678',
      nome_cliente: 'João Silva',
      email_cliente: 'joao@exemplo.com',
      telefone_cliente: '(11) 99999-9999',
      origem_completo: 'São Paulo, SP',
      destino_completo: 'Rio de Janeiro, RJ',
      distancia_km: '450',
      tipo_imovel: 'Apartamento',
      metragem: '50 a 150 m²',
      data_estimada: '25/12/2025',
      preco_min: '1.500',
      preco_max: '2.500',
      lista_objetos: 'Sofá, Mesa, Geladeira, Fogão',
      url_whatsapp: 'https://wa.me/5511999999999',
      codigo_rastreamento: 'MT-ABC12345',
      nome_campanha: 'Campanha Premium',
      data_vencimento: '31/12/2025',
      nome_plano: 'Plano Premium',
      valor_plano: '299,90',
      url_pagamento: 'https://mudatech.com.br/pagamento'
    }

    // Processar template
    let previewHtml = template.corpo_html
    Object.keys(exemploVars).forEach(key => {
      previewHtml = previewHtml.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), exemploVars[key] || '')
    })

    // Processar condicionais
    previewHtml = previewHtml.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
      if (exemploVars[varName]) return content
      return ''
    })

    setPreview(previewHtml)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Templates de Email</h1>
        <p className="text-gray-500 mt-1">Gerencie os templates de email enviados para empresas</p>
      </div>

      {/* Aviso sobre código de rastreamento */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Código de Rastreamento
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Cada email enviado para empresas contém um código único de rastreamento ({VAR_START}codigo_rastreamento{VAR_END}) 
              que permite identificar se o email foi repassado para outra empresa. O código é inserido automaticamente 
              como texto invisível no final do email.
            </p>
          </div>
        </div>
      </div>

      {/* Aviso se não há templates */}
      {!loading && templates.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Templates não encontrados
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                A tabela de templates ainda não foi criada. Para criar os templates padrão, execute a migration:
              </p>
              <code className="block bg-yellow-100 p-3 rounded text-sm mb-4">
                supabase/migrations/033_criar_tabela_email_templates.sql
              </code>
              <p className="text-sm text-yellow-700">
                Após executar a migration, recarregue esta página.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Templates */}
      <div className="space-y-4">
        {TIPOS_TEMPLATE.map(tipoInfo => {
          const template = templates.find(t => t.tipo === tipoInfo.tipo)
          const isEditing = editing === tipoInfo.tipo

          return (
            <div key={tipoInfo.tipo} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tipoInfo.nome}</h3>
                  <p className="text-sm text-gray-500 mt-1">{tipoInfo.descricao}</p>
                </div>
                <div className="flex items-center gap-2">
                  {template?.ativo ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Ativo
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      Inativo
                    </span>
                  )}
                </div>
              </div>

              {isEditing && template ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assunto do Email
                    </label>
                    <input
                      type="text"
                      value={template.assunto}
                      onChange={(e) => {
                        const updated = templates.map(t =>
                          t.id === template.id ? { ...t, assunto: e.target.value } : t
                        )
                        setTemplates(updated)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Assunto do email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Corpo do Email (HTML)
                    </label>
                    <textarea
                      value={template.corpo_html}
                      onChange={(e) => {
                        const updated = templates.map(t =>
                          t.id === template.id ? { ...t, corpo_html: e.target.value } : t
                        )
                        setTemplates(updated)
                      }}
                      rows={20}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="HTML do template"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use variáveis como {VAR_START}variavel{VAR_END} e condicionais {VAR_START}#if variavel{VAR_END}...{VAR_START}/if{VAR_END}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(template)}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvar Template
                    </button>
                    <button
                      onClick={() => handlePreview(template)}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar Preview
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => template && setEditing(tipoInfo.tipo)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar Template
                  </button>
                  {template && (
                    <button
                      onClick={() => handlePreview(template)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar Preview
                    </button>
                  )}
                </div>
              )}

              {template && template.variaveis && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Variáveis disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {(template.variaveis as string[]).map((variavel: string) => (
                      <span
                        key={variavel}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded"
                      >
                        {VAR_START}{variavel}{VAR_END}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal de Preview */}
      {preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Preview do Template</h2>
              <button
                onClick={() => setPreview(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div dangerouslySetInnerHTML={{ __html: preview }} />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setPreview(null)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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

