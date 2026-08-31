// Service worker simples: cacheia o "casco" do app (HTML/ícones) para abrir mesmo
// com conexão instável. Os dados em si continuam vindo do Firebase em tempo real.
const CACHE_NAME = 'gestao-saude-v1';
const APP_SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    // Só intercepta requisições do próprio app (mesma origem); Firebase e CDNs seguem direto pra rede
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request)
                .then((response) => {
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
                    return response;
                })
                .catch(() => cached);
            return cached || fetchPromise;
        })
    );
});
