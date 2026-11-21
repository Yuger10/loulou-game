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
   LES PALIERS DE DIFFICULTÉ (1 par île)
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

   Palier 5 — 🌴 Jungle, 🕰️ Cité du Temps — fin CE1 / début CE2 (9-10 ans)
     Palier de perfectionnement pour les 12 jeux « historiques » (nombres
     jusqu'à 100, calculs à 3 termes, lecture fluide sans aucune image).
     La Cité du Temps est au même palier numérique que la Jungle : elle
     n'ajoute pas de nombres plus grands, mais de NOUVELLES compétences
     (lire l'heure, repères temporels) — cf. `clockBounds`/`calendarMode`.

   Palier 6 — 🌋 Volcan des Génies — CE2 confirmé (10-11 ans)
     Palier exclusif au mini-jeu « Calcul mental » (voir `calcBounds`) :
     calcul SANS aucun support imagé, nombres à deux chiffres, tables de
     multiplication. Les 12 jeux historiques restent bloqués à leurs
     valeurs du palier 5 sur cette île (`tierValue` plafonne à 5) — il
     n'y a pédagogiquement rien à gagner à leur donner des nombres encore
     plus grands ; seul le calcul pur continue de progresser.

   Palier 6 — 🍡 Pays Squishy — CE2 (10-11 ans)
     8e île, la récompense après le Volcan : même palier 6. Son mini-jeu
     « Formes et couleurs » (voir `shapesRound`) couvre toute la scolarité,
     du tri par couleur (petite section) aux polygones et à leurs sommets
     (CE2) ; sur cette île il propose donc le plus difficile.

   Niveau propre à chaque jeu (v42, js/features/adaptive/adaptive.js) : en solo, le palier
   joué est aussi limité par ce que l'enfant a ACQUIS dans ce jeu. Changer
   d'île ne suffit plus : on monte d'un cran après 2 réussites d'affilée
   presque sans erreur, on redescend d'un cran après 2 missions ratées.

   Un joueur sans âge renseigné n'est jamais concerné par le minuteur
   (voir `timerFor`) ; un enfant de moins de 6 ans ne voit jamais les
   paliers 3 et plus, quelle que soit l'île (voir `gameTypesForAge` dans
   js/entities (item, character, world)) : la pression temporelle n'a pas sa place avant le CP.
   ===================================================================== */

// Les paliers eux-mêmes (texte + repère scolaire), utilisés pour l'affichage
// (étoiles sur la carte) et pour la documentation ci-dessus.
const DIFFICULTY_TIERS = [
  { n:1, island:'lagon',    schoolLevel:'GS / début CP',  label:'Découverte' },
  { n:2, island:'foret',    schoolLevel:'CP',              label:'Entraînement' },
  { n:3, island:'montagne', schoolLevel:'fin CP / CE1',     label:'Fluence' },
  { n:4, island:'chateau',  schoolLevel:'CE1',              label:'Consolidation' },
  { n:5, island:'jungle',   schoolLevel:'fin CE1 / CE2',     label:'Perfectionnement' },
  { n:5, island:'cite',     schoolLevel:'fin CE1 / CE2',     label:'Nouvelles compétences (temps)' },
  { n:6, island:'volcan',   schoolLevel:'CE2',               label:'Calcul mental pur' },
  { n:6, island:'squishy',  schoolLevel:'CE2',               label:'Formes, couleurs et polygones' },
];

// Petit utilitaire : interpole/clampe un tableau de valeurs { 1:x, 2:y, ... }
// sur les 5 paliers « historiques », pour éviter les lectures `|| valeur
// piochée` au hasard. Les jeux qui vont au-delà (calcul mental, palier 6)
// ont leur propre fonction de bornes qui n'utilise pas `tierValue`.
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
  // mémoire : voir livesFor — les essais suivent le nombre de paires
  jigsaw:       {2:5, 3:4, 4:4, 5:3},   // puzzle : beaucoup de morceaux, on essaie
  simon:        {2:3, 3:3, 4:2, 5:2},
  rhythm:       {2:3, 3:3, 4:2, 5:2},   // comme Simon : une suite à rejouer
  default:      {2:3, 3:2, 4:2, 5:1},          // jeux « une seule bonne réponse »
  // les jeux plus récents (calcul, lecture…) demandent un temps de
  // réflexion : on laisse un essai de plus que le barème par défaut.
  generous:     {2:4, 3:3, 4:3, 5:2},
};
function livesFor(kind, dd){
  const d = Math.max(1, Math.min(5, Number(dd) || 1));
  if(d <= 1) return Infinity;                  // île 1 : on apprend sans pression
  // MÉMOIRE : retourner deux cartes différentes fait partie du jeu. Avec n
  // paires, même un enfant qui se souvient de TOUT ce qu'il a vu se trompe
  // jusqu'à n fois en découvrant les cartes (≈ 0,6 n en moyenne). Avant, 3
  // essais pour 7 paires (palier 5) faisaient perdre presque à coup sûr un
  // enfant qui n'avait rien oublié (constaté par test/games.test.js). Les
  // essais suivent donc le nombre de paires : n + 2. Bien retenir fait
  // toujours gagner ; toucher au hasard fait toujours perdre.
  if(kind === 'memory') return memoryPairs(d) + 2;
  const GENEROUS_KINDS = ['math','reading','determinants','volume','compare','money','clock','calendar','calc','shapes','planets','cubes','packs','shelf','share','recipe','pitch','lifecycle','ladybugs','potions','mirror'];
  const table = LIVES_TABLE[kind] || (GENEROUS_KINDS.includes(kind) ? LIVES_TABLE.generous : LIVES_TABLE.default);
  // le calcul mental (palier 6, Volcan) emprunte le barème d'essais du
  // palier 5 : seul le minuteur continue de se resserrer au-delà.
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
  clock:        {3:18, 4:16, 5:14},
  calc:         {3:28, 4:24, 5:22, 6:20},   // calcul abstrait : le plus généreux de tous
};
// jeux à plusieurs étapes : jamais de minuteur, quelle que soit la difficulté
const NO_TIMER_KINDS = ['memory','simon','puzzle','calendar','shapes','planets','jigsaw','nesting','cubes','packs','shelf','share','recipe','rhythm','pitch','lifecycle','ladybugs','potions','mirror'];
function timerFor(kind, dd){
  if(NO_TIMER_KINDS.includes(kind)) return null;
  const table = TIMER_SECONDS[kind];
  if(!table) return null;
  // le calcul mental va jusqu'au palier 6 (Volcan) ; les autres jeux
  // restent plafonnés au palier 5 comme avant.
  const d = Math.max(1, Math.min(kind==='calc' ? 6 : 5, Number(dd) || 1));
  return table[d] || null;            // undefined aux paliers 1-2 → pas de minuteur
}

