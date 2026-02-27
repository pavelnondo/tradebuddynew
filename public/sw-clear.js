// Emergency service worker to clear all caches
self.addEventListener('install', (event) => {
  console.log('🧹 Cache clearing service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🧹 Clearing all caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('✅ All caches cleared!');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Don't cache anything, always fetch from network
  event.respondWith(fetch(event.request));
});
