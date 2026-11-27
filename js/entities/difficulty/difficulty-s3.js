/* Les paliers des mini-jeux de la saison 3 « La Grande Expédition », sur le
   modèle de difficulty-s2.js : un tableau par palier lu par tierValue (voir
   l'en-tête de difficulty.js). Les essais et l'absence de minuteur restent
   dans difficulty.js (LIVES_TABLE, GENEROUS_KINDS, NO_TIMER_KINDS). */
import { tierValue } from './difficulty.js';

/* ---------------------------------------------------------------------
   TRACE AVEC TON DOIGT (Île des Crayons, saison 3) : le geste d'écriture
   (cycle 2 : les capitales et les chiffres, puis l'écriture cursive au CP).
     palier 1   1 glyphe : capitales bâton et chiffres simples, tolérance
                large, ni sens ni départ imposés, démonstration au début
     palier 2   2 glyphes : lettres attachées et chiffres ; on part du point
                vert et on suit le sens des flèches
     palier 3   2 glyphes : les lettres rondes (c, o, a, d) et 6, 8, 9
     palier 4   3 lettres attachées, révision, tolérance plus fine
     palier 5   3 glyphes, sans les flèches
   `R` : rayon de tolérance (unités du carré de 0 à 100) ; `cover` : part du
   modèle à couvrir ; `order` : dans le sens du modèle ; `start` : départ près
   du point vert ; `wander` : part du geste tolérée hors du chemin.
   Une enfant de 6 ans joue les paliers 1 et 2 (plafond par l'âge).
   Pas de minuteur.
   --------------------------------------------------------------------- */
/** @typedef {{ glyphs: number, set: string, R: number, cover: number, order: boolean, start: boolean, wander: number, arrows: boolean, demo: boolean }} TraceRules */
/** @type {Record<number, TraceRules>} */
const TRACE_TIERS = {
  1: { glyphs: 1, set: 'p1', R: 16, cover: 0.75, order: false, start: false, wander: 0.35, arrows: true, demo: true },
  2: { glyphs: 2, set: 'p2', R: 14, cover: 0.85, order: true, start: true, wander: 0.3, arrows: true, demo: false },
  3: { glyphs: 2, set: 'p3', R: 12, cover: 0.85, order: true, start: true, wander: 0.25, arrows: true, demo: false },
  4: { glyphs: 3, set: 'p4', R: 11, cover: 0.9, order: true, start: true, wander: 0.25, arrows: true, demo: false },
  5: { glyphs: 3, set: 'p5', R: 10, cover: 0.9, order: true, start: true, wander: 0.2, arrows: false, demo: false },
};
/**
 * @param {number} dd le palier de difficulté
 * @returns {TraceRules}
 */
function traceRound(dd) {
  return tierValue(TRACE_TIERS, dd);
}

/* ---------------------------------------------------------------------
   MESURE LES CRAYONS (Île des Crayons, saison 3) : grandeurs et mesures
   (cycle 2 : comparer des longueurs, mesurer avec un étalon, puis avec la
   règle graduée en centimètres au CE1).
     palier 1   le plus long (ou le plus court) de 2 crayons alignés
     palier 2   de 3 crayons décalés : celui qui va le plus loin n'est pas
                toujours le plus long
     palier 3   mesurer en gommes (2 à 6), trois réponses voisines
     palier 4   mesurer en centimètres, le crayon posé au zéro de la règle
     palier 5   le crayon ne part plus du zéro : il faut compter l'écart
   `minRatio` : rapport minimal entre deux longueurs voisines ; `trap` : chance
   du piège du décalage ; `unit` et `cm` : largeur d'une gomme et d'un
   centimètre dans le dessin (largeur 100). Pas de minuteur.
   --------------------------------------------------------------------- */
/** @typedef {{ mode: 'compare' | 'units' | 'ruler', n?: number, aligned?: boolean, minRatio?: number, trap?: number, min?: number, max?: number, choices?: number, unit?: number, cm?: number, offset?: boolean }} LengthRules */
/** @type {Record<number, LengthRules>} */
const LENGTH_TIERS = {
  1: { mode: 'compare', n: 2, aligned: true, minRatio: 1.3 },
  2: { mode: 'compare', n: 3, aligned: false, minRatio: 1.15, trap: 0.5 },
  3: { mode: 'units', min: 2, max: 6, choices: 3, unit: 12 },
  4: { mode: 'ruler', min: 3, max: 12, offset: false, choices: 4, cm: 6 },
  5: { mode: 'ruler', min: 3, max: 10, offset: true, choices: 4, cm: 6 },
};
/**
 * @param {number} dd le palier de difficulté
 * @returns {LengthRules}
 */
