/* Jeu 3 : trouver l'intrus (discrimination visuelle — voir
   js/entities/difficulty/difficulty.js § diffTotal / diffMirrorChance) */
import { diffMirrorChance, diffTotal } from '../../../entities/difficulty/index.js';
import { pickRandom, random } from '../../../shared/lib/index.js';
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
  startTimerIfNeeded,
  stepOk,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

// emojis qui se voient bien à l'envers (pas symétriques)
const DIFF_MIRRORABLE = ['🐠', '🦋', '🐌', '🦄', '🐬', '🦊', '🐿️', '🦉', '🦌', '🦔', '🐟', '🎩'];
// l'intrus et les autres : proches (niveaux élevés) ou bien différents
const DIFF_SETS_CLOSE = [
  ['🐚', '🐌'],
  ['🌸', '🌺'],
  ['⭐', '🌟'],
  ['🦋', '🐝'],
  ['🎀', '🎁'],
  ['🐠', '🐟'],
  ['🍄', '🌰'],
  ['🍀', '🌿'],
];
const DIFF_SETS_FAR = [
  ['🐚', '🦄'],
  ['🦋', '💎'],
  ['🌸', '🍓'],
  ['⭐', '🌙'],
  ['🎀', '🧜‍♀️'],
  ['🍄', '🦊'],
];

function renderDiff() {
  setupLives('diff');
  const dd = gameDiff();
  const total = diffTotal(dd);
  const { mirrorMode, odd, items, hint, oddPos } = diffDraw(dd, total);

  openModal(`
    ${gameHeader("🔍 Trouve l'intrus", hint)}
    ${livesBar()}
    <div class="diff-row">
      ${items
        .map((e, i) => {
          const isOdd = mirrorMode ? i === oddPos : e === odd;
          return `<button type="button" class="diff-item ${mirrorMode && isOdd ? 'mirror' : ''}" data-odd="${isOdd}" aria-label="Image ${i + 1}">${e}</button>`;
        })
        .join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('diff');
  setSolution(['.diff-item[data-odd="true"]']);
  setHintQuestion(
    'diff',
    { mirror: mirrorMode, total, oddPos: mirrorMode ? oddPos : items.indexOf(odd) },
    { choices: '.diff-item' },
  );
  document.querySelectorAll('.diff-item').forEach((el) => {
    setHandler(el, 'click', () => {
      if (el.dataset.odd === 'true') {
        clearActiveTimer();
        stepOk(el);
        flashModal('ok');
        winSoon();
      } else loseLife(el, { onRetry: renderDiff });
    });
  });
}

/**
 * Les images de la rangée et l'intrus parmi elles.
 * @param {number} dd le palier de difficulté
 * @param {number} total le nombre d'images
 */
function diffDraw(dd, total) {
  // niveaux élevés : l'intrus ressemble un peu plus aux autres
  const sets = dd >= 2 ? DIFF_SETS_CLOSE : DIFF_SETS_FAR;

  // au-delà du palier 1 : chance croissante que ce soit la variante miroir
  const mirrorMode = random() < diffMirrorChance(dd);
  let base, odd, items, hint;
  if (mirrorMode) {
    base = pickRandom(DIFF_MIRRORABLE);
    odd = base;
    hint = 'Une image est retournée comme dans un miroir. Laquelle ?';
    items = Array(total).fill(base);
  } else {
    [base, odd] = pickRandom(sets);
    hint = "Touche celui qui n'est pas comme les autres";
    items = Array(total - 1).fill(base);
  }
  const oddPos = Math.floor(random() * total);
  if (!mirrorMode) items.splice(oddPos, 0, odd);
  return { mirrorMode, odd, items, hint, oddPos };
}

// Indices (v52) : 1. regarder chaque image, une par une (ou dans quel sens
// elle regarde) ; 2. l'intrus est dans la moitié qui brille (au moins 3 images).
/** @param {{ mirror: boolean, total: number, oddPos: number }} q */
function diffHints(q) {
  const half = Math.ceil(q.total / 2);
  const inFirst = q.oddPos < half;
  const ids = Array.from({ length: q.total }, (_, i) => i).filter((i) => (inFirst ? i < half : i >= q.total - half));
  return [
    {
      say: q.mirror
        ? 'Regarde de quel côté chaque image est tournée, une par une.'
        : "Regarde bien chaque image, une par une : une seule n'est pas pareille.",
      fx: { glow: '.diff-row' },
    },
    {
      say: "L'intrus se cache parmi celles qui brillent !",
      fx: { glow: ids.map((i) => `.diff-row .diff-item:nth-child(${i + 1})`).join(', ') },
    },
  ];
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('diff', renderDiff);
registerHints('diff', diffHints);
