"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/app/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.png"
              alt="Guia de Mudanças"
              width={200}
              height={40}
              className="h-8 lg:h-10 w-auto transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="#como-funciona"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Como Funciona
            </Link>
            <Link
              href="/cidades"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cidades
            </Link>
            <Link
              href="#empresas"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Empresas
            </Link>
            <Link
              href="/quem-somos"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sobre
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link href="/orcamento">
              <Button size="lg" className="rounded-full font-semibold">
                Solicitar Orçamento
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-foreground">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-border animate-in slide-in-from-top">
            <nav className="flex flex-col gap-4">
              <Link
                href="#como-funciona"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Como Funciona
              </Link>
              <Link
                href="/cidades"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cidades
              </Link>
              <Link
                href="#empresas"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Empresas
              </Link>
              <Link
                href="/quem-somos"
                className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sobre
              </Link>
              <Link href="/orcamento" onClick={() => setMobileMenuOpen(false)}
>
                <Button size="lg" className="rounded-full font-semibold w-full mt-2">
                  Solicitar Orçamento
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

