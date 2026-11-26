/* ---------- Mini-jeu : Les paquets de jouets (Coffre aux Jouets Doux, saison 2) ----------
   Le début de la multiplication : des jouets rangés par paquets de 2, 5 ou
   10. Combien y en a-t-il en tout ? On compte par paquets plutôt qu'un par
   un, et on choisit parmi 3 réponses (grands chiffres et points).
   Tailles et nombre de paquets : `packsRound` (js/entities/difficulty/difficulty.js) ;
   au palier haut, un jouet tout seul s'ajoute, et la phrase « 4 paquets de
   5 » s'écrit sous l'image.
   Anti-devinette : une mauvaise réponse relance une AUTRE collection. */
import { packsRound } from '../../../entities/difficulty/index.js';
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

const PACK_TOYS = ['🧸', '🪀', '⚽', '🎈', '🧩', '🪁', '🎲', '🚗', '🦆', '🍡'];
/** @type {Record<number, string>} */
const PACK_WORDS = { 2: 'deux', 5: 'cinq', 10: 'dix' };

/** @typedef {ReturnType<typeof packsBuildRound>} PacksRound */
/** @typedef {{ size: number, n: number, extra: number, label: PacksRound['label'], total: number }} PacksQuestion */

// Une collection : `n` paquets de `size` jouets, et peut-être un jouet tout seul
/** @param {number} dd le palier de difficulté */
function packsBuildRound(dd, rng = random) {
  const cfg = packsRound(dd);
  const size = cfg.sizes[Math.floor(rng() * cfg.sizes.length)];
  const n = cfg.min + Math.floor(rng() * (cfg.max - cfg.min + 1));
  const extra = rng() < cfg.extra ? 1 : 0;
  return {
    cfg,
    size,
    n,
    extra,
    total: size * n + extra,
    toy: PACK_TOYS[Math.floor(rng() * PACK_TOYS.length)],
    label: cfg.label,
  };
}

// trois réponses : la bonne et deux pièges plausibles (un paquet de plus ou
// de moins, le jouet seul oublié, un de plus), toutes différentes et ≥ 1
/** @param {PacksRound} r */
function packsOptions(r) {
  const set = new Set([r.total]);
  const traps = shuffle([
    r.total - r.size,
    r.total + r.size,
    r.extra ? r.total - 1 : r.total + 1,
    r.total - 1,
    r.total + 2,
    r.n + r.size,
  ]);
  for (const k of traps) {
    if (set.size >= 3) break;
    if (k >= 1) set.add(k);
  }
  for (let k = 1; set.size < 3; k++) set.add(r.total + k);
  return shuffle([...set]);
}
const packDots = (/** @type {number} */ n) =>
  n <= 12 ? `<span class="cube-dots" aria-hidden="true">${'<i></i>'.repeat(n)}</span>` : '';

// un paquet : un sachet aux coins arrondis, les jouets rangés en lignes de 5
/**
 * @param {PacksRound} r
 * @param {number} i
 */
function packHTML(r, i) {
  return `<div class="pack pack-${r.size}" data-pack="${i}" aria-hidden="true">${`<i class="pack-toy">${r.toy}</i>`.repeat(r.size)}</div>`;
}
/** @param {PacksRound} r */
function packsLabel(r) {
  const what = `${r.n} paquet${r.n > 1 ? 's' : ''} de ${r.size}`;
  return r.extra ? `${what} et 1 jouet tout seul` : what;
}

// la collection précédente : une relance en tire toujours une AUTRE (anti-devinette)
let packsLast = '';
// la clé est ce qui fixe le total : le jouet dessiné n'en fait pas partie (le
// même total avec un autre jouet serait la même question, réponse déjà montrée)
const packsKey = (/** @type {PacksRound} */ x) => `${x.size}-${x.n}-${x.extra}`;
/**
 * Une collection, jamais la même que la précédente.
 * @param {number} dd le palier de difficulté
 * @returns {PacksRound}
 */
