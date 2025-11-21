import { Card } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { MapPin, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function CitiesSection() {
  const cities = [
    {
      name: "São Paulo",
      state: "SP",
      companies: 150,
      image: "/s-o-paulo-skyline.jpg",
      slug: "sao-paulo-sp",
    },
    {
      name: "Rio de Janeiro",
      state: "RJ",
      companies: 120,
      image: "/rio-de-janeiro-christ.jpg",
      slug: "rio-de-janeiro-rj",
    },
    {
      name: "Belo Horizonte",
      state: "MG",
      companies: 85,
      image: "/belo-horizonte-cityscape.jpg",
      slug: "belo-horizonte-mg",
    },
    {
      name: "Brasília",
      state: "DF",
      companies: 95,
      image: "/brasilia-congress.jpg",
      slug: "brasilia-df",
    },
    {
      name: "Curitiba",
      state: "PR",
      companies: 70,
      image: "/curitiba-architecture.jpg",
      slug: "curitiba-pr",
    },
    {
      name: "Porto Alegre",
      state: "RS",
      companies: 65,
      image: "/porto-alegre-downtown.jpg",
      slug: "porto-alegre-rs",
    },
  ]

  return (
    <section id="cidades" className="py-20 lg:py-32 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground text-balance">Atendemos todo o Brasil</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Empresas de mudança verificadas nas principais cidades do país
          </p>
        </div>

        {/* Cities Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {cities.map((city, index) => (
            <Link key={index} href={`/cidades/${city.slug}`}>
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={city.image || "/placeholder.svg"}
                    alt={`${city.name}, ${city.state}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{city.state}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{city.name}</h3>
                  <p className="text-sm text-white/90">{city.companies} empresas disponíveis</p>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button variant="secondary" size="lg" className="rounded-full font-semibold pointer-events-none">
                    Ver Empresas
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/cidades">
            <Button variant="outline" size="lg" className="rounded-full font-semibold bg-transparent">
              Ver Todas as Cidades
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

