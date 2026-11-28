/* ---------- « Le trésor raconté » : le tirage (tables T1, L1, R1 et X2 de la spec) ----------
   Un problème se tire en trois temps : son type (jamais celui du dernier
   problème joué, « possible » rare), ses nombres dans les bornes du palier
   (jamais ceux du dernier problème de ce type), ses personnages et son objet.
   La mémoire du dernier problème vit ici, jamais dans la sauvegarde. */
import { pickRandom, random, shuffle } from '../../../shared/lib/index.js';
import { PB_OBJECTS, PB_PEOPLE } from './problems-bank.js';

/** @typedef {import('../../../entities/difficulty/index.js').ProblemsRound} ProblemsRound */
/** @typedef {import('./problems-bank.js').PbProblem} PbProblem */
/** @typedef {{ a: number, b: number, c: number, t: number }} PbNums */
/**
 * Une étape de calcul (table L1) : les deux nombres dans l'ordre de l'énoncé,
 * leurs cases et celle du « ? » (`slots`), l'opération, le résultat, l'ordre
 * à toucher pour l'égalité (`order`).
 * @typedef {{ n1: number, n2: number, slots: string[], op: '+' | '-', r: number, order: number[], kind: 'pt' | 'cmp' }} PbStage
 */

const PB_WEIGHTS = /** @type {Record<string, number>} */ ({ possible: 0.2 });
// le dernier problème joué : son type, et le dernier tuple de nombres de chaque type
const pbLast = { type: '', tuples: /** @type {Record<string, string>} */ ({}) };

/**
 * @param {number} lo
 * @param {number} hi
 * @returns {number} un entier de lo à hi compris
 */
function pbInt(lo, hi) {
  return lo + Math.floor(random() * (hi - lo + 1));
}
/** @type {(R: ProblemsRound) => PbNums} le tout, puis une partie */
const pbWhole = (R) => {
  const t = pbInt(R.min, R.max);
  return { a: pbInt(1, t - 1), b: 0, c: 0, t };
};
/** @type {Record<string, (R: ProblemsRound) => PbNums>} */
const PB_NUMBERS = {
  reunion: (R) => {
    const n = pbWhole(R);
    return { ...n, b: n.t - n.a };
  },
  retrait: (R) => {
    const a = pbInt(R.min, R.max);
    return { a, b: pbInt(1, a - 1), c: 0, t: 0 };
  },
  partie: pbWhole,
  compPlus: (R) => {
    const b = pbInt(1, R.ecart);
    return { a: pbInt(1, R.max - b), b, c: 0, t: 0 };
  },
  compEcart: (R) => {
    const a = pbInt(1, R.max - 1);
    return { a, b: pbInt(a + 1, Math.min(R.max, a + R.ecart)), c: 0, t: 0 };
  },
  compMoinsPlus: (R) => {
    const t = pbInt(Math.max(R.min, 2), R.max);
    return { a: 0, b: pbInt(1, Math.min(R.ecart, t - 1)), c: 0, t };
  },
  deuxEtapes: (R) => {
    const a = pbInt(1, R.max - 2);
    const b = pbInt(1, R.max - a - 1);
    return { a, b, c: pbInt(1, a + b - 1), t: 0 };
  },
  possible: (R) => {
    if (random() < 0.5) {
      const a = pbInt(2, R.max - 1);
      return { a, b: pbInt(a + 1, Math.min(R.max, a + 9)), c: 0, t: 0 };
    }
    const a = pbInt(2, R.max);
    return { a, b: pbInt(1, a), c: 0, t: 0 };
  },
};
PB_NUMBERS.ajout = PB_NUMBERS.reunion;
PB_NUMBERS.ajoutInconnu = pbWhole;

// L1 : les cases de n1, de n2 et du « ? », par type
const PB_UP = ['partie1', 'partie2', 'tout'];
const PB_DOWN = ['tout', 'partie1', 'partie2'];
/** @type {Record<string, string[]>} */
const PB_SLOTS = {
  reunion: PB_UP,
  ajout: PB_UP,
  retrait: PB_DOWN,
  partie: PB_DOWN,
  ajoutInconnu: ['partie1', 'tout', 'partie2'],
  compPlus: ['petit', 'ecart', 'grand'],
  compEcart: ['petit', 'grand', 'ecart'],
  compMoinsPlus: ['grand', 'ecart', 'petit'],
};
/**
 * Une étape : on ajoute si le « ? » est le tout ou le plus grand, sinon on
 * enlève ; pour enlever, le grand nombre se touche d'abord (ordre Q).
 * @param {number} n1
 * @param {number} n2
 * @param {string[]} slots
 * @returns {PbStage}
 */
