/* ---------- Les squishies à collectionner (v53) : le catalogue ----------
   Idée de la joueuse principale : « un système de squishies qu'on range
   dans des boîtes ». Comme les vrais (voir conductor/research-squishies.md) :
   des boîtes surprises, des séries à compléter, trois raretés (commun, rare,
   et ✨ pailleté).

   Ce fichier ne contient QUE des données : la logique (boîtes, tirage,
   échange, rangement) est dans js/features/squishies/. Une série est une
   simple entrée de SQUISHY_SERIES, et ses modèles des entrées de SQUISHIES :
   les futurs mondes (Boîtes, Licornes) ajouteront la leur sans toucher à la
   logique.

   Chaque modèle a trois attributs qui servent au tri des boîtes de
   rangement (couleur, forme, taille) :
     color   une couleur du mini-jeu Formes (SQ_COLORS : rose, bleu, jaune,
             vert, violet, orange) : la couleur dominante du corps
     shape   la forme du corps : 'rond', 'ovale' ou 'carre' (carré arrondi)
     size    'petit' ou 'grand' */

const SQUISHY_SERIES = {
  capy:     { name:'Capybaras', emoji:'🦫' },
  desserts: { name:'Desserts',  emoji:'🍩' },
  animaux:  { name:'Animaux',   emoji:'🐾' },
};
const SQUISHY_SERIES_ORDER = ['capy', 'desserts', 'animaux'];

// les trois raretés, et leur chance au tirage (voir openSquishyBox)
const SQUISHY_RARITY = {
  commun: { name:'commun', chance:.70 },
  rare:   { name:'rare',   chance:.25 },
  brille: { name:'pailleté', chance:.05 },
};

// `say` : ce que dit la voix à l'ouverture (« Un capy fraise ! »)
const SQUISHIES = {
  // 🦫 Capybaras
  'capy-fraise':  { series:'capy', name:'Capy fraise',    say:'un capy fraise',    rarity:'commun', color:'rose',   shape:'carre', size:'grand' },
  'capy-orange':  { series:'capy', name:'Capy orange',    say:'un capy orange',    rarity:'commun', color:'orange', shape:'ovale', size:'petit' },
  'capy-dodo':    { series:'capy', name:'Capy dodo',      say:'un capy dodo',      rarity:'commun', color:'bleu',   shape:'ovale', size:'grand' },
  'capy-bain':    { series:'capy', name:'Capy au bain',   say:'un capy au bain',   rarity:'commun', color:'jaune',  shape:'rond',  size:'petit' },
  'capy-pyjama':  { series:'capy', name:'Capy pyjama',    say:'un capy pyjama',    rarity:'rare',   color:'violet', shape:'carre', size:'grand' },
  'capy-dore':    { series:'capy', name:'Capy doré',      say:'un capy doré',      rarity:'brille', color:'jaune',  shape:'carre', size:'grand' },
  // 🍩 Desserts
  'donut':        { series:'desserts', name:'Donut',      say:'un donut',          rarity:'commun', color:'rose',   shape:'rond',  size:'grand' },
  'mochi':        { series:'desserts', name:'Mochi',      say:'un mochi',          rarity:'commun', color:'vert',   shape:'rond',  size:'petit' },
  'cupcake':      { series:'desserts', name:'Cupcake',    say:'un cupcake',        rarity:'commun', color:'bleu',   shape:'carre', size:'grand' },
  'glace':        { series:'desserts', name:'Glace',      say:'une glace',         rarity:'commun', color:'vert',   shape:'rond',  size:'petit' },
  'macaron':      { series:'desserts', name:'Macaron',    say:'un macaron',        rarity:'rare',   color:'violet', shape:'ovale', size:'petit' },
  'gateau-arc':   { series:'desserts', name:'Gâteau arc-en-ciel', say:'un gâteau arc-en-ciel', rarity:'brille', color:'rose', shape:'carre', size:'grand' },
  // 🐾 Animaux
  'chat':         { series:'animaux', name:'Chat',        say:'un chat',           rarity:'commun', color:'orange', shape:'rond',  size:'grand' },
  'pingouin':     { series:'animaux', name:'Pingouin',    say:'un pingouin',       rarity:'commun', color:'bleu',   shape:'ovale', size:'petit' },
  'lapin':        { series:'animaux', name:'Lapin',       say:'un lapin',          rarity:'commun', color:'rose',   shape:'ovale', size:'petit' },
  'poussin':      { series:'animaux', name:'Poussin',     say:'un poussin',        rarity:'commun', color:'jaune',  shape:'rond',  size:'petit' },
  'grenouille':   { series:'animaux', name:'Grenouille',  say:'une grenouille',    rarity:'rare',   color:'vert',   shape:'ovale', size:'grand' },
  'chat-holo':    { series:'animaux', name:'Chat holographique', say:'un chat holographique', rarity:'brille', color:'violet', shape:'rond', size:'grand' },
};

// La série gagnée en résolvant l'énigme d'une île (une seule fois par île)
const SQUISHY_ISLAND_SERIES = {
  lagon:'animaux', foret:'animaux', montagne:'animaux',
  chateau:'desserts', volcan:'desserts', squishy:'desserts',
  jungle:'capy', cite:'capy',
};

function squishiesOf(series){ return Object.keys(SQUISHIES).filter(id=> SQUISHIES[id].series === series); }

const SQ_COLORS = {
  rose:   { fill:'#FF9CC8', edge:'#C9497F', adj:['rose','roses','rose','roses'] },
  bleu:   { fill:'#6FB8F5', edge:'#2F7CC0', adj:['bleu','bleus','bleue','bleues'] },
  jaune:  { fill:'#FFD95A', edge:'#B8901A', adj:['jaune','jaunes','jaune','jaunes'] },
  vert:   { fill:'#6ED38C', edge:'#2F9551', adj:['vert','verts','verte','vertes'] },
  violet: { fill:'#BFA3EC', edge:'#7B5CC0', adj:['violet','violets','violette','violettes'] },
  orange: { fill:'#FFAE5C', edge:'#C8661A', adj:['orange','orange','orange','orange'] },
};

export {
  SQ_COLORS, SQUISHIES, squishiesOf, SQUISHY_ISLAND_SERIES, SQUISHY_RARITY, SQUISHY_SERIES,
  SQUISHY_SERIES_ORDER
};
