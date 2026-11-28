/* ---------- Mini-jeu : Calcul mental (CE1-CE2, Volcan des Génies) ----------
   Seul jeu du Lagon Magique à aller jusqu'au palier 6. Calcul SANS
   AUCUN support imagé (à la différence du jeu « Opérations ») : addition,
   soustraction, et à partir du palier 5, multiplication (tables de 2, 5,
   10) et expressions à 3 termes. Bornes dans js/entities/difficulty/difficulty.js (calcBounds). */
import { CALC_MULT_TABLES, calcBounds } from '../../../entities/difficulty/index.js';
import { pickRandom, random, shuffle } from '../../../shared/lib/index.js';
import { openModal, setHandler } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerExplain, registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer,
  drawOther,
  flashModal,
  livesBar,
  loseLife,
  registerGame,
  setSolution,
  setupLives,
  solSel,
  startTimerIfNeeded,
  stepOk,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';
import { calcExplain, calcStrategy } from './explain.js';

/** @typedef {{ sign: string, n: number }} CalcOp une étape : '+' ou '−', et le nombre */
/**
 * Une multiplication (`mult`), ou un nombre de départ et une ou deux étapes (`first`, `ops`).
 * @typedef {{ text: string, result: number, mult: { a: number, b: number }, first?: undefined, ops?: undefined }
 *   | { text: string, result: number, first: number, ops: CalcOp[], mult?: undefined }} CalcQuestion
 */

/**
 * @param {number} dd le palier de difficulté
 * @returns {CalcQuestion}
 */
function makeCalcProblem(dd) {
  const { max, terms, allowMinus, allowMulti } = calcBounds(dd);
  const useMulti = allowMulti && random() < 0.3;

  if (useMulti) {
    const table = pickRandom(CALC_MULT_TABLES);
    const factor = 1 + Math.floor(random() * 10);
    const a = table,
      b = factor;
    return { text: `${a} × ${b}`, result: a * b, mult: { a, b } };
  }

  // construit une expression à 2 ou 3 termes, toujours positive à chaque étape
  const nTerms = terms >= 3 && random() < 0.5 ? 3 : 2;
  let value = 1 + Math.floor(random() * Math.floor(max / 2));
  let text = `${value}`;
  const first = value,
    ops = []; // pour les indices (v52)
  for (let i = 1; i < nTerms; i++) {
    const isMinus = allowMinus && random() < 0.5 && value > 1;
    if (isMinus) {
      const b = 1 + Math.floor(random() * Math.min(value - 1, max));
      value -= b;
      text += ` − ${b}`;
      ops.push({ sign: '−', n: b });
    } else {
      const room = Math.max(1, max - value);
      const b = 1 + Math.floor(random() * Math.min(room, max));
      value += b;
      text += ` + ${b}`;
      ops.push({ sign: '+', n: b });
    }
  }
  return { text, result: value, first, ops };
}

// la question précédente : une relance en tire toujours une AUTRE (anti-devinette)
let calcLast = '';
/**
 * Après 8 tirages identiques : le dernier nombre change d'un cran, dans le palier.
 * @param {CalcQuestion} q
 * @param {number} max
 * @returns {CalcQuestion}
 */
function calcOther(q, max) {
  if (q.mult) {
    const a = q.mult.a,
      b = (q.mult.b % 10) + 1;
    return { text: `${a} × ${b}`, result: a * b, mult: { a, b } };
  }
  const ops = q.ops.map((o) => ({ ...o }));
  const last = ops[ops.length - 1];
  // un de plus, si le résultat reste entre 0 et max ; sinon un de moins
  const moved = q.result + (last.sign === '+' ? 1 : -1);
  const up = moved >= 0 && moved <= max;
  last.n += up ? 1 : -1;
  return {
    text: `${q.first}${ops.map((o) => ` ${o.sign} ${o.n}`).join('')}`,
    result: up ? moved : 2 * q.result - moved,
    first: q.first,
    ops,
  };
}
/**
 * Un calcul, jamais le même que le précédent (clé : son texte).
 * @param {number} dd le palier de difficulté
 * @returns {CalcQuestion}
 */
function calcQuestion(dd) {
  const { max } = calcBounds(dd);
  const q = drawOther(
    () => makeCalcProblem(dd),
    (x) => x.text,
    { last: calcLast, fallback: (x) => calcOther(x, max) },
  );
  calcLast = q.text;
  return q;
}

