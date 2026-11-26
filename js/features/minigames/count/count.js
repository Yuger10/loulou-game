/* Jeu 2 : compter (dénombrement — voir js/entities/difficulty/difficulty.js § countRange) */
import { countRange } from '../../../entities/difficulty/index.js';
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

/** @typedef {{ n: number, emoji: string }} CountQuestion */

// la question précédente : une relance en tire toujours une AUTRE (anti-devinette)
let countLast = '';
/**
 * Une question, jamais la même que la précédente (clé : le nombre d'objets).
 * @param {number} dd le palier de difficulté
 * @returns {CountQuestion}
 */
function countQuestion(dd) {
  const { min, max } = countRange(dd);
  const q = drawOther(
    () => ({
      emoji: pickRandom(['⭐', '🐚', '🌸', '🦪', '🐠', '🦋']),
      n: min + Math.floor(random() * (max - min + 1)),
    }),
    (x) => String(x.n),
    { last: countLast, fallback: (x) => ({ ...x, n: x.n + 1 <= max ? x.n + 1 : x.n - 1 }) },
  );
  countLast = String(q.n);
  return q;
}

function renderCount() {
  setupLives('count');
  const { n, emoji } = countQuestion(gameDiff());
  const choices = new Set([n]);
  while (choices.size < 3) {
    choices.add(Math.max(1, n + (Math.floor(random() * 5) - 2)));
  }
  const options = shuffle([...choices]);

  openModal(`
    ${gameHeader('🔢 Compte avec moi', `Combien y a-t-il de ${emoji} ?`, `Combien y a-t-il de ${emojiWord(emoji, true)} ?`)}
    ${livesBar()}
    <div class="count-row">${Array(n)
      .fill(emoji)
      .map((e) => `<span>${e}</span>`)
      .join('')}</div>
    <div class="num-options">
      ${options.map((o) => `<button class="num-btn" data-v="${o}">${o}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('count');
  setSolution([solSel('.num-btn', 'v', n)]);
  setHintQuestion('count', { n, emoji }, { choices: '.num-btn' });
  document.querySelectorAll('.num-btn').forEach((btn) => {
    setHandler(btn, 'click', () => {
      if (Number(btn.dataset.v) === n) {
        clearActiveTimer();
        stepOk(btn);
        flashModal('ok');
        winSoon();
      } else loseLife(btn, { onRetry: renderCount, wrong: Number(btn.dataset.v) });
    });
  });
}

// Indices (v52) : 1. compter un par un avec le doigt ; 2. les premiers
// objets numérotés (jamais jusqu'au dernier : la réponse reste à trouver).
/** @param {CountQuestion} q */
function countHints(q) {
  const k = Math.min(3, q.n - 1);
  const what = emojiWord(q.emoji) || 'image';
  return [
    { say: `Touche chaque ${what} avec ton doigt, une seule fois, en comptant.`, fx: { glow: '.count-row' } },
    {
      say:
        k > 0
          ? `Je commence avec toi : ${Array.from({ length: k }, (_, i) => i + 1).join(', ')}… Continue à compter !`
          : 'Compte doucement avec ton doigt.',
      fx: {
        marks: Array.from({ length: k }, (_, i) => ({
          sel: `.count-row span:nth-child(${i + 1})`,
          text: String(i + 1),
        })),
      },
    },
  ];
}

// Explication d'une erreur (track erreurs-expliquees) : pourquoi le nombre
// touché ne va pas (un objet oublié, ou compté deux fois), puis chaque objet
// numéroté jusqu'au dernier. La question est remplacée : la réponse se montre.
/**
 * @param {CountQuestion} q
 * @param {number} v le nombre touché
 * @returns {import('../../hints/index.js').Explain}
 */
function countExplain(q, v) {
  const what = emojiWord(q.emoji) || 'image';
  return {
    say:
      v < q.n
        ? `Il ne faut en oublier aucun. Il y en a ${q.n}.`
        : `Chaque ${what} se compte une seule fois. Il y en a ${q.n}.`,
    fx: {
      marks: Array.from({ length: q.n }, (_, i) => ({
        sel: `.count-row span:nth-child(${i + 1})`,
        text: String(i + 1),
      })),
      glow: solSel('.num-btn', 'v', q.n),
    },
  };
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('count', renderCount);
registerHints('count', countHints);
// la stratégie d'une réussite, dite sur l'écran de victoire
const countStrategy = (/** @type {CountQuestion} */ q) =>
  `Tu as compté chaque ${emojiWord(q.emoji) || 'image'} une seule fois.`;
registerExplain('count', { wrong: countExplain, right: countStrategy });
