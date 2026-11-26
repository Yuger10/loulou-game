/* ---------- Mini-jeu : La monnaie magique (CP-CE2) ----------
   Composer une somme avec des pièces de différentes valeurs : retrouver
   la pile de pièces qui vaut exactement le prix demandé. Prépare au
   calcul de la monnaie (compter, additionner des valeurs différentes).
   Valeurs et nombre de pièces centralisés dans js/entities/difficulty/difficulty.js
   (moneyDenoms / moneyPileSize) : plus de pièces = plus de termes à
   additionner mentalement, indépendamment des valeurs elles-mêmes. */
import { moneyDenoms, moneyPileSize } from '../../../entities/difficulty/index.js';
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

// construit une pile de pièces au hasard et renvoie sa valeur
/**
 * @param {number[]} denoms les pièces possibles
 * @param {number} size le nombre de pièces
 */
function randomPile(denoms, size) {
  const pile = [];
  for (let i = 0; i < size; i++) pile.push(pickRandom(denoms));
  const total = pile.reduce((s, v) => s + v, 0);
  return { pile: pile.sort((a, b) => b - a), total };
}

/** @typedef {ReturnType<typeof randomPile>} MoneyPile une pile : ses pièces et leur somme */
/** @typedef {{ target: number, piles: MoneyPile[] }} MoneyQuestion */
/** @typedef {{ correct: MoneyPile, options: MoneyPile[] }} MoneyRound la bonne pile, puis les trois piles proposées */

// la question précédente : une relance en tire toujours une AUTRE (anti-devinette)
let moneyLast = '';
/**
 * Après 8 tirages identiques : la plus grande pièce de la bonne pile prend la
 * valeur suivante, donc le prix change toujours ; les piles d'un autre total restent.
 * @param {number[]} denoms
 * @param {{ min: number, max: number }} size
 * @param {MoneyRound} r
 * @returns {MoneyRound}
 */
function moneyOther(denoms, size, r) {
  const pile = r.correct.pile.slice();
  pile[0] = denoms[(denoms.indexOf(pile[0]) + 1) % denoms.length];
  pile.sort((a, b) => b - a);
  const correct = { pile, total: pile.reduce((sum, v) => sum + v, 0) };
  const kept = r.options.slice(1).filter((o) => o.total !== correct.total);
  return { correct, options: moneyOptions(denoms, size, correct, kept) };
}
/**
 * Un prix et ses trois piles, jamais le même prix que la question précédente (clé : le prix).
 * @param {number} dd le palier de difficulté
 * @returns {MoneyRound}
 */
function moneyQuestion(dd) {
  const denoms = moneyDenoms(dd);
  const size = moneyPileSize(dd);
  const r = drawOther(
    () => {
      const correct = randomPile(denoms, size.min + Math.floor(random() * (size.max - size.min + 1)));
      return { correct, options: moneyOptions(denoms, size, correct) };
    },
    (x) => String(x.correct.total),
    moneyLast,
    (x) => moneyOther(denoms, size, x),
  );
  moneyLast = String(r.correct.total);
  return r;
}

