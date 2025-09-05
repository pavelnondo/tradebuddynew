// Service Worker for TradeBuddy PWA
const CACHE_NAME = 'tradebuddy-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
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