function lengthRound(dd) {
  return tierValue(LENGTH_TIERS, dd);
}

/* ---------------------------------------------------------------------
   LES PANIERS DE DIX (Île des Squishy Dumplings, saison 3) : la valeur de
   position (cycle 2 : dizaines et unités jusqu'à 100 en fin de CP, centaines
   jusqu'à 1000 en fin de CE1).
     palier 1   GS, début CP   ranger 11 à 19 dumplings dans un panier de dix
     palier 2   CP             lire et construire, de 20 à 69, sans dizaine ronde
     palier 3   fin CP, CE1    jusqu'à 99, dizaines rondes, écriture 30 + 5
     palier 4   CE1            10 à 19 tout seuls à regrouper, écriture 5 + 30
     palier 5   fin CE1, CE2   les centaines : piles de cent, 300 + 40 + 5
   `modes` : chance de chaque mode ; `min`/`max` : bornes du nombre ;
   `choices` : nombre de réponses ; `zero` : un chiffre 0 est-il permis ;
   `looseBig` : chance, en lecture, d'avoir 10 à 19 tout seuls ; `unitsFirst` :
   chance d'écrire les unités d'abord ; `shuffled` : chance d'un ordre mélangé ;
   `hundreds` : piles de cent et bouton +100. Pas de minuteur.
   --------------------------------------------------------------------- */
/** @typedef {{ modes: { build?: number, read?: number, make?: number, write?: number }, min: number, max: number, choices: number, zero: boolean, looseBig: number, unitsFirst: number, shuffled: number, hundreds: boolean }} TensRound */
/** @type {Record<number, TensRound>} */
const TENS_TIERS = {
  1: {
    modes: { build: 1 },
    min: 11,
    max: 19,
    choices: 3,
    zero: false,
    looseBig: 0,
    unitsFirst: 0,
    shuffled: 0,
    hundreds: false,
  },
  2: {
    modes: { read: 0.5, make: 0.5 },
    min: 20,
    max: 69,
    choices: 3,
    zero: false,
    looseBig: 0,
    unitsFirst: 0,
    shuffled: 0,
    hundreds: false,
  },
  3: {
    modes: { read: 0.35, make: 0.35, write: 0.3 },
    min: 20,
    max: 99,
    choices: 4,
    zero: true,
    looseBig: 0,
    unitsFirst: 0,
    shuffled: 0,
    hundreds: false,
  },
  4: {
    modes: { read: 0.35, make: 0.3, write: 0.35 },
    min: 20,
    max: 99,
    choices: 4,
    zero: true,
    looseBig: 0.5,
    unitsFirst: 0.5,
    shuffled: 0,
    hundreds: false,
  },
  5: {
    modes: { read: 0.35, make: 0.3, write: 0.35 },
    min: 100,
    max: 999,
    choices: 4,
    zero: true,
    looseBig: 0,
    unitsFirst: 0,
    shuffled: 0.3,
    hundreds: true,
  },
};
/**
 * @param {number} dd le palier de difficulté
 * @returns {TensRound}
 */
function tensRound(dd) {
  return tierValue(TENS_TIERS, dd);
}

/* ---------------------------------------------------------------------
   LA COMMANDE DU CHEF (Île des Squishy Dumplings, saison 3) : retenir un
   ensemble (des sortes de dumplings et leur quantité), pour le plaisir et
   l'attention. L'empan d'un enfant de 6 à 7 ans est d'environ 4 à 5
   éléments : le palier de cet âge reste en dessous.
     palier 1   1 sorte, 1 à 3 dumplings, la couleur seule
     palier 2   2 sortes, 3 ou 4 dumplings, 4 couleurs
     palier 3   2 sortes, 3 à 5 dumplings, couleur et forme
     palier 4   3 sortes, 4 à 6 dumplings, couleur et forme
     palier 5   3 sortes, 5 ou 6 dumplings, couleur, forme et visage
   `kinds` : sortes commandées ; `min`/`max` : total de dumplings ; `attrs` :
   attributs actifs ; `colors` : couleurs possibles ; `palette` : sortes
   proposées. Pas de minuteur : l'enfant cache la commande lui-même.
   --------------------------------------------------------------------- */
