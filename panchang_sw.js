const CACHE_NAME = 'panchang-offline-v1';

// Essential local files to cache immediately
const STATIC_ASSETS = [
  '/panchang.html',
  '/panchang_manifest.json',
  '/panchang_details.json',
  '/panchang-icon-192.png',
  '/panchang-icon-512.png'
];

// Install Event - Cache Local Assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Cache-First Strategy (Handles CDNs and Local files)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Skip caching for your Python API and Nominatim so live data is always fresh
  if (requestUrl.hostname.includes('pythonanywhere.com') || 
      requestUrl.hostname.includes('openstreetmap.org') ||
      requestUrl.hostname.includes('googleapis.com')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Return from local device cache
      }

      // If not in cache, fetch from network and add to cache (for CDNs)
      return fetch(event.request).then(networkResponse => {
        // Only cache valid responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
         // Optional: Handle offline fallback here if needed
      });
    })
  );
});