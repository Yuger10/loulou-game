/* ---------- La file de révision espacée (« les souvenirs ») ----------
   Une question ratée dans un jeu simple est gardée sous forme rejouable (un
   « item »), puis reposée 1, 3 et 7 jours plus tard. On garde les PARAMÈTRES
   de la question (les nombres, l'heure, le mot), pas une graine : le hasard du
   jeu n'en conserve pas par question, et rejouer une graine casserait dès
   qu'un jeu change. Les choix proposés sont tirés à nouveau.

   Tout ici est pur : aucune lecture de l'horloge ni de la partie, « aujourd'hui »
   est toujours donné (AAAA-MM-JJ, date LOCALE comme la pause et les progrès).
   Les fonctions qui rendent une file rendent un nouvel objet.

   Cette file peut venir d'une sauvegarde importée (entrée non fiable) :
   sanitizeReview la remet en forme à chaque lecture (readSave, game-state). */
import { WORDS_CP } from '../words/index.js';

/** @typedef {{ g: 'math', a: number, b: number, op: '+' | '-' }} MathParams */
/** @typedef {{ g: 'calc', first: number, ops: Array<{ s: '+' | '-', n: number }> } | { g: 'calc', mult: { a: 2 | 5 | 10, b: number } }} CalcParams */
/** @typedef {{ g: 'compare', a: number, b: number }} CompareParams */
/** @typedef {{ g: 'clock', h: number, m: 0 | 15 | 30 | 45 }} ClockParams */
/** @typedef {{ g: 'reading', w: string, img: boolean }} ReadingParams */
/** @typedef {MathParams | CalcParams | CompareParams | ClockParams | ReadingParams} ReviewParams */
/** @typedef {{ k: string, p: ReviewParams, t: number, due: string, box: 1 | 3 | 7, fails: number, added: string }} ReviewItem */
/** @typedef {{ items: ReviewItem[], offered: string | null }} ReviewState */

const REVIEW_MAX = 30; // items gardés au plus : borne la sauvegarde et l'import
const REVIEW_STEPS = /** @type {const} */ ([1, 3, 7]); // jours avant la prochaine révision
const REVIEW_FAILS_OUT = 3; // erreurs en révision : la question est trop dure pour l'instant, elle sort
const REVIEW_TIER_MAX = 6; // le palier joué le plus haut (calcul mental)

/* ---- les jours ---- */
/**
 * Le jour d'une date, en heure locale.
 * @param {Date} date
 * @returns {string} AAAA-MM-JJ
 */
function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
/**
 * Un jour, n jours plus tard. Le calcul part de midi : un changement d'heure
 * (une journée de 23 ou 25 heures) ne fait jamais sauter ni répéter un jour.
 * @param {string} key AAAA-MM-JJ
 * @param {number} n
 * @returns {string}
 */
function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n, 12));
}
/**
 * Un texte AAAA-MM-JJ qui désigne un vrai jour (pas le 30 février).
 * @param {unknown} v
 * @returns {v is string}
 */
function isDayKey(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && addDays(v, 0) === v;
}

/* ---- les paramètres d'une question, jeu par jeu ---- */
/**
 * @param {unknown} v
 * @param {number} min
 * @param {number} max
 * @returns {v is number} un entier entre min et max
 */
function intIn(v, min, max) {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}
/** @typedef {Record<string, unknown>} RawParams un objet lu du stockage, pas encore vérifié */

