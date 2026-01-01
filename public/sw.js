const CACHE_VERSION = '__BUILD_VERSION__'; // Será substituído no build
const CACHE_NAME = `asperus-dashboard-${CACHE_VERSION}`;
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Skip waiting - ativa imediatamente quando nova versão é instalada
self.addEventListener('install', (event) => {
  console.log('SW: Installing version', CACHE_VERSION);
  self.skipWaiting(); // Ativa imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('SW: Cache failed', error);
      })
  );
});

// Claim clients - assume controle imediatamente
self.addEventListener('activate', (event) => {
  console.log('SW: Activating version', CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assume controle imediatamente
      self.clients.claim()
    ])
  );
});

// Network-first para HTML, cache-first para assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network-first para páginas HTML (garante sempre última versão)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone e cache a resposta
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback para cache se offline
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first para assets (CSS, JS, imagens)
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            // Clone e cache novos assets
            if (response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          });
        })
    );
  }
});

// Notificar clientes sobre nova versão disponível
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
