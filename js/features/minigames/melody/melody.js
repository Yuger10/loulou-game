/* ---------- Mini-jeu : La mélodie (Île du Grand Concert, saison 3) ----------
   Rejouer une petite mélodie sur le xylophone de Xylo. Selon le palier
   (`melodyRound`, js/entities/difficulty/difficulty-s3-concert.js) :
     paliers 1 à 3   on écoute et on regarde (les lames s'allument, des points
                     montent et descendent comme la mélodie), puis on rejoue ;
                     au palier 3, les points se cachent après l'écoute
     paliers 4 et 5  on lit la mélodie sur la portée AVANT de l'entendre ;
                     elle n'est jouée qu'après la réussite
   Ce n'est pas « Les couleurs » (Simon) : un vrai instrument rangé du grave à
   l'aigu, de vraies mélodies, une partition. Ni « Grave ou aigu ? » : on
   reproduit des notes nommées, on ne les compare pas.
   Pendant une écoute, les touches sont ignorées (ni son, ni erreur) : on ne
   mélange pas la note de l'enfant et celle du modèle.
   Anti-devinette : une erreur relance une AUTRE mélodie. */
import { melodyRound } from '../../../entities/difficulty/index.js';
import { pickRandom } from '../../../shared/lib/index.js';
import { openModal, setHandler } from '../../../shared/ui/index.js';
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
  solSel,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';
import { playXylo, staffSVG, XYLO_NOTES, xyloHTML } from '../../xylophone/index.js';
import { MELODIES } from './melody-tunes.js';

/** @typedef {import('../../../entities/difficulty/index.js').MelodyRound} MelodyRound */
/** @typedef {{ read: boolean, replay: () => void }} MelodyQuestion */
/**
 * Une partie : la mélodie, où en est l'enfant, à qui le tour. `run` compte
 * les écoutes : une écoute plus récente arrête la précédente.
 * @typedef {{ cfg: MelodyRound, seq: number[], pos: number, turn: 'listen' | 'you', run: number, alive: () => boolean }} MelodyPlay
 */

const MELODY_START = 500; // un temps avant la première note d'une écoute
const MELODY_STEP = 650; // une note toutes les 650 ms
const MELODY_SLOW = 1.6; // l'indice 2 rejoue 1,6 fois plus lentement
// En lecture (paliers 4 et 5), la mélodie est jouée après la réussite : l'écran
// de victoire, qui remplace le jeu et couperait la musique, attend sa fin
// (comme « Le rythme magique »).
const MELODY_READ_STEP = 300;
const MELODY_NOTE_MS = 500; // durée d'une note du xylophone
const MELODY_END_MARGIN = 200;
/** @param {number} n le nombre de notes @returns {number} le moment où finit la mélodie jouée (ms) */
const melodyReadEnd = (n) => MELODY_READ_STEP * (n - 1) + MELODY_NOTE_MS + MELODY_END_MARGIN;

const MELODY_COVERED = 'background:#C9CEDB;bottom:45%'; // un point caché : gris, à mi-hauteur
const MELODY_READ_LABEL = '📖 Lis la mélodie, puis joue-la !';

// La dernière mélodie tirée : elle survit d'une ouverture du jeu à l'autre.
let melodyLast = '',
  melodyToken = 0;

/** @param {number} dd le palier de difficulté @returns {number[]} une mélodie du palier, jamais la précédente */
function melodyDraw(dd) {
  const list = MELODIES[Math.max(1, Math.min(5, Number(dd) || 1))];
  const seq = pickRandom(list.filter((m) => m.join() !== melodyLast));
  melodyLast = seq.join();
  return seq;
}

const melodyLame = (/** @type {number} */ n) => document.querySelector(`.xylo-lame[data-n="${n}"]`);
const melodyMarks = () => [...document.querySelectorAll('#melody-score .ml-note')];

/** @param {MelodyPlay} g @returns {string} */
function melodyMarkup(g) {
  const { cfg, seq } = g;
  const [title, say] = cfg.read
    ? [
        'Lis la mélodie, puis joue-la !',
        'Lis les notes sur la portée, puis joue-les sur le xylophone. Xylo te la fera écouter après !',
      ]
    : ['Rejoue la mélodie de Xylo', 'Écoute et regarde la mélodie de Xylo, puis rejoue-la sur le xylophone.'];
  // des points qui montent et descendent comme la mélodie, ou la portée
  const score =
    cfg.show === 'staff'
      ? staffSVG(seq, { lines: 5, colors: cfg.colors, id: 'melody-staff', cls: 'ml-staff' })
      : seq
          .map(
            (n) =>
              `<span class="ml-note" data-n="${n}" style="background:${XYLO_NOTES[n].color};bottom:${10 + n * 10}%"></span>`,
          )
          .join('');
  return `
    ${gameHeader('🎶 La mélodie', title, say)}
    ${livesBar()}
    <p class="puzzle-hint" id="melody-state" data-turn="listen">👂 Écoute…</p>
    <div class="ml-score ml-score-${cfg.show}" id="melody-score">${score}</div>
    ${cfg.read ? '' : '<button class="btn-small ml-listen" id="melody-listen">🔈 Écouter</button>'}
    <div id="melody-progress">${progressDots(0, seq.length)}</div>
    ${xyloHTML({ lames: cfg.lames })}
  `;
}

