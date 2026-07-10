const CACHE_NAME = 'eprashala-library-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/intry3.js',
    '/library_config.json',
    '/manifest.json',
    // Add any local CSS, fonts, or images here if you host them
    // Note: External CDNs (like Tailwind) should ideally be cached too, 
    // but caching external cross-origin requests requires specific CORS headers.
];

// Install Event: Pre-cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Pre-caching offline assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event: Clean up old caches if you update the CACHE_NAME version
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Cache-First strategy
self.addEventListener('fetch', (event) => {
    // Only handle GET requests (skip POST requests like the Gemini API call)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }
            // Otherwise, fetch from the network
            return fetch(event.request).catch(() => {
                // Optional: Return a specific fallback page if network fails and item isn't cached
                console.log('[Service Worker] Fetch failed; returning offline page instead.');
            });
        })
    );
});