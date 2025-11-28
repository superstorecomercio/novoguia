const CACHE_NAME = "mudatech-painel-v3"
const urlsToCache = [
  "/painel/dashboard",
  "/painel/login"
]

// Instalar Service Worker e cachear recursos
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Cache aberto:", CACHE_NAME)
      // Não falhar se alguma URL não puder ser cacheada
      return Promise.allSettled(
        urlsToCache.map(url => 
          cache.add(url).catch(err => {
            console.warn(`[SW] Não foi possível cachear ${url}:`, err)
            return null
          })
        )
      )
    }),
  )
  self.skipWaiting()
})

// Ativar Service Worker e limpar caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Removendo cache antigo:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  
  // Ignorar requisições de API - sempre buscar da rede (não cachear)
  if (url.pathname.startsWith("/api/")) {
    return
  }

  // Ignorar requisições de outros domínios
  if (url.origin !== location.origin) {
    return
  }

  // Para páginas protegidas (dashboard), SEMPRE buscar da rede primeiro
  // para garantir que o middleware possa verificar autenticação
  if (url.pathname.startsWith("/painel/dashboard") || url.pathname === "/painel") {
    event.respondWith(
      fetch(event.request, {
        credentials: "include", // Incluir cookies na requisição
        cache: "no-store" // Não usar cache para páginas protegidas
      })
        .then((response) => {
          // Se a resposta foi um redirecionamento (301, 302, etc), seguir o redirecionamento
          if (response.redirected) {
            return response
          }
          // Se a resposta foi bem-sucedida, não cachear páginas protegidas
          // para garantir que sempre verifique autenticação
          return response
        })
        .catch(() => {
          // Se falhar a rede, redirecionar para login
          return Response.redirect(new URL("/painel/login", location.origin), 302)
        })
    )
    return
  }

  // Para outras páginas (login, etc), usar estratégia Network First
  event.respondWith(
    fetch(event.request, {
      credentials: "include"
    })
      .then((response) => {
        // Se a resposta foi bem-sucedida, cachear apenas páginas públicas
        if (response && response.status === 200 && url.pathname === "/painel/login") {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Se falhar a rede, tentar do cache
        console.log("[SW] Rede falhou, tentando cache para:", event.request.url)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          // Se for uma navegação e não tiver no cache, redirecionar para login
          if (event.request.mode === "navigate") {
            return Response.redirect(new URL("/painel/login", location.origin), 302)
          }
          
          // Para outros recursos, retornar erro
          return new Response("Recurso não disponível offline", {
            status: 503,
            statusText: "Service Unavailable"
          })
        })
      })
  )
})

