/* =====================================================================
   DIFFICULTÉ ACADÉMIQUE — source unique de vérité
   =====================================================================
   Ce fichier centralise TOUS les paramètres numériques de difficulté
   des 12 mini-jeux, pour trois raisons :
     1. Lisibilité  : un seul endroit où comprendre « à quel niveau on
        demande quoi », au lieu d'une logique éparpillée dans 8 fichiers.
     2. Cohérence   : chaque jeu progresse par paliers réguliers (pas de
        saut brutal d'un niveau à l'autre), avec les mêmes 5 paliers.
     3. Fondement académique : les bornes sont choisies pour suivre la
        progression du programme scolaire français (cycle 1 - maternelle
        3-6 ans, et cycle 2 - CP/CE1/CE2), pas au hasard.

   ⚠️ Pas d'accès internet dans l'environnement de développement : les
   repères ci-dessous viennent du programme officiel que je connais déjà
   (BOEN, cycle 1 et cycle 2 — domaines « Construire les premiers outils
   pour structurer sa pensée » et « Mobiliser le langage », + programme
   de mathématiques/français CP-CE1-CE2). À vérifier sur
   eduscol.education.fr si une confirmation précise est nécessaire.

   -----------------------------------------------------------------
   LES 5 PALIERS DE DIFFICULTÉ (1 par île, dont la nouvelle île 5)
   -----------------------------------------------------------------
   Palier 1 — 🌊 Lagon      — grande section / début CP (5-6 ans)
     Découverte. Aucune pénalité d'erreur, pas de minuteur. On explore
     librement : l'objectif est la familiarisation avec chaque jeu.

   Palier 2 — 🌲 Forêt       — CP confirmé (6-7 ans)
     Premiers essais limités (❤️), toujours sans minuteur : on apprend
     à se concentrer, mais pas encore à aller vite.

   Palier 3 — ⛰️ Montagne    — fin CP / début CE1 (7-8 ans)
     Les nombres grandissent, les choix se multiplient. C'est le premier
     palier où un minuteur apparaît sur les jeux à réponse unique : à cet
     âge, la fluence (répondre vite ET bien) devient un objectif du
     programme (calcul mental automatisé, lecture courante).

   Palier 4 — 🏰 Château     — CE1 confirmé (8-9 ans)
     Consolidation : mêmes types d'exercices, exigences plus poussées
     (nombres plus grands, moins d'indices visuels, temps plus court).

   Palier 5 — 🌴 Jungle      — fin CE1 / début CE2 (9-10 ans)
     Palier de perfectionnement : le niveau le plus avancé du jeu. Les
     exercices se rapprochent de ce qui est attendu en CE2 (nombres
     jusqu'à 100, calculs à 3 termes, lecture fluide sans aucune image).

   Un joueur sans âge renseigné n'est jamais concerné par le minuteur
   (voir `timerFor`) ; un enfant de moins de 6 ans ne voit jamais les
   paliers 3 à 5, quelle que soit l'île (voir `gameTypesForAge` dans
   js/data.js) : la pression temporelle n'a pas sa place avant le CP.
   ===================================================================== */

// Les 5 paliers eux-mêmes (texte + repère scolaire), utilisés pour l'affichage
// (étoiles sur la carte) et pour la documentation ci-dessus.
const DIFFICULTY_TIERS = [
  { n:1, island:'lagon',    schoolLevel:'GS / début CP',  label:'Découverte' },
  { n:2, island:'foret',    schoolLevel:'CP',              label:'Entraînement' },
  { n:3, island:'montagne', schoolLevel:'fin CP / CE1',     label:'Fluence' },
  { n:4, island:'chateau',  schoolLevel:'CE1',              label:'Consolidation' },
  { n:5, island:'jungle',   schoolLevel:'fin CE1 / CE2',     label:'Perfectionnement' },
];

// Petit utilitaire : interpole/clampe un tableau de valeurs { 1:x, 2:y, ... }
// sur les 5 paliers, pour éviter les lectures `|| valeurPiochée`au hasard.
function tierValue(table, dd){
  const d = Math.max(1, Math.min(5, Number(dd) || 1));
  return (d in table) ? table[d] : table[Object.keys(table).map(Number).sort((a,b)=>a-b).pop()];
}

