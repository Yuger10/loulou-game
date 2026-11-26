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
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer,
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

function renderMoney() {
  setupLives('money');
  const dd = gameDiff();
  const denoms = moneyDenoms(dd);
  const { min, max } = moneyPileSize(dd);
  const size = min + Math.floor(random() * (max - min + 1));
  const correct = randomPile(denoms, size);
  const target = correct.total;
  const item = pickRandom(['🍭', '🧸', '🎈', '🍦', '⚽', '🎁', '🪁', '🍪']);

  const shuffled = shuffle(moneyOptions(denoms, { min, max }, correct));

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
      } else loseLife(btn, { onRetry: renderMoney });
    });
  });
}

/**
 * La bonne pile et deux piles d'un autre total.
 * @param {number[]} denoms
 * @param {{ min: number, max: number }} size le nombre de pièces d'une pile
 * @param {ReturnType<typeof randomPile>} correct
 */
function moneyOptions(denoms, size, correct) {
  const { min, max } = size;
  const target = correct.total;
  const options = [correct];
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
/** @param {{ target: number, piles: ReturnType<typeof randomPile>[] }} q */
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

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('money', renderMoney);
registerHints('money', moneyHints);
