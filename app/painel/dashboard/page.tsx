"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Truck, Users, FileText, Loader2, Download } from "lucide-react"
import { InstallPrompt } from "@/app/components/painel/InstallPrompt"

interface Usuario {
  id: string
  email: string
  empresa_id: string | null
  nome: string | null
  telefone: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [canInstall, setCanInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    const standalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Verificar se pode instalar
    const checkInstall = () => {
      // Para Android/Chrome
      if ('serviceWorker' in navigator) {
        setCanInstall(true)
      }
    }

    checkInstall()
  }, [])

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const response = await fetch("/api/cliente/auth/me", {
          credentials: "include", // Garantir que cookies sejam enviados
        })
        if (!response.ok) {
          // Limpar qualquer token inválido
          document.cookie = "cliente_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
          router.push("/painel/login")
          return
        }
        const data = await response.json()
        if (!data.usuario) {
          router.push("/painel/login")
          return
        }
        setUsuario(data.usuario)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        // Limpar qualquer token inválido
        document.cookie = "cliente_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push("/painel/login")
      } finally {
        setLoading(false)
      }
    }

    fetchUsuario()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">MudaTech Dashboard</h1>
              <p className="text-sm text-muted-foreground">{usuario.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isStandalone && canInstall && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Scroll para o prompt de instalação
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                }}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Instalar App
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                fetch("/api/cliente/auth/logout", { method: "POST" })
                router.push("/painel/login")
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bem-vindo, {usuario.nome || "Usuário"}!</h2>
          <p className="text-muted-foreground">Gerencie seus leads e propostas de mudança</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Leads recebidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Aguardando resposta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamentos Enviados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Propostas enviadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
            <CardDescription>Seus leads aparecerão aqui</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead ainda. Quando você receber leads, eles aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      </main>

      <InstallPrompt />
    </div>
  )
}

