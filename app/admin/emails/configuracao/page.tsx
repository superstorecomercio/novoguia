'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { Save, TestTube, Mail, CheckCircle2, AlertTriangle, Loader2, Info } from 'lucide-react'
import Link from 'next/link'
import { formatDateTimeBR } from '@/lib/utils/date'

interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'nodemailer' | 'socketlabs' | null
  api_key: string
  server_id?: string // Para SocketLabs
  from_email: string
  from_name: string
  reply_to: string
  ativo: boolean
  testado: boolean
  ultimo_teste?: string
  erro_teste?: string
}

function TestModeWarning() {
  const [testModeActive, setTestModeActive] = useState(false)
  const [testEmail, setTestEmail] = useState<string>('')
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = () => {
    fetch('/api/admin/emails/test-mode/status')
      .then(res => res.json())
      .then(data => {
        setTestModeActive(data.active || false)
        setTestEmail(process.env.NEXT_PUBLIC_EMAIL_TEST_TO || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'test@mudatech.com.br')
      })
      .catch(() => {
        setTestModeActive(process.env.NEXT_PUBLIC_EMAIL_TEST_MODE === 'true')
      })
  }

  const handleToggle = async () => {
    try {
      setToggling(true)
      const response = await fetch('/api/admin/emails/test-mode/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !testModeActive })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar modo de teste')
      }

      setTestModeActive(data.enabled)
      loadStatus() // Recarregar status
    } catch (error: any) {
      alert(`Erro: ${error.message}`)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${
      testModeActive 
        ? 'bg-yellow-50 border-yellow-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Info className={`w-5 h-5 mt-0.5 ${
            testModeActive ? 'text-yellow-600' : 'text-gray-600'
          }`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              testModeActive ? 'text-yellow-900' : 'text-gray-900'
            }`}>
              {testModeActive ? '🧪 Modo de Teste Ativo' : '📧 Modo de Teste Desativado'}
            </p>
            <p className={`text-sm mt-1 ${
              testModeActive ? 'text-yellow-700' : 'text-gray-600'
            }`}>
              {testModeActive 
                ? `Os emails estão sendo interceptados e não serão enviados para clientes reais. ${testEmail && `Todos os emails serão redirecionados para: ${testEmail}`}`
                : 'Os emails serão enviados normalmente para os clientes. Ative o modo de teste para interceptar.'
              }
            </p>
            {testModeActive && (
              <Link
                href="/admin/emails/test-mode"
                className="inline-flex items-center gap-1 text-sm text-yellow-800 hover:text-yellow-900 font-medium mt-2 underline"
              >
                Ver emails interceptados →
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
            testModeActive
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {toggling ? (
            '...'
          ) : testModeActive ? (
            'Desativar'
          ) : (
            'Ativar'
          )}
        </button>
      </div>
    </div>
  )
}

export default function EmailConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState<EmailConfig>({
    provider: null,
    api_key: '',
    from_email: '',
    from_name: 'MudaTech',
    reply_to: '',
    ativo: false,
    testado: false
  })
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const supabase = getSupabase()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      // Buscar configuração (vamos criar uma tabela para isso)
      // Por enquanto, vamos usar variáveis de ambiente como fallback
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('chave', 'email_config')
        .single()

      if (data && !error) {
        setConfig(data.valor as EmailConfig)
      } else {
        // Se não existe, usar valores padrão
        setConfig({
          provider: null,
          api_key: '',
          from_email: process.env.NEXT_PUBLIC_EMAIL_FROM || '',
          from_name: 'MudaTech',
          reply_to: process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || '',
          ativo: false,
          testado: false
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/emails/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar configuração')
      }

      alert('Configuração salva com sucesso!')
      setConfig(prev => ({ ...prev, ...data.config }))
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      setTestResult(null)

      const response = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          api_key: config.api_key,
          server_id: config.server_id,
          from_email: config.from_email,
          from_name: config.from_name
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao testar configuração')
      }

      setTestResult({
        success: true,
        message: data.message || 'Email de teste enviado com sucesso!'
      })

      // Atualizar status de teste
      setConfig(prev => ({
        ...prev,
        testado: true,
        ultimo_teste: new Date().toISOString(),
        erro_teste: undefined
      }))
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erro ao testar configuração'
      })
      setConfig(prev => ({
        ...prev,
        testado: false,
        erro_teste: error.message
      }))
    } finally {
      setTesting(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Configuração de Envio de Emails</h1>
        <p className="text-gray-500 mt-1">Configure a API de envio de emails para notificar empresas</p>
      </div>

      {/* Aviso sobre variáveis de ambiente */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Configuração Segura
            </p>
            <p className="text-sm text-blue-700 mt-1">
              As credenciais da API são armazenadas de forma segura. Para produção, recomendamos usar variáveis de ambiente.
            </p>
          </div>
        </div>
      </div>

      {/* Aviso sobre Modo de Teste */}
      <TestModeWarning />

      {/* Formulário de Configuração */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Provedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provedor de Email *
          </label>
          <select
            value={config.provider || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, provider: e.target.value as any || null }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione um provedor</option>
            <option value="socketlabs">SocketLabs</option>
            <option value="resend">Resend</option>
            <option value="sendgrid">SendGrid</option>
            <option value="nodemailer">Nodemailer (SMTP)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            SocketLabs é recomendado para alta deliverability e volume
          </p>
        </div>

        {/* Server ID (SocketLabs) */}
        {config.provider === 'socketlabs' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Server ID *
            </label>
            <input
              type="text"
              value={config.server_id || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, server_id: e.target.value }))}
              placeholder="12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Seu Server ID do SocketLabs (encontre no dashboard)
            </p>
          </div>
        )}

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {config.provider === 'socketlabs' ? 'API Key *' : 'API Key *'}
          </label>
          <input
            type="password"
            value={config.api_key}
            onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
            placeholder={
              config.provider === 'socketlabs' 
                ? 'Sua API Key do SocketLabs'
                : config.provider === 'resend'
                ? 're_xxxxxxxxxxxxx'
                : config.provider === 'sendgrid'
                ? 'SG.xxxxxxxxxxxxx'
                : 'Sua chave de API'
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Sua chave de API do provedor escolhido. Mantenha em segredo!
          </p>
        </div>

        {/* From Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Remetente *
          </label>
          <input
            type="email"
            value={config.from_email}
            onChange={(e) => setConfig(prev => ({ ...prev, from_email: e.target.value }))}
            placeholder="noreply@mudatech.com.br"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email que aparecerá como remetente. Deve estar verificado no provedor.
          </p>
        </div>

        {/* From Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Remetente
          </label>
          <input
            type="text"
            value={config.from_name}
            onChange={(e) => setConfig(prev => ({ ...prev, from_name: e.target.value }))}
            placeholder="MudaTech"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Reply To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email para Resposta
          </label>
          <input
            type="email"
            value={config.reply_to}
            onChange={(e) => setConfig(prev => ({ ...prev, reply_to: e.target.value }))}
            placeholder="contato@mudatech.com.br"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Email que receberá as respostas (opcional)
          </p>
        </div>

        {/* Ativo */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="ativo"
            checked={config.ativo}
            onChange={(e) => setConfig(prev => ({ ...prev, ativo: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
            Ativar envio automático de emails
          </label>
        </div>

        {/* Status do Teste */}
        {config.testado && (
          <div className={`p-4 rounded-lg border-2 ${
            config.erro_teste 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2">
              {config.erro_teste ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  config.erro_teste ? 'text-red-900' : 'text-green-900'
                }`}>
                  {config.erro_teste ? 'Teste Falhou' : 'Configuração Testada'}
                </p>
                {config.ultimo_teste && (
                  <p className="text-xs text-gray-600 mt-1">
                    Último teste: {formatDateTimeBR(config.ultimo_teste)}
                  </p>
                )}
                {config.erro_teste && (
                  <p className="text-xs text-red-700 mt-1 font-mono">
                    {config.erro_teste}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resultado do Teste */}
        {testResult && (
          <div className={`p-4 rounded-lg border-2 ${
            testResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm font-medium ${
                testResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {testResult.message}
              </p>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleTest}
            disabled={!config.provider || !config.api_key || !config.from_email || (config.provider === 'socketlabs' && !config.server_id) || testing}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            Testar Configuração
          </button>
          <button
            onClick={handleSave}
            disabled={!config.provider || !config.api_key || !config.from_email || (config.provider === 'socketlabs' && !config.server_id) || saving}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Configuração
          </button>
        </div>
      </div>

      {/* Documentação Rápida */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Como Obter as Credenciais</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">SocketLabs</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Acesse <a href="https://www.socketlabs.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">socketlabs.com</a> e crie uma conta</li>
              <li>No dashboard, vá em "Settings" → "API Keys"</li>
              <li>Anote seu <strong>Server ID</strong> (número, ex: 12345)</li>
              <li>Crie uma nova API Key ou use uma existente</li>
              <li>Copie o <strong>Server ID</strong> e a <strong>API Key</strong></li>
              <li>Verifique seu domínio em "Settings" → "Domains"</li>
            </ol>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Resend</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Acesse <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com</a> e crie uma conta</li>
              <li>Vá em "API Keys" e crie uma nova chave</li>
              <li>Adicione e verifique seu domínio em "Domains"</li>
              <li>Copie a API Key (começa com "re_")</li>
            </ol>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">SendGrid</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Acesse <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sendgrid.com</a> e crie uma conta</li>
              <li>Vá em "Settings" → "API Keys"</li>
              <li>Crie uma nova API Key com permissões de "Mail Send"</li>
              <li>Copie a API Key (começa com "SG.")</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

