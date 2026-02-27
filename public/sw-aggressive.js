// Ultra-Aggressive Service Worker for TradeBuddy PWA
const CACHE_NAME = 'tradebuddy-ultra-aggressive-v' + Date.now();
const FORCE_RELOAD_VERSION = 'v' + Date.now();

console.log('🔥 ULTRA-AGGRESSIVE SW LOADED:', CACHE_NAME);

// Immediately clear ALL existing caches
self.addEventListener('install', (event) => {
  console.log('🔥 INSTALL: Clearing all caches aggressively');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🔥 DELETING CACHE:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('🔥 ALL CACHES DELETED');
      return self.skipWaiting();
    })
  );
});

// Force activation and clear everything
self.addEventListener('activate', (event) => {
  console.log('🔥 ACTIVATE: Ultra-aggressive cache clearing');
  event.waitUntil(
    Promise.all([
      // Clear all caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🔥 ACTIVATE: Deleting cache', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('🔥 ACTIVATE: Complete - all caches cleared, clients claimed');
    })
  );
});

// Intercept ALL requests and force fresh content
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For our domain, always bypass cache
  if (url.hostname === 'www.mytradebuddy.ru' || url.hostname === 'mytradebuddy.ru') {
    console.log('🔥 FETCH: Bypassing cache for', url.pathname);
    
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).then((response) => {
        // Clone the response to modify headers
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...response.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Last-Modified': new Date().toUTCString(),
            'ETag': '"' + Date.now() + '"'
          }
        });
        
        console.log('🔥 FETCH: Fresh response with no-cache headers');
        return newResponse;
      }).catch((error) => {
        console.log('🔥 FETCH: Error, trying cache as fallback', error);
        return caches.match(event.request);
      })
    );
  }
  
  // For external resources, use normal caching
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('🔥 FETCH: Serving from cache', url.pathname);
        return response;
      }
      
      console.log('🔥 FETCH: Fetching fresh', url.pathname);
      return fetch(event.request).then((response) => {
        // Don't cache anything - always fresh
        return response;
      });
    })
  );
});

// Send message to all clients to force reload
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FORCE_RELOAD') {
    console.log('🔥 MESSAGE: Force reload requested');
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'FORCE_RELOAD',
            version: FORCE_RELOAD_VERSION
          });
        });
      })
    );
  }
});

console.log('🔥 ULTRA-AGGRESSIVE SW READY');


