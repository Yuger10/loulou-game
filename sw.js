const CACHE = 'lagon-v50';
const FILES = [
  './','./index.html','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png',
  './icon-180.png','./styles.css','./island.css','./js/entities/character/characters.css','./js/shared/lib/random.js','./js/shared/ui/icons.js',
  './js/shared/ui/sound.js','./js/shared/ui/voice.js','./js/shared/ui/feedback.js','./js/shared/ui/modal.js','./js/shared/ui/views.js','./js/entities/words/words.js',
  './js/entities/item/items.js','./js/entities/world/worlds.js','./js/entities/character/characters.js','./js/entities/character/characters-art.js','./js/entities/difficulty/difficulty.js','./js/entities/difficulty/game-types.js',
  './js/entities/difficulty/age.js','./js/entities/game-state/state.js','./js/entities/player/avatars.js','./js/entities/player/profiles.js','./js/entities/player/party-state.js','./js/entities/companion/companions.js',
  './js/features/party/party.js','./js/story.js','./js/episodes.js','./js/state.js','./js/ui.js','./js/music.js',
  './js/gains.js','./js/map.js','./js/island.js','./js/features/minigame-engine/engine.js','./js/features/minigames/memory/memory.js','./js/features/minigames/count/count.js',
  './js/features/minigames/intruder/intruder.js','./js/features/minigames/simon/simon.js','./js/features/minigames/sequence/sequence.js','./js/features/minigames/puzzle/puzzle.js','./js/features/minigames/math/math.js','./js/features/minigames/reading/reading.js',
  './js/features/minigames/grammar/grammar.js','./js/features/minigames/volume/volume.js','./js/features/minigames/compare/compare.js','./js/features/minigames/money/money.js','./js/features/minigames/clock/clock.js','./js/features/minigames/calendar/calendar.js',
  './js/features/minigames/calc/calc.js','./js/features/minigames/shapes/shapes.js','./js/features/minigames/planets/planets.js','./js/features/minigames/jigsaw/jigsaw.js','./js/market.js','./js/gifts.js',
  './js/race.js','./js/profiles-ui.js','./js/backup.js','./js/parents.js','./js/adaptive.js','./js/wardrobe.js',
  './js/seasons.js','./js/init.js'
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
