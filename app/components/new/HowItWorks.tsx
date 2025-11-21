import { Card } from "@/app/components/ui/card"
import { ClipboardList, Users, CheckCircle } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: ClipboardList,
      title: "Preencha o formulário",
      description: "Informe os detalhes da sua mudança em menos de 2 minutos. É rápido, fácil e gratuito.",
    },
    {
      number: "02",
      icon: Users,
      title: "Receba propostas",
      description: "Empresas verificadas enviam orçamentos personalizados direto para você comparar.",
    },
    {
      number: "03",
      icon: CheckCircle,
      title: "Escolha e contrate",
      description: "Compare preços, avaliações e serviços. Escolha a melhor opção e agende sua mudança.",
    },
  ]

  return (
    <section id="como-funciona" className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground text-balance">Como funciona?</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Simplificamos todo o processo para você encontrar a empresa perfeita em 3 passos simples
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card
                key={index}
                className="relative p-8 border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30"
              >
                {/* Step Number */}
                <div className="absolute top-0 right-8 -translate-y-1/2">
                  <div className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-xl shadow-lg">
                    {step.number}
                  </div>
                </div>

                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mb-6">
                  <Icon className="w-8 h-8 text-accent" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

