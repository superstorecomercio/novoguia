"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Registrar Service Worker quando o componente carregar
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/painel/sw.js", { scope: "/painel/" })
        .then((registration) => {
          console.log("[SW] ✅ Service Worker registrado:", registration.scope)
          console.log("[SW] Estado:", registration.active ? "Ativo" : "Aguardando ativação")
          
          // Verificar se há uma nova versão disponível
          registration.addEventListener("updatefound", () => {
            console.log("[SW] 🔄 Nova versão do Service Worker encontrada")
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[SW] ⚠️ Nova versão disponível. Recarregue a página para atualizar.")
                }
              })
            }
          })
          
          // Forçar atualização para garantir que está ativo
          return registration.update()
        })
        .then(() => {
          console.log("[SW] ✅ Service Worker verificado e atualizado")
        })
        .catch((error) => {
          console.error("[SW] ❌ Erro ao registrar Service Worker:", error)
        })
    } else {
      console.warn("[SW] ⚠️ Service Worker não suportado neste navegador")
    }
  }, [])

  return null
}

