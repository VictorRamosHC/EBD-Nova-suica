// Service Worker para EBD Nova Suíça
const CACHE_NAME = 'ebd-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.jpg',
  '/background_ebd_1.jpg'
];

// Instalação: cache dos assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW: erro no install cache', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: estratégia cache-first para assets estáticos, network-first para HTML
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Para requisições de API (Google Sheets), sempre vai para a rede
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para documentos HTML, tenta rede com fallback para cache
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(( cached ) => {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Para demais recursos (js, css, imagens): cache-first com validação de staleness
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Clona a requisição para não consumir o stream
        const networkPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fallback silencioso se rede falhar
        });
        return cached;
      }
      return fetch(event.request).catch(() => {
        // Se o recurso não está em cache e a rede falha, mostra erro gentle
        if (event.request.destination === 'image') {
          return caches.match('/background_ebd_1.jpg');
        }
        return new Response('Recurso não disponível offline', { status: 503 });
      });
    })
  );
});

// Background sync para quando a conexão voltar (opcional, extensível)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-chamados') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Hook para sincronização de dados pendentes quando online
  // Pode ser expandido para enqueue de chamadas não enviadas
  console.log('[SW] sync-chamados: verificando dados pendentes');
}
