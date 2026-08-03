// 玄机阁 Service Worker
// 缓存策略：应用壳缓存，API 网络优先
const CACHE = 'xuanjige-v1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API 调用走网络
  if (url.pathname.includes('/v1/') || url.hostname.includes('deepseek.com')) {
    return;
  }

  // 图片和静态资源缓存优先
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((res) => {
          if (res.ok && (url.pathname.match(/\.(js|css|png|jpg|svg|woff2|txt|json)$/) || url.pathname.startsWith('/corpus/'))) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          }
          return res;
        }),
    ),
  );
});
