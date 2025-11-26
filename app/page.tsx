"use client"

import { Button } from "@/app/components/ui/button"
import { Card } from "@/app/components/ui/card"
import { Star, Check, Shield, Zap, Building2, Package, MessageCircle, TrendingUp, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

const WHATSAPP_URL = "https://wa.me/15551842523?text=Ol%C3%A1,%20quero%20calcular%20a%20minha%20mudan%C3%A7a!"

// Função para gerar um número dinâmico que muda a cada hora
const getPessoasSolicitaram = () => {
  const base = 113
  const now = new Date()
  const hour = now.getHours() // 0-23
  const day = now.getDate() // 1-31

  // Variação baseada na hora e no dia para parecer "aleatório" mas ser consistente por hora
  const variation = Math.floor((hour * 13 + day * 7) % 100) // Garante variação entre 0-99
  return base + variation
}

const testimonials = [
  {
    name: "Maria Silva",
    route: "São Paulo → Rio de Janeiro",
    text: "Não acreditei quando recebi 5 orçamentos em menos de 5 minutos! Consegui negociar e economizei quase R$ 1.000 comparando os preços. O processo todo pelo WhatsApp foi super prático.",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    name: "João Costa",
    route: "Curitiba → Florianópolis",
    text: "O valor estimado foi muito próximo do que realmente paguei. A empresa que escolhi foi super profissional e o orçamento que recebi aqui ajudou muito na negociação.",
    avatar: "https://i.pravatar.cc/150?img=33",
  },
  {
    name: "Ana Paula",
    route: "Brasília → Goiânia",
    text: "Adorei a praticidade! Não precisei ficar ligando para várias empresas. Recebi os contatos direto no WhatsApp e já consegui fechar o negócio no mesmo dia.",
    avatar: "https://i.pravatar.cc/150?img=20",
  },
  {
    name: "Carlos Mendes",
    route: "Belo Horizonte → Vitória",
    text: "Estava com medo de ser golpe, mas todas as empresas que me contataram eram sérias e verificadas. O preço ficou dentro do que eu esperava e o serviço foi excelente!",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Juliana Santos",
    route: "Porto Alegre → Caxias do Sul",
    text: "Mudança de última hora e consegui resolver tudo rapidinho! A Julia (a assistente) foi super atenciosa e me ajudou a entender todos os detalhes. Recomendo demais!",
    avatar: "https://i.pravatar.cc/150?img=45",
  },
  {
    name: "Roberto Alves",
    route: "Salvador → Aracaju",
    text: "Comparar preços nunca foi tão fácil. Recebi 4 propostas diferentes e consegui escolher a melhor relação custo-benefício. O processo todo levou menos de 10 minutos!",
    avatar: "https://i.pravatar.cc/150?img=15",
  },
  {
    name: "Fernanda Lima",
    route: "Recife → Maceió",
    text: "Primeira vez que uso um serviço assim e fiquei impressionada! Recebi 6 empresas diferentes, todas com preços competitivos. Escolhi uma que tinha ótimas avaliações.",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
  {
    name: "Pedro Henrique",
    route: "Fortaleza → Natal",
    text: "O cálculo foi super preciso! A diferença entre o valor estimado e o real foi de apenas R$ 150. As empresas que me contataram foram todas muito profissionais.",
    avatar: "https://i.pravatar.cc/150?img=51",
  },
  {
    name: "Larissa Oliveira",
    route: "Manaus → Belém",
    text: "Mudança interestadual sempre é complicada, mas aqui foi super simples. Recebi várias opções e consegui negociar um preço melhor. Recomendo para quem precisa de mudança!",
    avatar: "https://i.pravatar.cc/150?img=28",
  },
  {
    name: "Rafael Souza",
    route: "Campinas → Ribeirão Preto",
    text: "Economizei tempo e dinheiro! Não precisei pesquisar empresas manualmente. Em poucos minutos já tinha várias propostas para comparar. Valeu muito a pena!",
    avatar: "https://i.pravatar.cc/150?img=8",
  },
  {
    name: "Patricia Rocha",
    route: "Florianópolis → Joinville",
    text: "Adorei a experiência! A assistente virtual foi super educada e me ajudou em tudo. Recebi orçamentos de empresas confiáveis e fechei com a melhor proposta.",
    avatar: "https://i.pravatar.cc/150?img=36",
  },
  {
    name: "Marcos Ferreira",
    route: "Vitória → Vila Velha",
    text: "Mudança comercial e consegui resolver tudo pelo WhatsApp mesmo. As empresas entenderam minhas necessidades e me deram propostas personalizadas. Excelente serviço!",
    avatar: "https://i.pravatar.cc/150?img=13",
  },
  {
    name: "Camila Rodrigues",
    route: "São Luís → Teresina",
    text: "Super prático e rápido! Em menos de 3 minutos já tinha recebido os primeiros orçamentos. Consegui fechar no mesmo dia e a mudança foi perfeita.",
    avatar: "https://i.pravatar.cc/150?img=44",
  },
  {
    name: "Thiago Martins",
    route: "João Pessoa → Campina Grande",
    text: "Não esperava que fosse tão fácil! Recebi 5 empresas diferentes, todas verificadas. O preço ficou bem abaixo do que eu imaginava. Super recomendo!",
    avatar: "https://i.pravatar.cc/150?img=19",
  },
  {
    name: "Beatriz Almeida",
    route: "Aracaju → Maceió",
    text: "Primeira experiência com mudança e foi perfeita! A plataforma me guiou em tudo e recebi empresas sérias. O processo todo foi muito tranquilo e organizado.",
    avatar: "https://i.pravatar.cc/150?img=52",
  },
  {
    name: "Lucas Barbosa",
    route: "Natal → João Pessoa",
    text: "Comparação de preços em tempo real foi o diferencial! Consegui ver todas as propostas lado a lado e escolher a melhor. Economizei quase R$ 600!",
    avatar: "https://i.pravatar.cc/150?img=24",
  },
  {
    name: "Isabela Costa",
    route: "Goiânia → Uberlândia",
    text: "Mudança de última hora e consegui resolver rapidinho! Recebi várias opções e fechei com uma empresa que tinha disponibilidade imediata. Salvaram minha vida!",
    avatar: "https://i.pravatar.cc/150?img=41",
  },
  {
    name: "Gabriel Nunes",
    route: "Cuiabá → Campo Grande",
    text: "Serviço excelente! O cálculo foi preciso e as empresas que me contataram foram todas muito profissionais. A mudança aconteceu sem nenhum problema.",
    avatar: "https://i.pravatar.cc/150?img=16",
  },
]

function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerPage = 3
  const totalPages = Math.ceil(testimonials.length / itemsPerPage)

  const currentTestimonials = testimonials.slice(
    currentIndex * itemsPerPage,
    (currentIndex * itemsPerPage) + itemsPerPage
  )

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200"
          aria-label="Depoimento anterior"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200"
          aria-label="Próximo depoimento"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 px-8 md:px-0">
          {currentTestimonials.map((testimonial, i) => (
            <Card key={`${currentIndex}-${i}`} className="p-6 bg-white border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-3">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#FFD700] text-[#FFD700] drop-shadow-[0_2px_4px_rgba(255,215,0,0.5)] stroke-black stroke-[1]" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic leading-relaxed">&quot;{testimonial.text}&quot;</p>
              <div className="border-t pt-4 flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.route}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Dots Navigation */}
      <div className="flex justify-center items-center gap-2 mt-8">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-[#667eea] w-8"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [pessoasSolicitaram, setPessoasSolicitaram] = useState(getPessoasSolicitaram())

  // Atualizar a cada minuto (para garantir que mude na hora certa)
  useEffect(() => {
    const interval = setInterval(() => {
      setPessoasSolicitaram(getPessoasSolicitaram())
    }, 60000) // 60 segundos

    return () => clearInterval(interval)
  }, [])
  const cidadesPopulares = [
    {
      nome: "São Paulo",
      slug: "sao-paulo-sp",
      estado: "SP",
      descricao: "Empresas verificadas em SP",
      servicos: ["Mudanças", "Carretos", "Guarda-móveis"],
      imagem: "/s-o-paulo-skyline.jpg"
    },
    {
      nome: "Rio de Janeiro",
      slug: "rio-de-janeiro-rj",
      estado: "RJ",
      descricao: "Empresas verificadas no Rio",
      servicos: ["Mudanças", "Carretos", "Guarda-móveis"],
      imagem: "/rio-de-janeiro-christ.jpg"
    },
    {
      nome: "Curitiba",
      slug: "curitiba-pr",
      estado: "PR",
      descricao: "Empresas verificadas em Curitiba",
      servicos: ["Mudanças", "Carretos", "Guarda-móveis"],
      imagem: "/curitiba-architecture.jpg"
    },
    {
      nome: "Porto Alegre",
      slug: "porto-alegre-rs",
      estado: "RS",
      descricao: "Empresas verificadas em Porto Alegre",
      servicos: ["Mudanças", "Carretos", "Guarda-móveis"],
      imagem: "/porto-alegre-downtown.jpg"
    },
    {
      nome: "Brasília",
      slug: "brasilia-df",
      estado: "DF",
      descricao: "Empresas verificadas no DF",
      servicos: ["Mudanças", "Carretos", "Guarda-móveis"],
      imagem: "/brasilia-congress.jpg"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-animated">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 md:py-32 pt-12 md:pt-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge: Comparar e Receber Cotações */}
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-6 md:mb-8 animate-fade-in-up shadow-lg">
            <Building2 className="w-3 h-3 md:w-4 md:h-4 text-[#667eea]" />
            <span className="text-xs md:text-sm font-medium text-gray-800">Compare preços e receba cotações de empresas verificadas</span>
          </div>

          {/* Rating */}
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg mb-6 md:mb-10 animate-fade-in-up animation-delay-100">
            <div className="flex gap-0.5 md:gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-[#FFD700] text-[#FFD700] drop-shadow-[0_2px_4px_rgba(255,215,0,0.5)] stroke-black stroke-[1]" />
              ))}
            </div>
            <span className="text-xs md:text-sm font-bold text-gray-900">4.9/5 - Mais de 10.000 orçamentos realizados</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl md:text-7xl font-extrabold text-white mb-4 md:mb-8 animate-fade-in-up animation-delay-200 text-balance drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] leading-tight">
            Calcule o preço da sua mudança <span className="text-[#FFD700]">em segundos</span>
          </h1>

          <p className="text-base md:text-3xl text-white/95 mb-8 md:mb-12 animate-fade-in-up animation-delay-300 text-balance font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
            Descubra o valor real da sua mudança em 60 segundos pelo WhatsApp
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-6 md:mb-12 text-white animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-base font-semibold">
              <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FFD700]" />
              <span>Grátis</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-base font-semibold">
              <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FFD700]" />
              <span>Rápido</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-base font-semibold">
              <Check className="w-4 h-4 md:w-5 md:h-5 text-[#FFD700]" />
              <span>Sem Cadastro</span>
            </div>
          </div>

          {/* CTA Button - PREMIUM */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block animate-fade-in-up animation-delay-500 mb-4 md:mb-0"
          >
            <button
              className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-base md:text-2xl px-8 md:px-[60px] py-4 md:py-[25px] rounded-2xl shadow-[0_15px_50px_rgba(37,211,102,0.5)] hover:shadow-[0_20px_60px_rgba(37,211,102,0.7)] hover:scale-110 transition-all duration-300 font-extrabold animate-glow w-full md:w-auto"
            >
              💬 Calcular no WhatsApp Grátis
            </button>
          </a>

          {/* Urgency Badge - GRADIENT LARANJA/VERMELHO COM FOGO */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF6B35] via-[#FF4500] to-[#FF1744] text-white px-4 py-2 md:px-8 md:py-4 rounded-full font-extrabold mt-4 md:mt-8 animate-fade-in-up animation-delay-600 shadow-[0_8px_30px_rgba(255,107,53,0.4)] text-sm md:text-base">
            <span className="animate-fire text-lg md:text-2xl">🔥</span>
            <span>{pessoasSolicitaram} pessoas solicitaram orçamento hoje</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="bg-white/95 backdrop-blur-sm py-24 md:py-36">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-extrabold text-center text-gray-900 mb-16 md:mb-20">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-12 max-w-5xl mx-auto">
            {[
              { icon: "📱", title: "Clique no Botão", desc: "Em 2 segundos você já está conversando" },
              {
                icon: "💬",
                title: "Fale com Julia",
                desc: "Nossa IA faz 10 perguntas rápidas sobre sua mudança",
              },
              {
                icon: "💰",
                title: "Receba Orçamento",
                desc: "Preço real + contato de empresas verificadas",
              },
            ].map((step, i) => (
              <Card
                key={i}
                className="p-6 md:p-10 text-center bg-white border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-3"
              >
                <div className="text-5xl md:text-7xl mb-4 md:mb-6">{step.icon}</div>
                <h3 className="text-xl md:text-2xl font-extrabold mb-3 md:mb-4 text-gray-900">{step.title}</h3>
                <p className="text-base md:text-lg text-gray-600 font-medium">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-24 md:py-36">
        <h2 className="text-4xl md:text-6xl font-extrabold text-center text-gray-900 mb-16 md:mb-20">Por Que Escolher o MudaTech?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: TrendingUp,
              title: "Inteligência Artificial",
              desc: "IA calcula distância real e complexidade da mudança",
            },
            {
              icon: MessageCircle,
              title: "Preço Realista",
              desc: "Baseado em centenas de mudanças reais já realizadas",
            },
            { icon: Building2, title: "Empresas Verificadas", desc: "Até 10 transportadoras confiáveis e avaliadas" },
            { icon: Package, title: "Completo", desc: "Inclui embalagem, elevador e lista de objetos" },
            { icon: Zap, title: "Super Rápido", desc: "Resposta instantânea via WhatsApp" },
            { icon: Shield, title: "Seguro", desc: "Seus dados protegidos e empresas verificadas" },
          ].map((benefit, i) => {
            const Icon = benefit.icon
            return (
              <Card
                key={i}
                className="p-8 bg-white border-l-4 border-[#667eea] border-0 shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-3"
              >
                <Icon className="w-14 h-14 text-[#667eea] mb-5" />
                <h3 className="text-xl font-extrabold mb-3 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600 text-base font-medium">{benefit.desc}</p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white/95 backdrop-blur-sm py-24 md:py-36">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-extrabold text-center text-gray-900 mb-16 md:mb-20">
            O Que Nossos Clientes Dizem
          </h2>
          
          <TestimonialsCarousel />
        </div>
      </section>

      {/* Seção de Cidades Populares */}
      <section className="py-24 md:py-36 px-4 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#667eea]/10 rounded-full mb-4">
              <TrendingUp className="w-5 h-5 text-[#667eea]" />
              <span className="text-sm font-bold text-[#667eea]">Buscas Populares</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-extrabold text-gray-900">
              Encontre Empresas nas Principais Cidades
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
              Acesse diretamente as empresas mais procuradas em cada cidade
            </p>
          </div>

          {/* Grid de Cidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 relative z-10">
            {cidadesPopulares.map((cidade) => (
              <Link
                key={cidade.slug}
                href={`/cidades/${cidade.slug}`}
                className="group relative overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-3 bg-white border-l-4 border-[#667eea] border-0 cursor-pointer"
              >
                {/* Imagem de Fundo */}
                <div className="relative h-48 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${cidade.imagem})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Nome da Cidade */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-white" />
                      <span className="text-sm font-medium text-white/90">{cidade.estado}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {cidade.nome}
                    </h3>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-5 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {cidade.descricao}
                  </p>
                  
                  {/* Serviços */}
                  <div className="flex flex-wrap gap-2">
                    {cidade.servicos.map((servico) => (
                      <span
                        key={servico}
                        className="text-xs px-3 py-1 bg-[#667eea]/10 text-[#667eea] font-medium rounded-full"
                      >
                        {servico}
                      </span>
                    ))}
                  </div>

                  {/* Link */}
                  <div className="pt-2">
                    <span className="text-sm font-semibold text-[#667eea] group-hover:text-[#764ba2] transition-colors inline-flex items-center gap-1">
                      Ver empresas
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Link para todas as cidades */}
          <div className="text-center mt-12 md:mt-16">
            <Link
              href="/cidades"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-[#667eea] text-[#667eea] font-extrabold rounded-xl hover:bg-gradient-to-r hover:from-[#667eea] hover:to-[#764ba2] hover:text-white transition-all duration-300 shadow-[0_10px_40px_rgba(102,126,234,0.3)] hover:shadow-[0_15px_50px_rgba(102,126,234,0.5)]"
            >
              <MapPin className="w-5 h-5" />
              Ver todas as cidades
            </Link>
          </div>
        </div>
      </section>

      {/* Anuncie sua empresa */}
      <section className="bg-white/95 backdrop-blur-sm py-24 md:py-36">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 md:mb-8 text-balance">
              Anuncie sua empresa
            </h2>
            <p className="text-lg md:text-xl text-gray-600 mb-8 md:mb-10">
              Aumente sua visibilidade e receba mais orçamentos de clientes qualificados
            </p>
            <Link href="/orcamento">
              <button
                className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-lg md:text-xl px-12 md:px-[60px] py-4 md:py-[25px] rounded-2xl shadow-[0_10px_40px_rgba(102,126,234,0.4)] hover:shadow-[0_15px_50px_rgba(102,126,234,0.6)] hover:scale-110 transition-all duration-300 font-extrabold"
              >
                📢 Cadastrar Empresa
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-animated py-24 md:py-36">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-7xl font-extrabold text-white mb-10 text-balance drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
              Pronto Para Saber o Valor da Sua Mudança?
            </h2>

            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-block mb-8">
              <button
                className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-xl md:text-2xl px-[60px] py-[25px] rounded-2xl shadow-[0_15px_50px_rgba(37,211,102,0.5)] hover:shadow-[0_20px_60px_rgba(37,211,102,0.7)] hover:scale-110 transition-all duration-300 font-extrabold animate-glow"
              >
                💬 Começar Agora no WhatsApp
              </button>
            </a>

            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF6B35] via-[#FF4500] to-[#FF1744] text-white px-8 py-4 rounded-full font-extrabold shadow-[0_8px_30px_rgba(255,107,53,0.4)]">
              <span className="animate-fire text-2xl">⏰</span>
              <span>Atenção: Vagas limitadas para orçamentos hoje!</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
