const CACHE = 'lagon-v52';
const FILES = [
  './','./index.html','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png',
  './icon-180.png','./js/shared/styles/base.css','./js/features/island/island-view.css','./js/entities/world/world-themes.css','./js/features/map/map.css','./js/features/minigames/simon/simon.css',
  './js/features/minigames/sequence/sequence.css','./js/features/profile/welcome.css','./js/features/quests/quests.css','./js/features/bag/bag.css','./js/features/market/market.css','./js/shared/ui/views.css',
  './js/shared/ui/modal.css','./js/features/minigame-engine/engine.css','./js/shared/ui/feedback.css','./js/features/party/party.css','./js/features/party/race.css','./js/shared/styles/interface-v12.css',
  './js/shared/styles/pointer-v13.css','./js/features/minigame-engine/deck-v13.css','./js/features/minigame-engine/outcome-v14.css','./js/shared/styles/responsive-v14.css','./js/features/minigames/math/math.css','./js/features/minigames/reading/reading.css',
  './js/features/minigames/grammar/grammar.css','./js/features/minigames/volume/volume.css','./js/features/minigames/compare/compare.css','./js/features/minigames/money/money.css','./js/shared/styles/design-system-v21.css','./js/features/minigame-engine/board-v21.css',
  './js/features/minigame-engine/timer.css','./js/entities/companion/companions.css','./js/shared/styles/devices.css','./js/features/gains/gains.css','./js/features/minigames/clock/clock.css','./js/features/minigames/calendar/calendar.css',
  './js/features/story/story.css','./js/features/minigames/calc/calc.css','./js/features/minigames/shapes/shapes.css','./js/features/minigames/planets/planets.css','./js/features/backup/backup.css','./js/features/parents/parents.css',
  './js/features/adaptive/adaptive.css','./js/features/wardrobe/wardrobe.css','./js/shared/ui/icons.css','./js/features/seasons/seasons.css','./js/features/minigames/jigsaw/jigsaw.css','./js/features/gifts/gifts.css',
  './js/features/story/episodes.css','./js/features/minigame-engine/hints.css','./js/features/companion-team/team.css','./js/features/island/island.css','./js/entities/character/characters.css','./js/shared/lib/random.js',
  './js/shared/ui/icons.js','./js/shared/ui/sound.js','./js/shared/ui/voice.js','./js/shared/ui/feedback.js','./js/shared/ui/modal.js','./js/shared/ui/views.js',
  './js/entities/words/words.js','./js/entities/item/items.js','./js/entities/world/worlds.js','./js/entities/world/availability.js','./js/entities/character/characters.js','./js/entities/character/characters-art.js',
  './js/entities/difficulty/difficulty.js','./js/entities/difficulty/game-types.js','./js/entities/difficulty/age.js','./js/entities/game-state/state.js','./js/entities/player/avatars.js','./js/entities/player/profiles.js',
  './js/entities/player/party-state.js','./js/entities/companion/companions.js','./js/features/party/party.js','./js/features/party/race.js','./js/features/profile/profile.js','./js/features/profile/topbar.js',
  './js/features/quests/quests.js','./js/features/wallet/wallet.js','./js/features/adaptive/game-diff.js','./js/features/adaptive/adaptive.js','./js/features/bag/bag.js','./js/features/island/island-view.js',
  './js/features/island/island.js','./js/features/music/music.js','./js/features/gains/gains.js','./js/features/map/map.js','./js/features/minigame-engine/engine.js','./js/features/minigame-engine/hints.js',
  './js/features/minigames/memory/memory.js','./js/features/minigames/count/count.js','./js/features/minigames/intruder/intruder.js','./js/features/minigames/simon/simon.js','./js/features/minigames/sequence/sequence.js','./js/features/minigames/puzzle/puzzle.js',
  './js/features/minigames/math/math.js','./js/features/minigames/reading/reading.js','./js/features/minigames/grammar/grammar.js','./js/features/minigames/volume/volume.js','./js/features/minigames/compare/compare.js','./js/features/minigames/money/money.js',
  './js/features/minigames/clock/clock.js','./js/features/minigames/calendar/calendar.js','./js/features/minigames/calc/calc.js','./js/features/minigames/shapes/shapes.js','./js/features/minigames/planets/planets.js','./js/features/minigames/jigsaw/jigsaw.js',
  './js/features/story/story.js','./js/features/story/episodes.js','./js/features/market/market.js','./js/features/gifts/gifts.js','./js/features/players/profiles-ui.js','./js/features/backup/backup.js',
  './js/features/parents/parents.js','./js/features/wardrobe/wardrobe.js','./js/features/seasons/seasons.js','./js/features/companion-team/team.js','./js/features/companion-team/specialties.js','./js/app/init.js'
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
