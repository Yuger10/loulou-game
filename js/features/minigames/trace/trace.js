/* ---------- Mini-jeu : Trace avec ton doigt (Île des Crayons, saison 3) ----------
   Le geste d'écriture : l'enfant suit du doigt un modèle gris, en partant du
   point vert et dans le sens des flèches. Une mission montre tous ses glyphes
   dans une bande ; chaque glyphe se trace trait après trait dans le grand
   carré. Les modèles : trace-glyphs.js ; le juge : trace-judge.js ; le dessin :
   trace-draw.js ; les paliers : `traceRound`
   (js/entities/difficulty/difficulty-s3.js).
   Pas de punition : un trait raté se refait, la voix dit pourquoi ; au 3ᵉ raté
   de suite sur le même trait, un essai part et le crayon montre le chemin.
   On reste toujours sur le même trait (il n'y a aucun choix à deviner). */
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  flashModal,
  livesBar,
  loseLife,
  progressDots,
  registerGame,
  setSolution,
  setupLives,
  stepOk,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';
import { openModal, speak } from '../../../shared/ui/index.js';
import { traceHeadHTML, traceMiniHTML, traceNum, tracePadHTML, traceSay } from './trace-draw.js';
import { TRACE_GLYPHS, traceBuildRound } from './trace-glyphs.js';
import { traceBindPad, traceClearInk } from './trace-input.js';
import { traceJudge, traceStrokePoints } from './trace-judge.js';

/** @typedef {import('./trace-glyphs.js').TraceGlyph} TraceGlyph */
/** @typedef {import('./trace-glyphs.js').TraceStroke} TraceStroke */
/** @typedef {import('./trace-glyphs.js').TraceRules} TraceRules */
/** @typedef {{ g: number, arrows: boolean }} TraceQuestion la question des indices : une par glyphe */
/**
 * La mission en cours : `g` et `s` = le glyphe et le trait à faire, `misses` =
 * ratés de suite sur ce trait.
 * @typedef {{
 *   rules: TraceRules,
 *   glyphs: string[],
 *   g: number,
 *   s: number,
 *   misses: number,
 *   demo: ReturnType<typeof setInterval> | null,
 *   done: boolean,
 *   q: TraceQuestion,
 * }} TraceGame
 */

const TRACE_SVG_NS = 'http://www.w3.org/2000/svg';
const TRACE_DEMO_STEPS = 30; // la démonstration : 30 pas de 40 ms (1,2 s)
const TRACE_MISS_SAY = {
  start: 'Presque ! Pose ton doigt sur le point vert pour commencer.',
  cover: "Presque ! Suis bien le chemin gris jusqu'au bout.",
  wander: 'Doucement ! Reste sur le chemin gris.',
  dot: 'Touche juste le petit point.',
};

/** @type {TraceGame | null} */
let traceGame = null;

/* Redessine le carré pour le trait courant. Le carré est refait en entier
   (son conteneur reçoit le HTML) plutôt que retouché : `innerHTML` sur un
   élément SVG manque aux vieux navigateurs. */
/** @param {TraceGame} game */
function traceDraw(game) {
  traceStopDemo();
  const board = document.getElementById('tr-board');
  if (!board) return;
  board.innerHTML = tracePadHTML(game);
  const pad = document.getElementById('tr-pad');
  if (!pad) return;
  traceBindPad(pad, {
    onDown() {
      if (game.done) return false;
      traceStopDemo(); // on peut toujours tracer, même pendant la démonstration
      return true;
    },
    onStroke: traceAddStroke,
  });
}

/* La démonstration : un ✏️ suit le trait courant en 1,2 s. Avec « réduire les
   animations », le trait clignote une fois à la place. */
function traceDemo() {
  const game = traceGame,
    pad = document.getElementById('tr-pad');
  if (!game || game.done || !pad) return;
  traceStopDemo();
  const reduce = typeof window.matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    const model = pad.querySelector(`.tr-model[data-s="${game.s}"]`);
    if (model) {
      model.classList.remove('tr-flash');
      model.classList.add('tr-flash');
    }
    return;
  }
  const pts = traceStrokePoints(TRACE_GLYPHS[game.glyphs[game.g]].strokes[game.s]);
  const pencil = document.createElementNS(TRACE_SVG_NS, 'text');
  pencil.setAttribute('class', 'tr-demo');
  pencil.setAttribute('data-s', String(game.s));
  pencil.textContent = '✏️';
  let k = 0;
  const place = () => {
    const [x, y] = pts[Math.round(((pts.length - 1) * k) / TRACE_DEMO_STEPS)];
    pencil.setAttribute('x', traceNum(x));
    pencil.setAttribute('y', traceNum(y));
  };
  place();
  pad.appendChild(pencil);
  game.demo = setInterval(() => {
    k++;
    if (k > TRACE_DEMO_STEPS) traceStopDemo();
    else place();
  }, 40);
}
function traceStopDemo() {
  if (traceGame && traceGame.demo) {
    clearInterval(traceGame.demo);
    traceGame.demo = null;
  }
  document.querySelectorAll('#tr-pad .tr-demo').forEach((el) => el.remove());
}