/** @typedef {{ kinds: number, min: number, max: number, attrs: Array<'color' | 'shape' | 'face'>, colors: string[], palette: number }} OrderRound */
/** @type {Record<number, OrderRound>} */
const ORDER_TIERS = {
  1: { kinds: 1, min: 1, max: 3, attrs: ['color'], colors: ['rose', 'vert', 'jaune'], palette: 3 },
  2: { kinds: 2, min: 3, max: 4, attrs: ['color'], colors: ['rose', 'vert', 'jaune', 'violet'], palette: 4 },
  3: { kinds: 2, min: 3, max: 5, attrs: ['color', 'shape'], colors: ['rose', 'vert', 'jaune'], palette: 6 },
  4: { kinds: 3, min: 4, max: 6, attrs: ['color', 'shape'], colors: ['rose', 'vert', 'jaune'], palette: 6 },
  5: {
    kinds: 3,
    min: 5,
    max: 6,
    attrs: ['color', 'shape', 'face'],
    colors: ['rose', 'vert', 'jaune', 'violet'],
    palette: 8,
  },
};
/**
 * @param {number} dd le palier de difficulté
 * @returns {OrderRound}
 */
function orderRound(dd) {
  return tierValue(ORDER_TIERS, dd);
}

/* ---------------------------------------------------------------------
   LE TRÉSOR RACONTÉ (Île des Coffres, saison 3) : la résolution de problèmes
   additifs (cycle 2 : comprendre, modéliser, calculer, répondre).
     palier 1   GS, début CP   réunion, ajout, retrait jusqu'à 6, objets à toucher
     palier 2   CP             jusqu'à 10, les objets deviennent des barres
     palier 3   fin CP, CE1    jusqu'à 20, schéma en barres, comparaisons
     palier 4   CE1            jusqu'à 50, deux étapes, « est-ce possible ? »
     palier 5   fin CE1, CE2   jusqu'à 100, l'égalité seule
   `min`/`max` : bornes du tout ; `ecart` : écart maximal d'une comparaison ;
   `rep` : représentation ; `eqUnder` : l'égalité s'écrit sous le schéma ;
   `choices` : réponses au calcul ; `gap` : écart maximal d'un leurre ;
   `tens` : leurres à plus ou moins dix. Pas de minuteur.
   --------------------------------------------------------------------- */
/** @typedef {'concret' | 'concret-barre' | 'barres' | 'egalite'} ProblemsRep */
/**
 * Une ligne de « Le trésor raconté » (tables T1 et R1 de la spec).
 * @typedef {{ types: string[], min: number, max: number, ecart: number, rep: ProblemsRep,
 *   eqUnder: boolean, choices: number, gap: number, tens: boolean }} ProblemsRound
 */
const PB_EARLY = ['reunion', 'ajout', 'retrait', 'partie', 'ajoutInconnu', 'compPlus', 'compEcart'];
const PB_LATE = ['partie', 'ajoutInconnu', 'compEcart', 'compMoinsPlus', 'deuxEtapes', 'possible'];
const PB_SMALL = { ecart: 0, eqUnder: false, choices: 3, gap: 3, tens: false };
const PB_BIG = { choices: 4, gap: 10, tens: true };
/** @type {Record<number, ProblemsRound>} */
const PROBLEMS_TIERS = {
  1: { types: PB_EARLY.slice(0, 3), min: 2, max: 6, rep: 'concret', ...PB_SMALL },
  2: { types: PB_EARLY.slice(0, 4), min: 4, max: 10, rep: 'concret-barre', ...PB_SMALL },
  3: { types: PB_EARLY, min: 5, max: 20, rep: 'barres', ...PB_SMALL, ecart: 9, choices: 4 },
  4: {
    types: ['retrait', 'partie', 'ajoutInconnu', 'compPlus', 'compEcart', 'compMoinsPlus', 'deuxEtapes', 'possible'],
    min: 10,
    max: 50,
    ecart: 20,
    rep: 'barres',
    eqUnder: true,
    ...PB_BIG,
  },
  5: { types: PB_LATE, min: 20, max: 100, ecart: 40, rep: 'egalite', eqUnder: false, ...PB_BIG },
};
/**
 * @param {number} dd le palier de difficulté
 * @returns {ProblemsRound}
 */
