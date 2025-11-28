"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Não verificar autenticação na página de login
    if (pathname === "/painel/login" || pathname?.startsWith("/painel/login")) {
      setIsChecking(false)
      return
    }

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/cliente/auth/me", {
          credentials: "include",
        })

        if (!response.ok) {
          // Não autenticado, redirecionar para login
          const redirectUrl = `/painel/login?redirect=${encodeURIComponent(pathname || "/painel/dashboard")}`
          router.push(redirectUrl)
          return
        }

        const data = await response.json()
        if (!data.usuario) {
          router.push("/painel/login")
          return
        }

        // Autenticado, permitir acesso
        setIsChecking(false)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/painel/login")
      }
    }

    checkAuth()
  }, [router, pathname])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