/* =====================================================================
   NOUVEAUX MONDES — Cité du Temps (palier 5, nouvelles compétences) et
   Volcan des Génies (palier 6, calcul mental pur). Voir
   ANALYSE-DIFFICULTE.md § 5 pour la proposition d'origine.
   ===================================================================== */

/* ---------------------------------------------------------------------
   13) QUELLE HEURE EST-IL ? — lecture de l'heure sur une horloge à
   aiguilles. Programme « grandeurs et mesures » CP-CE1 : heures pleines
   d'abord, demi-heures ensuite, quarts d'heure au palier le plus élevé
   (compétence CE1-CE2, rarement maîtrisée avant). Accessible dès 5 ans
   (MS/GS) en heures pleines : lire « il est 3 heures » sur une horloge
   ne demande pas de savoir lire des chiffres composés.
   --------------------------------------------------------------------- */
function clockGranularity(dd){
  // minutes possibles affichées sur l'horloge, selon le palier
  if(dd<=2) return [0];                 // heures pleines : 3h, 7h…
  if(dd<=4) return [0,30];              // + demi-heures : 3h30
  return [0,15,30,45];                  // + quarts d'heure : 3h15, 3h45
}
function clockOptions(dd){
  return dd>=4 ? 4 : 3;
}

/* ---------------------------------------------------------------------
   14) JOURS, MOIS, SAISONS — repères temporels, domaine « explorer le
   monde » (cycle 1) prolongé en cycle 2. Deux familles d'exercices :
   - « quelle saison ? » (reconnaissance d'une scène) : accessible dès
     la petite section (3-4 ans), aucune lecture nécessaire ;
   - « remets les jours dans l'ordre » : demande de lire des mots,
     réservé à partir du CP confirmé (palier 2+).
   Pas de minuteur sur ce jeu (voir NO_TIMER_KINDS) : la notion de temps
   qui passe n'a pas à être elle-même chronométrée, ce serait un comble
   pédagogique contre-productif.
   --------------------------------------------------------------------- */
