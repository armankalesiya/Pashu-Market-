const CACHE_VERSION = 'pashu-market-static-v2';

const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/?$/, '/');
const withScope = (p) => `${SCOPE_PATH}${String(p).replace(/^\/+/, '')}`;

const PRECACHE_URLS = [
  withScope(''),
  withScope('index.html'),
  withScope('manifest.json'),
  withScope('apple-touch-icon.png'),
  withScope('icons/icon.svg'),
  withScope('icons/icon-192x192.png'),
  withScope('icons/icon-512x512.png'),
  withScope('icons/icon-maskable-512x512.png'),
];

const BYPASS_HOSTS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebasestorage.googleapis.com',
  'firebase.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'accounts.google.com',
  'apis.google.com',
  'www.googleapis.com',
  'oauth2.googleapis.com',
  'www.gstatic.com',
];

const STATIC_EXT_RE = /\.(?:css|png|jpg|jpeg|webp|svg|ico|woff|woff2)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never cache non-GET requests or authorized requests
  if (request.method !== 'GET') return;
  if (request.headers && request.headers.has('Authorization')) return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never cache Firebase Auth, Firestore, Storage, Google OAuth, or external APIs
  if (BYPASS_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    return;
  }

  // Cache-First for Google Fonts
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && (response.ok || response.type === 'opaque')) {
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      })
    );
    return;
  }

  // Skip all other cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache APIs, auth endpoints, or Vite dev HMR internals
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__/auth/') ||
    url.pathname.startsWith('/__/firebase/') ||
    url.pathname.startsWith(withScope('api/')) ||
    url.pathname.startsWith(withScope('__/auth/')) ||
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // SPA navigation requests: Network-First with offline app-shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && (url.pathname === SCOPE_PATH || url.pathname === withScope('index.html'))) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(withScope('index.html'), copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_VERSION);
          return (await cache.match(withScope('index.html'))) || (await cache.match(withScope('')));
        })
    );
    return;
  }

  const isProdBundle = url.pathname.startsWith(withScope('assets/'));
  const isPublicAsset =
    url.pathname.startsWith(withScope('icons/')) ||
    url.pathname.startsWith(withScope('src/assets/')) ||
    url.pathname === withScope('manifest.json') ||
    url.pathname === withScope('apple-touch-icon.png');
  const isStaticAsset = STATIC_EXT_RE.test(url.pathname);

  if (!isProdBundle && !isPublicAsset && !isStaticAsset) {
    return;
  }

  // Stale-While-Revalidate for public static assets
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        })
        .catch(() => undefined);

      return cached || (await networkPromise) || Response.error();
    })
  );
});
