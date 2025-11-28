'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Shield, ArrowRight, Loader2 } from 'lucide-react'

interface LoginStep {
  step: 'email' | 'code' | 'change-password'
  adminId?: string
  primeiroLogin?: boolean
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>({ step: 'email' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Verificar se já está logado
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('admin_session')
      if (storedToken) {
        try {
          const response = await fetch('/api/admin/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          })
          if (response.ok) {
            router.push('/admin')
          }
        } catch (err) {
          localStorage.removeItem('admin_session')
        }
      }
    }
    checkAuth()
  }, [router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login')
        setLoading(false)
        return
      }

      setStep({
        step: 'code',
        adminId: data.adminId,
        primeiroLogin: data.primeiroLogin
      })
      setLoading(false)
    } catch (err: any) {
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: step.adminId,
          code
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Código inválido')
        setLoading(false)
        return
      }

      setToken(data.token)
      localStorage.setItem('admin_session', data.token)
      
      // Salvar também em cookie para o middleware
      document.cookie = `admin_session=${data.token}; path=/; max-age=86400; SameSite=Lax`

      // Se for primeiro login, pedir mudança de senha
      if (step.primeiroLogin) {
        setStep({
          step: 'change-password',
          adminId: step.adminId,
          primeiroLogin: true
        })
      } else {
        router.push('/admin')
      }
      setLoading(false)
    } catch (err: any) {
      setError('Erro ao verificar código')
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao alterar senha')
        setLoading(false)
        return
      }

      router.push('/admin')
    } catch (err: any) {
      setError('Erro ao alterar senha')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MudaTech Admin
          </h1>
          <p className="text-gray-600">
            {step.step === 'email' && 'Faça login para acessar o painel'}
            {step.step === 'code' && 'Verificação de segurança'}
            {step.step === 'change-password' && 'Altere sua senha'}
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Email e Senha */}
          {step.step === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Código de Verificação */}
          {step.step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Enviamos um código de verificação para:
                </p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Digite o código de 6 dígitos enviado por email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Verificar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep({ step: 'email' })}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                ← Voltar
              </button>
            </form>
          )}

          {/* Step 3: Mudança de Senha (Primeiro Login) */}
          {step.step === 'change-password' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Primeiro acesso:</strong> Por segurança, você precisa alterar sua senha antes de continuar.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite a senha novamente"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    Alterar Senha e Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>MudaTech © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}