function calendarUsesWeekdayOrder(dd){ return dd >= 2; }
function calendarWeekdayCount(dd){
  return tierValue({1:3, 2:3, 3:4, 4:5, 5:6}, dd);
}

/* ---------------------------------------------------------------------
   15) CALCUL MENTAL — la seule compétence du jeu qui va jusqu'au
   palier 6 (Volcan des Génies). Calcul SANS AUCUN support imagé : à la
   différence du jeu « Opérations » (qui illustre chaque terme par des
   emojis), on reste ici dans l'abstraction pure, ce qui correspond à
   l'attendu de fin CE1/CE2 (calcul mental automatisé). Multiplication
   introduite au palier 5 (tables de 2, 5 et 10 : les plus régulières,
   toujours enseignées en premier).
   --------------------------------------------------------------------- */
function calcBounds(dd){
  const d = Math.max(1, Math.min(6, Number(dd) || 1));
  const table = {
    1:{max:20,  terms:2, allowMinus:true,  allowMulti:false},
    2:{max:30,  terms:2, allowMinus:true,  allowMulti:false},
    3:{max:50,  terms:2, allowMinus:true,  allowMulti:false},
    4:{max:70,  terms:2, allowMinus:true,  allowMulti:false},
    5:{max:100, terms:3, allowMinus:true,  allowMulti:true},   // + multiplication
    6:{max:100, terms:3, allowMinus:true,  allowMulti:true},   // Volcan : idem, en moins de temps (timerFor)
  };
  return table[d];
}
const CALC_MULT_TABLES = [2, 5, 10];

/* ---------------------------------------------------------------------
   FORMES ET COULEURS (mini-jeu du Pays Squishy) — « Touche tous les… »
   ---------------------------------------------------------------------
   On trie des squishies : l'enfant touche TOUS ceux qui répondent à la
   consigne (2 ou 3 sur le plateau). Le critère suit la progression du
   programme « Explorer des formes, des grandeurs » (cycle 1) puis
   « Espace et géométrie » (cycle 2) :
     palier 1 (GS)        une couleur              « tous les squishies roses »
     palier 2 (CP)        une forme                « toutes les étoiles »
     palier 3 (CP/CE1)    forme ET couleur         « tous les cœurs bleus »
     palier 4 (CE1)       taille ET forme          « tous les petits triangles »
     palier 5 (CE1/CE2)   nombre de côtés          « les formes qui ont 4 côtés »
     palier 6 (CE2)       nombre de sommets        « les formes qui ont 6 sommets »
   Les couleurs se distinguent aussi par la clarté, et la consigne montre
   la couleur ou la forme attendue en image (pastille, silhouette) pour un
   enfant qui ne lit pas encore ; aux paliers 5-6, compter les côtés ou
   les sommets EST l'exercice, la consigne n'a donc pas d'image.
   Pas de minuteur (jeu à plusieurs touches) ; essais généreux. */
function shapesRound(dd){
  const d = Math.max(1, Math.min(6, Number(dd) || 1));
  return [
    null,
    { criterion:'color',      items:6, targets:2, shapes:['rond','carre','triangle'],                               colors:['rose','bleu','jaune'] },
    { criterion:'shape',      items:6, targets:2, shapes:['rond','carre','triangle','etoile','coeur'],             colors:['rose','bleu','jaune','vert'] },
    { criterion:'shapeColor', items:8, targets:2, shapes:['rond','carre','triangle','etoile','coeur'],             colors:['rose','bleu','jaune','vert'] },
    { criterion:'sizeShape',  items:8, targets:2, shapes:['rond','carre','triangle','etoile','coeur'],             colors:['rose','bleu','jaune','vert','violet'] },
    { criterion:'sides',      items:8, targets:3, shapes:['rond','triangle','carre','rectangle','losange','pentagone','hexagone'], colors:['rose','bleu','jaune','vert','violet','orange'] },
    { criterion:'vertices',   items:9, targets:3, shapes:['triangle','carre','rectangle','losange','pentagone','hexagone','octogone'], colors:['rose','bleu','jaune','vert','violet','orange'] },
  ][d];
}

