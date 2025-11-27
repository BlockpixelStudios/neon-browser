// Service Worker para Neon Browser PWA
const CACHE_NAME = 'neon-browser-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '../src/index.html',
  '../src/styles.css',
  '../src/renderer.js',
  '../assets/logo.svg'
];

// Install
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('❌ Erro ao cachear:', err))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta do cache
        if (response) {
          return response;
        }

        // Clone da request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verifica se é uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone da response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Offline fallback
          return caches.match('/index.html');
        });
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  }
});

async function syncHistory() {
  console.log('🔄 Sincronizando histórico...');
  // Implementar sincronização com Supabase aqui
}

// Push Notifications (opcional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Neon Browser',
    icon: '../assets/logo.svg',
    badge: '../assets/logo.svg',
    vibrate: [200, 100, 200],
    tag: 'neon-notification',
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Neon Browser', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('💜 Neon Browser Service Worker carregado!');