function renderCalc() {
  setupLives('calc');
  const dd = gameDiff();
  const problem = calcQuestion(dd);
  const { text, result } = problem;

  const choices = new Set([result]);
  while (choices.size < 3) {
    const delta = Math.floor(random() * 7) - 3;
    choices.add(Math.max(0, result + (delta === 0 ? 1 : delta)));
  }
  const options = shuffle([...choices]);

  openModal(`
    ${gameHeader('🌋 Calcul mental', `${text} = ?`, `Combien ça fait, ${text.replace('×', 'fois').replace('−', 'moins').replace('+', 'plus')} ?`)}
    ${livesBar()}
    <div class="calc-equation">
      <span class="calc-expr">${text}</span>
      <span class="calc-op">=</span>
      <span class="eq-q">?</span>
    </div>
    <div class="num-options">
      ${options.map((o) => `<button class="num-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('calc');
  setSolution([solSel('.num-btn', 'v', result)]);
  setHintQuestion('calc', problem, { choices: '.num-btn' });
  document.querySelectorAll('.num-btn').forEach((btn) => {
    setHandler(btn, 'click', () => {
      if (Number(btn.dataset.v) === result) {
        clearActiveTimer();
        const q = document.querySelector('.eq-q');
        if (q) {
          q.textContent = String(result);
          q.classList.add('filled');
        }
        stepOk(btn);
        flashModal('ok');
        winSoon();
      } else {
        loseLife(btn, { onRetry: renderCalc, wrong: Number(btn.dataset.v) });
      }
    });
  });
}

// Indices (v52) : 1. la méthode (partir du premier nombre, avancer ou
// reculer ; compter de 2 en 2…) ; 2. la première étape seulement, jamais le
// résultat (ex. « 23 + 10 = 33, il reste 4 à ajouter »).
/**
 * @param {number} a le nombre de départ
 * @param {string} sign '+' ou '−'
 * @param {number} n
 */
function calcStepHint(a, sign, n) {
  const plus = sign === '+',
    step = (/** @type {number} */ x) => (plus ? a + x : a - x);
  const tens = Math.floor(n / 10) * 10,
    units = n % 10;
  const verb = plus ? 'ajoute' : 'enlève';
  if (tens && units)
    return `D'abord les dizaines : ${a} ${sign} ${tens} = ${step(tens)}. Puis ${verb} encore les unités de ${n}.`;
  if (tens > 10) return `${plus ? 'Avance' : 'Recule'} de 10 en 10 : ${a}, ${step(10)}… Continue !`;
  if (tens === 10)
    return plus
      ? "Ajouter 10, c'est avancer d'une dizaine : le chiffre des dizaines augmente d'un cran."
      : "Enlever 10, c'est reculer d'une dizaine : le chiffre des dizaines diminue d'un cran.";
  if (n >= 3) return `Pars de ${a} et ${plus ? 'avance' : 'recule'} de ${n} : ${step(1)}, ${step(2)}… Continue !`;
  return `Pars de ${a} et ${plus ? 'avance' : 'recule'} de ${n} pas.`;
}
/** @param {CalcQuestion} q */
function calcHints(q) {
  if (q.mult) {
    const { a, b } = q.mult;
    const k = Math.min(3, b - 1);
    return [
      { say: `${a} fois ${b}, c'est ${b} paquets de ${a}. Compte de ${a} en ${a}.`, fx: { glow: '.calc-expr' } },
      {
        say:
          b === 1
            ? "Une seule fois un nombre, c'est ce nombre lui-même !"
            : `Compte avec moi : ${Array.from({ length: k }, (_, i) => a * (i + 1)).join(', ')}… Continue jusqu'à ${b} paquets !`,
        fx: {
          html:
            b > 1
              ? `<span class="hint-strip">${Array.from({ length: k }, (_, i) => `<i>${a * (i + 1)}</i>`).join('')}<i class="q">?</i></span>`
              : '',
        },
      },
    ];
  }
  const [op1, op2] = q.ops;
  if (op2) {
    const mid = op1.sign === '+' ? q.first + op1.n : q.first - op1.n;
    return [
      { say: 'Il y a plusieurs calculs : fais-les un par un, de gauche à droite.', fx: { glow: '.calc-expr' } },
      {
        say: `D'abord : ${q.first} ${op1.sign} ${op1.n} = ${mid}. Ensuite, ${op2.sign === '+' ? 'ajoute' : 'enlève'} ${op2.n}.`,
        fx: {
          html: `<span class="hint-strip"><i>${q.first} ${op1.sign} ${op1.n} = ${mid}</i><i class="q">${mid} ${op2.sign} ${op2.n} = ?</i></span>`,
        },
      },
    ];
  }
  return [
    {
      say:
        op1.sign === '+'
          ? 'Pars du premier nombre, puis avance du deuxième.'
          : 'Pars du premier nombre, puis recule du deuxième.',
      fx: { glow: '.calc-expr' },
    },
    { say: calcStepHint(q.first, op1.sign, op1.n), fx: {} },
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('calc', renderCalc);
registerHints('calc', calcHints);
// l'explication d'une erreur et la stratégie d'une réussite : ./explain.js
registerExplain('calc', { wrong: calcExplain, right: calcStrategy });
