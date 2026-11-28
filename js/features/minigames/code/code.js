/* ---------- Mini-jeu : Le code secret (Île des Coffres, saison 3) ----------
   Un jeu de déduction : un cadenas à roues, des cartes d'indice toutes
   vraies, un seul code possible. L'enfant touche une roue puis un symbole de
   la palette ; chaque symbole ne sert qu'une fois (le poser ailleurs le
   déplace). Quand toutes les roues sont pleines, « Ouvrir » s'active.
   La fabrique des cadenas : code-make.js ; le dessin : code-draw.js ; les
   indices : code-hints.js ; les paliers : `codeRound`.
   Une mission = un cadenas, sans minuteur. Anti-devinette : un mauvais code
   relance un AUTRE cadenas. */
import { openModal, setHandler, speak } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerExplain, registerHints, setHintQuestion } from '../../hints/index.js';
import {
  flashModal,
  livesBar,
  loseLife,
  registerGame,
  setSolution,
  setupLives,
  solSel,
  stepOk,
  WIN_DELAY_LONG,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';
import { codeEmoji, codeStageHTML } from './code-draw.js';
import { codeHints } from './code-hints.js';
import { codeClueSay, codeLock } from './code-make.js';

/** @typedef {import('./code-make.js').CodeLock} CodeLock */
/**
 * Le cadenas en cours : ce qui est posé sur chaque roue ('' : vide), la roue
 * choisie, et s'il est déjà ouvert ou raté.
 * @typedef {{ lock: CodeLock, wheels: string[], sel: number, over: boolean }} CodeGame
 */

const CODE_TITLE = '🔐 Le code secret';
const CODE_SAY = "Trouve le code du cadenas. Chaque symbole ne sert qu'une fois. Touche un indice pour l'écouter.";

/** @param {string} sel @returns {HTMLElement[]} */
function codeAll(sel) {
  return [...document.querySelectorAll(sel)].map((el) => /** @type {HTMLElement} */ (el));
}
/** @param {CodeGame} g la page suit l'état : roues, sélection, bouton « Ouvrir » */
function codeRedraw(g) {
  codeAll('.code-wheel').forEach((el, w) => {
    el.dataset.s = g.wheels[w];
    el.textContent = g.wheels[w] ? codeEmoji(g.wheels[w]) : '';
    el.classList.toggle('sel', w === g.sel);
  });
  codeAll('.code-sym').forEach((el) => el.classList.toggle('used', g.wheels.includes(el.dataset.s || '')));
  const open = /** @type {HTMLButtonElement | null} */ (document.getElementById('code-open'));
  if (open) open.disabled = g.wheels.includes('');
}
/**
 * Un symbole se pose sur la roue choisie ; s'il était sur une autre roue, il
 * la quitte (jamais de doublon). La sélection va à la première roue vide à
 * droite, sinon à la première roue vide, sinon elle reste où l'on vient de poser.
 * @param {CodeGame} g
 * @param {string} s
 */
function codePlace(g, s) {
  if (g.over) return;
  g.wheels = g.wheels.map((x) => (x === s ? '' : x));
  g.wheels[g.sel] = s;
  const right = g.wheels.findIndex((x, w) => w > g.sel && !x);
  const empty = right >= 0 ? right : g.wheels.indexOf('');
  if (empty >= 0) g.sel = empty;
  codeRedraw(g);
}
/**
 * « Ouvrir » : le bon code ouvre le cadenas ; un mauvais code est une erreur,
 * puis un autre cadenas arrive.
 * @param {CodeGame} g
 * @param {HTMLElement} btn
 */
function codeOpen(g, btn) {
  if (g.over || g.wheels.includes('')) return;
  g.over = true;
  if (g.wheels.join() !== g.lock.code.join()) {
    loseLife(btn, { disable: false, onRetry: () => codeShow(codeOther(g.lock)), wrong: g.wheels.join() });
    return;
  }
  codeAll('.code-lock').forEach((el) => el.classList.add('open'));
  speak("Clic ! Le cadenas s'ouvre !");
  stepOk(btn);
  flashModal('ok');
  winSoon(WIN_DELAY_LONG);
}
/**
 * Un autre cadenas que celui qui vient d'être raté : son code est différent (X2).
 * @param {CodeLock} failed
 * @returns {CodeLock}
 */
function codeOther(failed) {
  let lock = codeLock(gameDiff());
  for (let k = 0; k < 50 && lock.code.join() === failed.code.join(); k++) lock = codeLock(gameDiff());
  return lock;
}

/** @param {CodeGame} g branche les roues, la palette, les cartes et « Ouvrir » */
function codeBind(g) {
  codeAll('.code-wheel').forEach((el, w) =>
    setHandler(el, 'click', () => {
      if (g.over) return;
      g.sel = w;
      codeRedraw(g);
    }),
  );
  codeAll('.code-sym').forEach((el) => setHandler(el, 'click', () => codePlace(g, el.dataset.s || '')));
  codeAll('.code-clue').forEach((el, k) => setHandler(el, 'click', () => speak(codeClueSay(g.lock.clues[k]))));
  codeAll('#code-open').forEach((el) => setHandler(el, 'click', () => codeOpen(g, el)));
}
/**
 * Affiche un cadenas. A2 : #code-root porte de quoi le résoudre (lu par le
 * solveur des tests). Aux paliers 1 et 2, les indices sont dits à la suite.
 * @param {CodeLock} lock
 */
function codeShow(lock) {
  const clues = lock.clues.map(codeClueSay);
  const say = gameDiff() <= 2 ? `${CODE_SAY} ${clues.join(' ')}` : CODE_SAY;
  openModal(`
    ${gameHeader(CODE_TITLE, 'Trouve le code du cadenas.', say)}
    ${livesBar()}
    ${codeStageHTML(lock)}
  `);
  const root = document.getElementById('code-root');
  if (root)
    Object.assign(root.dataset, {
      wheels: String(lock.wheels),
      palette: JSON.stringify(lock.palette),
      code: JSON.stringify(lock.code),
      clues: JSON.stringify(lock.clues),
    });
  bindQuit();
  setSolution([
    ...lock.code.flatMap((s, w) => [solSel('.code-wheel', 'w', w), solSel('.code-sym', 's', s)]),
    '#code-open',
  ]);
  setHintQuestion('code', { clues: lock.clues });
  codeBind({ lock, wheels: lock.code.map(() => ''), sel: 0, over: false });
}

function renderCode() {
  setupLives('code');
  codeShow(codeLock(gameDiff()));
}

registerGame('code', renderCode);
registerHints('code', codeHints);
registerExplain('code', {
  wrong() {
    return { say: 'Compare les indices, chacun donne une règle.', fx: { glow: '.code-clue' } };
  },
});
