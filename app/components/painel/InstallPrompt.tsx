"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Detectar se já está instalado (standalone mode)
    const standalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Se já está instalado, não mostrar
    if (standalone) {
      console.log("[PWA] App já está instalado")
      return
    }

    // Registrar Service Worker PRIMEIRO (necessário para PWA)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/painel/sw.js")
        .then((registration) => {
          console.log("[SW] Registrado com sucesso:", registration.scope)
          // Aguardar um pouco para o SW estar ativo
          return registration.update()
        })
        .catch((error) => {
          console.error("[SW] Falha ao registrar:", error)
        })
    }

    // Capturar evento de instalação (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      console.log("[PWA] ✅ Evento beforeinstallprompt capturado - pronto para instalar!")

      // Verificar se já instalou antes
      const hasInstalled = localStorage.getItem("pwa-installed")
      const hasDismissed = localStorage.getItem("pwa-dismissed")

      if (!hasInstalled && !hasDismissed) {
        // Mostrar prompt após 2 segundos
        setTimeout(() => setShowPrompt(true), 2000)
      } else {
        // Mesmo se já tiver sido dispensado, mostrar botão manual
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handler)
    
    // Log para debug
    console.log("[PWA] Aguardando evento beforeinstallprompt...")
    console.log("[PWA] HTTPS:", window.location.protocol === 'https:')
    console.log("[PWA] Localhost:", window.location.hostname === 'localhost')

    // Detectar se foi instalado
    window.addEventListener("appinstalled", () => {
      console.log("[PWA] ✅ App instalado com sucesso!")
      localStorage.setItem("pwa-installed", "true")
      setShowPrompt(false)
      setIsStandalone(true)
    })

    // Para iOS ou se não tiver o evento após 3 segundos, mostrar botão manual
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log("[PWA] ⚠️ Evento beforeinstallprompt não foi disparado")
        const hasDismissed = localStorage.getItem("pwa-dismissed")
        if (!hasDismissed && !standalone) {
          setShowPrompt(true)
        }
      }
    }, 3000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    console.log("[PWA] Botão de instalação clicado")
    console.log("[PWA] deferredPrompt disponível:", !!deferredPrompt)
    
    // Android/Chrome - usar prompt nativo
    if (deferredPrompt) {
      try {
        console.log("[PWA] Chamando prompt nativo...")
        // Mostrar o prompt nativo do navegador
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        console.log("[PWA] Resultado do prompt:", outcome)

        if (outcome === "accepted") {
          localStorage.setItem("pwa-installed", "true")
          setShowPrompt(false)
          console.log("[PWA] ✅ Usuário aceitou a instalação")
          // O evento 'appinstalled' será disparado automaticamente
        } else {
          console.log("[PWA] ❌ Usuário rejeitou a instalação")
        }

        setDeferredPrompt(null)
      } catch (error) {
        console.error("[PWA] ❌ Erro ao mostrar prompt:", error)
        // Se falhar, mostrar instruções manuais
        setShowPrompt(true)
      }
    } else {
      // Se não tiver deferredPrompt, mostrar instruções
      console.log("[PWA] ⚠️ deferredPrompt não disponível, mostrando instruções manuais")
      setShowPrompt(true)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", "true")
    setShowPrompt(false)
  }

  // Não mostrar se já está instalado
  if (isStandalone) {
    return null
  }

  // Mostrar botão sempre visível no header ou card flutuante
  return (
    <>
      {/* Botão fixo no canto superior direito - sempre visível */}
      {!isStandalone && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (deferredPrompt) {
              handleInstall()
            } else {
              setShowPrompt(true)
            }
          }}
          className="fixed top-4 right-4 z-50 gap-2 shadow-lg bg-background/95 backdrop-blur-sm"
        >
          <Download className="h-4 w-4" />
          Instalar App
        </Button>
      )}

      {/* Card flutuante expandido - aparece quando clicar no botão ou automaticamente */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md border-2 border-primary/20 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Instalar MudaTech
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {isIOS
                      ? "Toque no botão de compartilhar e selecione 'Adicionar à Tela de Início'"
                      : "Instale o app para acesso rápido e use offline"}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {deferredPrompt ? (
                <>
                  <Button 
                    onClick={handleInstall} 
                    className="w-full gap-2" 
                    size="lg"
                  >
                    <Download className="h-4 w-4" />
                    Instalar Agora
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    O prompt de instalação aparecerá automaticamente ao clicar
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      📱 Como instalar o app:
                    </p>
                    {isIOS ? (
                      <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                        <ol className="list-decimal list-inside space-y-1.5 ml-1">
                          <li>Toque no botão de <strong>compartilhar</strong> (⬆️) na barra inferior do Safari</li>
                          <li>Role para baixo e encontre <strong>"Adicionar à Tela de Início"</strong></li>
                          <li>Toque e confirme o nome do app</li>
                          <li>Toque em <strong>"Adicionar"</strong> no canto superior direito</li>
                        </ol>
                      </div>
                    ) : (
                      <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                        <ol className="list-decimal list-inside space-y-1.5 ml-1">
                          <li>Toque no <strong>menu do navegador</strong> (três pontos ⋮) no canto superior direito</li>
                          <li>Procure por <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></li>
                          <li>Toque na opção e confirme a instalação</li>
                        </ol>
                        <p className="mt-2 text-xs italic">
                          💡 Dica: Se não aparecer a opção, tente recarregar a página ou verifique se o app já está instalado.
                        </p>
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={() => {
                      // Tentar novamente capturar o evento
                      window.location.reload()
                    }}
                    variant="outline" 
                    className="w-full gap-2"
                  >
                    Recarregar Página
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