/* ---------------------------------------------------------------------
   LES PLANÈTES — quiz illustré (« Questionner le monde », puis cycle 3)
   ---------------------------------------------------------------------
   Le palier du quiz suit celui de l'île (et donc l'âge de l'enfant, qui
   le plafonne en solo) : du Soleil, de la Lune et de la Terre (GS/CP)
   jusqu'à l'ordre des planètes et aux planètes rocheuses ou géantes.
   Pas de minuteur : on lit la question, ou on l'écoute, à son rythme.
   La banque de questions et les règles d'exactitude sont dans js/features/minigames/planets/planets.js. */
function planetsTier(dd){ return Math.max(1, Math.min(6, Number(dd) || 1)); }

/* ---------------------------------------------------------------------
   ASSEMBLER L'IMAGE — vrai puzzle (« Se repérer dans l'espace », cycle 1 :
   reconstituer une image de 2 puis 4 morceaux en petite et moyenne section,
   davantage en grande section et au CP).
     palier 1   2×2, l'image en transparence dans le cadre (guide fort)
     palier 2   2×2, transparence légère
     palier 3   3×3, transparence légère
     palier 4   3×3, plus de transparence : un petit modèle à côté
     palier 5   4×3 (12 morceaux), modèle à côté
   Pas de minuteur (tâche à plusieurs étapes) ; essais généreux.
   --------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   LES BOÎTES GIGOGNES (Monde des Boîtes, saison 2, v55) — sériation :
   ranger des boîtes de la plus petite à la plus grande (« Explorer des
   formes, des grandeurs », cycle 1 : ranger 3 objets en PS-MS, davantage
   ensuite).
     palier 1   3 boîtes, tailles bien différentes
     palier 2   4 boîtes
     palier 3   5 boîtes
     palier 4   5 boîtes, écarts plus fins ; parfois à l'envers
     palier 5   5 boîtes, écarts fins ; une fois sur deux, à l'envers
                (« de la plus grande à la plus petite »)
   `sizes` : tailles relatives (100 = la plus grande). Pas de minuteur.
   --------------------------------------------------------------------- */
function nestingRound(dd){
  return tierValue({
    1:{ n:3, sizes:[42, 71, 100],               reverse:0 },
    2:{ n:4, sizes:[40, 60, 80, 100],           reverse:0 },
    3:{ n:5, sizes:[40, 55, 70, 85, 100],       reverse:0 },
    4:{ n:5, sizes:[60, 70, 80, 90, 100],       reverse:.3 },
    5:{ n:5, sizes:[64, 73, 82, 91, 100],       reverse:.5 },
  }, dd);
}

/* ---------------------------------------------------------------------
   COMBIEN DE CUBES ? (Monde des Boîtes, saison 2, v55) — se repérer dans
   l'espace : une pile de cubes dessinée en perspective. La pile est une
   « carte des hauteurs » : chaque cube du dessus repose sur un autre cube.
     palier 1   2 à 4 cubes, une rangée, tous visibles
     palier 2   3 à 5 cubes, une rangée, tous visibles
     palier 3   jusqu'à 8 cubes, une rangée, sur 2 étages
     palier 4   jusqu'à 8 cubes, 2 étages, quelques cubes sur 2 rangées
     palier 5   jusqu'à 12 cubes, 2 rangées et 3 étages : certains sont
                cachés derrière ou dessous
   `w` × `d` : largeur et profondeur ; `h` : étages ; `min`/`max` : cubes.
   --------------------------------------------------------------------- */
function cubesRound(dd){
  return tierValue({
    1:{ w:4, d:1, h:1, min:2, max:4 },
    2:{ w:4, d:1, h:2, min:3, max:5 },
    3:{ w:4, d:1, h:2, min:5, max:8 },
    4:{ w:3, d:2, h:2, min:6, max:8 },
    5:{ w:3, d:2, h:3, min:8, max:12 },
  }, dd);
}

/* ---------------------------------------------------------------------
   LES PAQUETS DE JOUETS (Coffre aux Jouets Doux, saison 2) — le début de la
   multiplication : compter par paquets plutôt qu'un par un (« compter de 2
   en 2, de 5 en 5, de 10 en 10 », CP-CE1 ; « 4 paquets de 5 », 4 × 5, CE2).
     palier 1   paquets de 2, 2 ou 3 paquets (on peut compter un par un)
     palier 2   paquets de 2 et de 5, 2 à 4 paquets
     palier 3   paquets de 2, 5 et 10, 2 à 4 paquets
     palier 4   paquets de 2, 5 et 10, jusqu'à 5 paquets, parfois un jouet seul
     palier 5   idem, 3 à 5 paquets, et « 4 paquets de 5 » écrit sous l'image
   `extra` : chance d'un jouet tout seul en plus ; `label` : la phrase écrite.
   Pas de minuteur.
   --------------------------------------------------------------------- */
