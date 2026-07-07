const STATIC_CACHE = "pos-static-v1";
const PAGE_CACHE = "pos-pages-v1";

const isDev =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

// Cache Next.js static chunks on first fetch, serve from cache thereafter
self.addEventListener("fetch", (event) => {
  // In development, don't intercept — let requests hit the network so hot
  // reload works and updated JS is always served fresh.
  if (isDev) return;

  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // /_next/static/** — immutable hashed assets, cache-first forever
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request).then((res) => {
              cache.put(event.request, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }

  // /sales/add-sale — network-first, cache fallback so page loads offline
  if (
    url.pathname === "/sales/add-sale" ||
    url.pathname.startsWith("/sales/add-sale?")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            caches
              .open(PAGE_CACHE)
              .then((cache) => cache.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches
            .open(PAGE_CACHE)
            .then((cache) => cache.match(event.request))
        )
    );
    return;
  }

  // Static public assets (images, favicon)
  if (
    url.pathname.startsWith("/favicon") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then(
          (cached) =>
            cached ||
            fetch(event.request).then((res) => {
              cache.put(event.request, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }
});

// Clean up old caches on SW update
self.addEventListener("activate", (event) => {
  const current = new Set([STATIC_CACHE, PAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !current.has(k)).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});
