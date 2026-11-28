// Çevrimdışı çalışma: uygulama dosyalarını önbelleğe alır, önce ağdan dener (güncellemeler hemen gelir)
const CACHE='aliskanlik-v15';
const FILES=['./','index.html','css/app.css','js/core.js','js/quotes.js','js/fx.js','js/qr.js','js/rewards.js','js/month.js','js/year.js','js/insights.js','js/tools.js','js/extra.js','js/welcome.js','js/firebase-config.js','js/cloud.js','giris.html','js/giris.js','js/main.js','icon.svg','icon-192.png','icon-512.png','manifest.webmanifest'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok&&(new URL(e.request.url).origin===location.origin||e.request.url.startsWith('https://www.gstatic.com/firebasejs/'))){ const c=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,c)); } return r; })
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});
self.addEventListener('notificationclick',e=>{ e.notification.close(); e.waitUntil(self.clients.matchAll({type:'window'}).then(cs=>cs.length?cs[0].focus():self.clients.openWindow('./'))); });
