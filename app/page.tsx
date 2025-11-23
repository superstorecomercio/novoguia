import { HeroSection } from "@/app/components/new/HeroSection"
import Link from "next/link"
import { MapPin, TrendingUp, Calculator, Building2 } from "lucide-react"

export default function Home() {
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
    <div className="min-h-screen">
      <main>
        <HeroSection />
        
        {/* Botões de Ação Principal */}
        <section className="py-8 md:py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                  Calcule o preço da sua mudança{" "}
                  <span className="text-primary">em segundos</span>
                </h1>
                <div className="flex items-center justify-center gap-6 text-lg font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    Grátis
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    Rápido
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    Sem Cadastro
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 relative z-10">
                <Link
                  href="/calculadorateste"
                  className="group relative p-6 md:p-8 bg-white border-2 border-primary rounded-2xl hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10 cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4 text-left pointer-events-none">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Calculator className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        CALCULADORA INSTANTÂNEA
                      </h3>
                      <p className="text-muted-foreground">
                        Calcule o preço da sua mudança em segundos
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/cidades/sao-paulo-sp"
                  className="group relative p-6 md:p-8 bg-white border-2 border-border rounded-2xl hover:shadow-xl transition-all duration-300 hover:border-primary cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4 text-left pointer-events-none">
                    <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                      <Building2 className="w-8 h-8 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Ver empresas de mudanças
                      </h3>
                      <p className="text-muted-foreground">
                        Encontre as melhores empresas da sua região
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Seção de Cidades Populares */}
        <section className="py-12 md:py-16 px-4 bg-gradient-to-br from-slate-50 to-white">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 md:mb-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">Buscas Populares</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Encontre Empresas nas Principais Cidades
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Acesse diretamente as empresas mais procuradas em cada cidade
              </p>
            </div>

            {/* Grid de Cidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 relative z-10">
              {cidadesPopulares.map((cidade) => (
                <Link
                  key={cidade.slug}
                  href={`/cidades/${cidade.slug}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white border border-slate-200 cursor-pointer active:scale-[0.98]"
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
                          className="text-xs px-3 py-1 bg-accent/10 text-accent font-medium rounded-full"
                        >
                          {servico}
                        </span>
                      ))}
                    </div>

                    {/* Link */}
                    <div className="pt-2">
                      <span className="text-sm font-semibold text-primary group-hover:text-accent transition-colors inline-flex items-center gap-1">
                        Ver empresas
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Link para todas as cidades */}
            <div className="text-center mt-8 md:mt-10">
              <Link
                href="/cidades"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all duration-300 shadow-md hover:shadow-xl"
              >
                <MapPin className="w-5 h-5" />
                Ver todas as cidades
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
