/* ---------- Mini-jeu : Les paniers de dix (Île des Squishy Dumplings, saison 3) ----------
   La valeur de position : dizaines et unités, puis centaines. Quatre modes,
   du concret à l'abstrait : ranger 11 à 19 dumplings dans un panier de dix
   (build), lire des paniers pleins et des tout seuls (read), préparer un
   nombre avec les boutons +10 et +1 (make), lire l'écriture 30 + 5 (write).
   Les tirages : tens-build.js ; le dessin : tens-draw.js ; les indices :
   tens-hints.js ; les paliers : `tensRound` (js/entities/difficulty/difficulty-s3.js).
   Une mission = une question, sans minuteur. On touche, on ne fait pas
   glisser. Anti-devinette : une mauvaise réponse relance une AUTRE question. */
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
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';
import { tensDigits, tensNewQuestion, tensQty } from './tens-build.js';
import { tensGroupsHTML, tensStageHTML } from './tens-draw.js';
import { tensHints } from './tens-hints.js';

/** @typedef {import('./tens-build.js').TensQuestion} TensQuestion */

const TENS_TITLE = '🧺 Les paniers de dix';
const TENS_COUNT = 'Combien de dumplings en tout ?';

/**
 * La consigne affichée et la phrase dite (table T12 de la spec).
 * @param {TensQuestion} q
 * @returns {{ short: string, say: string }}
 */
function tensText(q) {
  if (q.mode === 'build')
    return {
      short: 'Range les dumplings dans le panier !',
      say: "Touche chaque dumpling pour le ranger dans le panier. Un panier, c'est dix places !",
    };
  if (q.mode === 'write')
    return { short: `${q.terms.join(' + ')} = ?`, say: `${q.terms.join(' plus ')}. Quel nombre ça fait ?` };
  const big = q.tier === 5;
  if (q.mode === 'make')
    return {
      short: `Prépare ${q.n} dumplings`,
      say: `Le client veut ${q.n} dumplings. Prépare-les avec ${big ? 'des piles de cent, ' : ''}des paniers de dix et des dumplings tout seuls, puis touche « C'est prêt ».`,
    };
  return {
    short: TENS_COUNT,
    say: big
      ? "Une pile, c'est dix paniers : cent dumplings. Combien y en a-t-il en tout ?"
      : 'Les dumplings sont rangés par paniers de dix. Combien y en a-t-il en tout ?',
  };
}

/**
 * Ce qu'il faut toucher pour réussir, dans l'ordre (lu par les tests).
 * @param {TensQuestion} q
 * @returns {string[]}
 */
function tensSolution(q) {
  const answer = solSel('.tens-opt', 'v', q.n);
  if (q.mode === 'build')
    return [...Array.from({ length: q.n }, (_, i) => solSel('.tens-heap .tens-dumpling', 'id', i)), answer];
  if (q.mode !== 'make') return [answer];
  const { c, d, u } = tensDigits(q.n);
  const big = q.tier === 5;
  return [
    ...Array(big ? c : 0).fill('#tens-add100'),
    ...Array(big ? d : 10 * c + d).fill('#tens-add10'),
    ...Array(u).fill('#tens-add1'),
    '#tens-ready',
  ];
}

/** @param {TensQuestion} q la mission est gagnée */
function tensWin(q) {
  q.phase = 'won';
  flashModal('ok');
  winSoon();
}

/* ---- ranger (mode build) ---- */
/**
 * Tout est rangé : les réponses apparaissent, la consigne devient la question.
 * @param {TensQuestion} q
 */
function tensSorted(q) {
  q.phase = 'answer';
  const options = document.querySelector('.tens-options');
  if (options) options.removeAttribute('hidden');
  const say = `Un panier de dix, et ${tensQty(q.n - 10, 'tout seul', 'tout seuls')}. ${TENS_COUNT}`;
  const txt = document.querySelector('.puzzle-hint .hint-txt');
  if (txt) txt.textContent = TENS_COUNT;
  const btn = /** @type {HTMLElement | null} */ (document.querySelector('.puzzle-hint .btn-speak'));
  if (btn) btn.dataset.say = say;
  speak(say);
}
/**
 * Un dumpling du vrac est touché : il saute dans la première case libre du
 * panier, puis dans l'assiette des tout seuls. Jamais une erreur.
 * @param {TensQuestion} q
 * @param {Element} el
 */
function tensPlace(q, el) {
  // un dumpling déjà rangé ne se touche plus
  if (q.phase !== 'range' || !el.closest('.tens-heap')) return;
  const cell = document.querySelectorAll('.tens-basket .tens-cell')[q.placed];
  const home = cell || document.querySelector('.tens-loose');
  if (!home) return;
  home.appendChild(el);
  q.placed++;
  const basket = document.querySelector('.tens-basket');
  if (q.placed === 10 && basket) basket.classList.add('full');
  if (q.placed === q.n) tensSorted(q);
}

