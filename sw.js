/* 상담일지 서비스워커 — 코드를 고쳐 올릴 때마다 아래 버전 숫자만 올리면 됨 */
const CACHE = 'sangdam-v24';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('sangdam-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 앱 화면: 인터넷 되면 새 버전(브라우저 캐시 건너뛰고 서버 확인), 안 되면 저장된 버전
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // 같은 주소의 파일과 구글 글꼴: 저장된 것 먼저, 없으면 받아서 저장
  if (url.origin === location.origin || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
  // 그 밖(일정 불러오기 등 외부 요청)은 서비스워커가 건드리지 않음
});
