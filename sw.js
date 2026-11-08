/* Piano Man — offline režimas */
const CACHE = "pianoman-v1";
const FILES = ["./", "index.html", "css/style.css", "js/data.js", "js/store.js", "js/audio.js", "js/views.js", "js/app.js", "assets/icon.svg", "manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Tinklas pirmiausia, kad atnaujinimai pasiektų iškart; be interneto – iš talpyklos
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