/* ---- construire (mode make) ---- */
/** @param {TensQuestion} q le total préparé */
function tensMade(q) {
  return 100 * q.stock.piles + 10 * q.stock.baskets + q.stock.loose;
}
/** @param {TensQuestion} q la scène est redessinée à partir de ce qui est préparé */
function tensRedraw(q) {
  const stage = document.getElementById('tens-stage');
  if (stage) stage.innerHTML = tensGroupsHTML(q.stock);
}
/**
 * Un bouton d'ajout : rien au-delà du plafond (99, ou 999 au palier 5). Dix
 * tout seuls deviennent un panier, dix paniers une pile : l'échange se voit.
 * @param {TensQuestion} q
 * @param {number} unit 100, 10 ou 1
 */
function tensAdd(q, unit) {
  if (q.phase === 'won' || tensMade(q) + unit > (q.tier === 5 ? 999 : 99)) return;
  q.undo.push(q.stock);
  const s = { ...q.stock };
  if (unit === 100) s.piles++;
  else if (unit === 10) s.baskets++;
  else s.loose++;
  if (s.loose === 10) {
    s.loose = 0;
    s.baskets++;
    speak('Dix dumplings : hop, un panier plein !');
  }
  if (s.baskets === 10) {
    s.baskets = 0;
    s.piles++;
    speak('Dix paniers : hop, une pile de cent !');
  }
  q.stock = s;
  tensRedraw(q);
}
/** @param {TensQuestion} q ↩️ : l'état d'avant le dernier ajout, regroupement compris */
function tensUndo(q) {
  const before = q.undo.pop();
  if (q.phase === 'won' || !before) return;
  q.stock = before;
  tensRedraw(q);
}
/**
 * « C'est prêt ! » : rien de posé n'est pas une erreur ; le bon total gagne.
 * @param {TensQuestion} q
 * @param {HTMLElement} btn
 */
function tensReady(q, btn) {
  if (q.phase === 'won') return;
  if (tensMade(q) === 0) {
    speak("Ajoute d'abord des paniers ou des dumplings !");
    return;
  }
  if (tensMade(q) !== q.n) {
    loseLife(btn, { disable: false, onRetry: renderTens, wrong: tensMade(q) });
    return;
  }
  stepOk(btn);
  tensWin(q);
}

/* ---- les réponses (ranger, lire, écrire) ---- */
/**
 * @param {TensQuestion} q
 * @param {HTMLButtonElement} btn
 */
function tensAnswer(q, btn) {
  if (q.phase !== 'answer') return;
  if (Number(btn.dataset.v) !== q.n) {
    loseLife(btn, { onRetry: renderTens, wrong: Number(btn.dataset.v) });
    return;
  }
  stepOk(btn);
  tensWin(q);
}

/** @param {TensQuestion} q branche tout ce qui se touche */
function tensBind(q) {
  const each = (/** @type {string} */ sel, /** @type {(el: HTMLButtonElement) => void} */ fn) =>
    /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll(sel)).forEach((el) =>
      setHandler(el, 'click', () => fn(el)),
    );
  each('.tens-heap .tens-dumpling', (el) => tensPlace(q, el));
  each('.tens-opt', (el) => tensAnswer(q, el));
  each('#tens-add100', () => tensAdd(q, 100));
  each('#tens-add10', () => tensAdd(q, 10));
  each('#tens-add1', () => tensAdd(q, 1));
  each('#tens-undo', () => tensUndo(q));
  each('#tens-ready', (el) => tensReady(q, el));
}

function renderTens() {
  setupLives('tens');
  const q = tensNewQuestion(gameDiff());
  const text = tensText(q);
  openModal(`
    ${gameHeader(TENS_TITLE, text.short, text.say)}
    ${livesBar()}
    ${tensStageHTML(q)}
  `);
  bindQuit();
  setSolution(tensSolution(q));
  setHintQuestion('tens', q, q.mode === 'make' ? {} : { choices: '.tens-opt' });
  tensBind(q);
}

registerGame('tens', renderTens);
registerHints('tens', tensHints);
registerExplain('tens', {
  /** @param {TensQuestion} q */
  wrong(q) {
    const say =
      q.tier === 5
        ? 'Dix paniers forment une pile de cent.'
        : q.mode === 'build'
          ? 'Un panier plein contient dix places.'
          : q.mode === 'read'
            ? 'Compte les paniers puis les dumplings seuls.'
            : q.mode === 'make'
              ? 'Regroupe les unités avant de préparer.'
              : 'Chaque terme indique un groupe de quantité.';
    return { say, fx: { glow: '#tens-stage' } };
  },
});
