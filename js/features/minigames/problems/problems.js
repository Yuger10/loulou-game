/* ---------- Mini-jeu : Le trésor raconté (Île des Coffres, saison 3) ----------
   La résolution de problèmes en quatre étapes : comprendre l'histoire, la
   dessiner (objets à toucher, puis schéma en barres, puis égalité), calculer,
   répondre. Selon ce que l'enfant a déjà réussi à son palier (mode d'exemple,
   table E1 de la spec), le compagnon résout d'abord un exemple puis laisse un
   problème jumeau à finir (n = 0), écoute seulement l'histoire avec lui
   (n = 1), ou le laisse tout faire (n ≥ 2).
   La banque d'énoncés : problems-bank.js ; le tirage : problems-draw.js ; le
   dessin : problems-schema.js ; les gestes de l'enfant : problems-play.js ;
   l'exemple et le jumeau : problems-example.js ; les paliers : `problemsRound`.
   Une mission = un problème, sans minuteur. On touche, on ne fait pas glisser.
   Anti-devinette : une erreur relance un AUTRE problème. */
import { problemsRound } from '../../../entities/difficulty/index.js';
import { state } from '../../../entities/game-state/index.js';
import { party } from '../../../entities/player/index.js';
import { openModal, speak } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints } from '../../hints/index.js';
import { livesBar, registerGame, setSolution, setupLives } from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';
import { pbEl } from './problems-auto.js';
import { pbStatement } from './problems-bank.js';
import { PB_COACH_HEARD, pbCoach } from './problems-coach.js';
import { pbDraw, pbNote, pbTuple } from './problems-draw.js';
import { pbExampleStart, pbExampleSteps, pbTwinStart, pbView } from './problems-example.js';
import { pbHints } from './problems-hints.js';
import { pbBindRun, pbEnter } from './problems-play.js';
import { pbBoxHTML, pbStepsHTML } from './problems-schema.js';
import { pbSolution } from './problems-solution.js';

/** @typedef {import('../../../entities/difficulty/index.js').ProblemsRound} ProblemsRound */
/** @typedef {import('./problems-bank.js').PbProblem} PbProblem */
/** @typedef {import('./problems-play.js').PbRun} PbRun */
/** @typedef {import('./problems-schema.js').PbView} PbView */
/**
 * Une mission : son mode d'exemple `n`, la ligne du palier, l'exemple résolu
 * (mode 0), le problème que l'enfant résout, et si un jumeau a déjà été relancé.
 * @typedef {{ n: number, row: ProblemsRound, ex: PbProblem | null, cur: PbProblem, retried: boolean }} PbMission
 */

const PB_TITLE = '🪙 Le trésor raconté';

/**
 * E1 : le mode d'exemple, lu au début de la mission. 0 : un exemple résolu puis
 * un jumeau ; 1 : le compagnon écoute avec l'enfant ; 2 : l'enfant fait tout.
 * @param {{ lvl?: number, atLvl?: unknown[] } | null | undefined} s les progrès de l'enfant dans ce jeu
 * @param {number} tier le palier joué
 * @param {boolean} multi une partie à plusieurs
 */
function pbModeOf(s, tier, multi) {
  if (multi) return 2;
  if (!s || !s.lvl || tier > s.lvl) return 0;
  if (tier < s.lvl) return 2;
  return Math.min(2, (s.atLvl || []).length);
}
/** @returns {PbMission} une nouvelle mission au palier joué */
function pbNewMission() {
  const tier = gameDiff();
  const row = problemsRound(tier);
  const n = pbModeOf((state.skills || {}).problems, tier, party.active);
  if (n > 0) return { n, row, ex: null, cur: pbDraw(row, {}), retried: false };
  const ex = pbDraw(row, {});
  return { n, row, ex, cur: pbTwinOf(row, ex, []), retried: false };
}
/**
 * Le jumeau d'un exemple : même type, autres nombres, autre objet (X2).
 * @param {ProblemsRound} row
 * @param {PbProblem} ex
 * @param {string[]} avoid les tuples des jumeaux déjà ratés
 */
function pbTwinOf(row, ex, avoid) {
  return pbDraw(row, { type: ex.type, avoid: [pbTuple(ex), ...avoid], notObj: ex.obj });
}

