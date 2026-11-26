/* Jeu 5 : suite logique (notion de « suite organisée », cycle 1 puis
   algorithme simple en cycle 2 — voir js/entities/difficulty/difficulty.js § sequence*) */
import { sequencePatternLength } from '../../../entities/difficulty/index.js';
import { pickRandom, shuffle } from '../../../shared/lib/index.js';
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

function renderSequence() {
  setupLives('sequence');
  const symbols = shuffle(['🐚', '⭐', '🌸', '🎀', '💎', '🦋', '🐠']).slice(0, 3);
  const dd = gameDiff();
  const patterns = sequencePatterns(dd, symbols);
  const pattern = pickRandom(patterns);
  const shown = sequencePatternLength(dd);
  const seq = Array.from({ length: shown }, (_, i) => pattern[i % pattern.length]);
  const answer = pattern[shown % pattern.length];
  const options = shuffle([...new Set([answer, ...symbols])]).slice(0, 3);
  if (!options.includes(answer)) options[0] = answer;

  openModal(`
    ${gameHeader('🔮 La suite magique', 'Regarde bien… quelle image vient après ?')}
    ${livesBar()}
    <div class="seq-row">
      ${seq.map((e) => `<span>${e}</span>`).join('')}
      <span class="q">?</span>
    </div>
    <div class="seq-options">
      ${shuffle(options)
        .map((o) => `<button class="seq-btn" data-v="${o}">${o}</button>`)
        .join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('sequence');
  setSolution([solSel('.seq-btn', 'v', answer)]);
  setHintQuestion('sequence', { pattern, shown }, { choices: '.seq-btn' });
  document.querySelectorAll('.seq-btn').forEach((btn) => {
    setHandler(btn, 'click', () => {
      if (btn.dataset.v === answer) {
        clearActiveTimer();
        const q = /** @type {HTMLElement} */ (document.querySelector('.seq-row .q'));
        q.textContent = answer;
        q.style.border = 'none';
        q.classList.add('filled');
        stepOk(btn);
        flashModal('ok');
        winSoon();
      } else loseLife(btn, { onRetry: renderSequence });
    });
  });
}

/**
 * Les motifs possibles, avec trois images.
 * @param {number} dd le palier de difficulté
 * @param {string[]} abc
 */
function sequencePatterns(dd, abc) {
  const [A, B, C] = abc;
  // le motif qui se répète grandit avec le palier : 2 éléments (le plus
  // simple) → jusqu'à 4 éléments combinés (palier 5)
  return dd <= 1
    ? [[A, B]]
    : dd === 2
      ? [
          [A, B],
          [A, A, B],
          [A, B, C],
        ]
      : dd === 3
        ? [
            [A, B, B],
            [A, A, B],
            [A, B, C],
          ]
        : [
            [A, B, C],
            [A, B, A, C],
            [A, A, B, C],
            [A, B, B, C],
          ];
}

// Indices (v52) : 1. trouver le petit groupe qui se répète ; 2. chaque image
// numérotée selon sa place dans le motif (1, 2, 3, 1, 2, 3…).
/** @param {{ pattern: string[], shown: number }} q */
function sequenceHints(q) {
  const L = q.pattern.length;
  return [
    { say: "Cherche le petit groupe d'images qui se répète, encore et encore.", fx: { glow: '.seq-row' } },
    {
      say: `Je numérote le motif : ${Array.from({ length: L }, (_, i) => i + 1).join(', ')}, puis ça recommence. Quel numéro vient après ?`,
      fx: {
        marks: Array.from({ length: q.shown }, (_, i) => ({
          sel: `.seq-row span:nth-child(${i + 1})`,
          text: String((i % L) + 1),
        })),
      },
    },
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('sequence', renderSequence);
registerHints('sequence', sequenceHints);