function renderMoney() {
  setupLives('money');
  const { correct, options } = moneyQuestion(gameDiff());
  const target = correct.total;
  const item = pickRandom(['🍭', '🧸', '🎈', '🍦', '⚽', '🎁', '🪁', '🍪']);

  const shuffled = shuffle(options);

  openModal(`
    ${gameHeader('💰 La monnaie magique', `Quelle pile de pièces vaut ${target} ?`, `Quelle pile de pièces vaut ${target} ?`)}
    ${livesBar()}
    <div class="money-target"><span class="money-item">${item}</span><span class="money-price">${target} 🪙</span></div>
    <div class="money-options">
      ${shuffled
        .map(
          (o) => `<button type="button" class="money-pile-btn" data-v="${o.total}">
        ${o.pile.map((v) => `<span class="coin-chip">${v}</span>`).join('')}
      </button>`,
        )
        .join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('money');
  setSolution([solSel('.money-pile-btn', 'v', target)]);
  setHintQuestion('money', { target, piles: shuffled }, { choices: '.money-pile-btn' });
  document.querySelectorAll('.money-pile-btn').forEach((btn) => {
    setHandler(btn, 'click', () => {
      if (Number(btn.dataset.v) === target) {
        clearActiveTimer();
        stepOk(btn);
        flashModal('ok');
        winSoon();
      } else loseLife(btn, { onRetry: renderMoney, wrong: Number(btn.dataset.v) });
    });
  });
}

/**
 * La bonne pile et deux piles d'un autre total.
 * @param {number[]} denoms
 * @param {{ min: number, max: number }} size le nombre de pièces d'une pile
 * @param {MoneyPile} correct
 * @param {MoneyPile[]} [kept] des piles d'un autre total, déjà tirées (repli)
 */
function moneyOptions(denoms, size, correct, kept = []) {
  const { min, max } = size;
  const target = correct.total;
  const options = [correct, ...kept];
  let tries = 0;
  while (options.length < 3 && tries < 30) {
    tries++;
    const p = randomPile(denoms, min + Math.floor(random() * (max - min + 1)));
    if (p.total !== target) options.push(p);
  }
  // au cas où (petites valeurs) on n'a pas trouvé 2 distracteurs différents
  while (options.length < 3) {
    options.push({ pile: [pickRandom(denoms)], total: target + options.length });
  }
  return options;
}

// Indices (v52) : 1. additionner les pièces de chaque pile ; 2. le début de
// chaque addition est écrit (jamais le total d'une pile).
/** @param {MoneyQuestion} q */
function moneyHints(q) {
  const start = (/** @type {number[]} */ pile) =>
    pile.length >= 3 ? `${pile[0]}+${pile[1]}=${pile[0] + pile[1]}…` : pile.length === 2 ? `${pile[0]}+…` : '';
  return [
    {
      say: `Additionne les pièces de chaque pile, une par une, et compare avec le prix : ${q.target}.`,
      fx: { glow: '.money-price' },
    },
    {
      say: 'Je commence les additions de chaque pile. À toi de les finir !',
      fx: {
        marks: q.piles
          .map((o, i) => ({ sel: `.money-options .money-pile-btn:nth-child(${i + 1})`, text: start(o.pile) }))
          .filter((m) => m.text),
      },
    },
  ];
}

// Explication d'une erreur (track erreurs-expliquees) : la pile touchée vaut
// moins, ou plus, que le prix ; son addition et celle de la bonne pile
// s'écrivent en entier sur les deux piles.
/**
 * @param {MoneyQuestion} q
 * @param {number} v le total de la pile touchée
 * @returns {import('../../hints/index.js').Explain | null}
 */
function moneyExplain(q, v) {
  const touched = q.piles.find((o) => o.total === v),
    good = q.piles.find((o) => o.total === q.target);
  // la pile de secours (moneyOptions) n'a pas la somme de ses pièces : rien de vrai à en dire
  if (!touched || !good || touched.pile.reduce((sum, c) => sum + c, 0) !== v) return null;
  const line = (/** @type {MoneyPile} */ o) => `${o.pile.join(' + ')} = ${o.total}`;
  const goodSel = solSel('.money-pile-btn', 'v', q.target);
  return {
    say: `Cette pile fait ${v} : c'est ${v < q.target ? 'moins' : 'plus'} que ${q.target}.`,
    fx: {
      marks: [
        { sel: solSel('.money-pile-btn', 'v', v), text: line(touched) },
        { sel: goodSel, text: line(good) },
      ],
      glow: goodSel,
    },
  };
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('money', renderMoney);
registerHints('money', moneyHints);
registerExplain('money', { wrong: moneyExplain, right: () => 'Tu as additionné les pièces de chaque pile.' });
