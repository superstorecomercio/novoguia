const CACHE_NAME = "mudatech-v1"
const urlsToCache = ["/", "/dashboard", "/profile", "/login", "/globals.css"]

// Instalar Service Worker e cachear recursos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Cache aberto")
      return cache.addAll(urlsToCache)
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
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - retorna a resposta do cache
      if (response) {
        return response
      }

      // Clone da requisição
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest)
        .then((response) => {
          // Verifica se é uma resposta válida
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone da resposta
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Se falhar, tenta retornar página offline
          return caches.match("/")
        })
    }),
  )
})
