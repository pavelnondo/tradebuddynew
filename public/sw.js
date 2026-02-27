// Service Worker for TradeBuddy PWA
const CACHE_NAME = 'tradebuddy-v1.0.1761074052442';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the new service worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache each resource individually to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null; // Continue with other resources
            })
          )
        );
      })
      .catch((error) => {
        console.warn('Failed to open cache:', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  // Do NOT intercept API or uploads - let them go directly to the network.
  // Same-origin /api and /uploads must bypass cache to avoid stale/503 errors.
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        // Otherwise fetch from network
        return fetch(event.request).catch((error) => {
          console.warn('Fetch failed:', error);
          // Return a basic offline page or let the browser handle it
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
      .catch((error) => {
        console.warn('Cache match failed:', error);
        // Fallback to network fetch
        return fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clear ALL old caches aggressively
      caches.keys().then((cacheNames) => {
        console.log('Found caches:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Background sync for offline trade data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync offline trade data when connection is restored
  try {
    const offlineTrades = await getOfflineTrades();
    if (offlineTrades.length > 0) {
      await syncOfflineTrades(offlineTrades);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineTrades() {
  // Get trades stored in IndexedDB during offline mode
  return new Promise((resolve) => {
    const request = indexedDB.open('TradeBuddyDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['trades'], 'readonly');
      const store = transaction.objectStore('trades');
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
    };
    request.onerror = () => resolve([]);
  });
}

async function syncOfflineTrades(trades) {
  // Sync offline trades to server
  for (const trade of trades) {
    try {
      await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trade),
      });
    } catch (error) {
      console.error('Failed to sync trade:', error);
    }
  }
}
