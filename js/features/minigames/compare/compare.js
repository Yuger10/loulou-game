/* ---------- Mini-jeu : Comparer les nombres (CP-CE2) ----------
   Choisir le bon signe < / > / = entre deux nombres. Programme CP :
   comparaison et rangement des nombres, introduction des symboles
   mathématiques. Bornes dans js/entities/difficulty/difficulty.js (compareRange).
   Correctif pédagogique : à partir du palier 3, une partie des manches
   force des nombres PROCHES (compareCloseChance) — sinon l'exercice
   peut rester trivial même au palier maximal (comparer 3 et 97 ne
   demande aucune réflexion sur l'ordre de grandeur réel). */
import { compareCloseChance, compareEqualChance, compareRange } from '../../../entities/difficulty/index.js';
import { random, shuffle } from '../../../shared/lib/index.js';
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

/** @typedef {{ a: number, b: number, answer: string }} CompareQuestion */

// la question précédente : une relance en tire toujours une AUTRE (anti-devinette)
let compareLast = '';
/**
 * Une question, jamais la même que la précédente (clé : les deux nombres).
 * @param {number} dd le palier de difficulté
 * @returns {CompareQuestion}
 */
function compareQuestion(dd) {
  const max = compareRange(dd);
  const { a, b } = drawOther(
    () => comparePair(dd),
    (x) => `${x.a}-${x.b}`,
    { last: compareLast, fallback: (x) => ({ a: x.a, b: x.b + 1 <= max ? x.b + 1 : x.b - 1 }) },
  );
  compareLast = `${a}-${b}`;
  return { a, b, answer: a < b ? '<' : a > b ? '>' : '=' };
}

function renderCompare() {
  setupLives('compare');
  const q = compareQuestion(gameDiff());
  const { a, b, answer } = q;
  const options = shuffle(['<', '>', '=']);

  openModal(`
    ${gameHeader('⚖️ Compare les nombres', 'Quel est le bon signe ?', `Quel est le bon signe entre ${a} et ${b} ?`)}
    ${livesBar()}
    <div class="cmp-equation">
      <span class="cmp-num">${a}</span>
      <span class="cmp-q">?</span>
      <span class="cmp-num">${b}</span>
    </div>
    <div class="cmp-options">
      ${options.map((o) => `<button type="button" class="cmp-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('compare');
  setSolution([solSel('.cmp-btn', 'v', answer)]);
  setHintQuestion('compare', q, { choices: '.cmp-btn' });
  document.querySelectorAll('.cmp-btn').forEach((btn) => {
    setHandler(btn, 'click', () => {
      if (btn.dataset.v === answer) {
        clearActiveTimer();
        const box = document.querySelector('.cmp-q');
        if (box) {
          box.textContent = answer;
          box.classList.add('filled');
        }
        stepOk(btn);
        flashModal('ok');
        winSoon();
      } else {
        loseLife(btn, { onRetry: renderCompare, wrong: btn.dataset.v });
      }
    });
  });
}

/**
 * Les deux nombres à comparer : souvent voisins, parfois égaux.
 * @param {number} dd le palier de difficulté
 */
function comparePair(dd) {
  const max = compareRange(dd);
  let a = 1 + Math.floor(random() * max);
  let b;
  if (random() < compareCloseChance(dd)) {
    // nombre voisin de a (écart de 1 à 5), toujours dans les bornes
    const delta = 1 + Math.floor(random() * 5);
    b = random() < 0.5 ? Math.max(1, a - delta) : Math.min(max, a + delta);
  } else {
    b = 1 + Math.floor(random() * max);
  }
  if (random() < compareEqualChance(dd)) b = a; // teste aussi l'égalité
  return { a, b };
}

// Indices (v52) : 1. le sens du signe (la bouche vers le plus grand) ;
// 2. comparer d'abord les dizaines, puis les unités.
/** @param {CompareQuestion} q */
function compareHints(q) {
  const ta = Math.floor(q.a / 10),
    tb = Math.floor(q.b / 10);
  const plural = (/** @type {number} */ n, /** @type {string} */ w) => `${n} ${w}${n > 1 ? 's' : ''}`;
  let say2;
  if (q.a < 10 && q.b < 10)
    say2 = `Compte dans ta tête : 1, 2, 3… Lequel arrive en dernier, ${q.a} ou ${q.b} ? Ou bien sont-ils pareils ?`;
  else if (ta !== tb)
    say2 = `Regarde d'abord les dizaines : ${q.a} a ${plural(ta, 'dizaine')}, ${q.b} a ${plural(tb, 'dizaine')}.`;
  else say2 = `Les dizaines sont pareilles. Regarde les unités : ${q.a % 10} et ${q.b % 10}.`;
  return [
    {
      say: "Le signe ouvre sa grande bouche vers le plus grand nombre, et sa pointe montre le plus petit. Si les deux sont pareils, c'est le signe égal.",
      fx: { glow: '.cmp-options' },
    },
    { say: say2, fx: { glow: '.cmp-num' } },
  ];
}

// Explication d'une erreur (track erreurs-expliquees) : le signe touché ne va
// pas parce que les nombres sont pareils, ou ne le sont pas, ou parce que la
// bouche s'ouvre vers le plus grand. Le bon signe s'écrit dans la case.
/**
 * @param {CompareQuestion} q
 * @param {string | undefined} v le signe touché
 * @returns {import('../../hints/index.js').Explain}
 */
function compareExplain(q, v) {
  const big = Math.max(q.a, q.b),
    small = Math.min(q.a, q.b);
  const answerSel = solSel('.cmp-btn', 'v', q.answer);
  const fill = { sel: '.cmp-q', text: q.answer };
  if (q.answer === '=')
    return {
      say: `${q.a} et ${q.b} sont pareils : c'est le signe égal.`,
      fx: { fill, glow: `.cmp-num, ${answerSel}` },
    };
  const bigSel = `.cmp-equation .cmp-num:${q.a > q.b ? 'first-child' : 'last-child'}`;
  return {
    say:
      v === '='
        ? `${q.a} et ${q.b} ne sont pas pareils : ${big} est plus grand.`
        : `${big} est plus grand que ${small} : la bouche s'ouvre vers ${big}.`,
    fx: { fill, glow: `${bigSel}, ${answerSel}` },
  };
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('compare', renderCompare);
registerHints('compare', compareHints);
// la stratégie d'une réussite, dite sur l'écran de victoire
/** @param {CompareQuestion} q */
function compareStrategy(q) {
  if (q.a === q.b) return "Tu as vu qu'ils sont pareils.";
  if (q.a >= 10 && q.b >= 10 && Math.floor(q.a / 10) !== Math.floor(q.b / 10))
    return 'Tu as bien regardé les dizaines.';
  return 'Tu as trouvé le plus grand nombre.';
}
registerExplain('compare', { wrong: compareExplain, right: compareStrategy });
