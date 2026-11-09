/* ---------- Manifeste des slices (architecture « feature slices », v51) ----------
   Source unique de vérité de l'organisation du code :
   - `layer` : la couche de la slice. De la plus haute à la plus basse :
       app > features > entities > shared
     Un fichier ne doit utiliser que des noms de sa couche ou des couches
     inférieures (vérifié par test/slices.test.js).
   - `files` / `css` : les fichiers de la slice, DANS L'ORDRE de chargement.
     index.html, sw.js et les tests chargent exactement cette liste, slice
     après slice, dans l'ordre du tableau.
   - `public` : l'API publique de la slice, c'est-à-dire les seuls noms que les
     autres slices ont le droit d'utiliser. `null` = pas encore déclarée (la
     règle n'est alors pas vérifiée pour cette slice).

   Ce fichier n'est pas chargé par le jeu : seuls les outils et les tests le
   lisent (`require`). */
const SLICES = [
  { id:'shared-lib',     layer:'shared',   files:['js/shared/lib/random.js'], css:[], public:null },
  { id:'shared-ui',      layer:'shared',   files:['js/shared/ui/icons.js','js/shared/ui/sound.js','js/shared/ui/voice.js',
                                                'js/shared/ui/feedback.js','js/shared/ui/modal.js','js/shared/ui/views.js'], css:['styles.css'], public:null },
  { id:'words',          layer:'entities', files:['js/entities/words/words.js'], css:[], public:null },
  { id:'item',           layer:'entities', files:['js/entities/item/items.js'], css:[], public:null },
  { id:'world',          layer:'entities', files:['js/entities/world/worlds.js','js/entities/world/availability.js'], css:[], public:null },
  { id:'character',      layer:'entities', files:['js/entities/character/characters.js','js/entities/character/characters-art.js'],
                                           css:['js/entities/character/characters.css'], public:null },
  { id:'difficulty',     layer:'entities', files:['js/entities/difficulty/difficulty.js','js/entities/difficulty/game-types.js',
                                                'js/entities/difficulty/age.js'], css:[], public:null },
  { id:'game-state',     layer:'entities', files:['js/entities/game-state/state.js'], css:[], public:null },
  { id:'player',         layer:'entities', files:['js/entities/player/avatars.js','js/entities/player/profiles.js',
                                                'js/entities/player/party-state.js'], css:[], public:null },
  { id:'companion',      layer:'entities', files:['js/entities/companion/companions.js'], css:[], public:null },
  { id:'party', layer:'features', files:['js/features/party/party.js','js/features/party/race.js'], css:[], public:null },
  { id:'story', layer:'features', files:['js/features/story/story.js','js/features/story/episodes.js'], css:[], public:null },
  { id:'profile', layer:'features', files:['js/features/profile/profile.js','js/features/profile/topbar.js'], css:[], public:null },
  { id:'quests', layer:'features', files:['js/features/quests/quests.js'], css:[], public:null },
  { id:'wallet', layer:'features', files:['js/features/wallet/wallet.js'], css:[], public:null },
  { id:'adaptive', layer:'features', files:['js/features/adaptive/game-diff.js','js/features/adaptive/adaptive.js'], css:[], public:null },
  { id:'bag', layer:'features', files:['js/features/bag/bag.js'], css:[], public:null },
  { id:'island', layer:'features', files:['js/features/island/island-view.js','js/features/island/island.js'], css:['js/features/island/island.css'], public:null },
  { id:'music', layer:'features', files:['js/features/music/music.js'], css:[], public:null },
  { id:'gains', layer:'features', files:['js/features/gains/gains.js'], css:[], public:null },
  { id:'map', layer:'features', files:['js/features/map/map.js'], css:[], public:null },
  { id:'minigame-engine', layer:'features', files:['js/features/minigame-engine/engine.js'], css:[], public:null },
  { id:'minigame-memory', layer:'features', files:['js/features/minigames/memory/memory.js'], css:[], public:null },
  { id:'minigame-count', layer:'features', files:['js/features/minigames/count/count.js'], css:[], public:null },
  { id:'minigame-intruder', layer:'features', files:['js/features/minigames/intruder/intruder.js'], css:[], public:null },
  { id:'minigame-simon', layer:'features', files:['js/features/minigames/simon/simon.js'], css:[], public:null },
  { id:'minigame-sequence', layer:'features', files:['js/features/minigames/sequence/sequence.js'], css:[], public:null },
  { id:'minigame-puzzle', layer:'features', files:['js/features/minigames/puzzle/puzzle.js'], css:[], public:null },
  { id:'minigame-math', layer:'features', files:['js/features/minigames/math/math.js'], css:[], public:null },
  { id:'minigame-reading', layer:'features', files:['js/features/minigames/reading/reading.js'], css:[], public:null },
  { id:'minigame-grammar', layer:'features', files:['js/features/minigames/grammar/grammar.js'], css:[], public:null },
  { id:'minigame-volume', layer:'features', files:['js/features/minigames/volume/volume.js'], css:[], public:null },
  { id:'minigame-compare', layer:'features', files:['js/features/minigames/compare/compare.js'], css:[], public:null },
  { id:'minigame-money', layer:'features', files:['js/features/minigames/money/money.js'], css:[], public:null },
  { id:'minigame-clock', layer:'features', files:['js/features/minigames/clock/clock.js'], css:[], public:null },
  { id:'minigame-calendar', layer:'features', files:['js/features/minigames/calendar/calendar.js'], css:[], public:null },
  { id:'minigame-calc', layer:'features', files:['js/features/minigames/calc/calc.js'], css:[], public:null },
  { id:'minigame-shapes', layer:'features', files:['js/features/minigames/shapes/shapes.js'], css:[], public:null },
  { id:'minigame-planets', layer:'features', files:['js/features/minigames/planets/planets.js'], css:[], public:null },
  { id:'minigame-jigsaw', layer:'features', files:['js/features/minigames/jigsaw/jigsaw.js'], css:[], public:null },
  { id:'market', layer:'features', files:['js/features/market/market.js'], css:[], public:null },
  { id:'gifts', layer:'features', files:['js/features/gifts/gifts.js'], css:[], public:null },
  { id:'players', layer:'features', files:['js/features/players/profiles-ui.js'], css:[], public:null },
  { id:'backup', layer:'features', files:['js/features/backup/backup.js'], css:[], public:null },
  { id:'parents', layer:'features', files:['js/features/parents/parents.js'], css:[], public:null },
  { id:'wardrobe', layer:'features', files:['js/features/wardrobe/wardrobe.js'], css:[], public:null },
  { id:'seasons', layer:'features', files:['js/features/seasons/seasons.js'], css:[], public:null },
  { id:'app', layer:'app', files:['js/app/init.js'], css:[], public:null },
];

// ordre de chargement des feuilles de style : la cascade dépend de cet ordre
const CSS_ORDER = ['styles.css', 'js/features/island/island.css', 'js/entities/character/characters.css'];

if(typeof module !== 'undefined') module.exports = { SLICES, CSS_ORDER };