/**
 * A1 : #pb-root décrit le problème que l'enfant résout (lu par le solveur des tests).
 * @param {PbProblem} x
 */
function pbSetData(x) {
  const root = pbEl('#pb-root');
  if (!root) return;
  const txt = (/** @type {number} */ n) => (n ? String(n) : '');
  Object.assign(root.dataset, { type: x.type, a: txt(x.a), b: txt(x.b), c: txt(x.c), t: txt(x.t) });
  root.dataset.r = x.type === 'possible' ? (x.b <= x.a ? 'oui' : 'non') : String(x.r);
  delete root.dataset.variant;
  delete root.dataset.r1;
  if (x.type === 'deuxEtapes') Object.assign(root.dataset, { variant: x.variant, r1: String(x.r1) });
}
/**
 * Le problème de l'enfant, prêt à être joué.
 * @param {PbMission} m
 * @param {PbView} v
 * @returns {PbRun}
 */
function pbRunOf(m, v) {
  return {
    ...v,
    e: 0,
    moment: '',
    pick: '',
    eq: [],
    moved: 0,
    placed: 0,
    dead: false,
    helped: m.n === 0,
    retry: () => pbRetry(m),
    drawn: () => {},
  };
}

/**
 * Après une erreur : un autre problème. Pendant le jumeau, un nouveau jumeau
 * seul (même type), sans rejouer l'exemple ; sinon un tirage libre, même mode.
 * @param {PbMission} m
 */
function pbRetry(m) {
  if (!m.ex) {
    m.cur = pbDraw(m.row, {});
    pbOpen(m);
    return;
  }
  m.cur = pbTwinOf(m.row, m.ex, [pbTuple(m.cur)]);
  m.retried = true;
  const old = pbEl('#pb-twin');
  const v = pbView('pb-twin', m.cur, m.row);
  if (!old) return;
  old.outerHTML = pbBoxHTML(v, [], true);
  pbPlay(m, v);
  pbTwinStart(pbBindNew(m, v));
}
/**
 * Pose les attributs, la solution et les gestes du problème de l'enfant.
 * @param {PbMission} m
 * @param {PbView} v
 */
function pbPlay(m, v) {
  pbSetData(m.cur);
  setSolution(pbSolution(v, m.ex && !m.retried ? pbExampleSteps(m.ex).length : 0, m.n > 0));
}
/**
 * @param {PbMission} m
 * @param {PbView} v
 * @returns {PbRun}
 */
function pbBindNew(m, v) {
  const run = pbRunOf(m, v);
  pbBindRun(run);
  return run;
}

/**
 * Ouvre la fenêtre de la mission : tout y est dès l'ouverture, les étapes à
 * venir et le jumeau attendent cachés.
 * @param {PbMission} m
 */
function pbOpen(m) {
  const v = pbView(m.ex ? 'pb-twin' : 'pb-main', m.cur, m.row);
  const ex = m.ex ? pbView('pb-ex', m.ex, m.row) : null;
  const boxes = ex
    ? pbBoxHTML(ex, pbExampleSteps(ex.x), true) + pbBoxHTML(v, [], false)
    : pbBoxHTML(v, ['comprendre'], true);
  openModal(`
    ${gameHeader(PB_TITLE, "Écoute l'histoire.", pbStatement((ex || v).story))}
    ${livesBar()}
    <div id="pb-root">${pbStepsHTML()}<p class="pb-coach" hidden></p>${boxes}</div>
  `);
  bindQuit();
  pbPlay(m, v);
  const run = pbBindNew(m, v);
  if (ex) {
    pbExampleStart(ex, run);
    return;
  }
  pbNote(m.cur);
  pbEnter(run, 'comprendre');
  // n = 1 : le compagnon écoute l'histoire avec l'enfant, puis lui laisse la suite
  if (m.n === 1) speak(`${pbStatement(v.story)} ${pbCoach(v.x, v.story, m.row.rep).listen} ${PB_COACH_HEARD}`);
}

function renderProblems() {
  setupLives('problems');
  pbOpen(pbNewMission());
}

registerGame('problems', renderProblems);
registerHints('problems', pbHints);
