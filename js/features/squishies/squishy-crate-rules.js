/* ---------- Les boîtes de rangement durables : la logique ----------
   Idée de la joueuse : « on range dans des boîtes les squishies ». À côté de
   l'exercice « 📦 Ranger » (une consigne, puis tout disparaît), l'enfant a ses
   boîtes à elle : elle choisit l'étiquette de chacune (une couleur, une
   famille, ses préférés, puis une forme, une taille, puis deux règles), y
   range ses squishies et les retrouve à la prochaine visite.

   L'état est state.squishies.crates (forme et nettoyage d'une partie importée :
   js/entities/game-state). Un exemplaire est à un seul endroit : libre, sur
   l'étagère ou dans une boîte (squishyFree, dans squishies.js).

   Ce que rapporte une boîte est borné : 5 pièces et une boîte de plus, une
   seule fois par boîte (`done`), et seulement pour une étiquette de tri : les
   préférés acceptent tout, ils ne paient donc jamais. 8 boîtes au plus.
   Aucune interface ici : l'onglet « 🗃️ Mes boîtes » est dans squishy-crates.js. */
import { crateCriteria, crateLabelValid, save } from '../../entities/game-state/index.js';
import { currentPlayerAge } from '../../entities/player/index.js';
import { SQ_COLORS, SQUISHIES, SQUISHY_SERIES, SQUISHY_SERIES_ORDER } from '../../entities/squishy/index.js';
import { addCoins } from '../wallet/index.js';
import {
  sortLevelCap,
  sortMatches,
  sortSay,
  sortWrongHint,
  SQ_SORT_SHAPES,
  SQ_SORT_SIZES,
  sqState,
  squishyFree,
  squishySeriesAvailable,
} from './squishies.js';

const CRATE_START = 3; // boîtes au départ
const CRATE_MAX = 8; // boîtes au plus
const CRATE_SLOTS = 6; // places par boîte
const CRATE_REWARD = 5; // pièces pour une boîte de tri pleine, une seule fois par boîte
const CRATE_UNLOCK_AT = 2; // boîtes payées qui ouvrent les deux règles à 6 et 7 ans

/** @typedef {import('../../entities/game-state/index.js').SquishyCrate} SquishyCrate */
/**
 * Ce que répond crateAdd : rangé (`ok`, avec toujours `full`, `coins`,
 * `newCrate` et `unlock`), ou refusé (`reason` seulement).
 * @typedef {{
 *   ok: boolean,
 *   reason?: 'bad' | 'nolabel' | 'full' | 'none' | 'wrong',
 *   full?: boolean,
 *   coins?: number,
 *   newCrate?: boolean,
 *   unlock?: boolean,
 * }} CrateResult
 */

/** @returns {SquishyCrate[]} les boîtes de rangement du joueur */
function squishyCrates() {
  return sqState().crates;
}
/** @param {unknown} i @returns {SquishyCrate | null} la boîte à cet index, s'il en est un */
function crateAt(i) {
  const list = squishyCrates();
  return typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < list.length ? list[i] : null;
}
function cratePaidCount() {
  return squishyCrates().filter((c) => c.done).length;
}

/* ---- le cran d'étiquettes : ce que l'enfant peut choisir ----
   1 (moins de 6 ans ou sans âge) : préférés, couleurs, familles ;
   2 (6-7 ans) : aussi les formes et les tailles ;
   3 (8 ans et plus, ou 6-7 ans après 2 boîtes payées) : aussi deux règles. */
/** @param {unknown} age @returns {number} */
function crateLevel(age) {
  const cap = sortLevelCap(age);
  return cap === 2 && cratePaidCount() >= CRATE_UNLOCK_AT ? 3 : cap;
}
/**
 * Les étiquettes à une règle proposées, dans l'ordre d'affichage.
 * @param {unknown} age
 * @returns {string[]}
 */
function crateLabelsFor(age) {
  const list = [
    'fav',
    ...Object.keys(SQ_COLORS).map((c) => 'color:' + c),
    ...SQUISHY_SERIES_ORDER.filter(squishySeriesAvailable).map((s) => 'series:' + s),
  ];
  if (crateLevel(age) < 2) return list;
  return [
    ...list,
    ...Object.keys(SQ_SORT_SHAPES).map((s) => 'shape:' + s),
    ...Object.keys(SQ_SORT_SIZES).map((z) => 'size:' + z),
  ];
}
/**
 * L'enfant peut-il poser cette étiquette ? (le choix proposé et sa vérification disent la même chose)
 * @param {unknown} key
 * @param {unknown} age
 * @returns {boolean}
 */
function crateLabelAllowed(key, age) {
  if (!crateLabelValid(key)) return false;
  const rules = crateCriteria(key);
  if (!rules) return true; // les préférés
  if (rules.some((r) => r.type === 'series' && !squishySeriesAvailable(r.value))) return false;
  const lvl = crateLevel(age);
  if (rules.length > 1) return lvl >= 3;
  return rules[0].type === 'color' || rules[0].type === 'series' || lvl >= 2;
}

