// Conto in ordine: funzionamento offline. Cambia VERSIONE quando aggiorni i file.
const VERSIONE = 'conto-v2';
const BASE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIONE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const mio = u.origin === self.location.origin;
  const font = u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!mio && !font) return;
  e.respondWith(caches.open(VERSIONE).then(async c => {
    const vecchio = await c.match(r, { ignoreSearch: true });
    const rete = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => null);
    if (vecchio) { e.waitUntil(rete); return vecchio; }
    const res = await rete;
    if (res) return res;
    if (r.mode === 'navigate') return (await c.match('index.html')) || (await c.match('./'));
    return new Response('', { status: 504 });
  }));
});
