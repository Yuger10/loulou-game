/* ---------- Calcul mental : l'explication d'une erreur, la stratégie d'une réussite ----------
   (track erreurs-expliquees) La phrase dit l'erreur reconnue (un paquet oublié,
   le nombre de départ compté, les dizaines…) et le chemin jusqu'au résultat ;
   la bande l'écrit, et le résultat remplit la case. Dans son fichier pour que
   calc.js reste lisible d'une traite. */
import { solSel } from '../../minigame-engine/index.js';

/** @typedef {import('./calc.js').CalcOp} CalcOp */
/** @typedef {import('./calc.js').CalcQuestion} CalcQuestion */

const calcStrip = (/** @type {Array<string | number>} */ cells) =>
  `<span class="hint-strip">${cells.map((c) => `<i>${c}</i>`).join('')}</span>`;
const calcWord = (/** @type {string} */ sign) => (sign === '+' ? 'plus' : 'moins');
/**
 * La phrase et la bande d'une multiplication.
 * @param {{ a: number, b: number }} m
 * @param {number} r
 * @param {number} v
 */
function calcExplainMult(m, r, v) {
  const { a, b } = m;
  const packs = `${b} paquet${b > 1 ? 's' : ''} de ${a}`;
  let say = `${a} fois ${b}, c'est ${packs} : ${r}.`;
  if (v === r - a) say = `Il manque un paquet de ${a}. ${packs} : ${r}.`;
  else if (v === r + a) say = `Un paquet de ${a} en trop. ${packs} : ${r}.`;
  return { say, html: calcStrip(Array.from({ length: b }, (_, i) => a * (i + 1))) };
}
/**
 * La phrase et la bande d'un calcul à 2 termes.
 * @param {{ first: number, ops: CalcOp[], result: number }} q
 * @param {number} v
 */
function calcExplainStep(q, v) {
  const { first, result: r } = q;
  const { sign, n } = q.ops[0];
  const plus = sign === '+';
  const tens = n - (n % 10),
    units = n % 10;
  const mid = plus ? first + tens : first - tens;
  const byTens = [`${first} ${sign} ${tens} = ${mid}`, `${mid} ${sign} ${units} = ${r}`];
  const steps = Array.from({ length: n + 1 }, (_, i) => (plus ? first + i : first - i));
  const whole = [`${first} ${sign} ${n} = ${r}`];
  const split = tens > 0 && units > 0;
  // le nombre de départ compté comme un pas : le résultat tombe un cran avant
  if (v === (plus ? r - 1 : r + 1))
    return {
      say: `On ne compte pas ${first} lui-même. ${first} ${calcWord(sign)} ${n}, ça fait ${r}.`,
      html: calcStrip(n <= 5 ? steps : split ? byTens : whole),
    };
  if (split) return { say: `D'abord les dizaines : ${mid}. Puis les unités : ${r}.`, html: calcStrip(byTens) };
  return {
    say: `Je pars de ${first} et ${plus ? "j'avance" : 'je recule'} de ${n} : ${r}.`,
    html: calcStrip(n <= 5 ? steps : whole),
  };
}
/**
 * @param {CalcQuestion} q
 * @param {number} v le nombre touché
 * @returns {import('../../hints/index.js').Explain}
 */
function calcExplain(q, v) {
  const r = q.result;
  let part;
  if (q.mult) part = calcExplainMult(q.mult, r, v);
  else if (q.ops.length > 1) {
    const [op1, op2] = q.ops;
    const mid = op1.sign === '+' ? q.first + op1.n : q.first - op1.n;
    part = {
      say: `D'abord ${q.first} ${calcWord(op1.sign)} ${op1.n}, ça fait ${mid}. Puis ${calcWord(op2.sign)} ${op2.n} : ${r}.`,
      html: calcStrip([`${q.first} ${op1.sign} ${op1.n} = ${mid}`, `${mid} ${op2.sign} ${op2.n} = ${r}`]),
    };
  } else part = calcExplainStep(q, v);
  return {
    say: part.say,
    fx: { fill: { sel: '.eq-q', text: String(r) }, html: part.html, glow: solSel('.num-btn', 'v', r) },
  };
}

// la stratégie d'une réussite, dite sur l'écran de victoire
/** @param {CalcQuestion} q */
function calcStrategy(q) {
  if (q.mult) return `Tu as compté de ${q.mult.a} en ${q.mult.a}.`;
  if (q.ops.length > 1) return 'Tu as fait les calculs un par un.';
  const { sign, n } = q.ops[0];
  if (n >= 10 && n % 10) return 'Tu as fait les dizaines, puis les unités.';
  return sign === '+' ? 'Tu as avancé depuis le premier nombre.' : 'Tu as reculé depuis le premier nombre.';
}

export { calcExplain, calcStrategy };
