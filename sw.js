/* CSN PWA service worker — app shell + runtime caching. */
const VERSION = 'csn-v3.0.0';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const IMAGE_CACHE = `${VERSION}-images`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/catalogo',
  '/catalogo.html',
  '/recompensas',
  '/recompensas.html',
  '/pedido',
  '/pedido.html',
  '/sucursales',
  '/sucursales.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/theme.css',
  '/assets/app.js',
  '/assets/tailwind.config.js',
  '/assets/sucursales.js',
  '/assets/qr-membership.png',
  '/assets/qr-membership-sm.png',
  '/assets/logo-badge.png',
  '/assets/logo-badge-sm.png',
  '/assets/logo-hero.png',
  '/assets/logo-watermark.png',
  '/icons/favicon.svg',
  '/icons/favicon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon-180.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        SHELL_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            /* tolerate a missing shell entry; we'll cache it on first hit */
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isHTMLNavigation(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept') &&
      request.headers.get('accept').includes('text/html'))
  );
}

function isImage(request) {
  return request.destination === 'image';
}

function isStaticAsset(url) {
  return /\.(css|js|svg|webmanifest|woff2?)$/.test(url.pathname);
}

// Network-first for HTML navigations, fall back to cache, then to offline page.
async function htmlStrategy(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(event.request);
    if (fresh && fresh.ok) cache.put(event.request, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const indexed = await cache.match('/index.html');
    if (indexed) return indexed;
    return cache.match('/offline.html');
  }
}

// Stale-while-revalidate for CSS/JS/manifest.
async function staticStrategy(event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(event.request);
  const network = fetch(event.request)
    .then((res) => {
      if (res && res.ok) cache.put(event.request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

// Cache-first for images, with cap & graceful fallback.
async function imageStrategy(event) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  try {
    const res = await fetch(event.request);
    if (res && res.ok && res.type !== 'opaque') {
      cache.put(event.request, res.clone());
      cache.keys().then((keys) => {
        if (keys.length > 80) cache.delete(keys[0]);
      });
    }
    return res;
  } catch (e) {
    return new Response('', { status: 504, statusText: 'image offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    if (isHTMLNavigation(request)) {
      event.respondWith(htmlStrategy(event));
      return;
    }
    if (isStaticAsset(url)) {
      event.respondWith(staticStrategy(event));
      return;
    }
    if (isImage(request)) {
      event.respondWith(imageStrategy(event));
      return;
    }
  } else {
    // Cross-origin (fonts, Tailwind CDN, image CDNs): stale-while-revalidate.
    if (isImage(request)) {
      event.respondWith(imageStrategy(event));
      return;
    }
    event.respondWith(staticStrategy(event));
  }
});
