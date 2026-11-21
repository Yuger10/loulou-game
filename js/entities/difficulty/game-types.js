/* ---------- Types de mini-jeux et ceux proposés selon l'âge ---------- */
const GAME_TYPES = ['memory','count','diff','puzzle','sequence','simon','math','reading','determinants','volume','compare','money','clock','calendar','calc','shapes','planets','jigsaw','nesting','cubes','packs','shelf','share','recipe','rhythm','pitch','lifecycle','ladybugs','potions','mirror'];

/* Quels types de défis proposer selon l'âge (programme de l'école
   maternelle, cycle 1, 3-6 ans — repères eduscol.education.fr) :
   - Petite section (3-4 ans) : tout juste le dénombrement (1 à 3), la
     reconnaissance visuelle (mémoire, intrus), pas encore de lecture ni
     de logique de suite.
   - Moyenne section (4-5 ans) : dénombrer jusqu'à 10, comparer des
     grandeurs (le plus grand/le plus petit), débuter les suites simples.
   - Grande section / 6 ans (début CP) : principe alphabétique et débuts
     de lecture, décomposer les nombres, suites de nombres, premiers
     calculs — tout l'éventail du jeu est alors ouvert.
   Un joueur sans âge renseigné garde l'accès à tous les jeux (comme avant). */
const AGE_GAME_TYPES = [
  // « Quelle saison ? » (calendar) ne demande aucune lecture : accessible
  // dès la petite section, au même titre que la mémoire ou l'intrus.
  // « Formes et couleurs » (shapes) aussi : reconnaître et trier formes et
  // couleurs est au programme dès la petite section (cycle 1).
  // « Les planètes » : dès 5 ans seulement (le Soleil, la Lune, la Terre,
  // le jour et la nuit) ; plus tôt, ces notions sont trop abstraites.
  // « Assembler l'image » (jigsaw) : le puzzle 2×2 avec l'image en
  // transparence se fait dès la petite section.
  // « Les boîtes gigognes » (nesting, v55) : ranger 3 objets du plus petit
  // au plus grand se fait dès la petite section.
  { max:4, types:['memory','count','diff','calendar','shapes','jigsaw','nesting'] },
  // à 5 ans (MS/GS) : + comparer des tailles, suites simples, couleurs,
  // et lire l'heure en heures pleines (« il est 3 heures »).
  // « Combien de cubes ? » (cubes, v55) : à 5 ans, compter une petite pile
  // dont tous les cubes se voient.
  // « Les paquets de jouets » (packs) : en GS, compter des paquets de 2 ;
  // « L'étagère magique » (shelf) : ranger un jouet dans une étagère 2 × 2.
  // « Le gâteau partagé » (share) : en GS, « est-ce coupé en parts égales ? » ;
  // « La recette » (recipe) : en GS, le bol le plus rempli, la balance.
  // « Le rythme magique » (rhythm) : en GS, 3 coups pareils à rejouer ;
  // « Grave ou aigu ? » (pitch) : en GS, 2 cloches très différentes.
  // « De la graine à la fleur » (lifecycle) : en GS, 3 étapes à ordonner ;
  // « Les coccinelles » (ladybugs) : en GS, compter jusqu'à 3 points par aile.
  // « Les potions de couleurs » (potions) : en GS, reconnaître la couleur nommée ;
  // « Le miroir magique » (mirror) : en GS, 2 cases à refléter dans une grille 4 × 4.
  { max:5, types:['memory','count','diff','volume','sequence','simon','clock','calendar','shapes','planets','jigsaw','nesting','cubes','packs','shelf','share','recipe','rhythm','pitch','lifecycle','ladybugs','potions','mirror'] },
  // 6 ans et plus (ou âge non précisé) : tous les jeux, dont le calcul
  // mental abstrait (calc), réservé au CP confirmé et plus.
];

function gameTypesForAge(age){
  const a = Number(age);
  if(!a) return GAME_TYPES;
  const tier = AGE_GAME_TYPES.find(r=>a<=r.max);
  return tier ? tier.types : GAME_TYPES;
}

const GAME_LIST = [
  { key:'memory',   emoji:'🧠', name:'Mémoire' },
  { key:'count',    emoji:'🔢', name:'Compter' },
  { key:'diff',     emoji:'🔍', name:"L'intrus" },
  { key:'puzzle',   emoji:'🧩', name:'Les nombres' },
  { key:'sequence', emoji:'🔮', name:'La suite' },
  { key:'simon',    emoji:'🎵', name:'Les couleurs' },
  { key:'math',     emoji:'➕', name:'Opérations' },
  { key:'reading',  emoji:'📖', name:'Lecture' },
  { key:'determinants', emoji:'🔤', name:'Petits mots' },
  { key:'volume',   emoji:'🧪', name:'Volumes' },
  { key:'compare',  emoji:'⚖️', name:'Comparer' },
  { key:'money',    emoji:'💰', name:'La monnaie' },
  { key:'clock',    emoji:'🕐', name:"L'heure" },
  { key:'calendar', emoji:'📅', name:'Calendrier' },
  { key:'calc',     emoji:'🌋', name:'Calcul mental' },
  { key:'shapes',   emoji:'🍡', name:'Formes et couleurs' },
  { key:'planets',  emoji:'🪐', name:'Les planètes' },
  { key:'jigsaw',   emoji:'🖼️', name:'Le puzzle' },
  { key:'nesting',  emoji:'🪆', name:'Les boîtes gigognes' },
  { key:'cubes',    emoji:'🧊', name:'Combien de cubes ?' },
  { key:'packs',    emoji:'🧸', name:'Les paquets de jouets' },
  { key:'shelf',    emoji:'🗄️', name:'L\'étagère magique' },
  { key:'share',    emoji:'🎂', name:'Le gâteau partagé' },
  { key:'recipe',   emoji:'🥣', name:'La recette' },
  { key:'rhythm',   emoji:'🥁', name:'Le rythme magique' },
  { key:'pitch',    emoji:'🔔', name:'Grave ou aigu ?' },
  { key:'lifecycle', emoji:'🌱', name:'De la graine à la fleur' },
  { key:'ladybugs', emoji:'🐞', name:'Les coccinelles' },
  { key:'potions',  emoji:'🧪', name:'Les potions de couleurs' },
  { key:'mirror',   emoji:'🪞', name:'Le miroir magique' },
];

export { GAME_LIST, gameTypesForAge };
