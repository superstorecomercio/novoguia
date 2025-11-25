"use client"

import { useState } from "react"
import { InstantCalculatorHybridTeste } from "@/app/components/InstantCalculatorHybridTeste"
import { cn } from "@/lib/utils"

export default function CalculadoraTestePage() {
  const [mostrarHeader, setMostrarHeader] = useState(true)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className={cn("container mx-auto px-4 py-8", mostrarHeader ? "pt-24 md:pt-28" : "pt-20 md:pt-24")}>
        {mostrarHeader && (
          <header className="mb-8 text-center space-y-4">
            <div className="space-y-3 font-[family-name:var(--font-montserrat)]">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                Calcule o valor da sua mudança em <span className="text-primary">menos de 15 segundos</span>
              </h1>
              <p className="text-base text-muted-foreground">
                Sem cadastro. Simples, rápido e 100% confiável.
              </p>
            </div>
            <div className="inline-block bg-primary/10 border-2 border-primary rounded-full px-6 py-2">
              <p className="text-primary font-semibold text-lg">⚡ Calculadora Instantânea</p>
            </div>
          </header>
        )}
        <InstantCalculatorHybridTeste onEstadoChange={(estado) => setMostrarHeader(estado !== "resultadoFinal")} />
      </div>
    </main>
  )
}

