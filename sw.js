const CACHE_NAME = `rosarium:${self.registration.scope}`;
const FILES = [
  "index.html",
  "rosarium.md",
  "rosary.svg",
  "assets/css/style.css",
  "assets/js/theme.js",
  "assets/js/content.js",
  "assets/js/app.js",
  "assets/js/offline.js",
  "assets/vendor/marked/marked.min.js",
  "assets/fonts/source-serif-4/SourceSerif4-normal.woff2",
  "assets/fonts/source-serif-4/SourceSerif4-italic.woff2",
  "assets/icons/rosary-light.svg",
  "assets/icons/rosary-dark.svg",
  "assets/icons/sun.svg",
  "assets/icons/moon.svg",
  "assets/icons/initial.svg",
  "assets/icons/smile.svg",
  "assets/icons/cross.svg",
  "assets/icons/halo.svg",
  "assets/icons/final.svg"
].map(path => new URL(path, self.registration.scope).href);
const urls = new Set(FILES);
const updates = new Map();

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(FILES.map(url => new Request(url, { cache: "reload" })))
  ));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    await Promise.all(requests.filter(request => !urls.has(request.url))
      .map(request => cache.delete(request)));
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  url.search = "";
  if (url.href === self.registration.scope) url.pathname += "index.html";
  if (!urls.has(url.href)) return;

  const cache = caches.open(CACHE_NAME);
  const update = updates.get(url.href) || { pending: Promise.resolve() };
  const token = {};
  update.latest = token;
  updates.set(url.href, update);
  const fresh = fetch(event.request, { cache: "no-cache" }).then(async response => {
    if (response.ok) {
      try {
        const store = await cache;
        // Serialize writes and discard responses superseded by a later request.
        update.pending = update.pending.catch(() => undefined).then(() => {
          if (update.latest === token) return store.put(url.href, response.clone());
        });
        await update.pending;
      } catch {
        // A storage failure must not interrupt an online visit.
      }
    }
    return response;
  }).catch(() => undefined);
  event.waitUntil(fresh.then(() => undefined));

  event.respondWith((async () => {
    const saved = await cache.then(store => store.match(url.href)).catch(() => undefined);
    // Explicit reloads and the retry button prefer a fresh response.
    const retry = ["no-cache", "reload", "no-store"].includes(event.request.cache);
    if (saved && !retry) return saved;
    const response = await fresh;
    return response?.ok ? response : saved || response || Response.error();
  })());
});