function pbStage(n1, n2, slots) {
  const plus = slots[2] === 'tout' || slots[2] === 'grand';
  return {
    n1,
    n2,
    slots,
    op: plus ? '+' : '-',
    r: plus ? n1 + n2 : Math.abs(n1 - n2),
    order: !plus && n1 < n2 ? [2, 1] : [1, 2],
    kind: slots.includes('tout') ? 'pt' : 'cmp',
  };
}
/**
 * Les étapes de calcul d'un problème : une, deux (deuxEtapes) ou aucune (possible).
 * @param {{ type: string, a: number, b: number, c: number, t: number }} x
 * @returns {PbStage[]}
 */
function pbStages(x) {
  if (x.type === 'possible') return [];
  if (x.type === 'deuxEtapes') return [pbStage(x.a, x.b, PB_UP), pbStage(x.a + x.b, x.c, PB_DOWN)];
  const first = { partie: x.t, compMoinsPlus: x.t }[x.type] || x.a;
  const second = { partie: x.a, ajoutInconnu: x.t }[x.type] || x.b;
  return [pbStage(first, second, PB_SLOTS[x.type])];
}

/**
 * Un problème complet à partir de son type, de ses nombres et de ses acteurs.
 * @param {{ type: string, variant?: string, a?: number, b?: number, c?: number, t?: number, p: string, q: string, obj: string }} spec
 * @returns {PbProblem}
 */
function pbMake(spec) {
  const x = { variant: '', a: 0, b: 0, c: 0, t: 0, ...spec, r: 0, r1: 0 };
  if (x.type === 'reunion' || x.type === 'ajout') x.t = x.a + x.b;
  const stages = pbStages(x);
  if (stages.length) x.r = stages[stages.length - 1].r;
  if (stages.length === 2) x.r1 = stages[0].r;
  return x;
}
/** @param {PbProblem} x son tuple de nombres (X2) : deux problèmes aux mêmes nombres ont le même */
function pbTuple(x) {
  return [x.variant, x.a, x.b, x.c, x.t].join('|');
}
/** @param {PbProblem} x le problème est montré à l'enfant : son type et ses nombres sont retenus */
function pbNote(x) {
  pbLast.type = x.type;
  pbLast.tuples[x.type] = pbTuple(x);
}

/**
 * Le type d'un tirage libre : jamais celui du dernier problème joué.
 * @param {ProblemsRound} R
 */
function pbPickType(R) {
  const pool = R.types.filter((ty) => ty !== pbLast.type);
  let at = random() * pool.reduce((sum, ty) => sum + (PB_WEIGHTS[ty] || 1), 0);
  for (const ty of pool) {
    at -= PB_WEIGHTS[ty] || 1;
    if (at < 0) return ty;
  }
  return pool[pool.length - 1];
}
/**
 * P et Q, deux personnages différents (Zap n'est ni l'un ni l'autre quand il reçoit), et l'objet.
 * @param {string} key le type et sa variante
 * @param {string} [notObj] l'objet de l'exemple, que le jumeau ne reprend pas
 */
function pbCast(key, notObj) {
  const people = shuffle(Object.keys(PB_PEOPLE).filter((id) => key !== 'deuxEtapesB' || id !== 'zap'));
  return { p: people[0], q: people[1], obj: pickRandom(Object.keys(PB_OBJECTS).filter((o) => o !== notObj)) };
}
/**
 * Tire un problème du palier. `type` : imposé (le jumeau garde celui de son
 * exemple) ; `avoid` : tuples exclus ; `notObj` : objet exclu.
 * @param {ProblemsRound} R
 * @param {{ type?: string, avoid?: string[], notObj?: string }} opts
 * @returns {PbProblem}
 */
function pbDraw(R, opts) {
  const type = opts.type || pbPickType(R);
  const avoid = [...(opts.avoid || []), pbLast.tuples[type]];
  const variant = type === 'deuxEtapes' ? pickRandom(['A', 'B']) : '';
  const cast = pbCast(type + variant, opts.notObj);
  let x = pbMake({ type, variant, ...PB_NUMBERS[type](R), ...cast });
  for (let k = 0; k < 50 && avoid.includes(pbTuple(x)); k++)
    x = pbMake({ type, variant, ...PB_NUMBERS[type](R), ...cast });
  return x;
}

/**
 * R1 : les nombres proposés au calcul. Le résultat, puis les leurres dans
 * l'ordre : l'autre opération, r + 1, r − 1, r + 2, r − 2, r + 3, et r ± 10
 * si la ligne le dit ; jamais 0, jamais à plus de `gap` du résultat.
 * @param {PbStage} s
 * @param {ProblemsRound} R
 * @returns {number[]}
 */
function pbChoices(s, R) {
  const other = s.op === '+' ? Math.abs(s.n1 - s.n2) : s.n1 + s.n2;
  const near = [other, s.r + 1, s.r - 1, s.r + 2, s.r - 2, s.r + 3, ...(R.tens ? [s.r + 10, s.r - 10] : [])];
  const lures = [...new Set(near)].filter((v) => v >= 1 && v !== s.r && Math.abs(v - s.r) <= R.gap);
  return shuffle([s.r, ...lures.slice(0, R.choices - 1)]);
}

export { pbChoices, pbDraw, pbMake, pbNote, pbStages, pbTuple };
