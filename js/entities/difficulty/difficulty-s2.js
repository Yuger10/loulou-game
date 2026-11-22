/* Les paliers des mini-jeux de la saison 2 (et de l'image à assembler),
   déplacés tels quels depuis difficulty.js, devenu trop long. Même règle :
   un tableau par palier lu par tierValue (voir l'en-tête de difficulty.js). */
import { tierValue } from './difficulty.js';

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
/** @param {number} dd le palier de difficulté */
function nestingRound(dd) {
  return tierValue(
    {
      1: { n: 3, sizes: [42, 71, 100], reverse: 0 },
      2: { n: 4, sizes: [40, 60, 80, 100], reverse: 0 },
      3: { n: 5, sizes: [40, 55, 70, 85, 100], reverse: 0 },
      4: { n: 5, sizes: [60, 70, 80, 90, 100], reverse: 0.3 },
      5: { n: 5, sizes: [64, 73, 82, 91, 100], reverse: 0.5 },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function cubesRound(dd) {
  return tierValue(
    {
      1: { w: 4, d: 1, h: 1, min: 2, max: 4 },
      2: { w: 4, d: 1, h: 2, min: 3, max: 5 },
      3: { w: 4, d: 1, h: 2, min: 5, max: 8 },
      4: { w: 3, d: 2, h: 2, min: 6, max: 8 },
      5: { w: 3, d: 2, h: 3, min: 8, max: 12 },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function packsRound(dd) {
  return tierValue(
    {
      1: { sizes: [2], min: 2, max: 3, extra: 0, label: false },
      2: { sizes: [2, 5], min: 2, max: 4, extra: 0, label: false },
      3: { sizes: [2, 5, 10], min: 2, max: 4, extra: 0, label: false },
      4: { sizes: [2, 5, 10], min: 2, max: 5, extra: 0.5, label: false },
      5: { sizes: [2, 5, 10], min: 3, max: 5, extra: 0.5, label: true },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function shelfRound(dd) {
  return tierValue(
    {
      1: { size: 2, toys: 1, find: 0, coords: 0 },
      2: { size: 3, toys: 2, find: 0, coords: 0 },
      3: { size: 3, toys: 3, find: 0.3, coords: 0 },
      4: { size: 4, toys: 3, find: 0.3, coords: 0 },
      5: { size: 4, toys: 3, find: 0.2, coords: 0.5 },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function shareRound(dd) {
  return tierValue(
    {
      1: { ask: 'fair', parts: [2], near: false },
      2: { ask: 'fair', parts: [2, 4], near: true },
      3: { ask: 'show', fracs: [2, 4], trap: false },
      4: { ask: 'show', fracs: [2, 3, 4], trap: true },
      5: { ask: 'write', fracs: [2, 3, 4], whole: 0.4 },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function recipeRound(dd) {
  return tierValue(
    {
      1: { asks: ['bowls', 'balance'], amounts: [1, 3, 5] },
      2: { asks: ['spoons'], min: 2, max: 6 },
      3: { asks: ['spoons', 'cup'], min: 4, max: 10, scales: [{ unit: 'verres', step: 1, max: 5, label: 1 }] },
      4: { asks: ['cup'], scales: [{ unit: 'g', step: 10, max: 100, label: 50 }] },
      5: {
        asks: ['cup'],
        scales: [
          { unit: 'g', step: 50, max: 500, label: 250 },
          { unit: 'cl', step: 10, max: 100, label: 50 },
        ],
      },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function rhythmRound(dd) {
  return tierValue(
    {
      1: { n: 3, long: false, rests: 0, hide: false, read: false },
      2: { n: 4, long: true, rests: 0, hide: false, read: false },
      3: { n: 5, long: true, rests: 1, hide: true, read: false },
      4: { n: 6, long: true, rests: 1, hide: true, read: false },
      5: { n: 6, long: true, rests: 2, hide: false, read: true },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function pitchRound(dd) {
  return tierValue(
    {
      1: { ask: 'high', n: 2, gap: 9 },
      2: { ask: 'order', n: 3, gap: 5 },
      3: { ask: 'order', n: 4, gap: 2, maxGap: 7 },
      4: { ask: 'order', n: 5, gap: 2, maxGap: 5 },
      5: { ask: 'order', n: 5, gap: 2, maxGap: 5, melody: 0.4 },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function lifecycleRound(dd) {
  return tierValue(
    {
      1: { n: 3, modes: ['order'] },
      2: { n: 4, modes: ['order'] },
      3: { n: 5, modes: ['order', 'missing'] },
      4: { n: 4, modes: ['missing', 'mixed'] },
      5: { n: 5, modes: ['next', 'mixed', 'missing'] },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function ladybugsRound(dd) {
  return tierValue(
    {
      1: { modes: ['count'], min: 1, max: 3 },
      2: { modes: ['double'], min: 2, max: 5 },
      3: { modes: ['double', 'complete'], min: 4, max: 10 },
      4: { modes: ['complete', 'double'], min: 5, max: 10 },
      5: { modes: ['half', 'half', 'complete'], min: 4, max: 10 },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function potionsRound(dd) {
  return tierValue(
    {
      1: { modes: ['name'], mixes: 3, holes: 2 },
      2: { modes: ['mix'], mixes: 3, holes: 2 },
      3: { modes: ['mix', 'rainbow'], mixes: 5, holes: 2 },
      4: { modes: ['mix', 'rainbow', 'inverse'], mixes: 5, holes: 3 },
      5: { modes: ['inverse', 'rainbow'], mixes: 5, holes: 4 },
    },
    dd,
  );
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
/** @param {number} dd le palier de difficulté */
function mirrorRound(dd) {
  return tierValue(
    {
      1: { size: 4, cells: 2, axes: ['v'], two: 0 },
      2: { size: 4, cells: 3, axes: ['v'], two: 0 },
      3: { size: 6, cells: 5, axes: ['v'], two: 0 },
      4: { size: 6, cells: 5, axes: ['v', 'h'], two: 0 },
      5: { size: 6, cells: 6, axes: ['v', 'h'], two: 0.5 },
    },
    dd,
  );
}

/** @param {number} dd le palier de difficulté */
function jigsawRound(dd) {
  return tierValue(
    {
      1: { cols: 2, rows: 2, ghost: 0.45 },
      2: { cols: 2, rows: 2, ghost: 0.2 },
      3: { cols: 3, rows: 3, ghost: 0.22 },
      4: { cols: 3, rows: 3, ghost: 0 },
      5: { cols: 4, rows: 3, ghost: 0 },
    },
    dd,
  );
}

export {
  cubesRound,
  jigsawRound,
  ladybugsRound,
  lifecycleRound,
  mirrorRound,
  nestingRound,
  packsRound,
  pitchRound,
  potionsRound,
  recipeRound,
  rhythmRound,
  shareRound,
  shelfRound,
};