function packsRound(dd){
  return tierValue({
    1:{ sizes:[2],        min:2, max:3, extra:0,  label:false },
    2:{ sizes:[2, 5],     min:2, max:4, extra:0,  label:false },
    3:{ sizes:[2, 5, 10], min:2, max:4, extra:0,  label:false },
    4:{ sizes:[2, 5, 10], min:2, max:5, extra:.5, label:false },
    5:{ sizes:[2, 5, 10], min:3, max:5, extra:.5, label:true },
  }, dd);
}

/* ---------------------------------------------------------------------
   L'ÉTAGÈRE MAGIQUE (Coffre aux Jouets Doux, saison 2) — lire un tableau à
   double entrée (une couleur par ligne, une forme par colonne), puis des
   coordonnées (« ligne rose, colonne étoile », repérage CE2).
     palier 1   2 × 2 cases, un jouet à ranger
     palier 2   3 × 3, deux jouets
     palier 3   3 × 3, trois jouets ; parfois « quel jouet va dans cette case ? »
     palier 4   4 × 4, trois jouets ; parfois « quel jouet… ? »
     palier 5   4 × 4 : souvent des cadeaux à poser aux coordonnées dites
   `find` : chance de la question inverse ; `coords` : chance des coordonnées.
   Pas de minuteur.
   --------------------------------------------------------------------- */
function shelfRound(dd){
  return tierValue({
    1:{ size:2, toys:1, find:0,  coords:0 },
    2:{ size:3, toys:2, find:0,  coords:0 },
    3:{ size:3, toys:3, find:.3, coords:0 },
    4:{ size:4, toys:3, find:.3, coords:0 },
    5:{ size:4, toys:3, find:.2, coords:.5 },
  }, dd);
}

/* ---------------------------------------------------------------------
   LE GÂTEAU PARTAGÉ (Royaume des Bonbons, saison 2) — fractions simples :
   des parts égales (GS-CP), puis la moitié, le quart et le tiers (CE1),
   puis les écritures ½, ⅓, ¼ et « combien de quarts pour une moitié ? » (CE2).
     palier 1   « quel gâteau est coupé en 2 parts égales ? » (parts bien différentes)
     palier 2   en 2 ou en 4 parts égales, parts inégales plus proches
     palier 3   montrer la moitié ou le quart (la part colorée)
     palier 4   moitié, tiers, quart ; un piège : le bon nombre de parts, mais inégales
     palier 5   l'écriture de la part colorée, ou « combien de… pour faire… ? »
   `whole` : chance de la question « combien de… ». Pas de minuteur.
   --------------------------------------------------------------------- */
function shareRound(dd){
  return tierValue({
    1:{ ask:'fair',  parts:[2],       near:false },
    2:{ ask:'fair',  parts:[2, 4],    near:true },
    3:{ ask:'show',  fracs:[2, 4],    trap:false },
    4:{ ask:'show',  fracs:[2, 3, 4], trap:true },
    5:{ ask:'write', fracs:[2, 3, 4], whole:.4 },
  }, dd);
}

/* ---------------------------------------------------------------------
   LA RECETTE (Royaume des Bonbons, saison 2) — grandeurs et mesures :
   comparer (GS), compter des cuillères (CP), lire un verre doseur gradué de
   1 en 1 (CE1), puis de 10 en 10 et de 50 en 50 en grammes et centilitres,
   où seuls quelques traits portent un nombre (CE2).
     palier 1   le bol qui en a le plus (le moins), ou le sac le plus lourd (léger)
     palier 2   2 à 6 cuillères, puis « C'est prêt ! »
     palier 3   4 à 10 cuillères, ou le verre doseur en verres (traits numérotés)
     palier 4   le verre doseur en grammes : traits de 10 en 10, nombres tous les 50
     palier 5   grammes de 50 en 50 (nombres tous les 250) ou centilitres de 10 en 10
   Pas de minuteur.
   --------------------------------------------------------------------- */