/** @param {RawParams} r @returns {MathParams | null} */
function cleanMath(r) {
  const { a, b, op } = r;
  if (!intIn(a, 1, 30) || !intIn(b, 1, 30)) return null;
  if (op === '+') return a + b <= 30 ? { g: 'math', a, b, op } : null;
  if (op === '-') return b < a ? { g: 'math', a, b, op } : null;
  return null;
}
/** @param {unknown} mult @returns {CalcParams | null} */
function cleanCalcMult(mult) {
  if (!mult || typeof mult !== 'object') return null;
  const { a, b } = /** @type {RawParams} */ (mult);
  if ((a !== 2 && a !== 5 && a !== 10) || !intIn(b, 1, 10)) return null;
  return { g: 'calc', mult: { a, b } };
}
/** @param {RawParams} r @returns {CalcParams | null} */
function cleanCalc(r) {
  if ('mult' in r) return cleanCalcMult(r.mult);
  const { first, ops } = r;
  if (!intIn(first, 1, 100) || !Array.isArray(ops) || ops.length < 1 || ops.length > 2) return null;
  /** @type {Array<{ s: '+' | '-', n: number }>} */
  const out = [];
  let value = first;
  for (const op of ops) {
    if (!op || typeof op !== 'object') return null;
    const { s, n } = /** @type {RawParams} */ (op);
    if ((s !== '+' && s !== '-') || !intIn(n, 1, 100)) return null;
    value = s === '+' ? value + n : value - n;
    if (value < 0 || value > 100) return null; // chaque résultat intermédiaire reste entre 0 et 100
    out.push({ s, n });
  }
  return { g: 'calc', first, ops: out };
}
/** @param {RawParams} r @returns {CompareParams | null} */
function cleanCompare(r) {
  const { a, b } = r;
  return intIn(a, 1, 100) && intIn(b, 1, 100) ? { g: 'compare', a, b } : null;
}
/** @param {RawParams} r @returns {ClockParams | null} */
function cleanClock(r) {
  const { h, m } = r;
  if (!intIn(h, 1, 12) || (m !== 0 && m !== 15 && m !== 30 && m !== 45)) return null;
  return { g: 'clock', h, m };
}
/** @param {RawParams} r @returns {ReadingParams | null} */
function cleanReading(r) {
  const { w, img } = r;
  // le mot est le seul texte d'un item qui s'affiche : seulement un mot du jeu, jamais du HTML
  if (typeof w !== 'string' || typeof img !== 'boolean' || !WORDS_CP.some((x) => x.word === w)) return null;
  return { g: 'reading', w, img };
}
/**
 * Les paramètres vérifiés et recopiés (champs connus seulement), ou null.
 * @param {unknown} p
 * @returns {ReviewParams | null}
 */
function cleanParams(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const r = /** @type {RawParams} */ (p);
  if (r.g === 'math') return cleanMath(r);
  if (r.g === 'calc') return cleanCalc(r);
  if (r.g === 'compare') return cleanCompare(r);
  if (r.g === 'clock') return cleanClock(r);
  if (r.g === 'reading') return cleanReading(r);
  return null;
}
/**
 * @param {unknown} p
 * @returns {p is ReviewParams} les paramètres d'une question d'un jeu connu, dans ses bornes
 */
function validParams(p) {
  return cleanParams(p) !== null;
}
/**
 * La clé d'une question : deux questions valides différentes ont deux clés
 * différentes (chaque nombre est suivi d'un signe ou de la fin).
 * @param {ReviewParams} p
 * @returns {string}
 */
function reviewKey(p) {
  if (p.g === 'math') return `math:${p.a}${p.op}${p.b}`;
  if (p.g === 'calc')
    return 'mult' in p ? `calc:${p.mult.a}x${p.mult.b}` : `calc:${p.first}${p.ops.map((o) => o.s + o.n).join('')}`;
  if (p.g === 'compare') return `compare:${p.a}-${p.b}`;
  if (p.g === 'clock') return `clock:${p.h}-${p.m}`;
  return `reading:${p.w}-${p.img ? '1' : '0'}`;
}

/* ---- lire une file enregistrée ---- */
/**
 * Un item lu du stockage, vérifié et recopié, ou null.
 * @param {unknown} raw
 * @param {string} today
 * @returns {ReviewItem | null}
 */
function cleanItem(raw, today) {
  if (!raw || typeof raw !== 'object') return null;
  const r = /** @type {RawParams} */ (raw);
  const p = cleanParams(r.p);
  if (!p || r.k !== reviewKey(p)) return null;
  const { t, due, box, fails, added } = r;
  if (!intIn(t, 1, REVIEW_TIER_MAX) || !intIn(fails, 0, REVIEW_FAILS_OUT - 1)) return null;
  if (!isDayKey(due) || !isDayKey(added) || (box !== 1 && box !== 3 && box !== 7)) return null;
  // jamais plus loin que le plus long délai : une date trafiquée ne cache pas un item pour toujours
  const latest = addDays(today, REVIEW_STEPS[2]);
  return { k: r.k, p, t, due: due > latest ? latest : due, box, fails, added };
}
/**
 * La file d'une partie enregistrée ou importée, remise en forme : jamais
 * d'erreur, une file illisible devient une file vide.
 * @param {unknown} raw
 * @param {string} today AAAA-MM-JJ
 * @returns {ReviewState}
 */
