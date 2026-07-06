// Service worker для mesto: офлайн-фолбэк для навигаций + кэш иконок/манифеста.
// Стратегия намеренно простая: сеть в приоритете, кэш — страховка при офлайне.
// Хешированные ассеты Next не кэшируем вручную (у них уже immutable-кэш браузера).

const CACHE = "mesto-v1";
// Оболочка, которую прогреваем при установке, чтобы офлайн-экран был доступен.
const SHELL = ["/offline", "/icon.svg", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll падает целиком, если хоть один ресурс не отдался, — грузим по одному.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Занимаемся только GET того же origin.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Навигации: сеть в приоритете, при офлайне — кэшированная страница /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then((res) => res ?? Response.error()),
      ),
    );
    return;
  }

  // Прогретые ассеты оболочки: отдаём из кэша, если сеть недоступна.
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((res) => res ?? Response.error()),
    ),
  );
});
