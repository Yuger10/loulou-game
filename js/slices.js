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
  { id:'data',           layer:'entities', files:['js/data.js'],           css:[], public:null },
  { id:'icons',          layer:'shared',   files:['js/icons.js'],          css:[], public:null },
  { id:'difficulty',     layer:'entities', files:['js/difficulty.js'],     css:[], public:null },
  { id:'players',        layer:'entities', files:['js/players.js'],        css:[], public:null },
  { id:'companions',     layer:'entities', files:['js/companions.js'],     css:[], public:null },
  { id:'characters-art', layer:'entities', files:['js/characters-art.js'], css:['characters.css'], public:null },
  { id:'story',          layer:'features', files:['js/story.js'],          css:[], public:null },
  { id:'episodes',       layer:'features', files:['js/episodes.js'],       css:[], public:null },
  { id:'state',          layer:'entities', files:['js/state.js'],          css:[], public:null },
  { id:'ui',             layer:'shared',   files:['js/ui.js'],             css:['styles.css'], public:null },
  { id:'music',          layer:'features', files:['js/music.js'],          css:[], public:null },
  { id:'gains',          layer:'features', files:['js/gains.js'],          css:[], public:null },
  { id:'map',            layer:'features', files:['js/map.js'],            css:[], public:null },
  { id:'island',         layer:'features', files:['js/island.js'],         css:['island.css'], public:null },
  { id:'minigames',      layer:'features', files:['js/minigames.js'],      css:[], public:null },
  { id:'math',           layer:'features', files:['js/math.js'],           css:[], public:null },
  { id:'reading',        layer:'features', files:['js/reading.js'],        css:[], public:null },
  { id:'grammar',        layer:'features', files:['js/grammar.js'],        css:[], public:null },
  { id:'volume',         layer:'features', files:['js/volume.js'],         css:[], public:null },
  { id:'compare',        layer:'features', files:['js/compare.js'],        css:[], public:null },
  { id:'money',          layer:'features', files:['js/money.js'],          css:[], public:null },
  { id:'clock',          layer:'features', files:['js/clock.js'],          css:[], public:null },
  { id:'calendar',       layer:'features', files:['js/calendar.js'],       css:[], public:null },
  { id:'calc',           layer:'features', files:['js/calc.js'],           css:[], public:null },
  { id:'shapes',         layer:'features', files:['js/shapes.js'],         css:[], public:null },
  { id:'planets',        layer:'features', files:['js/planets.js'],        css:[], public:null },
  { id:'jigsaw',         layer:'features', files:['js/jigsaw.js'],         css:[], public:null },
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
const CSS_ORDER = ['styles.css', 'island.css', 'characters.css'];

if(typeof module !== 'undefined') module.exports = { SLICES, CSS_ORDER };
