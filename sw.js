const CACHE = 'lagon-v50';
const FILES = [
  './','./index.html','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png',
  './icon-180.png','./styles.css','./island.css','./characters.css','./js/shared/lib/random.js','./js/shared/ui/icons.js',
  './js/shared/ui/sound.js','./js/shared/ui/voice.js','./js/shared/ui/feedback.js','./js/shared/ui/modal.js','./js/shared/ui/views.js','./js/data.js',
  './js/difficulty.js','./js/players.js','./js/companions.js','./js/characters-art.js','./js/story.js','./js/episodes.js',
  './js/state.js','./js/ui.js','./js/music.js','./js/gains.js','./js/map.js','./js/island.js',
  './js/minigames.js','./js/math.js','./js/reading.js','./js/grammar.js','./js/volume.js','./js/compare.js',
  './js/money.js','./js/clock.js','./js/calendar.js','./js/calc.js','./js/shapes.js','./js/planets.js',
  './js/jigsaw.js','./js/market.js','./js/gifts.js','./js/race.js','./js/profiles-ui.js','./js/backup.js',
  './js/parents.js','./js/adaptive.js','./js/wardrobe.js','./js/seasons.js','./js/init.js'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('message', e=>{
  if(e.data==='skipWaiting') self.skipWaiting();
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