function recipeRound(dd){
  return tierValue({
    1:{ asks:['bowls', 'balance'], amounts:[1, 3, 5] },
    2:{ asks:['spoons'], min:2, max:6 },
    3:{ asks:['spoons', 'cup'], min:4, max:10, scales:[{ unit:'verres', step:1, max:5, label:1 }] },
    4:{ asks:['cup'], scales:[{ unit:'g', step:10, max:100, label:50 }] },
    5:{ asks:['cup'], scales:[{ unit:'g', step:50, max:500, label:250 }, { unit:'cl', step:10, max:100, label:50 }] },
  }, dd);
}

/* ---------------------------------------------------------------------
   LE RYTHME MAGIQUE (Île de la Musique, saison 2) — écouter et reproduire un
   rythme (éducation musicale, cycles 1 et 2) : coups courts ●, longs ▬, silences 🤫.
     palier 1   3 coups tous pareils (tous courts ou tous longs), le rythme reste écrit
     palier 2   4 coups, courts et longs, le rythme reste écrit
     palier 3   5 symboles dont un silence ; le rythme se cache après l'écoute
     palier 4   6 symboles dont un silence, caché après l'écoute
     palier 5   6 symboles, deux silences : on lit le rythme écrit AVANT de l'entendre
   Pas de minuteur.
   --------------------------------------------------------------------- */
function rhythmRound(dd){
  return tierValue({
    1:{ n:3, long:false, rests:0, hide:false, read:false },
    2:{ n:4, long:true,  rests:0, hide:false, read:false },
    3:{ n:5, long:true,  rests:1, hide:true,  read:false },
    4:{ n:6, long:true,  rests:1, hide:true,  read:false },
    5:{ n:6, long:true,  rests:2, hide:false, read:true },
  }, dd);
}

/* ---------------------------------------------------------------------
   GRAVE OU AIGU ? (Île de la Musique, saison 2) — la hauteur des sons. Les
   notes sont prises dans une gamme pentatonique (do, ré, mi, sol, la) ;
   `gap` : écart minimal entre deux notes voisines (en demi-tons).
     palier 1   2 notes très éloignées : la plus aiguë (ou la plus grave)
     palier 2   3 notes à ranger du grave à l'aigu
     palier 3   4 notes plus proches
     palier 4   5 notes proches
     palier 5   5 notes, ou « la mélodie monte ou descend ? »
   Pas de minuteur.
   --------------------------------------------------------------------- */
function pitchRound(dd){
  return tierValue({
    1:{ ask:'high',  n:2, gap:9 },
    2:{ ask:'order', n:3, gap:5 },
    3:{ ask:'order', n:4, gap:2, maxGap:7 },
    4:{ ask:'order', n:5, gap:2, maxGap:5 },
    5:{ ask:'order', n:5, gap:2, maxGap:5, melody:.4 },
  }, dd);
}

/* ---------------------------------------------------------------------
   DE LA GRAINE À LA FLEUR (Jardin des Fées, saison 2) — le vivant (cycle 2 :
   naissance, croissance) : la plante, le papillon, la poule.
     palier 1   3 étapes à remettre dans l'ordre (graine, pousse, fleur)
     palier 2   4 étapes : plante, papillon ou poule
     palier 3   5 étapes de la plante, ou une étape manquante à retrouver
     palier 4   étape manquante, ou deux cycles mélangés (ranger ceux de la plante)
     palier 5   « que se passe-t-il ensuite ? », cycles mélangés, étape manquante
   Pas de minuteur.
   --------------------------------------------------------------------- */
function lifecycleRound(dd){
  return tierValue({
    1:{ n:3, modes:['order'] },
    2:{ n:4, modes:['order'] },
    3:{ n:5, modes:['order', 'missing'] },
    4:{ n:4, modes:['missing', 'mixed'] },
    5:{ n:5, modes:['next', 'mixed', 'missing'] },
  }, dd);
}

/* ---------------------------------------------------------------------
   LES COCCINELLES (Jardin des Fées, saison 2) — les doubles et les moitiés
   grâce à la symétrie des ailes (calcul, CP-CE2).
     palier 1   jusqu'à 3 points par aile : compter tous les points
     palier 2   les doubles jusqu'à 5 + 5
     palier 3   les doubles jusqu'à 10 + 10, ou compléter l'aile vide
     palier 4   compléter l'aile (jusqu'à 10), ou les doubles
     palier 5   les moitiés : « 14 points en tout, combien par aile ? »
   `min`/`max` : points par aile. Pas de minuteur.
   --------------------------------------------------------------------- */
