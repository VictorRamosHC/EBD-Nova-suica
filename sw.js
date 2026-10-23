// Service Worker para EBD Nova Suíça (v2 Modular - Neo-Sacred Glass)
const CACHE_NAME = 'ebd-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.jpg',
  '/background_ebd_1.jpg',
  '/css/tokens.css',
  '/css/layout.css',
  '/css/components.css',
  '/js/app.js',
  '/js/core/store.js',
  '/js/core/router.js',
  '/js/core/haptics.js',
  '/js/modules/chamada.js',
  '/js/modules/modoRapido.js',
  '/js/modules/caixa.js',
  '/js/modules/ranking.js',
  '/js/modules/memorias.js',
  '/js/modules/sync.js',
  '/js/modules/admin.js'
];

// Instalação: cache resiliente dos assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) => 
          cache.add(asset).catch((err) => {
            console.warn('[SW] Falha ao cachear asset estático:', asset, err);
          })
        )
      );
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

// Fetch: estratégia cache-first com runtime caching para CDN (Chart.js / jsPDF) e network-first para APIs
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
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/index.html') || caches.match('/');
        });
      })
    );
    return;
  }

  // Para recursos estáticos (js, css, imagens, cdn): cache-first com runtime caching
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Atualização em background (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
        }).catch(() => {});
        return cached;
      }

      // Se não está em cache, busca na rede e guarda em cache (para CDN js/css/fontes)
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.destination === 'image') {
          return caches.match('/background_ebd_1.jpg');
        }
        return new Response('Recurso offline indisponível', { status: 503 });
      });
    })
  );
});
