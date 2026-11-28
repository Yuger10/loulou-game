/* ---------- « Les paniers de dix » : les tirages ----------
   La question d'une mission (js/features/minigames/tens/tens.js) : son mode
   (ranger, lire, construire, écrire), son nombre, les groupes dessinés, les
   termes de l'écriture et les réponses proposées. Les paliers : `tensRound`
   (js/entities/difficulty/difficulty-s3.js). */
import { tensRound } from '../../../entities/difficulty/index.js';
import { random, shuffle } from '../../../shared/lib/index.js';

/** @typedef {import('../../../entities/difficulty/index.js').TensRound} TensRound */
/** @typedef {'build' | 'read' | 'make' | 'write'} TensMode */
/** @typedef {{ piles: number, baskets: number, loose: number }} TensStock des piles de cent, des paniers de dix, des tout seuls */
/**
 * La question d'une mission. `piles`, `baskets`, `loose` : les groupes dessinés
 * (ceux du nombre, sauf 10 à 19 tout seuls au palier 4) ; `terms` : l'écriture,
 * dans l'ordre affiché ; `phase` : `range` tant qu'on range (mode build), puis
 * `answer`, puis `won` ; `placed` : dumplings déjà rangés ; `stock` et `undo` :
 * ce que l'enfant a préparé (mode make) et les états d'avant, pour ↩️.
 * @typedef {{
 *   mode: TensMode, n: number, tier: number,
 *   piles: number, baskets: number, loose: number,
 *   terms: number[], options: number[],
 *   phase: 'range' | 'answer' | 'won', placed: number,
 *   stock: TensStock, undo: TensStock[],
 * }} TensQuestion
 */

/** @param {number} dd le palier de difficulté, ramené de 1 à 5 */
function tensTier(dd) {
  return Math.max(1, Math.min(5, Math.round(Number(dd)) || 1));
}
/** @param {number} n ses chiffres : centaines, dizaines, unités */
function tensDigits(n) {
  return { c: Math.floor(n / 100), d: Math.floor((n % 100) / 10), u: n % 10 };
}
/**
 * L'accord d'une quantité dite (règle R3) : « 1 panier », « 2 paniers ».
 * @param {number} k jamais 0 : un groupe vide n'est pas dit
 * @param {string} one
 * @param {string} many
 */
function tensQty(k, one, many) {
  return `${k} ${k === 1 ? one : many}`;
}

/**
 * Les pièges du palier, dans l'ordre de la règle R1 (null : condition non remplie).
 * @param {number} n
 * @param {number} tier
 * @returns {Array<number | null>}
 */
function tensTrapList(n, tier) {
  const { c, d, u } = tensDigits(n);
  // l'inversion des deux chiffres (34 → 43) ; « 03 » n'est pas un nombre à deux chiffres
  const swap = u !== 0 && u !== d ? 10 * u + d : null;
  if (tier <= 1) return [d + u, n + 1, n - 1];
  if (tier === 2) return [swap, d + u, n + 1, n - 1, n + 10, n - 10];
  if (tier <= 4) return [swap, n + 10, n - 10, n + 1, d + u, n - 1];
  return [
    u !== d ? 100 * c + 10 * u + d : null,
    d !== 0 && d !== c ? 100 * d + 10 * c + u : null,
    n + 100,
    n + 10,
    n + 1,
    n - 10,
  ];
}
/**
 * Les pièges gardés (règle R1) : les premiers valides du palier, puis le repli
 * n + 2, n − 2, n + 3, n − 3… Valide : de 1 à la borne, différent de n et des autres.
 * @param {number} n la bonne réponse
 * @param {number} dd le palier
 */
function tensTraps(n, dd) {
  const tier = tensTier(dd),
    cfg = tensRound(tier),
    cap = cfg.hundreds ? 999 : 99;
  /** @type {number[]} */
  const kept = [];
  const keep = (/** @type {number | null} */ v) => {
    if (kept.length >= cfg.choices - 1 || v === null) return;
    if (v >= 1 && v <= cap && v !== n && !kept.includes(v)) kept.push(v);
  };
  tensTrapList(n, tier).forEach(keep);
  for (let k = 2; kept.length < cfg.choices - 1 && k < 60; k++) {
    keep(n + k);
    keep(n - k);
  }
  return kept;
}

/**
 * Une question toute faite : les groupes sont ceux des chiffres du nombre,
 * l'écriture va des centaines aux unités.
 * @param {TensMode} mode
 * @param {number} n
 * @param {number} dd le palier
 * @returns {TensQuestion}
 */
