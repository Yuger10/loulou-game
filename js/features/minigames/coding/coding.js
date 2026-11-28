/* ---------- Mini-jeu : Le chemin de la plume (Monde des Chatouilles, saison 3) ----------
   Le codage d'un déplacement (CP, CE1) : l'enfant pose des flèches dans un
   programme, puis « Go » : la plume les joue une à une jusqu'à l'ami qui a
   envie de rire. Palier 1 : flèches absolues ; ensuite « avance » et quarts
   de tour. Les grilles : coding-grid.js ; le dessin : coding-draw.js ; les
   indices : coding-hints.js ; les paliers : `codingRound`.
   Une erreur garde la grille ET le programme (spec D6) : corriger son
   programme est le but du jeu. Le message précis est dit après `loseLife`,
   dont la phrase générique serait sinon coupée (spec D8). Sans minuteur. */
import { giggle, openModal, setHandler, speak } from '../../../shared/ui/index.js';
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
import { CODING_WORDS, codingProgHTML, codingStageHTML } from './coding-draw.js';
import { codingBuildRound, codingRun } from './coding-grid.js';
import { codingHints } from './coding-hints.js';

/** @typedef {import('./coding-grid.js').CodingBuild} CodingBuild */
/** @typedef {import('./coding-grid.js').CodingState} CodingState */
/** @typedef {import('./coding-grid.js').CodingRunResult} CodingRunResult */
/**
 * La partie en cours : la grille, le programme de l'enfant, l'angle cumulé de
 * la plume (jamais ramené modulo 360 pendant un trajet : la transition ferait
 * un tour complet), si un trajet est en cours, si la mission est finie.
 * @typedef {{ round: CodingBuild, prog: string[], dir: number, angle: number, busy: boolean, over: boolean }} CodingGame
 */

const CODING_STEP_MS = 450;
const CODING_TITLE = '🪶 Le chemin de la plume';
const CODING_EMPTY = "Ajoute d'abord des flèches, puis appuie sur Go !";
const CODING_FULL = "Ton programme est plein. Touche une flèche du programme pour l'enlever.";
const CODING_WIN = 'Hi hi hi ! Ça chatouille ! Bravo, ta plume a trouvé le chemin !';

/** @type {CodingGame | null} la partie affichée : un trajet en retard d'une autre partie s'arrête tout seul */
let codingGame = null;
let codingLast = '';

/** @param {string} sel @returns {HTMLElement[]} */
function codingAll(sel) {
  return [...document.querySelectorAll(sel)].map((el) => /** @type {HTMLElement} */ (el));
}
/** @param {CodingGame} g cette partie est-elle encore à l'écran ? */
function codingLive(g) {
  return g === codingGame && !!document.getElementById('cd-grid');
}
/**
 * Pose la plume sur un état. L'angle prend le plus petit pas vers la nouvelle
 * direction (-90, 0, +90 ou +180) ; `instant` : sans transition (retour au départ).
 * @param {CodingGame} g
 * @param {CodingState} s
 * @param {boolean} [instant]
 */
function codingFeather(g, s, instant = false) {
  const el = document.getElementById('cd-feather');
  if (!el) return;
  const quarter = (s.dir - g.dir + 4) % 4;
  g.angle = instant ? s.dir * 90 : g.angle + (quarter === 3 ? -90 : quarter * 90);
  g.dir = s.dir;
  el.classList.toggle('cd-instant', instant);
  Object.assign(el.dataset, { r: String(s.r), c: String(s.c), dir: String(s.dir) });
  el.style.setProperty('--r', String(s.r));
  el.style.setProperty('--c', String(s.c));
  el.style.transform = `rotate(${g.angle}deg)`;
}
/** @param {CodingGame} g la plume revient au départ, les marques de l'essai d'avant s'effacent */
function codingReset(g) {
  const { start, dir } = g.round.grid;
  codingAll('.cd-step').forEach((el) => el.classList.remove('on', 'ko'));
  codingAll('.cd-cell.cd-stop').forEach((el) => el.classList.remove('cd-stop'));
  codingAll('#cd-feather').forEach((el) => el.classList.remove('cd-bump'));
  codingFeather(g, { r: start[0], c: start[1], dir }, true);
}
/**
 * Pendant un trajet, la palette, le programme et « Go » sont inactifs.
 * @param {CodingGame} g
 * @param {boolean} busy
 */
function codingLock(g, busy) {
  g.busy = busy;
  codingAll('.cd-op, .cd-step, #cd-go').forEach((el) =>
    /** @type {HTMLButtonElement} */ (el).toggleAttribute('disabled', busy),
  );
}
/** @param {CodingGame} g redessine le programme et rebranche ses flèches (les toucher les retire) */
function codingRedraw(g) {
  const box = document.getElementById('cd-prog');
  if (!box) return;
  codingReset(g);
  box.innerHTML = codingProgHTML(g.prog, g.round.cfg.slots);
  codingAll('.cd-step').forEach((el) =>
    setHandler(el, 'click', () => {
      if (g.busy || g.over) return;
      g.prog.splice(Number(el.dataset.i), 1);
      codingRedraw(g);
    }),
  );
}
/**
 * Une flèche de la palette s'ajoute au bout du programme, et son mot est dit.
 * @param {CodingGame} g
 * @param {string} op
 */
function codingAdd(g, op) {
  if (g.busy || g.over) return;
  if (g.prog.length >= g.round.cfg.slots) {
    speak(CODING_FULL);
    return;
  }
  g.prog.push(op);
  codingRedraw(g);
  speak(CODING_WORDS[op].say);
}

