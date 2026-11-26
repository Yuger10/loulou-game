/* ---------- Mini-jeu : Le rythme magique (Île de la Musique, saison 2) ----------
   Boumbo frappe un rythme (coups courts, coups longs, silences) ; l'enfant le
   rejoue avec les boutons du tambour. Le rythme est aussi écrit en images
   (● un coup court, ▬ un coup long, 🤫 un silence) : on peut jouer sans le son.
   Selon le palier (`rhythmRound`, js/entities/difficulty/difficulty.js) :
   le rythme reste écrit (paliers 1-2), se cache après l'écoute (paliers 3-4,
   il faut le retenir), ou se lit AVANT de l'entendre (palier 5).
   On peut toucher les boutons pendant l'écoute : rien n'est bloqué.
   Anti-devinette : une erreur relance un AUTRE rythme. */
import { rhythmRound } from '../../../entities/difficulty/index.js';
import { random, shuffle } from '../../../shared/lib/index.js';
import { openModal, playNote, setHandler, speak } from '../../../shared/ui/index.js';
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
import {
  clearActiveTimer,
  flashModal,
  livesBar,
  loseLife,
  progressDots,
  registerGame,
  setSolution,
  setupLives,
  solSel,
  startTimerIfNeeded,
  winSoon,
} from '../../minigame-engine/index.js';
import { bindQuit, gameHeader } from '../../screen/index.js';

// en lecture, l'écran de victoire attend la fin du rythme joué par Boumbo
// (il remplace le jeu et couperait la musique), plus ce petit temps
const READ_END_PAUSE = 400;

/** @typedef {'court' | 'long' | 'silence'} RhythmBeat un coup du rythme */
/** @typedef {{ n: number, rests: number, read: boolean, replay: () => void }} RhythmQuestion */

const RHYTHM_BEATS = {
  court: { sym: '●', label: 'Boum', aria: 'un coup court', freq: 262, dur: 0.25, units: 1 },
  long: { sym: '▬', label: 'Bouuum', aria: 'un coup long', freq: 196, dur: 0.9, units: 2 },
  silence: { sym: '🤫', label: 'Chut', aria: 'un silence', freq: 0, dur: 0, units: 1 },
};
const RHYTHM_UNIT = 420; // ms par temps

/**
 * @param {number} dd le palier de difficulté
 * @returns {{ cfg: ReturnType<typeof rhythmRound>, seq: RhythmBeat[] }}
 */
function rhythmBuildRound(dd, rng = random) {
  const cfg = rhythmRound(dd);
  for (let t = 0; t < 300; t++) {
    // palier 1 : des coups tous pareils (tous courts, ou tous longs)
    const same = !cfg.long ? (rng() < 0.5 ? 'court' : 'long') : null;
    /** @type {RhythmBeat[]} */
    const seq = Array.from({ length: cfg.n }, () => same || (rng() < 0.45 ? 'long' : 'court'));
    // les silences : jamais au début ni à la fin, jamais deux de suite
    let rests = 0;
    for (const p of shuffle(Array.from({ length: Math.max(0, cfg.n - 2) }, (_, i) => i + 1))) {
      if (rests >= cfg.rests) break;
      if (seq[p - 1] === 'silence' || seq[p + 1] === 'silence') continue;
      seq[p] = 'silence';
      rests++;
    }
    if (rests < cfg.rests) continue;
    const sounds = seq.filter((k) => k !== 'silence');
    if (cfg.long && !(sounds.includes('court') && sounds.includes('long'))) continue;
    return { cfg, seq };
  }
  return { cfg, seq: Array(cfg.n).fill('court') };
}

let rhythmToken = 0,
  rhythmLast = '';
/**
 * Une partie de rythme en cours : la position de l'enfant change à chaque coup.
 * @typedef {{ cfg: ReturnType<typeof rhythmRound>, seq: RhythmBeat[], alive: () => boolean, pos: number }} RhythmPlay
 */