function tensQuestion(mode, n, dd) {
  const { c, d, u } = tensDigits(n);
  return {
    mode,
    n,
    tier: tensTier(dd),
    piles: c,
    baskets: d,
    loose: u,
    terms: mode === 'write' ? [100 * c, 10 * d, u].filter(Boolean) : [],
    options: mode === 'make' ? [] : shuffle([n, ...tensTraps(n, dd)]),
    phase: mode === 'build' ? 'range' : 'answer',
    placed: 0,
    stock: { piles: 0, baskets: 0, loose: 0 },
    undo: [],
  };
}

/** @param {TensRound} cfg le mode tiré selon les chances du palier */
function tensPickMode(cfg) {
  const modes = /** @type {Array<[TensMode, number]>} */ (Object.entries(cfg.modes));
  let r = random();
  for (const [mode, chance] of modes) {
    r -= chance;
    if (r < 0) return mode;
  }
  return modes[0][0];
}
/**
 * Le nombre tient-il la règle de son mode ? (pas de dizaine ronde au palier 2,
 * au moins 2 termes à écrire)
 * @param {TensMode} mode
 * @param {number} n
 * @param {TensRound} cfg
 */
function tensValid(mode, n, cfg) {
  const { d, u } = tensDigits(n);
  if (mode === 'build') return u !== 0;
  if (mode === 'write') return cfg.hundreds ? d + u > 0 : u !== 0;
  return cfg.zero || u !== 0;
}
/**
 * L'ordre des termes de l'écriture : les unités d'abord (palier 4), ou mélangé (palier 5).
 * @param {number[]} terms des centaines aux unités
 * @param {TensRound} cfg
 */
function tensTermsOrder(terms, cfg) {
  if (random() < cfg.unitsFirst) return terms.slice().reverse();
  if (random() >= cfg.shuffled) return terms;
  let mixed = shuffle(terms.slice());
  for (let k = 0; k < 8 && mixed.join() === terms.join(); k++) mixed = shuffle(terms.slice());
  return mixed.join() === terms.join() ? terms.slice().reverse() : mixed;
}
/**
 * Un tirage : null si le nombre ne tient pas la règle de son mode.
 * @param {number} tier
 * @param {TensRound} cfg
 * @returns {TensQuestion | null}
 */
function tensDrawOnce(tier, cfg) {
  const mode = tensPickMode(cfg);
  if (mode === 'read' && random() < cfg.looseBig) {
    // 10 à 19 tout seuls à côté de 1 à 8 paniers : il faut regrouper de tête
    const baskets = 1 + Math.floor(random() * 8),
      loose = 10 + Math.floor(random() * 10);
    return { ...tensQuestion('read', 10 * baskets + loose, tier), baskets, loose };
  }
  const n = cfg.min + Math.floor(random() * (cfg.max - cfg.min + 1));
  if (!tensValid(mode, n, cfg)) return null;
  const q = tensQuestion(mode, n, tier);
  return mode === 'write' ? { ...q, terms: tensTermsOrder(q.terms, cfg) } : q;
}

const tensKey = (/** @type {TensQuestion} */ q) => `${q.mode}-${q.n}`;
// la question précédente : une relance en tire toujours une AUTRE (anti-devinette)
let tensLast = '';
/**
 * Après 20 tirages ratés : lire (ou ranger au palier 1) le premier nombre valide.
 * @param {number} tier
 * @param {TensRound} cfg
 */
function tensFallback(tier, cfg) {
  const mode = cfg.modes.read ? 'read' : 'build';
  for (let n = cfg.min; n <= cfg.max; n++)
    if (tensValid(mode, n, cfg) && `${mode}-${n}` !== tensLast) return tensQuestion(mode, n, tier);
  return tensQuestion(mode, cfg.min + 1, tier);
}
/**
 * La question d'une mission, toujours différente de la précédente (mode, nombre).
 * @param {number} dd le palier de difficulté
 * @returns {TensQuestion}
 */
function tensNewQuestion(dd) {
  const tier = tensTier(dd),
    cfg = tensRound(tier);
  /** @type {TensQuestion | null} */
  let q = null;
  for (let k = 0; k < 20 && !q; k++) {
    const draw = tensDrawOnce(tier, cfg);
    if (draw && tensKey(draw) !== tensLast) q = draw;
  }
  const picked = q || tensFallback(tier, cfg);
  tensLast = tensKey(picked);
  return picked;
}

export { tensDigits, tensNewQuestion, tensQty, tensQuestion, tensTraps };