/* ---- les noms dits à voix haute ---- */
/** @param {string} key @returns {string} « ta boîte des squishies roses » */
function crateName(key) {
  const rules = crateCriteria(key);
  if (!rules) return 'ta boîte de préférés';
  if (rules[0].type === 'series') return `ta boîte des ${SQUISHY_SERIES[rules[0].value].name}`;
  return `ta boîte des ${sortSay(rules).replace('Range les ', '')}`;
}
/** @param {string} key @returns {string} « Les roses », « Les petits squishies roses » */
function crateOptionSay(key) {
  const rules = crateCriteria(key);
  if (!rules) return 'Tes préférés : tu mets ceux que tu veux !';
  if (rules.length > 1) return sortSay(rules).replace('Range les', 'Les');
  const r = rules[0];
  if (r.type === 'series') return `Les ${SQUISHY_SERIES[r.value].name}`;
  if (r.type === 'color') return `Les ${SQ_COLORS[r.value].adj[1]}`;
  return `Les ${(r.type === 'shape' ? SQ_SORT_SHAPES : SQ_SORT_SIZES)[r.value].p}`;
}
/**
 * L'indice parlé d'un squishy qui ne va pas dans la boîte (vide pour les préférés : tout y va).
 * @param {string} id
 * @param {string} key
 * @returns {string}
 */
function crateWrongHint(id, key) {
  const rules = crateCriteria(key);
  if (!rules) return '';
  if (rules[0].type === 'series')
    return `Lui, c'est ${SQUISHIES[id].say}. On cherche des ${SQUISHY_SERIES[rules[0].value].name} !`;
  return sortWrongHint(id, rules);
}

/* ---- ranger, sortir, étiqueter ---- */
/**
 * Range un exemplaire libre dans une boîte. Refus, le premier qui s'applique :
 * `bad` (index ou id inconnu), `nolabel`, `full`, `none` (aucun exemplaire
 * libre), `wrong` (il ne respecte pas l'étiquette).
 * @param {number} i
 * @param {string} id
 * @returns {CrateResult}
 */
function crateAdd(i, id) {
  const c = crateAt(i);
  // une clé du catalogue lui-même (pas « constructor »)
  if (!c || typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(SQUISHIES, id))
    return { ok: false, reason: 'bad' };
  if (!c.label) return { ok: false, reason: 'nolabel' };
  if (c.items.length >= CRATE_SLOTS) return { ok: false, reason: 'full' };
  if (squishyFree(id) <= 0) return { ok: false, reason: 'none' };
  const rules = crateCriteria(c.label);
  if (rules && !sortMatches(id, rules)) return { ok: false, reason: 'wrong' };
  c.items.push(id);
  const full = c.items.length >= CRATE_SLOTS;
  const res = { ok: true, full, coins: 0, newCrate: false, unlock: false };
  // première boîte de tri pleine : elle paie une fois, et en apporte une autre
  if (full && rules && !c.done) {
    const paid = cratePaidCount();
    c.done = true;
    res.coins = CRATE_REWARD;
    res.unlock = sortLevelCap(currentPlayerAge()) === 2 && paid === CRATE_UNLOCK_AT - 1;
    if (squishyCrates().length < CRATE_MAX) {
      squishyCrates().push({ label: null, items: [], done: false });
      res.newCrate = true;
    }
    addCoins(CRATE_REWARD);
  }
  save();
  return res;
}
/**
 * Sort de la boîte l'exemplaire à cette position : il redevient libre.
 * @param {number} i
 * @param {number} pos
 * @returns {boolean}
 */
function crateRemove(i, pos) {
  const c = crateAt(i);
  if (!c || !Number.isInteger(pos) || pos < 0 || pos >= c.items.length) return false;
  c.items.splice(pos, 1);
  save();
  return true;
}
/** @param {number} i @returns {boolean} la boîte est vidée : tous ses exemplaires sont libres */
function crateEmpty(i) {
  const c = crateAt(i);
  if (!c) return false;
  c.items = [];
  save();
  return true;
}
/**
 * Pose l'étiquette d'une boîte vide (on ne change pas celle d'une boîte remplie :
 * un rangement ne se perd pas en silence).
 * @param {number} i
 * @param {string} key
 * @param {unknown} age
 * @returns {boolean}
 */
function crateSetLabel(i, key, age) {
  const c = crateAt(i);
  if (!c || c.items.length || !crateLabelAllowed(key, age)) return false;
  c.label = key;
  save();
  return true;
}

export {
  CRATE_MAX,
  CRATE_REWARD,
  CRATE_SLOTS,
  CRATE_START,
  crateAdd,
  crateEmpty,
  crateLabelAllowed,
  crateLabelsFor,
  crateLevel,
  crateName,
  crateOptionSay,
  crateRemove,
  crateSetLabel,
  crateWrongHint,
  squishyCrates,
};