function ladybugsRound(dd){
  return tierValue({
    1:{ modes:['count'],              min:1, max:3 },
    2:{ modes:['double'],             min:2, max:5 },
    3:{ modes:['double', 'complete'], min:4, max:10 },
    4:{ modes:['complete', 'double'], min:5, max:10 },
    5:{ modes:['half', 'half', 'complete'], min:4, max:10 },
  }, dd);
}

/* ---------------------------------------------------------------------
   LES POTIONS DE COULEURS (Royaume Arc-en-ciel, saison 2) — les couleurs
   et leurs mélanges (arts plastiques) ; l'ordre de l'arc-en-ciel.
     palier 1   reconnaître la couleur nommée à voix haute
     palier 2   les 3 mélanges primaires (orange, vert, violet)
     palier 3   tous les mélanges (+ rose, gris), l'arc-en-ciel à 2 trous
     palier 4   tous les mélanges, l'arc-en-ciel à 3 trous, le mélange inverse
     palier 5   le mélange inverse, l'arc-en-ciel à 4 trous
   `mixes` : nombre de mélanges utilisés (3 = les primaires). Pas de minuteur.
   --------------------------------------------------------------------- */
function potionsRound(dd){
  return tierValue({
    1:{ modes:['name'],                          mixes:3, holes:2 },
    2:{ modes:['mix'],                           mixes:3, holes:2 },
    3:{ modes:['mix', 'rainbow'],                mixes:5, holes:2 },
    4:{ modes:['mix', 'rainbow', 'inverse'],     mixes:5, holes:3 },
    5:{ modes:['inverse', 'rainbow'],            mixes:5, holes:4 },
  }, dd);
}

/* ---------------------------------------------------------------------
   LE MIROIR MAGIQUE (Royaume Arc-en-ciel, saison 2) — la symétrie axiale
   (cycle 2 : compléter une figure par symétrie).
     palier 1   4 × 4, axe vertical, 2 cases
     palier 2   4 × 4, axe vertical, 3 cases
     palier 3   6 × 6, axe vertical, 5 cases
     palier 4   6 × 6, axe vertical ou horizontal, 5 cases
     palier 5   6 × 6, axe vertical ou horizontal, 6 cases ; souvent deux couleurs
   Pas de minuteur.
   --------------------------------------------------------------------- */
function mirrorRound(dd){
  return tierValue({
    1:{ size:4, cells:2, axes:['v'],      two:0 },
    2:{ size:4, cells:3, axes:['v'],      two:0 },
    3:{ size:6, cells:5, axes:['v'],      two:0 },
    4:{ size:6, cells:5, axes:['v', 'h'], two:0 },
    5:{ size:6, cells:6, axes:['v', 'h'], two:.5 },
  }, dd);
}

function jigsawRound(dd){
  return tierValue({
    1:{cols:2, rows:2, ghost:.45},
    2:{cols:2, rows:2, ghost:.2},
    3:{cols:3, rows:3, ghost:.22},
    4:{cols:3, rows:3, ghost:0},
    5:{cols:4, rows:3, ghost:0},
  }, dd);
}

export {
  CALC_MULT_TABLES, calcBounds, calendarUsesWeekdayOrder, calendarWeekdayCount, clockGranularity,
  clockOptions, compareCloseChance, compareEqualChance, compareRange, countRange,
  determinantsExtraDistractor, determinantsImageShown, determinantsPluralChance, diffMirrorChance,
  cubesRound, diffTotal, jigsawRound, nestingRound, ladybugsRound, lifecycleRound, livesFor, mirrorRound, packsRound, potionsRound, pitchRound, recipeRound, rhythmRound, shareRound, shelfRound, mathBounds, memoryPairs, moneyDenoms, moneyPileSize, planetsTier,
  puzzleCount, puzzleStartMax, puzzleVariants, readingOptions, readingWordOnly, sequencePatternLength,
  shapesRound, simonLength, solidOptions, timerFor, volumeAskLessChance, volumeContainerCount,
  volumeUsesCapacityCompare
};