/**
 * Un geste fini (doigt levé) : jugé contre le trait courant.
 * @param {Array<[number, number]>} points le geste, en unités du carré
 */
function traceAddStroke(points) {
  const game = traceGame,
    pad = document.getElementById('tr-pad');
  if (!game || game.done || !pad) return;
  const glyph = TRACE_GLYPHS[game.glyphs[game.g]];
  const res = traceJudge(glyph.strokes[game.s], points, game.rules);
  traceClearInk(pad);
  if (res.ok) {
    traceStrokeDone(game, glyph);
    return;
  }
  const reason = res.reason;
  if (!reason || reason === 'short') return; // un simple toucher : rien ne se passe
  game.misses++;
  if (game.misses < 3) {
    speak(TRACE_MISS_SAY[reason]); // pas d'essai perdu : la voix dit quoi changer
    return;
  }
  // 3ᵉ raté de suite : un essai part, et le crayon montre ce trait (on y reste)
  game.misses = 0;
  if (loseLife(pad, { disable: false })) {
    game.done = true; // mission perdue : le carré ne répond plus
    return;
  }
  speak('Regarde le crayon, puis refais ce trait !');
  traceDemo();
}

/**
 * Un trait réussi : le suivant, ou le glyphe suivant, ou la victoire.
 * @param {TraceGame} game
 * @param {TraceGlyph} glyph
 */
function traceStrokeDone(game, glyph) {
  game.misses = 0;
  const strip = document.querySelector(`.tr-ms[data-g="${game.g}"][data-s="${game.s}"]`);
  if (strip) strip.classList.add('done');
  stepOk();
  if (game.s < glyph.strokes.length - 1) {
    game.s++;
    traceDraw(game);
    speak(`Bravo ! Maintenant, le trait numéro ${game.s + 1}.`);
    return;
  }
  const minis = document.querySelectorAll('.tr-strip .tr-mini');
  if (minis[game.g]) {
    minis[game.g].classList.remove('current');
    minis[game.g].classList.add('done');
  }
  document.querySelectorAll('.game-progress i').forEach((el, i) => el.classList.toggle('on', i <= game.g));
  if (game.g === game.glyphs.length - 1) {
    game.done = true;
    traceDraw(game); // le glyphe entier à la couleur du crayon
    flashModal('ok');
    winSoon();
    return;
  }
  // le glyphe suivant s'affiche tout de suite, avec sa consigne
  game.g++;
  game.s = 0;
  const next = TRACE_GLYPHS[game.glyphs[game.g]];
  const say = traceSay(next, game.rules.arrows);
  if (minis[game.g]) minis[game.g].classList.add('current');
  const txt = document.querySelector('.puzzle-hint .hint-txt');
  if (txt) txt.innerHTML = traceHeadHTML(next);
  const again = /** @type {HTMLElement | null} */ (document.querySelector('.puzzle-hint .btn-speak'));
  if (again) again.dataset.say = say;
  traceDraw(game);
  game.q = { g: game.g, arrows: game.rules.arrows };
  setHintQuestion('trace', game.q); // nouvelle question : les indices repartent de zéro
  speak(`Bravo, c'est très bien tracé ! ${say}`);
}

function renderTrace() {
  traceStopDemo(); // une démonstration de la mission d'avant
  setupLives('trace');
  const build = traceBuildRound(gameDiff());
  /** @type {TraceGame} */
  const game = {
    rules: build.rules,
    glyphs: build.glyphs,
    g: 0,
    s: 0,
    misses: 0,
    demo: null,
    done: false,
    q: { g: 0, arrows: build.rules.arrows },
  };
  traceGame = game;
  const glyphs = game.glyphs.map((id) => TRACE_GLYPHS[id]);
  openModal(`
    ${gameHeader('✍️ Trace avec ton doigt', traceHeadHTML(glyphs[0]), traceSay(glyphs[0], game.rules.arrows))}
    ${livesBar()}
    ${progressDots(0, glyphs.length)}
    <div class="tr-strip">${glyphs.map((glyph, g) => traceMiniHTML(glyph, g)).join('')}</div>
    <div class="tr-board" id="tr-board"></div>
  `);
  bindQuit();
  setSolution(glyphs.flatMap((glyph, g) => glyph.strokes.map((_stroke, s) => `.tr-ms[data-g="${g}"][data-s="${s}"]`)));
  traceDraw(game);
  setHintQuestion('trace', game.q);
  if (game.rules.demo) traceDemo(); // palier 1 : le crayon montre le premier trait
}

// Indices (v52) : 1. la méthode (le point vert brille) ; 2. le crayon montre
// le trait courant. Rien à écarter : il n'y a pas de choix.
/** @param {TraceQuestion} q */
function traceHints(q) {
  return [
    {
      say: `Pose ton doigt sur le point vert, puis suis ${q.arrows ? 'les flèches' : 'le chemin gris'} sans lever le doigt.`,
      fx: { glow: '#tr-pad .tr-start' },
    },
    { say: 'Regarde bien le crayon : il te montre le chemin. À toi !', fx: { run: () => traceDemo() } },
  ];
}

registerGame('trace', renderTrace);
registerHints('trace', traceHints);