function renderRhythm() {
  setupLives('rhythm');
  const dd = gameDiff();
  let r = rhythmBuildRound(dd);
  for (let k = 0; k < 8 && r.seq.join() === rhythmLast; k++) r = rhythmBuildRound(dd);
  rhythmLast = r.seq.join();
  const { cfg, seq } = r;
  const token = ++rhythmToken;
  /** @type {RhythmPlay} */
  const g = { cfg, seq, alive: () => token === rhythmToken && !!document.getElementById('rh-score'), pos: 0 };
  /** @type {RhythmBeat[]} */
  const kinds = cfg.rests ? ['court', 'long', 'silence'] : ['court', 'long'];
  openModal(rhythmMarkup(cfg, seq, kinds));
  bindQuit();
  startTimerIfNeeded('rhythm');
  setSolution(seq.map((k) => solSel('.rh-btn', 'k', k)));

  if (cfg.read) rhythmSetState('📖 Lis le rythme, puis joue-le !');
  else rhythmPlay(g, false, () => rhythmYourTurn(cfg));

  // indices (v52) : réécouter et revoir le rythme, plus lentement, depuis le début
  /** @type {RhythmQuestion} */
  const q = {
    n: seq.length,
    rests: cfg.rests,
    read: !!cfg.read,
    replay() {
      rhythmResetAnswer(g);
      rhythmSetState('👂 Écoute encore…');
      rhythmPlay(g, true, () => rhythmYourTurn(cfg));
    },
  };
  setHintQuestion('rhythm', q, { choices: '.rh-btn' });

  document.querySelectorAll('.rh-btn').forEach((btn) => {
    setHandler(btn, 'click', () => rhythmPress(g, btn));
  });
}

/**
 * @param {ReturnType<typeof rhythmRound>} cfg
 * @param {RhythmBeat[]} seq
 * @param {RhythmBeat[]} kinds les boutons du tambour
 */
function rhythmMarkup(cfg, seq, kinds) {
  const intro = cfg.read
    ? 'Lis le rythme écrit, puis joue-le avec le tambour. Boumbo te le fera écouter après !'
    : 'Écoute et regarde le rythme de Boumbo, puis rejoue-le avec le tambour.';
  return `
    ${gameHeader('🥁 Le rythme magique', cfg.read ? 'Lis le rythme, puis joue-le !' : 'Rejoue le rythme de Boumbo', intro)}
    ${livesBar()}
    <div class="rh-score" id="rh-score" aria-label="Le rythme">
      ${seq.map((k, i) => `<span class="rh-beat rh-${k}" data-i="${i}" data-k="${k}" title="${RHYTHM_BEATS[k].aria}">${RHYTHM_BEATS[k].sym}</span>`).join('')}
    </div>
    <p class="rh-state" id="rh-state">${cfg.read ? '📖 Lis le rythme…' : '👂 Écoute…'}</p>
    <div class="rh-answer" id="rh-answer" aria-live="polite"></div>
    <div id="rh-progress">${progressDots(0, seq.length)}</div>
    <div class="rh-pads">
      ${kinds.map((k) => `<button class="rh-btn rh-${k}" data-voix="choix" data-say="${RHYTHM_BEATS[k].label}" data-k="${k}" aria-label="${RHYTHM_BEATS[k].aria}"><b>${RHYTHM_BEATS[k].sym}</b><span>${RHYTHM_BEATS[k].label}</span></button>`).join('')}
    </div>
  `;
}

const rhythmBeatSound = (/** @type {RhythmBeat} */ k) => {
  const b = RHYTHM_BEATS[k];
  if (b.freq) playNote(b.freq, b.dur, 0.2);
};
const rhythmSetState = (/** @type {string} */ t) => {
  const s = document.getElementById('rh-state');
  if (s) s.textContent = t;
  speak(t); // un signal de tour : dit à chaque changement
};
// le rythme joué : chaque symbole s'allume avec son son ; `slow` : plus lentement (indice)
/**
 * @param {RhythmPlay} g
 * @param {boolean} slow
 * @param {(() => void) | null} then
 * @returns {number} le moment où finit la dernière note (ms après l'appel)
 */
