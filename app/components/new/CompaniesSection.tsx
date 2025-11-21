import { Card } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Star, Shield, Phone } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function CompaniesSection() {
  const companies = [
    {
      name: "TransMudança Express",
      rating: 4.9,
      reviews: 328,
      badge: "Destaque",
      services: ["Mudança Residencial", "Embalagem", "Montagem"],
      price: "A partir de R$ 800",
      logo: "/moving-company-logo-blue.jpg",
    },
    {
      name: "Mudanças Prime",
      rating: 4.8,
      reviews: 256,
      badge: "Verificada",
      services: ["Mudança Comercial", "Guarda-Móveis", "Longa Distância"],
      price: "A partir de R$ 950",
      logo: "/moving-company-logo-green.jpg",
    },
    {
      name: "Carrega Tudo Mudanças",
      rating: 4.7,
      reviews: 189,
      badge: "Confiável",
      services: ["Mudança Local", "Desmontagem", "Transporte"],
      price: "A partir de R$ 650",
      logo: "/moving-truck-logo.jpg",
    },
  ]

  return (
    <section id="empresas" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground text-balance">Empresas de confiança</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Todas as empresas são verificadas e avaliadas por clientes reais
          </p>
        </div>

        {/* Companies Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {companies.map((company, index) => (
            <Card key={index} className="p-6 border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0 relative">
                    <Image
                      src={company.logo || "/placeholder.svg"}
                      alt={company.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{company.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{company.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({company.reviews} avaliações)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div className="mb-4">
                <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-0">
                  <Shield className="w-3 h-3 mr-1" />
                  {company.badge}
                </Badge>
              </div>

              {/* Services */}
              <div className="space-y-3 mb-6">
                {company.services.map((service, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-muted-foreground">{service}</span>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="mb-6 p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Preço estimado</p>
                <p className="text-lg font-bold text-primary">{company.price}</p>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="lg" className="rounded-xl bg-transparent">
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar
                </Button>
                <Link href="/orcamento">
                  <Button size="lg" className="w-full rounded-xl font-semibold">
                    Solicitar
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/cidades">
            <Button size="lg" className="rounded-full font-semibold px-8">
              Ver Todas as Empresas
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

