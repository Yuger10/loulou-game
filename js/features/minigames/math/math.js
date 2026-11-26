/* ---------- Mini-jeu : Opérations magiques (niveau CP-CE2) ----------
   Additions et soustractions illustrées avec des emojis, pour
   apprendre le calcul sans se noyer dans les chiffres.
   Les bornes (mathBounds) sont centralisées et documentées dans
   js/entities/difficulty/difficulty.js — voir aussi ANALYSE-DIFFICULTE.md. */
import { mathBounds } from '../../../entities/difficulty/index.js';
import { pickRandom, random, shuffle } from '../../../shared/lib/index.js';
import { emojiWord, openModal, setHandler } from '../../../shared/ui/index.js';
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

const MATH_EMOJIS = ['⭐', '🐚', '🌸', '🦪', '🐠', '🦋', '🍎', '🎈'];

/** @typedef {{ a: number, b: number, op: string, result: number }} MathProblem */
/** @typedef {MathProblem & { emoji: string }} MathQuestion */

/**
 * @param {number} dd le palier de difficulté
 * @returns {MathProblem}
 */
function makeMathProblem(dd) {
  const { max, allowMinus } = mathBounds(dd);
  const isMinus = allowMinus && random() < 0.5;
  let a, b, result, op;
  if (isMinus) {
    a = 2 + Math.floor(random() * (max - 1)); // a entre 2 et max
    b = 1 + Math.floor(random() * (a - 1)); // b < a : jamais de résultat négatif
    result = a - b;
    op = '−';
  } else {
    const half = Math.max(1, Math.floor(max / 2));
    a = 1 + Math.floor(random() * half);
    b = 1 + Math.floor(random() * (max - a));
    result = a + b;
    op = '+';
  }
  return { a, b, op, result };
}

// la question précédente : une relance en tire toujours une AUTRE (anti-devinette)
let mathLast = '';
const mathKey = (/** @type {MathProblem} */ p) => `${p.a} ${p.op} ${p.b}`;
/**
 * Après 8 tirages identiques : la même opération avec un nombre voisin, dans le palier.
 * @param {MathProblem} p
 * @param {number} max
 * @returns {MathProblem}
 */
function mathOther(p, max) {
  let { a, b } = p;
  if (p.op === '+') {
    if (a + b + 1 <= max) b++;
    else if (b > 1) b--;
    else a--;
    return { a, b, op: p.op, result: a + b };
  }
  if (b > 1) b--;
  else if (b + 1 < a) b++;
  else a++;
  return { a, b, op: p.op, result: a - b };
}
/**
 * Une opération, jamais la même que la précédente (clé : « a op b »).
 * @param {number} dd le palier de difficulté
 * @returns {MathProblem}
 */
function mathQuestion(dd) {
  const { max } = mathBounds(dd);
  const p = drawOther(
    () => makeMathProblem(dd),
    mathKey,
    mathLast,
    (x) => mathOther(x, max),
  );
  mathLast = mathKey(p);
  return p;
}

function renderMath() {
  setupLives('math');
  const emoji = pickRandom(MATH_EMOJIS);
  const { a, b, op, result } = mathQuestion(gameDiff());

  const options = mathChoices(result);

  const spoken = op === '+' ? `Combien ça fait, ${a} plus ${b} ?` : `Combien ça fait, ${a} moins ${b} ?`;

  openModal(`
    ${gameHeader('➕ Opérations magiques', `${a} ${op} ${b} = ?`, spoken)}
    ${livesBar()}
    <div class="math-illustration">
      <div class="math-group">${mathGroup(a, emoji)}</div>
      <span class="math-op">${op}</span>
      <div class="math-group">${mathGroup(b, emoji)}</div>
    </div>
    <div class="math-equation">
      <span class="eq-num">${a}</span>
      <span class="eq-op">${op}</span>
      <span class="eq-num">${b}</span>
      <span class="eq-op">=</span>
      <span class="eq-q">?</span>
    </div>
    <div class="num-options">
      ${options.map((o) => `<button class="num-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('math');
  setSolution([solSel('.num-btn', 'v', result)]);
  setHintQuestion('math', { a, b, op, result, emoji }, { choices: '.num-btn' });
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
        loseLife(btn, { onRetry: renderMath, wrong: Number(btn.dataset.v) });
      }
    });
  });
}

