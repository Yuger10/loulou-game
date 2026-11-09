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
                                                'js/shared/ui/feedback.js','js/shared/ui/modal.js','js/shared/ui/views.js'], css:[], public:null },
  { id:'words',          layer:'entities', files:['js/entities/words/words.js'], css:[], public:null },
  { id:'item',           layer:'entities', files:['js/entities/item/items.js'], css:[], public:null },
  { id:'world',          layer:'entities', files:['js/entities/world/worlds.js'], css:[], public:null },
  { id:'character',      layer:'entities', files:['js/entities/character/characters.js','js/entities/character/characters-art.js'],
                                           css:['js/entities/character/characters.css'], public:null },
  { id:'difficulty',     layer:'entities', files:['js/entities/difficulty/difficulty.js','js/entities/difficulty/game-types.js',
                                                'js/entities/difficulty/age.js'], css:[], public:null },
  { id:'game-state',     layer:'entities', files:['js/entities/game-state/state.js'], css:[], public:null },
  { id:'player',         layer:'entities', files:['js/entities/player/avatars.js','js/entities/player/profiles.js',
                                                'js/entities/player/party-state.js'], css:[], public:null },
  { id:'companion',      layer:'entities', files:['js/entities/companion/companions.js'], css:[], public:null },
  { id:'party',          layer:'features', files:['js/features/party/party.js'], css:[], public:null },
  { id:'story',          layer:'features', files:['js/story.js'],          css:[], public:null },
  { id:'episodes',       layer:'features', files:['js/episodes.js'],       css:[], public:null },
  { id:'state',          layer:'entities', files:['js/state.js'],          css:[], public:null },
  { id:'ui',             layer:'shared',   files:['js/ui.js'],             css:['styles.css'], public:null },
  { id:'music',          layer:'features', files:['js/music.js'],          css:[], public:null },
  { id:'gains',          layer:'features', files:['js/gains.js'],          css:[], public:null },
  { id:'map',            layer:'features', files:['js/map.js'],            css:[], public:null },
  { id:'island',         layer:'features', files:['js/island.js'],         css:['island.css'], public:null },
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
  { id:'market',         layer:'features', files:['js/market.js'],         css:[], public:null },
  { id:'gifts',          layer:'features', files:['js/gifts.js'],          css:[], public:null },
  { id:'race',           layer:'features', files:['js/race.js'],           css:[], public:null },
  { id:'profiles-ui',    layer:'features', files:['js/profiles-ui.js'],    css:[], public:null },
  { id:'backup',         layer:'features', files:['js/backup.js'],         css:[], public:null },
  { id:'parents',        layer:'features', files:['js/parents.js'],        css:[], public:null },
  { id:'adaptive',       layer:'features', files:['js/adaptive.js'],       css:[], public:null },
  { id:'wardrobe',       layer:'features', files:['js/wardrobe.js'],       css:[], public:null },
  { id:'seasons',        layer:'features', files:['js/seasons.js'],        css:[], public:null },
  { id:'init',           layer:'app',      files:['js/init.js'],           css:[], public:null },
];

// ordre de chargement des feuilles de style : la cascade dépend de cet ordre
const CSS_ORDER = ['styles.css', 'island.css', 'js/entities/character/characters.css'];

if(typeof module !== 'undefined') module.exports = { SLICES, CSS_ORDER };