/**
 * Une erreur de programme : un essai perdu, puis le message précis. La grille
 * et le programme restent ; tout redevient actif, sauf si la mission est perdue.
 * @param {CodingGame} g
 * @param {'rock' | 'edge' | 'stop'} reason
 */
function codingFail(g, reason) {
  const lost = loseLife(document.getElementById('cd-go'), { disable: false, wrong: reason });
  g.over = lost;
  if (!lost) codingLock(g, false);
  else g.busy = false;
}
/** @param {CodingGame} g la plume est chez l'ami : il rit, la mission est gagnée */
function codingWin(g) {
  g.over = true;
  giggle(document.querySelector('.cd-cell.goal .cd-friend'));
  speak(CODING_WIN);
  stepOk(document.getElementById('cd-go'));
  flashModal('ok');
  winSoon(WIN_DELAY_LONG);
}
/**
 * Joue l'instruction `i` du trajet, puis la suivante 450 ms plus tard.
 * @param {CodingGame} g
 * @param {CodingRunResult} res le trajet calculé par `codingRun`
 * @param {number} i
 */
function codingTick(g, res, i) {
  if (!codingLive(g)) return;
  const stepEls = codingAll('.cd-step');
  stepEls.forEach((el, k) => el.classList.toggle('on', k === i));
  if (i === res.at && res.end !== 'goal') {
    // un cactus ou le bord : la plume reste sur sa case et tremble, la flèche fautive rougit
    stepEls[i].classList.replace('on', 'ko');
    codingAll('#cd-feather').forEach((el) => el.classList.add('cd-bump'));
    codingFail(g, res.end === 'rock' ? 'rock' : 'edge');
    return;
  }
  codingFeather(g, res.path[i + 1]);
  if (i === res.at) {
    codingWin(g);
    return;
  }
  if (i < g.prog.length - 1) {
    setTimeout(() => codingTick(g, res, i + 1), CODING_STEP_MS);
    return;
  }
  // le programme est fini ailleurs que chez l'ami : la case d'arrêt est entourée
  const last = res.path[res.path.length - 1];
  stepEls[i].classList.remove('on');
  codingAll(`.cd-cell[data-r="${last.r}"][data-c="${last.c}"]`).forEach((el) => el.classList.add('cd-stop'));
  codingFail(g, 'stop');
}
/** @param {CodingGame} g « Go » : la plume repart de sa case de départ et joue le programme */
function codingGo(g) {
  if (g.busy || g.over) return;
  if (!g.prog.length) {
    speak(CODING_EMPTY);
    return;
  }
  codingReset(g);
  codingLock(g, true);
  const res = codingRun(g.round.grid, g.prog);
  setTimeout(() => codingTick(g, res, 0), CODING_STEP_MS);
}

/** @param {CodingBuild} round la consigne dite (C3 en flèches absolues, C4 ensuite) */
function codingSay(round) {
  const name = round.grid.friend.name;
  if (round.grid.mode === 'abs')
    return `${name} a envie de rire ! Choisis les flèches pour guider la plume jusqu'à ${name === 'Guili' ? 'lui' : 'elle'}, puis appuie sur Go.`;
  return `${name} a envie de rire ! Programme la plume : elle avance tout droit, ou elle tourne sur place. Puis appuie sur Go. Attention aux cactus !`;
}
/**
 * Affiche une grille. La solution : les flèches du plus court programme, par
 * la palette, puis « Go ».
 * @param {CodingBuild} round
 */
function codingShow(round) {
  const { grid, best } = round;
  openModal(`
    ${gameHeader(CODING_TITLE, `Guide la plume jusqu'à ${grid.friend.name}`, codingSay(round))}
    ${livesBar()}
    ${codingStageHTML(round)}
  `);
  bindQuit();
  setSolution([...(best ? best.prog : []).map((op) => solSel('#cd-pal .cd-op', 'op', op)), '#cd-go']);
  setHintQuestion('coding', { grid, best }, { choices: '#cd-go' });
  /** @type {CodingGame} */
  const g = { round, prog: [], dir: grid.dir, angle: grid.dir * 90, busy: false, over: false };
  codingGame = g;
  codingReset(g);
  codingAll('.cd-op').forEach((el) => setHandler(el, 'click', () => codingAdd(g, el.dataset.op || '')));
  setHandler(document.getElementById('cd-go'), 'click', () => codingGo(g));
}

function renderCoding() {
  setupLives('coding');
  const dd = gameDiff();
  /** @type {(r: CodingBuild) => string} */
  const key = (r) => JSON.stringify([r.grid.start, r.grid.goal, r.grid.rocks]);
  let round = codingBuildRound(dd);
  // G6 : la même grille ne revient pas deux fois de suite
  for (let k = 0; k < 8 && key(round) === codingLast; k++) round = codingBuildRound(dd);
  codingLast = key(round);
  codingShow(round);
}

registerGame('coding', renderCoding);
registerHints('coding', codingHints);
registerExplain('coding', {
  /** @param {unknown} _q @param {string} reason */
  wrong(_q, reason) {
    const say =
      reason === 'rock'
        ? 'La plume ne traverse pas les cactus.'
        : reason === 'edge'
          ? 'La plume doit rester dans la grille.'
          : "Programme-la jusqu'à l'ami, pas avant.";
    return { say, fx: { glow: reason === 'stop' ? '.cd-stop' : '.cd-cell' } };
  },
});
