// Neon Browser Service Worker - PWA
const CACHE_NAME = 'neon-browser-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/assets/logo.svg'
];

// ==================== INSTALL ====================
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache aberto, adicionando arquivos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Todos os arquivos em cache!');
      })
      .catch((err) => {
        console.error('❌ Erro ao cachear:', err);
      })
  );
  
  // Força o SW a ativar imediatamente
  self.skipWaiting();
});

// ==================== ACTIVATE ====================
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove caches antigos
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker ativado!');
    })
  );
  
  // Toma controle imediatamente
  return self.clients.claim();
});

// ==================== FETCH ====================
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna do cache
        if (response) {
          console.log('📦 Carregando do cache:', event.request.url);
          return response;
        }

        // Clone da request
        const fetchRequest = event.request.clone();

        // Busca na rede
        return fetch(fetchRequest).then((response) => {
          // Verifica se é uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone da response para cachear
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
              console.log('💾 Adicionado ao cache:', event.request.url);
            });

          return response;
        }).catch(() => {
          // Se falhar, tenta retornar página offline
          console.log('❌ Falha na rede, tentando cache...');
          return caches.match('/index.html');
        });
      })
  );
});

// ==================== BACKGROUND SYNC (Opcional) ====================
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  }
});

async function syncHistory() {
  console.log('🔄 Sincronizando histórico...');
  // Implementar sincronização com Supabase aqui se quiser
  // Por enquanto só loga
}

// ==================== PUSH NOTIFICATIONS (Opcional) ====================
self.addEventListener('push', (event) => {
  console.log('📬 Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Neon Browser',
    icon: '/assets/logo.svg',
    badge: '/assets/logo.svg',
    vibrate: [200, 100, 200],
    tag: 'neon-notification',
    actions: [
      { action: 'open', title: 'Abrir', icon: '/assets/logo.svg' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Neon Browser', options)
  );
});

// ==================== NOTIFICATION CLICK ====================
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada:', event.action);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// ==================== MESSAGE (Comunicação com App) ====================
self.addEventListener('message', (event) => {
  console.log('💬 Mensagem recebida:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('🧹 Cache limpo!');
      })
    );
  }
});

// ==================== LOGS ====================
console.log('💜 Neon Browser Service Worker carregado!');
console.log('📦 Cache:', CACHE_NAME);
console.log('📁 Arquivos:', urlsToCache.length);