function rhythmPlay(g, slow, then) {
  const unit = RHYTHM_UNIT * (slow ? 1.6 : 1);
  const score = document.getElementById('rh-score');
  if (score) score.classList.remove('covered');
  let t = 500;
  g.seq.forEach((k, i) => {
    setTimeout(() => {
      if (!g.alive()) return;
      const el = document.querySelector(`.rh-beat[data-i="${i}"]`);
      if (el) {
        el.classList.add('lit');
        setTimeout(() => el.classList.remove('lit'), unit * RHYTHM_BEATS[k].units - 80);
      }
      rhythmBeatSound(k);
    }, t);
    t += unit * RHYTHM_BEATS[k].units;
  });
  setTimeout(() => {
    if (g.alive() && then) then();
  }, t + 250);
  return t;
}
/** @param {ReturnType<typeof rhythmRound>} cfg */
function rhythmYourTurn(cfg) {
  if (cfg.hide) {
    const s = document.getElementById('rh-score');
    if (s) s.classList.add('covered');
  }
  rhythmSetState('👆 À toi !');
}
/** @param {RhythmPlay} g */
function rhythmResetAnswer(g) {
  g.pos = 0;
  const a = document.getElementById('rh-answer');
  if (a) a.innerHTML = '';
  const p = document.getElementById('rh-progress');
  if (p) p.innerHTML = progressDots(0, g.seq.length);
}
/**
 * Un coup de tambour de l'enfant.
 * @param {RhythmPlay} g
 * @param {HTMLElement} btn
 */
function rhythmPress(g, btn) {
  const { cfg, seq } = g;
  const k = /** @type {RhythmBeat} */ (btn.dataset.k); // data-k : un des boutons de `kinds`
  rhythmBeatSound(k);
  btn.classList.add('lit');
  setTimeout(() => btn.classList.remove('lit'), 200);
  if (seq[g.pos] !== k) {
    loseLife(btn, { onRetry: renderRhythm, disable: false });
    return;
  }
  const a = document.getElementById('rh-answer');
  if (a) a.insertAdjacentHTML('beforeend', `<span class="rh-beat rh-${k}">${RHYTHM_BEATS[k].sym}</span>`);
  g.pos++;
  const p = document.getElementById('rh-progress');
  if (p) p.innerHTML = progressDots(g.pos, seq.length);
  if (g.pos === seq.length) {
    clearActiveTimer();
    flashModal('ok');
    const s = document.getElementById('rh-score');
    if (s) s.classList.remove('covered');
    // au palier de lecture : Boumbo joue enfin le rythme que l'enfant a lu
    if (cfg.read) winSoon(rhythmPlay(g, false, null) + READ_END_PAUSE);
    else winSoon();
  }
}

// Indices (v52) : 1. ce que veulent dire ●, ▬ et 🤫 ; 2. le rythme réécouté
// et revu plus lentement, depuis le début.
/** @param {RhythmQuestion} q */
function rhythmHints(q) {
  return [
    {
      say: `Un point, c'est un coup court : « boum ». Un trait, c'est un coup long : « bouuum ».${q.rests ? " Le doigt sur la bouche, c'est un silence : on ne tape pas." : ''} Dis le rythme tout bas avant de jouer.`,
      fx: { glow: '.rh-pads' },
    },
    {
      say: 'Écoute et regarde encore une fois, plus lentement. Puis rejoue depuis le début.',
      fx: {
        run() {
          q.replay();
        },
      },
    },
  ];
}

registerGame('rhythm', renderRhythm);
registerHints('rhythm', rhythmHints);
