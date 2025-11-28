'use client'

import { Target, Eye, Heart, Zap, Shield, CheckCircle2, Users, TrendingUp, MapPin, Building2 } from 'lucide-react'
import Link from 'next/link'

const QuemSomosPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#4facfe] text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Quem Somos
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Conectando pessoas a empresas de mudança confiáveis em todo o Brasil
            </p>
          </div>
        </div>
      </section>

      {/* Sobre o MudaTech */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Sobre o MudaTech
                </h2>
              </div>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  O <strong className="text-gray-900">MudaTech</strong> é uma plataforma inovadora dedicada a conectar pessoas que precisam de serviços de mudança com empresas confiáveis e especializadas em todo o Brasil.
                </p>
                <p>
                  Nossa missão é simplificar o processo de encontrar e contratar empresas de mudança, oferecendo informações detalhadas, comparação de serviços e facilitando a solicitação de orçamentos personalizados de forma rápida e eficiente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              {/* Missão */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Nossa Missão</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Simplificar o processo de encontrar e contratar empresas de mudança, oferecendo uma plataforma transparente, segura e eficiente que conecta clientes a empresas qualificadas em todo o Brasil.
                </p>
              </div>

              {/* Visão */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Nossa Visão</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Ser a principal referência em busca de empresas de mudança no Brasil, oferecendo uma experiência transparente, segura e eficiente para nossos usuários, com tecnologia de ponta e atendimento excepcional.
                </p>
              </div>
            </div>

            {/* Valores */}
            <div className="mt-12">
              <div className="text-center mb-12">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">Nossos Valores</h3>
                </div>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Os princípios que guiam nosso trabalho e relacionamento com clientes e parceiros
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Transparência</h4>
                  <p className="text-gray-600 text-sm">
                    Informações claras e processos transparentes em todas as etapas
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Qualidade</h4>
                  <p className="text-gray-600 text-sm">
                    Compromisso com a excelência e qualidade dos serviços oferecidos
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Facilidade</h4>
                  <p className="text-gray-600 text-sm">
                    Interface intuitiva e processos simplificados para melhor experiência
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Confiança</h4>
                  <p className="text-gray-600 text-sm">
                    Segurança e confiabilidade em todas as transações e relacionamentos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funcionamos */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Como Funcionamos
                </h2>
              </div>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Um processo simples e eficiente para encontrar a empresa de mudança ideal
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">1. Busque por Cidade</h3>
                <p className="text-gray-700 leading-relaxed">
                  Encontre empresas de mudança cadastradas na sua cidade ou região de destino. Nossa plataforma possui empresas em todo o Brasil.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-6">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">2. Compare Empresas</h3>
                <p className="text-gray-700 leading-relaxed">
                  Visualize informações detalhadas sobre cada empresa, incluindo serviços oferecidos, avaliações e histórico de trabalhos realizados.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">3. Solicite Orçamentos</h3>
                <p className="text-gray-700 leading-relaxed">
                  Solicite orçamentos personalizados de forma rápida e simples. Receba propostas de múltiplas empresas e escolha a melhor opção.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas / Diferenciais */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Por que escolher o MudaTech?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Uma plataforma completa e confiável para suas necessidades de mudança
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">+1000</h3>
                <p className="text-white/80">Empresas Cadastradas</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">+50</h3>
                <p className="text-white/80">Cidades Atendidas</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">100%</h3>
                <p className="text-white/80">Empresas Verificadas</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">5 min</h3>
                <p className="text-white/80">Tempo Médio de Resposta</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl shadow-2xl p-12 text-center text-white">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Pronto para sua mudança?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Solicite orçamentos gratuitos de empresas verificadas e encontre a melhor opção para você
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/orcamento"
                  className="px-8 py-4 bg-white text-[#667eea] rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Solicitar Orçamento
                </Link>
                <Link
                  href="/cidades"
                  className="px-8 py-4 bg-white/10 text-white border-2 border-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  Ver Cidades
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default QuemSomosPage
