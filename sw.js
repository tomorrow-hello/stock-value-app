/* 股价值得买 Service Worker —— 离线缓存 + 版本更新
   每次改完代码，把下面的 CACHE 版本号 +1，用户端会自动提示更新。 */
const CACHE = 'stockval-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 行情接口：始终走网络，不缓存（保证数据最新）
  if (url.hostname.includes('gtimg.cn')) {
    return; // 交给浏览器默认处理
  }

  // 页面资源：网络优先，失败时用缓存（离线可用）
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});