const CACHE_NAME = 'eprashala-library-v4.8'; 

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/in.js',
    '/intry.js',
    '/intry3.js',
    '/swar.js',
    '/swara.js',
    '/tools.html',
    '/dhwani.html',
    '/kundli.html',	
    '/appteach1.js', 
    '/panchang.html',
    '/face.html',
    '/tm3.html',
    '/library_config.json',
    '/manifest.json',
    '/tailwind.js',
    '/html2pdf.bundle.min.js',
    '/marked.min.js', 
    '/finger.html',
    '/palm.html',
    '/pada.html',
    '/sankhya.html',
    '/swara.html',
    '/book.html',
    '/Eye.html',
    '/cv.html',
    '/trip.html' 
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

// Activate Event: Clean up old caches if version changes
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

// Fetch Event: Stale-While-Revalidate + Dynamic Caching
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                
                // Fire a background request to the network to keep cache updated
                const fetchedResponse = fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    console.log('[Service Worker] Device is offline. Serving cached asset.');
                });

                return cachedResponse || fetchedResponse;
            });
        })
    );
});

// --- NEW DIRECT SYNC ENGINE ---
// Listens for "SYNC_NOW" message from the UI button
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'SYNC_NOW') {
        event.waitUntil(
            (async () => {
                try {
                    const cache = await caches.open(CACHE_NAME);
                    console.log('[Service Worker] Direct sync initiated. Pulling fresh files from server...');
                    
                    // Force fetch all assets from server bypassing HTTP disk cache
                    const syncTasks = ASSETS_TO_CACHE.map(async (url) => {
                        try {
                            // Add timestamp parameter to guarantee hitting the remote server, not browser disk cache
                            const cacheBustingUrl = `${url}${url.includes('?') ? '&' : '?'}sync_ts=${Date.now()}`;
                            const response = await fetch(cacheBustingUrl, { cache: 'no-cache' });
                            
                            if (response && response.status === 200) {
                                // Save fresh response into SW Cache under the original clean URL
                                await cache.put(url, response);
                            }
                        } catch (err) {
                            console.warn(`[Service Worker] Failed to update asset: ${url}`, err);
                        }
                    });

                    await Promise.all(syncTasks);

                    // Notify UI that synchronization completed successfully
                    if (event.ports && event.ports[0]) {
                        event.ports[0].postMessage({ status: 'SUCCESS' });
                    }
                } catch (error) {
                    console.error('[Service Worker] Sync failed:', error);
                    if (event.ports && event.ports[0]) {
                        event.ports[0].postMessage({ status: 'ERROR', error: error.toString() });
                    }
                }
            })()
        );
    }
});
