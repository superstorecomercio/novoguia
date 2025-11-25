"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Registrar Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[SW] Registrado com sucesso:", registration)
        })
        .catch((error) => {
          console.log("[SW] Falha ao registrar:", error)
        })
    }

    // Capturar evento de instalação
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Verificar se já instalou antes
      const hasInstalled = localStorage.getItem("pwa-installed")
      const hasDismissed = localStorage.getItem("pwa-dismissed")

      if (!hasInstalled && !hasDismissed) {
        // Mostrar prompt após 3 segundos
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Detectar se foi instalado
    window.addEventListener("appinstalled", () => {
      localStorage.setItem("pwa-installed", "true")
      setShowPrompt(false)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true")
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", "true")
    setShowPrompt(false)
  }

  if (!showPrompt || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">Instalar MudaTech</CardTitle>
              <CardDescription className="mt-1">Instale o app para acesso rápido e use offline</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <Button onClick={handleInstall} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Instalar Aplicativo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
