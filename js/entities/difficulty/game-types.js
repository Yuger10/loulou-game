/* ---------- Types de mini-jeux et ceux proposés selon l'âge ---------- */
const GAME_TYPES = ['memory','count','diff','puzzle','sequence','simon','math','reading','determinants','volume','compare','money','clock','calendar','calc','shapes','planets','jigsaw'];

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
  { max:4, types:['memory','count','diff','calendar','shapes','jigsaw'] },
  // à 5 ans (MS/GS) : + comparer des tailles, suites simples, couleurs,
  // et lire l'heure en heures pleines (« il est 3 heures »).
  { max:5, types:['memory','count','diff','volume','sequence','simon','clock','calendar','shapes','planets','jigsaw'] },
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
];

export { GAME_LIST, gameTypesForAge };