function sanitizeReview(raw, today) {
  /** @type {ReviewState} */
  const out = { items: [], offered: null };
  if (!raw || typeof raw !== 'object') return out;
  const r = /** @type {RawParams} */ (raw);
  if (isDayKey(r.offered)) out.offered = r.offered;
  if (!Array.isArray(r.items)) return out;
  /** @type {Set<string>} */
  const seen = new Set();
  for (const x of r.items) {
    if (out.items.length >= REVIEW_MAX) break;
    const it = cleanItem(x, today);
    if (!it || seen.has(it.k)) continue;
    seen.add(it.k);
    out.items.push(it);
  }
  return out;
}

/* ---- la vie d'un item ---- */
/**
 * Une question ratée en jeu : elle entre dans la file, due demain. Déjà dans
 * la file, elle repart de la première étape à sa place, sans doublon. File
 * pleine : l'ajout le plus ancien sort (le premier du tableau à égalité).
 * @param {ReviewState} rv
 * @param {ReviewParams} p
 * @param {number} t le palier joué
 * @param {string} today AAAA-MM-JJ
 * @returns {ReviewState}
 */
function addMiss(rv, p, t, today) {
  const k = reviewKey(p);
  const due = addDays(today, REVIEW_STEPS[0]);
  if (rv.items.some((x) => x.k === k))
    return {
      items: rv.items.map((x) => (x.k === k ? { ...x, t, due, box: /** @type {const} */ (1) } : x)),
      offered: rv.offered,
    };
  const items = rv.items.slice();
  while (items.length >= REVIEW_MAX) {
    let oldest = 0;
    items.forEach((x, i) => {
      if (x.added < items[oldest].added) oldest = i;
    });
    items.splice(oldest, 1);
  }
  items.push({ k, p, t, due, box: 1, fails: 0, added: today });
  return { items, offered: rv.offered };
}
/**
 * Un item après une réponse en révision, ou null s'il sort de la file.
 * @param {ReviewItem} it
 * @param {boolean} ok
 * @param {string} today
 * @returns {ReviewItem | null}
 */
function answeredItem(it, ok, today) {
  if (!ok) {
    // retour à la première étape ; trop d'erreurs : le niveau adaptatif du jeu s'en charge
    if (it.fails + 1 >= REVIEW_FAILS_OUT) return null;
    return { ...it, box: 1, due: addDays(today, REVIEW_STEPS[0]), fails: it.fails + 1 };
  }
  const next = REVIEW_STEPS[REVIEW_STEPS.indexOf(it.box) + 1];
  // les délais comptent à partir du jour de la révision réelle
  return next ? { ...it, box: next, due: addDays(today, next) } : null;
}
/**
 * Une réponse en révision : l'item avance (1, 3, 7 jours, puis il sort) ou
 * repart de la première étape. Le palier `t` ne change jamais ici.
 * @param {ReviewState} rv
 * @param {string} k la clé de l'item
 * @param {boolean} ok
 * @param {string} today AAAA-MM-JJ
 * @returns {ReviewState}
 */
function reviewAnswer(rv, k, ok, today) {
  /** @type {ReviewItem[]} */
  const items = [];
  for (const it of rv.items) {
    const next = it.k === k ? answeredItem(it, ok, today) : it;
    if (next) items.push(next);
  }
  return { items, offered: rv.offered };
}
/**
 * Les souvenirs à poser aujourd'hui, dans l'ordre de passage : les plus en
 * retard, de jeux différents d'abord, les mieux sus en premier.
 * @param {ReviewState} rv
 * @param {string} today AAAA-MM-JJ
 * @param {number} max
 * @returns {ReviewItem[]}
 */
function pickDue(rv, today, max) {
  // tri stable écrit à la main (toSorted est interdit, et l'ordre du tableau départage)
  const byDue = rv.items
    .filter((x) => x.due <= today)
    .map((it, i) => ({ it, i }))
    .sort((a, b) => (a.it.due < b.it.due ? -1 : a.it.due > b.it.due ? 1 : a.i - b.i))
    .map((x) => x.it);
  /** @type {ReviewItem[]} */
  const taken = [];
  // passe 1 : un seul item par jeu
  for (const it of byDue) if (taken.length < max && !taken.some((x) => x.p.g === it.p.g)) taken.push(it);
  // passe 2 : on complète avec les suivants
  for (const it of byDue) if (taken.length < max && !taken.includes(it)) taken.push(it);
  return taken
    .map((it, i) => ({ it, i }))
    .sort((a, b) => b.it.box - a.it.box || a.i - b.i)
    .map((x) => x.it);
}

export {
  addDays,
  addMiss,
  dayKey,
  pickDue,
  REVIEW_MAX,
  REVIEW_STEPS,
  reviewAnswer,
  reviewKey,
  sanitizeReview,
  validParams,
};