/* ---------------------------------------------------------------------
   1) MÉMOIRE — nombre de paires à retrouver.
   Charge de travail de mémoire visuelle : progression +1 paire par
   palier, jusqu'à 7 (au-delà, la grille devient difficile à lire sur
   un écran de téléphone pour un enfant).
   --------------------------------------------------------------------- */
function memoryPairs(dd){
  return tierValue({1:3, 2:4, 3:5, 4:6, 5:7}, dd);
}

/* ---------------------------------------------------------------------
   2) COMPTER — bornes du nombre d'objets à dénombrer.
   Programme : dénombrer jusqu'à 10 en fin de GS, jusqu'à 20 en CP,
   jusqu'à 100 en CE1-CE2 (ici on reste sous 20 : au-delà, l'exercice de
   dénombrement visuel un-par-un n'a plus de sens pédagogique — on passe
   au calcul, cf. mathBounds).
   --------------------------------------------------------------------- */
function countRange(dd){
  // { min, max } du nombre d'objets affichés
  return tierValue({
    1:{min:3, max:7},
    2:{min:3, max:9},
    3:{min:4, max:11},
    4:{min:5, max:14},
    5:{min:6, max:18},
  }, dd);
}

/* ---------------------------------------------------------------------
   3) TROUVER L'INTRUS — nombre d'images affichées, et probabilité de la
   variante « miroir » (plus exigeante : il faut comparer des formes
   symétriques, une compétence de discrimination visuelle plus fine que
   « cet objet est différent »).
   Progression régulière : +2 images par palier (6 → 8 → 10 → 12 → 14).
   --------------------------------------------------------------------- */
function diffTotal(dd){
  return tierValue({1:6, 2:8, 3:10, 4:12, 5:14}, dd);
}
function diffMirrorChance(dd){
  return tierValue({1:0, 2:0.3, 3:0.45, 4:0.55, 5:0.6}, dd);
}

/* ---------------------------------------------------------------------
   4) SUITE LOGIQUE — longueur du motif à reconnaître (en nombre de
   symboles distincts dans le motif qui se répète). Correspond à la
   notion de « suite organisée » du programme de cycle 1, puis à la
   notion d'algorithme simple en cycle 2.
   --------------------------------------------------------------------- */
function sequencePatternLength(dd){
  // nombre de symboles affichés avant de demander le suivant
  return tierValue({1:5, 2:6, 3:6, 4:7, 5:8}, dd);
}

/* ---------------------------------------------------------------------
   5) SIMON (mémoire auditive/visuelle de séquence) — longueur de la
   séquence à répéter. La recherche en psychologie cognitive situe
   l'empan mnésique d'un enfant de 6-7 ans autour de 4-5 éléments ; on
   reste prudemment sous cette limite même au palier maximal, pour que
   l'exercice reste un jeu et non un test de mémoire éprouvant.
   --------------------------------------------------------------------- */
function simonLength(dd){
  return tierValue({1:3, 2:4, 3:5, 4:6, 5:7}, dd);
}

/* ---------------------------------------------------------------------
   6) PUZZLE DES NOMBRES — longueur de la suite à ordonner, et quelles
   variantes sont proposées (suite à partir de 1, à partir d'un autre
   nombre, décroissante, de 2 en 2). Les probabilités sont EXPLICITES et
   chaque variante n'apparaît qu'une fois dans la liste — corrige un bug
   where « start » était ajouté deux fois (probabilité doublée par
   erreur dans l'ancienne version).
   --------------------------------------------------------------------- */
function puzzleCount(dd){
  return tierValue({1:4, 2:5, 3:6, 4:7, 5:8}, dd);
}
function puzzleVariants(dd){
  const d = Math.max(1, Math.min(5, Number(dd) || 1));
  // palier 1 : uniquement la suite la plus simple (1, 2, 3…)
  if(d<=1) return ['from1'];
  // palier 2 : + suite à partir d'un autre nombre
  if(d===2) return ['from1','start'];
  // palier 3 : + suite décroissante (compétence plus abstraite : CE1)
  if(d===3) return ['from1','start','desc'];
  // palier 4-5 : + suite de 2 en 2 (dénombrement par groupements, CE1-CE2)
  return ['from1','start','desc','step2'];
}
function puzzleStartMax(dd){
  return tierValue({1:8, 2:8, 3:12, 4:12, 5:16}, dd);
}