function renderMelody() {
  setupLives('melody');
  const dd = gameDiff();
  const token = ++melodyToken;
  /** @type {MelodyPlay} */
  const g = {
    cfg: melodyRound(dd),
    seq: melodyDraw(dd),
    pos: 0,
    turn: 'listen',
    run: 0,
    alive: () => token === melodyToken && !!document.getElementById('melody-score'),
  };
  openModal(melodyMarkup(g));
  // sur la portée, les têtes de note sont aussi les notes de la partition
  document.querySelectorAll('#melody-staff .note-head').forEach((h) => h.classList.add('ml-note'));
  bindQuit();
  setSolution(g.seq.map((n) => solSel('.xylo-lame', 'n', n)));
  /** @type {MelodyQuestion} */
  const q = { read: g.cfg.read, replay: () => melodyListen(g, true, true) };
  setHintQuestion('melody', q);
  if (g.cfg.read) melodyYourTurn(g);
  else melodyListen(g, false, false);
  setHandler(document.getElementById('melody-listen'), 'click', () => melodyListen(g, false, true));
  document.querySelectorAll('.xylo-lame').forEach((el) => setHandler(el, 'click', () => melodyPress(g, el)));
}

/**
 * @param {MelodyPlay} g
 * @param {MelodyPlay['turn']} turn
 * @param {string} [label] le libellé de l'état ; absent : il ne change pas
 */
function melodySetTurn(g, turn, label) {
  g.turn = turn;
  const s = document.getElementById('melody-state');
  if (!s) return;
  s.dataset.turn = turn;
  if (label) s.textContent = label;
}

/**
 * La main à l'enfant : au palier 3, les points se cachent.
 * @param {MelodyPlay} g
 */
function melodyYourTurn(g) {
  if (g.cfg.hide)
    melodyMarks().forEach((el) => {
      el.classList.add('covered');
      el.setAttribute('style', MELODY_COVERED);
    });
  const label = g.cfg.read ? MELODY_READ_LABEL : g.cfg.hide ? "👆 À toi ! Tu t'en souviens ?" : '👆 À toi !';
  melodySetTurn(g, 'you', label);
}

/**
 * Une note de la mélodie jouée par le jeu : sa lame s'allume, son point aussi.
 * @param {MelodyPlay} g
 * @param {number} i son rang
 */
function melodySound(g, i) {
  playXylo(g.seq[i], melodyLame(g.seq[i]));
  const mark = melodyMarks()[i];
  if (!mark) return;
  mark.classList.add('lit');
  setTimeout(() => mark.classList.remove('lit'), 400);
}

/**
 * Une écoute, depuis le début : la progression revient à 0, les touches sont
 * ignorées jusqu'à la fin. Les points déjà cachés le restent.
 * @param {MelodyPlay} g
 * @param {boolean} slow plus lentement (indice 2)
 * @param {boolean} again une réécoute (bouton 🔈, indice)
 */
function melodyListen(g, slow, again) {
  const run = ++g.run;
  const on = () => g.alive() && run === g.run;
  const step = MELODY_STEP * (slow ? MELODY_SLOW : 1);
  g.pos = 0;
  melodyMarks().forEach((el) => el.classList.remove('done'));
  melodyProgress(g);
  melodySetTurn(g, 'listen', again ? '🔁 Écoute encore…' : '👂 Écoute…');
  g.seq.forEach((_, i) =>
    setTimeout(
      () => {
        if (on()) melodySound(g, i);
      },
      MELODY_START + i * step,
    ),
  );
  setTimeout(
    () => {
      if (on()) melodyYourTurn(g);
    },
    MELODY_START + g.seq.length * step,
  );
}

/** @param {MelodyPlay} g */
function melodyProgress(g) {
  const p = document.getElementById('melody-progress');
  if (p) p.innerHTML = progressDots(g.pos, g.seq.length);
}

/**
 * Une lame touchée par l'enfant.
 * @param {MelodyPlay} g
 * @param {HTMLElement} el
 */
function melodyPress(g, el) {
  if (g.turn !== 'you') return;
  const n = Number(el.dataset.n);
  playXylo(n, el); // la lame chante toujours, même la mauvaise
  if (n !== g.seq[g.pos]) {
    loseLife(el, { onRetry: renderMelody, disable: false });
    return;
  }
  const mark = melodyMarks()[g.pos];
  if (mark) mark.classList.add('done');
  g.pos++;
  melodyProgress(g);
  if (g.pos < g.seq.length) return;
  g.run++; // plus aucune écoute en attente ne reprend la main
  melodySetTurn(g, 'listen');
  flashModal('ok');
  if (!g.cfg.read) {
    winSoon();
    return;
  }
  // lue sans l'avoir entendue : la voici, puis la victoire
  g.seq.forEach((_, i) =>
    setTimeout(() => {
      if (g.alive()) melodySound(g, i);
    }, i * MELODY_READ_STEP),
  );
  winSoon(melodyReadEnd(g.seq.length));
}

// Indices (v52) : 1. la méthode (le sens de la mélodie, lire de gauche à
// droite) ; 2. réécouter plus lentement, depuis le début. Rien n'est écarté.
/** @param {MelodyQuestion} q */
function melodyHints(q) {
  const replay = {
    run() {
      q.replay();
    },
  };
  if (q.read)
    return [
      {
        say: 'Lis les notes de gauche à droite. Plus une note est haute sur la portée, plus sa lame est petite.',
        fx: { glow: '#melody-staff' },
      },
      {
        say: 'Écoute la mélodie plus lentement, en suivant les notes du doigt. Puis joue-la depuis le début.',
        fx: replay,
      },
    ];
  return [
    {
      say: 'Écoute si la mélodie monte ou descend. Quand elle monte, on va vers les petites lames.',
      fx: { glow: '.xylo' },
    },
    { say: 'Écoute et regarde encore, plus lentement. Puis rejoue depuis le début.', fx: replay },
  ];
}

registerGame('melody', renderMelody);
registerHints('melody', melodyHints);
