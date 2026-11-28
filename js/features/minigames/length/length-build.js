/* ---------- « Mesure les crayons » : le tirage d'une question ----------
   La partie sans écran du jeu (js/features/minigames/length/length.js). Selon
   le palier (`lengthRound`, js/entities/difficulty/difficulty-s3.js) :
     compare : 2 ou 3 crayons, le plus long ou le plus court à toucher ;
     units   : un crayon à mesurer en gommes ;
     ruler   : un crayon à mesurer en centimètres sur la règle.
   Les longueurs de `compare` sont en unités du dessin (largeur 100). */
import { lengthRound } from '../../../entities/difficulty/index.js';
import { pickRandom, random, shuffle } from '../../../shared/lib/index.js';

/** @typedef {import('../../../entities/difficulty/index.js').LengthRules} LengthRules */
/** @typedef {{ start: number, len: number }} LengthCrayon   compare : unités du dessin ; units : gommes ; ruler : cm */
/** @typedef {{
 *   rules: LengthRules,
 *   mode: 'compare' | 'units' | 'ruler',
 *   ask: 'long' | 'short' | null,      // compare seulement, sinon null
 *   crayons: LengthCrayon[],           // 2 ou 3 en compare, 1 sinon
 *   start: number,                     // 0, ou s au palier 5 (0 en compare)
 *   answer: number,                    // compare : index dans crayons ; units et ruler : k
 *   choices: number[],                 // units et ruler : les nombres proposés, mélangés ; compare : []
 *   trap: number | null,               // palier 5 : s + k ; sinon null
 * }} LengthBuild */

const LENGTH_MIN = 25; // longueurs de `compare`, en unités du dessin
const LENGTH_MAX = 90;
const LENGTH_LEFT = 5; // le bord gauche : départ des crayons alignés
const LENGTH_SHIFT = 25; // départ le plus à droite d'un crayon décalé
const LENGTH_RIGHT = 95; // aucun crayon ne finit plus loin
const LENGTH_RULER_MAX = 15; // la règle va de 0 à 15 cm

/**
 * Un entier au hasard de min à max compris.
 * @param {number} min
 * @param {number} max
 */
function lengthInt(min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/**
 * Des longueurs toutes bien différentes : deux voisines (une fois triées)
 * sont dans un rapport d'au moins `minRatio`.
 * @param {number} n
 * @param {number} minRatio
 * @returns {number[]}
 */
function lengthDrawLens(n, minRatio) {
  for (let k = 0; k < 500; k++) {
    const lens = Array.from({ length: n }, () => lengthInt(LENGTH_MIN, LENGTH_MAX));
    const sorted = lens.slice().sort((a, b) => a - b);
    if (sorted.every((v, i) => i === 0 || v >= minRatio * sorted[i - 1])) return lens;
  }
  return [30, 45, 68, 90].slice(0, n); // jamais atteint en pratique : des longueurs sûres
}

/**
 * Les crayons d'une comparaison : alignés à gauche, ou décalés.
 * @param {LengthRules} rules
 * @returns {LengthCrayon[]}
 */
function lengthDrawCrayons(rules) {
  return lengthDrawLens(rules.n || 2, rules.minRatio || 1.3).map((len) => ({
    start: rules.aligned ? LENGTH_LEFT : lengthInt(LENGTH_LEFT, Math.min(LENGTH_SHIFT, LENGTH_RIGHT - len)),
    len,
  }));
}

/**
 * L'index du crayon demandé (le plus long ou le plus court).
 * @param {LengthCrayon[]} crayons
 * @param {'long' | 'short'} ask
 */
function lengthAnswer(crayons, ask) {
  const lens = crayons.map((c) => c.len);
  return lens.indexOf(ask === 'long' ? Math.max(...lens) : Math.min(...lens));
}
/** @param {LengthCrayon[]} crayons l'index du crayon qui finit le plus à droite */
function lengthFurthest(crayons) {
  const ends = crayons.map((c) => c.start + c.len);
  return ends.indexOf(Math.max(...ends));
}

/**
 * Comparer : le plus long, ou le plus court. Le piège du décalage (`trap`) :
 * on retire jusqu'à ce que le crayon qui finit le plus à droite ne soit pas
 * la réponse (« celui qui va le plus loin » n'est pas « le plus long »).
 * @param {LengthRules} rules
 * @returns {LengthBuild}
 */
function lengthBuildCompare(rules) {
  const ask = random() < 0.5 ? 'long' : 'short';
  const tries = random() < (rules.trap || 0) ? 400 : 0; // 0 : pas de piège cette fois
  let crayons = lengthDrawCrayons(rules);
  for (let k = 0; k < tries && lengthFurthest(crayons) === lengthAnswer(crayons, ask); k++) {
    crayons = lengthDrawCrayons(rules);
  }
  return {
    rules,
    mode: 'compare',
    ask,
    crayons,
    start: 0,
    answer: lengthAnswer(crayons, ask),
    choices: [],
    trap: null,
  };
}

/**
 * Mesurer en gommes : k gommes, et les choix k - 1, k, k + 1.
 * @param {LengthRules} rules
 * @returns {LengthBuild}
 */
function lengthBuildUnits(rules) {
  const k = lengthInt(rules.min || 2, rules.max || 6);
  return {
    rules,
    mode: 'units',
    ask: null,
    crayons: [{ start: 0, len: k }],
    start: 0,
    answer: k,
    choices: shuffle([k - 1, k, k + 1]),
    trap: null,
  };
}

/**
 * Mesurer à la règle : k centimètres. Posé au zéro, 4 choix voisins ; sinon le
 * crayon part de s, et la graduation sous sa pointe (s + k) est le piège.
 * @param {LengthRules} rules
 * @returns {LengthBuild}
 */
function lengthBuildRuler(rules) {
  const k = lengthInt(rules.min || 3, rules.max || 10);
  const start = rules.offset ? lengthInt(1, Math.min(4, LENGTH_RULER_MAX - 1 - k)) : 0;
  const trap = rules.offset ? start + k : null;
  const valid = (/** @type {number} */ v) => v >= 1 && v <= LENGTH_RULER_MAX && v !== trap;
  const near = rules.offset ? [k - 1, k + 1, k + 2] : [k - 2, k - 1, k + 1, k + 2];
  const fixed = trap === null ? [k] : [k, trap];
  const others = shuffle(near.filter(valid)).slice(0, (rules.choices || 4) - fixed.length);
  return {
    rules,
    mode: 'ruler',
    ask: null,
    crayons: [{ start, len: k }],
    start,
    answer: k,
    choices: shuffle([...fixed, ...others]),
    trap,
  };
}

/**
 * Une question du palier.
 * @param {number} dd le palier de difficulté
 * @returns {LengthBuild}
 */
function lengthBuildRound(dd) {
  const rules = lengthRound(dd);
  if (rules.mode === 'units') return lengthBuildUnits(rules);
  if (rules.mode === 'ruler') return lengthBuildRuler(rules);
  return lengthBuildCompare(rules);
}

// un mauvais choix à écarter par l'indice 2 de la règle : ni la réponse, ni le piège
/** @param {LengthBuild} b */
function lengthWrongChoice(b) {
  return pickRandom(b.choices.filter((v) => v !== b.answer && v !== b.trap));
}

export { lengthBuildRound, lengthWrongChoice };