/* ---------------------------------------------------------------------
   7) OPÉRATIONS (addition/soustraction) — plafond des nombres utilisés,
   et à partir de quel palier la soustraction apparaît. Repère officiel :
   calculs jusqu'à 10 en fin de GS/début CP, jusqu'à 20 en CP, jusqu'à
   100 en CE1 (ici on reste sous 30 : au-delà, la manipulation visuelle
   par emoji devient illisible — un vrai calcul CE1-CE2 jusqu'à 100 se
   fait sans support imagé, cf. proposition de 6e île en fin de document
   ANALYSE-DIFFICULTE.md).
   --------------------------------------------------------------------- */
function mathBounds(dd){
  return tierValue({
    1:{max:5,  allowMinus:false},
    2:{max:10, allowMinus:true},
    3:{max:15, allowMinus:true},
    4:{max:20, allowMinus:true},
    5:{max:30, allowMinus:true},
  }, dd);
}

/* ---------------------------------------------------------------------
   8) LECTURE — à partir de quel palier le mot est affiché SEUL (sans
   l'image), ce qui force la lecture réelle au lieu de l'association
   visuelle ; et nombre d'images proposées (plus de distracteurs = plus
   difficile). Le principe alphabétique est un objectif de fin de GS,
   la lecture autonome de mots simples un objectif CP.
   --------------------------------------------------------------------- */
function readingWordOnly(dd){ return dd >= 3; }
function readingOptions(dd){
  return tierValue({1:3, 2:3, 3:4, 4:4, 5:5}, dd);
}

/* ---------------------------------------------------------------------
   9) DÉTERMINANTS (le/la/les, un/une/des) — à partir de quel palier
   l'image disparaît, nombre d'options, et probabilité du pluriel (le
   singulier est travaillé d'abord, le pluriel demande de reconnaître
   une marque supplémentaire — on l'augmente progressivement).
   --------------------------------------------------------------------- */
function determinantsImageShown(dd){ return dd <= 2; }
function determinantsPluralChance(dd){
  return tierValue({1:0.25, 2:0.3, 3:0.4, 4:0.45, 5:0.5}, dd);
}
function determinantsExtraDistractor(dd){ return dd >= 3; }

/* ---------------------------------------------------------------------
   10) GRANDEURS & VOLUMES — deux compétences enchaînées dans le temps
   (et non juste « plus dur ») : comparer des contenances est une
   compétence de cycle 1 (GS), reconnaître les solides du quotidien une
   compétence qui se construit en cycle 2 (CP-CE1). Il est donc
   pédagogiquement cohérent de dédier les paliers 1-2 à la comparaison
   et les paliers 3-5 à la reconnaissance des solides, plutôt que de
   mélanger les deux à chaque palier.
   Correctif : la comparaison de contenances progresse maintenant elle
   aussi (2 contenants au palier 1, 3 au palier 2, en demandant parfois
   le plus petit ET le plus grand), au lieu d'être identique partout.
   --------------------------------------------------------------------- */
function volumeUsesCapacityCompare(dd){ return dd <= 2; }
function volumeContainerCount(dd){
  return tierValue({1:2, 2:3}, dd);           // n'est utilisé que pour dd 1-2
}
function volumeAskLessChance(dd){
  return tierValue({1:0.2, 2:0.4}, dd);        // "le moins" = question plus exigeante
}
function solidOptions(dd){
  return tierValue({3:3, 4:4, 5:5}, dd);       // n'est utilisé que pour dd >= 3
}

/* ---------------------------------------------------------------------
   11) COMPARER LES NOMBRES (<, >, =) — plafond des nombres, ET,
   correctif important : à partir du palier 3, on force une partie des
   manches à comparer des nombres PROCHES (écart ≤ 5), sinon l'exercice
   peut rester trivial même au palier 5 (ex. comparer 3 et 97 ne demande
   aucune réflexion). La vraie compétence de comparaison se mesure sur
   des nombres voisins, pas seulement sur l'ordre de grandeur.
   --------------------------------------------------------------------- */
function compareRange(dd){
  return tierValue({1:10, 2:20, 3:50, 4:100, 5:100}, dd);
}
function compareCloseChance(dd){
  return tierValue({1:0, 2:0.15, 3:0.35, 4:0.5, 5:0.6}, dd);
}
function compareEqualChance(dd){
  return tierValue({1:0.2, 2:0.2, 3:0.2, 4:0.15, 5:0.15}, dd);
}

