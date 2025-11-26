import { Metadata } from "next"
import Link from "next/link"
import { Card } from "@/app/components/ui/card"
import { 
  Bot, 
  Calculator, 
  Database, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight
} from "lucide-react"

export const metadata: Metadata = {
  title: "Como Funciona | MudaTech",
  description: "Entenda como o MudaTech funciona: IA, dashboard, cálculo de orçamentos e muito mais",
}

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">
              Como Funciona o MudaTech
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Descubra como nossa plataforma utiliza inteligência artificial para conectar você às melhores empresas de mudança
            </p>
          </div>
        </div>
      </section>

      {/* Para Clientes */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Para Clientes
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Processo simples e rápido para calcular o preço da sua mudança
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-4">1. Inicie pelo WhatsApp</h3>
                <p className="text-gray-600 leading-relaxed">
                  Clique no botão e comece a conversar com a Julia, nossa assistente virtual. Ela fará perguntas sobre sua mudança de forma natural e conversacional.
                </p>
              </Card>

              <Card className="p-8 border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center mb-6">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-4">2. IA Calcula Tudo</h3>
                <p className="text-gray-600 leading-relaxed">
                  Nossa inteligência artificial analisa origem, destino, distância, tipo de imóvel e complexidade para calcular uma estimativa precisa de preço em segundos.
                </p>
              </Card>

              <Card className="p-8 border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center mb-6">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-4">3. Receba Empresas</h3>
                <p className="text-gray-600 leading-relaxed">
                  Empresas verificadas no seu estado de destino recebem seu orçamento automaticamente e entram em contato com você via WhatsApp.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Inteligência Artificial */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Inteligência Artificial
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Tecnologia avançada para cálculos precisos e análise inteligente
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="p-8 bg-white border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-3">Cálculo de Distância</h3>
                    <p className="text-gray-600 leading-relaxed">
                      A IA utiliza APIs de geolocalização para calcular a distância real entre origem e destino, considerando rotas e estradas.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-white border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-3">Estimativa de Preço</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Baseado em centenas de mudanças reais, a IA calcula uma faixa de preço considerando distância, tipo de imóvel, elevador e embalagem.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-white border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-3">Processamento Rápido</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Todo o cálculo acontece em poucos segundos. Você recebe a estimativa de preço e a lista de empresas disponíveis instantaneamente.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-white border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-3">Análise Inteligente</h3>
                    <p className="text-gray-600 leading-relaxed">
                      A IA analisa a complexidade da mudança, tipo de imóvel, necessidade de embalagem e outros fatores para uma estimativa mais precisa.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard para Empresas */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Dashboard para Empresas
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Sistema completo de gestão de leads e orçamentos
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 bg-gradient-to-br from-[#667eea]/5 to-[#764ba2]/5 border-l-4 border-[#667eea] border-0 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900">Gestão de Leads</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-0.5" />
                    <span>Visualize todos os orçamentos recebidos em tempo real</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-0.5" />
                    <span>Filtre por data, cidade, estado ou status</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-0.5" />
                    <span>Veja detalhes completos: origem, destino, tipo de imóvel, lista de objetos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-0.5" />
                    <span>Contato direto do cliente (nome, email, WhatsApp)</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 bg-gradient-to-br from-[#667eea]/5 to-[#764ba2]/5 border-l-4 border-[#667eea] border-0 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900">Perfil da Empresa</h3>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-0.5" />
                    <span>Gerencie informações da sua empresa (nome, logo, fotos)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-0.5" />
                    <span>Atualize serviços oferecidos e formas de pagamento</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-0.5" />
                    <span>Configure áreas de atuação e estados atendidos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#667eea] flex-shrink-0 mt-0.5" />
                    <span>Visualize estatísticas e performance</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Sistema de Notificações */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Sistema de Notificações
              </h2>
              <p className="text-lg text-gray-600">
                Como as empresas recebem os orçamentos
              </p>
            </div>

            <Card className="p-8 md:p-12 bg-white border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">Cliente Solicita Orçamento</h3>
                    <p className="text-gray-600">
                      Quando um cliente completa o cálculo no WhatsApp ou no site, o sistema salva automaticamente o orçamento no banco de dados.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">Busca Empresas no Estado</h3>
                    <p className="text-gray-600">
                      O sistema identifica o estado de destino e busca automaticamente todas as empresas parceiras ativas naquela região.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">Cria Vínculo Automático</h3>
                    <p className="text-gray-600">
                      Cada empresa encontrada é vinculada ao orçamento. Elas podem visualizar o lead no dashboard e entrar em contato diretamente com o cliente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">Cliente Recebe Links</h3>
                    <p className="text-gray-600">
                      O cliente recebe uma lista com links diretos do WhatsApp de cada empresa, facilitando o contato imediato.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Tecnologias Utilizadas */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Tecnologias Utilizadas
              </h2>
              <p className="text-lg text-gray-600">
                Stack tecnológico moderno e confiável
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 text-center bg-white border-l-4 border-[#667eea] border-0 shadow-md hover:shadow-lg transition-all">
                <Database className="w-12 h-12 text-[#667eea] mx-auto mb-4" />
                <h3 className="font-extrabold text-gray-900 mb-2">Supabase</h3>
                <p className="text-sm text-gray-600">Banco de dados PostgreSQL com autenticação e storage</p>
              </Card>

              <Card className="p-6 text-center bg-white border-l-4 border-[#667eea] border-0 shadow-md hover:shadow-lg transition-all">
                <Bot className="w-12 h-12 text-[#667eea] mx-auto mb-4" />
                <h3 className="font-extrabold text-gray-900 mb-2">OpenAI GPT-4o-mini</h3>
                <p className="text-sm text-gray-600">IA para cálculo de distâncias e estimativas de preço</p>
              </Card>

              <Card className="p-6 text-center bg-white border-l-4 border-[#667eea] border-0 shadow-md hover:shadow-lg transition-all">
                <Zap className="w-12 h-12 text-[#667eea] mx-auto mb-4" />
                <h3 className="font-extrabold text-gray-900 mb-2">Next.js 16</h3>
                <p className="text-sm text-gray-600">Framework React com App Router e Server Components</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
              Pronto para Começar?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Calcule o preço da sua mudança agora mesmo ou cadastre sua empresa
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/calcularmudanca">
                <button className="bg-white text-[#667eea] px-8 py-4 rounded-2xl font-extrabold text-lg hover:scale-105 transition-all duration-300 shadow-lg">
                  Calcular Orçamento
                </button>
              </Link>
              <Link href="/orcamento">
                <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-2xl font-extrabold text-lg hover:bg-white hover:text-[#667eea] transition-all duration-300">
                  Cadastrar Empresa
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

