// Consolidated Service Worker for Wirasaga (PWA Caching + Firebase Cloud Messaging)

// 1. Load Firebase SDKs for background messaging compatibility
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 2. Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBvrHCGPn51or34NNH-ixxtQfQ2dZEv4GI",
  authDomain: "bantusekitar-497513.firebaseapp.com",
  projectId: "bantusekitar-497513",
  storageBucket: "bantusekitar-497513.firebasestorage.app",
  messagingSenderId: "842432470733",
  appId: "1:842432470733:web:86e9dedcd7b73fe3a21384"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[service-worker] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Kebakaran / Keadaan Darurat Wirasaga';
  const notificationOptions = {
    body: payload.notification?.body || 'Ada laporan insiden darurat baru terdeteksi di sekitar Anda!',
    icon: '/logo.svg',
    badge: '/logo.svg',
    tag: payload.notification?.tag || 'wirasaga-alert',
    renotify: true,
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus or open the app window
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// ==========================================
// PWA Caching Strategy
// ==========================================
const CACHE_NAME = "wirasaga-v3-cache";

const STATIC_SHELL = [
  "/",
  "/index.html",
  "/logo.svg",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL).catch((err) => {
        console.warn("Shell assets caching skipped during sw install:", err);
      });
    })
  );
  self.skipWaiting(); // Force active activation on reload
});

self.addEventListener("activate", (event) => {
  // Clear old caches
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Removing outdated cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper checking if request is an API call
const isApiOrAuth = (url) => {
  return url.includes("/api/") || url.includes("firestore.googleapis.com") || url.includes("identitytoolkit.googleapis.com");
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Completely bypass API, Database, and Auth endpoints
  if (isApiOrAuth(url.pathname) || isApiOrAuth(url.href)) {
    return; // Let browser process standard API requests naturally
  }

  // 2. Network-First strategy for HTML and Navigation requests to avoid stale hashes & MIME type errors
  const isNavigation = request.mode === "navigate" || request.headers.get("Accept")?.includes("text/html");
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache the latest successful HTML page
          if (networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, serve the cached index.html
          return caches.match("/");
        })
    );
    return;
  }

  // 3. Cache-First or Stale-While-Revalidate for other static assets (images, logos, fonts)
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Trigger a silent background update for assets under /assets/ or public folder
          if (url.pathname.includes("/assets/") || url.pathname.includes("/logo.svg")) {
            fetch(request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            }).catch(() => {});
          }
          return cachedResponse;
        }

        // Catch and dynamically cache standard system-ready requests
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200 && (url.pathname.includes("/assets/") || url.pathname === "/logo.svg")) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
          }
          return networkResponse;
        });
      })
    );
  }
});
