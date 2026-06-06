// service-worker.js для test

const CACHE_NAME = 'mi-n-d-v0.1.3.5';   // ← меняй версию при обновлении (v13, v14 и т.д.)

const urlsToCache = [
    '/',
    '/index.html',
    'manifest.json',
    'icons/icon-192.png',
    // Добавь сюда все важные файлы, если они есть отдельно
    // CSS и JS у тебя внутри HTML, поэтому основные файлы выше хватит для начала
];

// ==================== УСТАНОВКА (Install) ====================
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())   // сразу активируем новую версию
    );
});

// ==================== АКТИВАЦИЯ (Activate) ====================
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ==================== ЗАПРОСЫ (Fetch) ====================
// Стратегия: Cache First для статических файлов, Network First для данных
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Если есть в кэше — отдаём из кэша (быстро + оффлайн)
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Иначе идём в сеть
                return fetch(event.request).then(
                    networkResponse => {
                        // Кэшируем успешные ответы (опционально — можно кэшировать только определённые типы)
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseToCache));
                        }
                        return networkResponse;
                    }
                );
            })
            .catch(() => {
                // Если совсем нет сети и файла нет в кэше — можно показать оффлайн-страницу
                if (event.request.mode === 'navigate') {
                    return caches.match('/');
                }
            })
    );
});

// ==================== ОБНОВЛЕНИЕ (сообщение о новой версии) ====================
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Service Worker: Registered with cache', CACHE_NAME);