/* ---------------------------------------------------------------------
   12) LA MONNAIE — valeurs de pièces disponibles (suit les pièces
   réelles les plus simples : 1, 2, 5, 10, 20) ET nombre de pièces dans
   la pile à reconstituer (plus de pièces = plus de termes à additionner
   mentalement, donc plus dur, indépendamment des valeurs elles-mêmes).
   --------------------------------------------------------------------- */
function moneyDenoms(dd){
  return tierValue({
    1:[1,2],
    2:[1,2,5],
    3:[1,2,5,10],
    4:[1,2,5,10,20],
    5:[1,2,5,10,20],
  }, dd);
}
function moneyPileSize(dd){
  return tierValue({1:{min:2,max:2}, 2:{min:2,max:3}, 3:{min:2,max:3}, 4:{min:3,max:4}, 5:{min:3,max:5}}, dd);
}

/* ---------------------------------------------------------------------
   ESSAIS AUTORISÉS (❤️) — remplace l'ancien `triesFor` éparpillé.
   Règle générale : illimité au palier 1 (pure découverte), puis de
   moins en moins d'essais à mesure que la difficulté augmente — sauf
   pour les jeux qui demandent plusieurs étapes d'affilée (mémoire,
   Simon), où l'on garde un peu plus de marge pour ne pas sanctionner
   un enfant qui progresse normalement dans une tâche longue.
   --------------------------------------------------------------------- */
const LIVES_TABLE = {
  memory:       {2:5, 3:4, 4:4, 5:3},
  simon:        {2:3, 3:3, 4:2, 5:2},
  default:      {2:3, 3:2, 4:2, 5:1},          // jeux « une seule bonne réponse »
  // les jeux plus récents (calcul, lecture…) demandent un temps de
  // réflexion : on laisse un essai de plus que le barème par défaut.
  generous:     {2:4, 3:3, 4:3, 5:2},
};
function livesFor(kind, dd){
  const d = Math.max(1, Math.min(5, Number(dd) || 1));
  if(d <= 1) return Infinity;                  // île 1 : on apprend sans pression
  const GENEROUS_KINDS = ['math','reading','determinants','volume','compare','money'];
  const table = LIVES_TABLE[kind] || (GENEROUS_KINDS.includes(kind) ? LIVES_TABLE.generous : LIVES_TABLE.default);
  return table[d] !== undefined ? table[d] : table[4];
}

/* =====================================================================
   MINUTEUR — introduit la fluence (répondre juste ET dans un temps
   raisonnable), un objectif explicite du programme à partir du CE1.
   -----------------------------------------------------------------
   Règles :
   - jamais avant le palier 3 (Montagne) : avant cet âge/niveau, le
     programme vise la justesse, pas la vitesse ;
   - jamais pour les jeux à plusieurs étapes (mémoire, Simon, puzzle) :
     un minuteur sur une tâche longue stresse sans rien apprendre de
     plus — on le réserve aux jeux « une question, une réponse » ;
   - durée toujours généreuse, calibrée par type de tâche (compter
     visuellement prend plus de temps que lire un signe < ou >) ;
   - une minute écoulée ne « punit » pas plus qu'une mauvaise réponse :
     elle compte comme un essai perdu (même système de cœurs ❤️), avec
     un message encourageant, jamais un échec immédiat.
   ===================================================================== */
const TIMER_SECONDS = {
  count:        {3:20, 4:18, 5:16},
  diff:         {3:20, 4:18, 5:16},
  sequence:     {3:20, 4:18, 5:16},
  reading:      {3:22, 4:20, 5:18},   // lire prend plus de temps : on reste généreux
  math:         {3:26, 4:22, 5:20},
  money:        {3:26, 4:22, 5:20},   // additionner plusieurs pièces prend du temps
  determinants: {3:16, 4:14, 5:13},
  volume:       {3:16, 4:14, 5:13},
  compare:      {3:16, 4:14, 5:13},
};
// jeux à plusieurs étapes : jamais de minuteur, quelle que soit la difficulté
const NO_TIMER_KINDS = ['memory','simon','puzzle'];
function timerFor(kind, dd){
  if(NO_TIMER_KINDS.includes(kind)) return null;
  const table = TIMER_SECONDS[kind];
  if(!table) return null;
  const d = Math.max(1, Math.min(5, Number(dd) || 1));
  return table[d] || null;            // undefined aux paliers 1-2 → pas de minuteur
}
