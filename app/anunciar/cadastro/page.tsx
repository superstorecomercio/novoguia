'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'

function CadastroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planoId = searchParams.get('plano')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [planoNome, setPlanoNome] = useState('')

  const [formData, setFormData] = useState({
    // Dados do responsável
    nome: '',
    email: '',
    telefone: '',

    // Dados da empresa
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    nome_responsavel: '',
    telefone_responsavel: '',
    endereco_completo: '',
    cidade: '',
    estado: '',
    cep: '',
  })

  useEffect(() => {
    if (planoId) {
      carregarPlano()
    }
  }, [planoId])

  async function carregarPlano() {
    try {
      const response = await fetch('/api/admin/planos')
      const data = await response.json()
      if (response.ok && data.planos) {
        const plano = data.planos.find((p: any) => p.id === planoId)
        if (plano) {
          setPlanoNome(plano.nome)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error)
    }
  }

  // Formatação de telefone
  const formatPhone = (phone: string): string => {
    if (!phone) return ''
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length === 0) return ''
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  // Formatação de CNPJ
  const formatCNPJ = (cnpj: string): string => {
    if (!cnpj) return ''
    const numbers = cnpj.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5')
    }
    return cnpj
  }

  // Formatação de CEP
  const formatCEP = (cep: string): string => {
    if (!cep) return ''
    const numbers = cep.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{5})(\d{3}).*/, '$1-$2')
    }
    return cep
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === 'telefone' || name === 'telefone_responsavel') {
      const numbers = value.replace(/\D/g, '')
      setFormData((prev) => ({ ...prev, [name]: numbers }))
    } else if (name === 'cnpj') {
      const numbers = value.replace(/\D/g, '')
      setFormData((prev) => ({ ...prev, [name]: numbers }))
    } else if (name === 'cep') {
      const numbers = value.replace(/\D/g, '')
      setFormData((prev) => ({ ...prev, [name]: numbers }))
    } else if (name === 'estado') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase().slice(0, 2) }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validações básicas
    if (!formData.email || !formData.email.includes('@')) {
      setError('Por favor, informe um email válido.')
      setLoading(false)
      return
    }

    if (!formData.nome_fantasia || formData.nome_fantasia.trim().length < 3) {
      setError('Por favor, informe o nome fantasia da empresa (mínimo 3 caracteres).')
      setLoading(false)
      return
    }

    if (!formData.telefone || formData.telefone.replace(/\D/g, '').length < 10) {
      setError('Por favor, informe um telefone válido (mínimo 10 dígitos).')
      setLoading(false)
      return
    }

    if (!formData.nome || formData.nome.trim().length < 3) {
      setError('Por favor, informe seu nome completo (mínimo 3 caracteres).')
      setLoading(false)
      return
    }

    // Validar CNPJ se preenchido (deve ter 14 dígitos)
    if (formData.cnpj && formData.cnpj.replace(/\D/g, '').length !== 14) {
      setError('CNPJ inválido. Deve conter 14 dígitos.')
      setLoading(false)
      return
    }

    // Validar CEP se preenchido (deve ter 8 dígitos)
    if (formData.cep && formData.cep.replace(/\D/g, '').length !== 8) {
      setError('CEP inválido. Deve conter 8 dígitos.')
      setLoading(false)
      return
    }

    // Validar estado se preenchido (deve ter 2 caracteres)
    if (formData.estado && formData.estado.length !== 2) {
      setError('Estado inválido. Informe a sigla com 2 letras (ex: SP, RJ).')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/cliente/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          nome: formData.nome.trim(),
          telefone: formData.telefone,
          empresaData: {
            nome_fantasia: formData.nome_fantasia.trim(),
            razao_social: formData.razao_social?.trim() || formData.nome_fantasia.trim(),
            cnpj: formData.cnpj || null,
            nome_responsavel: formData.nome_responsavel?.trim() || formData.nome.trim(),
            telefone_responsavel: formData.telefone_responsavel || formData.telefone,
            endereco_completo: formData.endereco_completo?.trim() || null,
            cidade: formData.cidade?.trim() || null,
            estado: formData.estado?.toUpperCase() || null,
            cep: formData.cep || null,
          },
          plano_id: planoId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao realizar cadastro')
      }

      // Se email não foi enviado, mostrar senha na tela
      if (!data.email_enviado) {
        console.warn('Email não foi enviado:', data.email_erro)
        // Armazenar credenciais para mostrar na tela de sucesso
        sessionStorage.setItem('cadastro_credenciais', JSON.stringify({
          email: formData.email,
          senha: data.senha,
          erro: data.email_erro
        }))
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro. Tente novamente.')
      console.error('Erro ao cadastrar:', err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    // Verificar se há credenciais salvas (caso email não tenha sido enviado)
    const credenciaisStr = typeof window !== 'undefined' ? sessionStorage.getItem('cadastro_credenciais') : null
    const credenciais = credenciaisStr ? JSON.parse(credenciaisStr) : null
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white flex items-center justify-center py-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Cadastro realizado com sucesso!</h1>
            
            {credenciais ? (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-left">
                  <p className="text-sm font-semibold text-yellow-800 mb-3">
                    ⚠️ Email não foi enviado. Suas credenciais:
                  </p>
                  <div className="bg-white rounded p-4 space-y-2">
                    <p className="text-sm"><strong>Email:</strong> {credenciais.email}</p>
                    <p className="text-sm"><strong>Senha:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{credenciais.senha}</code></p>
                  </div>
                  <p className="text-xs text-yellow-700 mt-3">
                    {credenciais.erro && `Erro: ${credenciais.erro}`}
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    ⚠️ Guarde estas credenciais com segurança!
                  </p>
                </div>
              </>
            ) : (
              <p className="text-lg text-gray-600 mb-6">
                Verifique seu email <strong>{formData.email}</strong> para receber suas credenciais de acesso.
              </p>
            )}
            
            <p className="text-sm text-gray-500 mb-8">
              Use estas credenciais para acessar o painel administrativo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') sessionStorage.removeItem('cadastro_credenciais')
                  router.push('/')
                }}
                variant="outline"
                className="rounded-xl"
              >
                Voltar ao início
              </Button>
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') sessionStorage.removeItem('cadastro_credenciais')
                  router.push('/painel')
                }}
                className="rounded-xl bg-[#667eea] text-white hover:bg-[#5568d3]"
              >
                Acessar painel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/anunciar"
            className="inline-flex items-center text-[#667eea] hover:text-[#5568d3] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para planos
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Cadastre sua empresa
          </h1>
          {planoNome && (
            <p className="text-lg text-gray-600">
              Plano selecionado: <strong>{planoNome}</strong>
            </p>
          )}
        </div>

        <Card className="p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Dados do Responsável */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#667eea]" />
                Dados do Responsável
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone/WhatsApp *
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formatPhone(formData.telefone)}
                    onChange={handleChange}
                    required
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>
            </div>

            {/* Dados da Empresa */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Dados da Empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    name="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    name="razao_social"
                    value={formData.razao_social}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="Razão social da empresa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formatCNPJ(formData.cnpj)}
                    onChange={handleChange}
                    maxLength={18}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Responsável Legal
                  </label>
                  <input
                    type="text"
                    name="nome_responsavel"
                    value={formData.nome_responsavel}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="Nome do responsável legal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone do Responsável
                  </label>
                  <input
                    type="tel"
                    name="telefone_responsavel"
                    value={formatPhone(formData.telefone_responsavel)}
                    onChange={handleChange}
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="(11) 98765-4321"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    value={formatCEP(formData.cep)}
                    onChange={handleChange}
                    maxLength={9}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="00000-000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    name="endereco_completo"
                    value={formData.endereco_completo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="Rua, número, complemento, bairro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                    placeholder="Nome da cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    maxLength={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent uppercase"
                    placeholder="SP"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/anunciar')}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-[#667eea] text-white hover:bg-[#5568d3]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Finalizar cadastro'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CadastroForm />
    </Suspense>
  )
}