function problemsRound(dd) {
  return tierValue(PROBLEMS_TIERS, dd);
}

/* ---------------------------------------------------------------------
   LE CODE SECRET (Île des Coffres, saison 3) : la déduction. Un cadenas, des
   indices tous vrais, un seul code possible : tout se déduit avant d'ouvrir.
     palier 1   2 roues, 4 symboles : un symbole chassé, un symbole placé
     palier 2   3 roues : « n'est pas sur la roue… »
     palier 3   5 symboles : deux symboles voisins
     palier 4   4 roues
     palier 5   6 symboles, plus aucun symbole placé : « une roue du bout »
   `wheels` : roues ; `palette` : symboles proposés ; `types` : indices
   permis ; `maxEst` : indices « est sur la roue » au plus ; `maxClues` :
   indices au plus. Pas de minuteur.
   --------------------------------------------------------------------- */
/**
 * Une ligne du « Code secret » (table T2 de la spec).
 * @typedef {{ wheels: number, palette: number, types: string[], maxEst: number, maxClues: number }} CodeRound
 */
/** @type {Record<number, CodeRound>} */
const CODE_TIERS = {
  1: { wheels: 2, palette: 4, types: ['est', 'absent'], maxEst: 1, maxClues: 3 },
  2: { wheels: 3, palette: 4, types: ['est', 'pas', 'absent'], maxEst: 1, maxClues: 4 },
  3: { wheels: 3, palette: 5, types: ['est', 'pas', 'absent', 'voisins'], maxEst: 1, maxClues: 4 },
  4: { wheels: 4, palette: 5, types: ['est', 'pas', 'absent', 'voisins'], maxEst: 1, maxClues: 5 },
  5: { wheels: 4, palette: 6, types: ['pas', 'absent', 'voisins', 'bout'], maxEst: 0, maxClues: 6 },
};
/**
 * @param {number} dd le palier de difficulté
 * @returns {CodeRound}
 */
function codeRound(dd) {
  return tierValue(CODE_TIERS, dd);
}

/* ---------------------------------------------------------------------
   LE CHEMIN DE LA PLUME (Monde des Chatouilles, saison 3) : coder un
   déplacement (CP : 10 instructions dont 2 virages ; CE1 : 15 dont 4).
   Palier 1 : flèches absolues ; ensuite « avance » et quarts de tour.
   `len`, `turns` : bornes du plus court programme ; `rocks` : cactus ;
   `slots` : cases du programme ; `startUp` : départ vers le haut.
   --------------------------------------------------------------------- */
/** @typedef {{ size: number, mode: 'abs' | 'rel', len: [number, number], turns: [number, number], rocks: number, slots: number, startUp: boolean }} CodingRound */
/** @type {Record<number, CodingRound>} */
const CODING_TIERS = {
  1: { size: 4, mode: 'abs', len: [2, 3], turns: [0, 0], rocks: 0, slots: 6, startUp: false },
  2: { size: 4, mode: 'rel', len: [3, 6], turns: [1, 1], rocks: 1, slots: 10, startUp: true },
  3: { size: 5, mode: 'rel', len: [5, 10], turns: [2, 2], rocks: 2, slots: 10, startUp: false },
  4: { size: 5, mode: 'rel', len: [6, 12], turns: [2, 3], rocks: 3, slots: 12, startUp: false },
  5: { size: 6, mode: 'rel', len: [9, 15], turns: [3, 4], rocks: 5, slots: 15, startUp: false },
};
/** @param {number} dd le palier de difficulté @returns {CodingRound} */
function codingRound(dd) {
  return tierValue(CODING_TIERS, dd);
}

/** LA PHRASE RIGOLOTE (Monde des Chatouilles) : `n` étiquettes à remettre en ordre ; `pic` : l'image, aux paliers 1 et 2.
 * @typedef {{ n: number, pic: boolean }} SentenceRound */
/** @param {number} dd le palier de difficulté @returns {SentenceRound} */
function sentenceRound(dd) {
  const p = Math.max(1, Math.min(5, Math.round(Number(dd)) || 1));
  return { n: p + 2, pic: p <= 2 };
}

export { codeRound, codingRound, lengthRound, orderRound, problemsRound, sentenceRound, tensRound, traceRound };
