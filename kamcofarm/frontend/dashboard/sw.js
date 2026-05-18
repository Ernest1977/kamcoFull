// ========================================
// SERVICE WORKER — KAMCO FARM DASHBOARD PWA
// ========================================

const CACHE_NAME = 'kamco-dashboard-v2';
const OFFLINE_PAGE = '/admin/offline.html';

// Fichiers à mettre en cache
const STATIC_ASSETS = [
    './index.html',
    './dashboard.css',
    './dashboard.js',
    './manifest.json',
    './offline.html',
];

// Installation — mise en cache des assets statiques
self.addEventListener('install', event => {
    console.log('🔧 SW: Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('📦 SW: Mise en cache des assets');
            // Cacher chaque fichier individuellement pour éviter qu'un seul échec bloque tout
            return Promise.allSettled(
                STATIC_ASSETS.map(url => 
                    cache.add(url).catch(err => {
                        console.warn('⚠️ SW: Non caché:', url, err.message);
                    })
                )
            );
        })
        .then(() => self.skipWaiting())
    );
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', event => {
    console.log('✅ SW: Activation');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                .filter(name => name !== CACHE_NAME)
                .map(name => {
                    console.log('🗑️ SW: Suppression ancien cache:', name);
                    return caches.delete(name);
                })
            );
        })
        .then(() => self.clients.claim())
    );
});

// Fetch — stratégie Network First avec fallback cache
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Ne pas intercepter les requêtes API
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Ne pas intercepter les requêtes POST
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
        .then(response => {
            // Mettre en cache la réponse fraîche
            if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
            }
            return response;
        })
        .catch(() => {
            // Réseau indisponible — servir depuis le cache
            return caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Si la page n'est pas en cache, afficher la page offline
                if (event.request.mode === 'navigate') {
                    return caches.match(OFFLINE_PAGE);
                }
                return new Response('Offline', { status: 503 });
            });
        })
    );
});

// Push notification
self.addEventListener('push', event => {
    let data = { title: '🔔 KAMCO FARM', body: 'Nouvelle notification' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch(e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title || '🔔 KAMCO FARM', {
            body: data.body || '',
            icon: '/admin/icons/icon-192.png',
            badge: '/admin/icons/icon-96.png',
            vibrate: [200, 100, 200],
            tag: data.tag || 'kamco-' + Date.now(),
            requireInteraction: data.requireInteraction || false,
            data: data.data || { url: '/admin/index.html' },
            actions: [
                { action: 'open', title: '📂 Ouvrir' },
                { action: 'close', title: '✖ Fermer' }
            ]
        })
    );
});

// Clic sur notification
self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/admin/index.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
            for (const client of windowClients) {
                if (client.url.includes('dashboard') && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});

// Synchronisation en arrière-plan (quand le réseau revient)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        console.log('🔄 SW: Synchronisation en arrière-plan');
    }
});