function packsQuestion(dd) {
  const r = drawOther(() => packsBuildRound(dd), packsKey, {
    last: packsLast,
    fallback: (x) => {
      // après 8 tirages identiques : un paquet de plus, ou de moins au maximum du palier
      const n = x.n + 1 <= x.cfg.max ? x.n + 1 : x.n - 1;
      return { ...x, n, total: x.size * n + x.extra };
    },
  });
  packsLast = packsKey(r);
  return r;
}
function renderPacks() {
  setupLives('packs');
  const r = packsQuestion(gameDiff());
  const opts = packsOptions(r);
  /** @type {PacksQuestion} */
  const q = { size: r.size, n: r.n, extra: r.extra, label: r.label, total: r.total };
  const say = r.extra
    ? `Les jouets sont rangés par paquets de ${r.size}, et un jouet est tout seul. Combien y en a-t-il en tout ?`
    : `Les jouets sont rangés par paquets de ${r.size}. Combien y en a-t-il en tout ?`;
  openModal(`
    ${gameHeader('🧸 Les paquets de jouets', 'Combien de jouets en tout ?', say)}
    ${livesBar()}
    <div class="packs-stage">
      ${Array.from({ length: r.n }, (_, i) => packHTML(r, i)).join('')}
      ${r.extra ? `<div class="pack pack-single" aria-hidden="true"><i class="pack-toy">${r.toy}</i></div>` : ''}
    </div>
    ${r.label ? `<p class="packs-label">${packsLabel(r)}</p>` : ''}
    <div class="num-options packs-options">
      ${opts.map((o) => `<button class="num-btn pack-opt" data-v="${o}" aria-label="${o}"><b>${o}</b>${packDots(o)}</button>`).join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('packs');
  setSolution([solSel('.pack-opt', 'v', r.total)]);
  setHintQuestion('packs', q, { choices: '.pack-opt' });
  document.querySelectorAll('.pack-opt').forEach((btn) => {
    setHandler(btn, 'click', () => {
      if (Number(btn.dataset.v) === r.total) {
        clearActiveTimer();
        stepOk(btn);
        flashModal('ok');
        winSoon();
      } else loseLife(btn, { onRetry: renderPacks, wrong: Number(btn.dataset.v) });
    });
  });
}

// Indices (v52) : 1. compter de paquet en paquet (de 2 en 2, de 5 en 5…) ;
// 2. le premier paquet brille avec son nombre, et l'écriture « n × taille »
//    au palier haut : il reste à continuer. Jamais le total.
/** @param {PacksQuestion} q */
function packsHints(q) {
  const word = PACK_WORDS[q.size] || q.size;
  const alone = q.extra ? " Et n'oublie pas le jouet tout seul !" : '';
  const second = q.label
    ? `${q.n} paquets de ${q.size}, ça s'écrit ${q.n} × ${q.size}. Compte de ${q.size} en ${q.size}, un paquet à la fois.${alone}`
    : `Le premier paquet a ${q.size} jouets. Pour chaque autre paquet, ajoute encore ${q.size}.${alone}`;
  return [
    {
      say: `Ne compte pas les jouets un par un : compte de ${word} en ${word}, un paquet à la fois.`,
      fx: { glow: '.packs-stage' },
    },
    {
      say: second,
      fx: {
        glow: '.pack[data-pack="0"]',
        html: q.label
          ? `<span class="hint-strip"><i>${q.n} × ${q.size}</i>${q.extra ? '<i>+ 1</i>' : ''}<i class="q">= ?</i></span>`
          : `<span class="hint-strip"><i>${q.size}</i><i class="q">+ ${q.size} …</i></span>`,
      },
    },
  ];
}

// Explication d'une erreur (track erreurs-expliquees) : l'erreur reconnue
// (le nombre de paquets ajouté à leur taille, le jouet seul oublié, un paquet
// de moins ou de trop), puis le compte de paquet en paquet écrit sur chacun.
/**
 * @param {PacksQuestion} q
 * @param {number} v le nombre touché
 * @returns {import('../../hints/index.js').Explain}
 */
function packsExplain(q, v) {
  const { size, n, extra, total } = q;
  const whole = `${n} paquets de ${size}${extra ? ' et 1' : ''} : ${total}`;
  let say = `Je compte de ${size} en ${size} : ${total}.`;
  if (v === n + size && n + size !== total) say = `On ne fait pas ${n} plus ${size}. On compte par paquets : ${total}.`;
  else if (extra && v === total - 1) say = `N'oublie pas le jouet seul : ${total}.`;
  else if (v === total - size) say = `Il manque un paquet. ${whole}.`;
  else if (v === total + size) say = `Un paquet de trop. ${whole}.`;
  const marks = Array.from({ length: n }, (_, i) => ({ sel: `.pack[data-pack="${i}"]`, text: String(size * (i + 1)) }));
  if (extra) marks.push({ sel: '.pack-single', text: String(total) });
  return { say, fx: { marks, glow: solSel('.pack-opt', 'v', total) } };
}

registerGame('packs', renderPacks);
registerHints('packs', packsHints);
registerExplain('packs', {
  wrong: packsExplain,
  // la stratégie d'une réussite, dite sur l'écran de victoire
  right: (q) => `Tu as compté de ${q.size} en ${q.size}.`,
});
