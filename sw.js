const CACHE = 'lagon-v9';
const FILES = [
  './','./index.html','./styles.css','./manifest.json',
  './icon.svg','./icon-192.png','./icon-512.png','./icon-180.png',
  './js/data.js','./js/players.js','./js/profiles-ui.js','./js/state.js','./js/ui.js','./js/map.js','./js/minigames.js','./js/market.js','./js/init.js'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    fetch(e.request).then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(e.request))
  );
});