/**
 * Trois réponses proposées, dont la bonne, toutes proches.
 * @param {number} result
 */
function mathChoices(result) {
  const choices = new Set([result]);
  while (choices.size < 3) {
    const delta = Math.floor(random() * 5) - 2;
    const cand = Math.max(0, result + (delta === 0 ? 1 : delta));
    choices.add(cand);
  }
  return shuffle([...choices]);
}
/** @type {(n: number, emoji: string) => string} */
const mathGroup = (n, emoji) =>
  Array(n)
    .fill(emoji)
    .map((e) => `<span>${e}</span>`)
    .join('');

// Indices (v52). Addition : 1. tout compter ensemble ; 2. partir du premier
// groupe et continuer (« il y en a déjà 4… 5… »). Soustraction : 1. barrer ceux
// qui partent ; 2. ils sont barrés, il reste à compter. Jamais le résultat.
/** @param {MathQuestion} q */
function mathHints(q) {
  const word = emojiWord(q.emoji, true) || 'images';
  const g1 = '.math-illustration .math-group:first-child',
    g2 = '.math-illustration .math-group:last-child';
  if (q.op === '+')
    return [
      {
        say: `Pour ajouter, on compte tous les ${word} ensemble, ceux des deux groupes.`,
        fx: { glow: '.math-illustration' },
      },
      {
        say:
          q.b > 1
            ? `Il y en a déjà ${q.a} dans le premier groupe. Continue avec les autres : ${q.a + 1}…`
            : `Il y en a déjà ${q.a} dans le premier groupe. Ajoute encore celui de l'autre groupe !`,
        fx: {
          marks: [{ sel: `${g1} span:last-child`, text: String(q.a) }].concat(
            q.b > 1 ? [{ sel: `${g2} span:first-child`, text: String(q.a + 1) }] : [],
          ),
          glow: g2,
        },
      },
    ];
  return [
    { say: `Pour enlever, on barre les ${word} qui s'en vont, puis on compte ceux qui restent.`, fx: { glow: g1 } },
    {
      say: `Je barre ceux qui s'en vont. Compte ceux qui restent !`,
      fx: { strike: `${g1} span:nth-last-child(-n+${q.b})` },
    },
  ];
}

// Explication d'une erreur (track erreurs-expliquees) : l'opération confondue
// (ajouter au lieu d'enlever), ou un résultat trop petit ou trop grand. Le
// résultat s'écrit dans la case, et le dessin se compte : on continue après le
// premier groupe (addition), ou on barre ceux qui partent (soustraction).
/**
 * @param {MathQuestion} q
 * @param {number} v le nombre touché
 * @returns {import('../../hints/index.js').Explain}
 */
function mathExplain(q, v) {
  const { a, b, result: r } = q;
  const g1 = '.math-illustration .math-group:first-child',
    g2 = '.math-illustration .math-group:last-child';
  const fill = { sel: '.eq-q', text: String(r) },
    glow = solSel('.num-btn', 'v', r);
  if (q.op === '+') {
    const say =
      v === a - b
        ? `On ajoute ${b}, on n'enlève pas. ${a} plus ${b}, ça fait ${r}.`
        : `${v < r ? 'Il en manque' : "C'est trop"}. Je pars de ${a} et j'avance de ${b} : ${r}.`;
    const marks = [{ sel: `${g1} span:last-child`, text: String(a) }].concat(
      Array.from({ length: b }, (_, i) => ({ sel: `${g2} span:nth-child(${i + 1})`, text: String(a + i + 1) })),
    );
    return { say, fx: { fill, marks, glow } };
  }
  return {
    say:
      v === a + b
        ? `On enlève ${b}, on n'ajoute pas. ${a} moins ${b}, ça fait ${r}.`
        : `Il en reste ${v > r ? 'moins' : 'plus'}. J'enlève ${b} : il en reste ${r}.`,
    fx: {
      fill,
      strike: `${g1} span:nth-last-child(-n+${b})`,
      marks: Array.from({ length: r }, (_, i) => ({ sel: `${g1} span:nth-child(${i + 1})`, text: String(i + 1) })),
      glow,
    },
  };
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('math', renderMath);
registerHints('math', mathHints);
registerExplain('math', { wrong: mathExplain });
