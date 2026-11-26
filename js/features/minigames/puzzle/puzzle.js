/* Jeu 4 : puzzle des nombres (remettre une suite dans l'ordre). Pas de
   minuteur : tâche à plusieurs clics successifs (voir js/entities/difficulty/difficulty.js
   § « MINUTEUR »). Longueur et variantes dans § puzzleCount/Variants —
   corrige un bug où la variante « start » était comptée deux fois dans
   la liste de tirage (probabilité doublée par erreur). */
import { puzzleCount, puzzleStartMax, puzzleVariants } from '../../../entities/difficulty/index.js';
import { pickRandom, random, shuffle } from '../../../shared/lib/index.js';
import { openModal, setHandler } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { hintOrderStep, registerExplain, registerHints, setHintQuestion } from '../../hints/index.js';
import {
  flashModal,
  livesBar,
  loseLife,
  progressDots,
  registerGame,
  setSolution,
  setupLives,
  solSel,
  stepOk,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

/** @typedef {{ seq: number[], idx: number, variant: string }} PuzzleQuestion `idx` : où en est l'enfant */

function renderPuzzle() {
  setupLives('puzzle');
  const dd = gameDiff();
  const count = puzzleCount(dd);
  const variants = puzzleVariants(dd);
  const variant = pickRandom(variants);

  const { seq, hint } = puzzleSeq(dd, count, variant);

  const nums = shuffle(seq.slice());
  /** @type {PuzzleQuestion} */
  const q = { seq, idx: 0, variant }; // q.idx : où en est l'enfant (pour les indices)
  openModal(`
    ${gameHeader('🧩 Petit puzzle', hint)}
    ${livesBar()}
    ${progressDots(0, seq.length)}
    <div class="puzzle-row">
      ${nums.map((n) => `<button class="puzzle-btn" data-n="${n}">${n}</button>`).join('')}
    </div>
  `);
  bindQuit();
  setSolution(seq.map((n) => solSel('.puzzle-btn', 'n', n)));
  setHintQuestion('puzzle', q, { choices: '.puzzle-btn' });
  document.querySelectorAll('.puzzle-btn').forEach((btn) => {
    setHandler(btn, 'click', () => {
      const n = Number(btn.dataset.n);
      if (btn.classList.contains('done')) return;
      if (n === seq[q.idx]) {
        btn.classList.add('done');
        stepOk(btn);
        q.idx++;
        document.querySelectorAll('.game-progress i').forEach((d, i) => d.classList.toggle('on', i < q.idx));
        if (q.idx === seq.length) {
          flashModal('ok');
          winSoon();
        }
      } else {
        loseLife(btn, { disable: false, wrong: n }); // le bon nombre reste cliquable ensuite
      }
    });
  });
}

/**
 * La suite de nombres à toucher, et la consigne.
 * @param {number} dd le palier de difficulté
 * @param {number} count
 * @param {string} variant
 */
function puzzleSeq(dd, count, variant) {
  let seq, hint;
  if (variant === 'from1') {
    seq = Array.from({ length: count }, (_, i) => i + 1);
    hint = `Touche les nombres dans l'ordre : 1 → ${count}`;
  } else if (variant === 'start') {
    const maxStart = puzzleStartMax(dd);
    const start = 2 + Math.floor(random() * (maxStart - 1));
    seq = Array.from({ length: count }, (_, i) => start + i);
    hint = `Touche les nombres dans l'ordre : ${seq[0]} → ${seq[seq.length - 1]}`;
  } else if (variant === 'desc') {
    const start = count + 1 + Math.floor(random() * 6);
    seq = Array.from({ length: count }, (_, i) => start - i);
    hint = `À l'envers ! Du plus grand au plus petit : ${seq[0]} → ${seq[seq.length - 1]}`;
  } else {
    // step2
    const start = pickRandom([2, 3, 4, 5, 10]);
    seq = Array.from({ length: count }, (_, i) => start + i * 2);
    hint = `De 2 en 2 : ${seq[0]}, ${seq[1]}, ${seq[2]}…`;
  }
  return { seq, hint };
}

// Indices (v52) : voir hintOrderStep (js/features/hints/hints.js).
/** @param {PuzzleQuestion} q */
function puzzleHints(q) {
  const done = q.seq.slice(0, q.idx),
    last = done[done.length - 1];
  const desc = q.variant === 'desc',
    step2 = q.variant === 'step2';
  let say1;
  if (!done.length) say1 = desc ? "Cherche d'abord le plus grand nombre." : "Cherche d'abord le plus petit nombre.";
  else if (step2) say1 = `On compte de 2 en 2 : après ${last}, saute un nombre.`;
  else
    say1 = desc
      ? `Quel nombre vient juste avant ${last} quand on compte ?`
      : `Quel nombre vient juste après ${last} quand on compte ?`;
  return [
    { say: say1, fx: { glow: '.puzzle-row' } },
    hintOrderStep(
      done,
      done.length
        ? 'Voici le chemin déjà fait. Récite la suite dans ta tête : quel nombre vient ensuite ?'
        : 'Compare les nombres deux par deux, et garde à chaque fois le ' + (desc ? 'plus grand.' : 'plus petit.'),
    ),
  ];
}

// Explication d'une erreur (track erreurs-expliquees). La question continue :
// la phrase dit pourquoi le nombre touché ne va pas, et la règle à suivre,
// jamais le nombre attendu ; seuls les nombres déjà rangés brillent.
/**
 * @param {PuzzleQuestion} q
 * @param {number} v le nombre touché
 * @returns {import('../../hints/index.js').Explain}
 */
function puzzleExplain(q, v) {
  const desc = q.variant === 'desc';
  if (q.idx === 0) {
    const most = desc ? 'grand' : 'petit';
    return { say: `${v} n'est pas le plus ${most}. Cherche le plus ${most} nombre.`, fx: { glow: '.puzzle-row' } };
  }
  const last = q.seq[q.idx - 1];
  const rule =
    q.variant === 'step2'
      ? `On compte de 2 en 2 après ${last}.`
      : `Quel nombre vient juste ${desc ? 'avant' : 'après'} ${last} ?`;
  return { say: `${v} vient plus tard. ${rule}`, fx: { glow: '.puzzle-btn.done' } };
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('puzzle', renderPuzzle);
registerHints('puzzle', puzzleHints);
// la stratégie d'une réussite, dite sur l'écran de victoire
/** @param {PuzzleQuestion} q */
function puzzleStrategy(q) {
  if (q.variant === 'desc') return "Tu as compté à l'envers.";
  return q.variant === 'step2' ? 'Tu as compté de 2 en 2.' : "Tu as suivi l'ordre des nombres.";
}
registerExplain('puzzle', { wrong: puzzleExplain, right: puzzleStrategy });
