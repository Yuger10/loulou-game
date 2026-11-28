/* ---------- Mini-jeu : Quelle heure est-il ? (grandeurs & mesures, CP-CE1) ----------
   Lire l'heure sur une horloge à aiguilles. Granularité centralisée
   dans js/entities/difficulty/difficulty.js (clockGranularity) : heures pleines d'abord,
   puis demi-heures, puis quarts d'heure. Horloge dessinée en CSS pur
   (pas d'image), les aiguilles sont deux barres tournées en degrés. */
import { clockGranularity, clockOptions } from '../../../entities/difficulty/index.js';
import { pickRandom, random, shuffle } from '../../../shared/lib/index.js';
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

/**
 * @param {number} hour
 * @param {number} minute
 */
function clockAngles(hour, minute) {
  // aiguille des heures : 30° par heure + un peu selon les minutes
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minuteAngle = minute * 6;
  return { hourAngle, minuteAngle };
}

/**
 * @param {number} hour
 * @param {number} minute
 */
function clockFaceHtml(hour, minute) {
  const { hourAngle, minuteAngle } = clockAngles(hour, minute);
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = i * 30;
    return `<i class="clock-tick" style="transform:rotate(${a}deg)"></i>`;
  }).join('');
  return `
    <div class="clock-face">
      ${ticks}
      <b class="clock-hand clock-hand-h" style="transform:rotate(${hourAngle}deg)"></b>
      <b class="clock-hand clock-hand-m" style="transform:rotate(${minuteAngle}deg)"></b>
      <span class="clock-center"></span>
    </div>`;
}

/**
 * @param {number} hour
 * @param {number} minute
 */
function timeLabel(hour, minute) {
  const h = hour === 0 ? 12 : hour;
  if (minute === 0) return `${h} h`;
  if (minute === 30) return `${h} h 30`;
  if (minute === 15) return `${h} h 15`;
  return `${h} h 45`;
}

/** @typedef {{ hour: number, minute: number, answer: string, options: string[] }} ClockQuestion */

// la question précédente : une relance en tire toujours une AUTRE (anti-devinette)
let clockLast = '';
/**
 * Une heure à lire, jamais la même que la précédente (clé : heure et minutes).
 * @param {number} dd le palier de difficulté
 */
function clockQuestion(dd) {
  const minutes = clockGranularity(dd);
  const { hour, minute } = drawOther(
    () => ({ hour: 1 + Math.floor(random() * 12), minute: pickRandom(minutes) }),
    (x) => `${x.hour}-${x.minute}`,
    { last: clockLast, fallback: (x) => ({ hour: (x.hour % 12) + 1, minute: x.minute }) },
  );
  clockLast = `${hour}-${minute}`;
  return { hour, minute, answer: timeLabel(hour, minute) };
}

function renderClock() {
  setupLives('clock');
  const dd = gameDiff();
  const minutes = clockGranularity(dd);
  const { hour, minute, answer } = clockQuestion(dd);

  const nOptions = clockOptions(dd);
  const options = new Set([answer]);
  while (options.size < nOptions) {
    const h2 = 1 + Math.floor(random() * 12);
    const m2 = pickRandom(minutes);
    options.add(timeLabel(h2, m2));
  }

  openModal(`
    ${gameHeader('🕐 Quelle heure est-il ?', 'Regarde bien les aiguilles, puis touche la bonne heure')}
    ${livesBar()}
    ${clockFaceHtml(hour, minute)}
    <div class="clock-options">
      ${shuffle([...options])
        .map((o) => `<button type="button" class="clock-opt-btn" data-v="${o}">${o}</button>`)
        .join('')}
    </div>
  `);
  bindQuit();
  startTimerIfNeeded('clock');
  setSolution([solSel('.clock-opt-btn', 'v', answer)]);
  setHintQuestion('clock', { hour, minute, answer, options: [...options] }, { choices: '.clock-opt-btn' });
  document.querySelectorAll('.clock-opt-btn').forEach((btn) => {
    setHandler(btn, 'click', () => {
      if (btn.dataset.v === answer) {
        clearActiveTimer();
        stepOk(btn);
        flashModal('ok');
        winSoon();
      } else loseLife(btn, { onRetry: renderClock, wrong: btn.dataset.v });
    });
  });
}

// Indices (v52) : 1. la petite aiguille montre l'heure, la grande les
// minutes ; 2. les nombres apparaissent autour de l'horloge, la petite
// aiguille brille ; « en bas sur le 6, c'est la demie »… Avec 4 choix, une
// heure aux minutes impossibles est écartée.
/** @type {Record<number, string>} */
const CLOCK_MINUTE_TIPS = {
  0: "La grande aiguille est tout en haut, sur le 12 : c'est l'heure pile.",
  30: "La grande aiguille est tout en bas, sur le 6 : c'est la demie, 30 minutes.",
  15: "La grande aiguille est sur le 3 : c'est le quart, 15 minutes.",
  45: "La grande aiguille est sur le 9 : c'est 45 minutes.",
};
function clockNumbersSVG() {
  return `<svg class="clock-nums" viewBox="0 0 100 100" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => {
    const n = i + 1,
      a = ((n * 30 - 90) * Math.PI) / 180;
    return `<text x="${(50 + 37 * Math.cos(a)).toFixed(1)}" y="${(50 + 37 * Math.sin(a) + 4).toFixed(1)}" text-anchor="middle">${n}</text>`;
  }).join('')}</svg>`;
}
// les nombres autour du cadran, une seule fois (indice 2 et explication d'une erreur)
/** @param {HTMLElement} root */
function clockShowNumbers(root) {
  const face = root.querySelector('.clock-face');
  if (face && !face.querySelector('.clock-nums')) face.insertAdjacentHTML('beforeend', clockNumbersSVG());
}
/** @param {ClockQuestion} q */
function clockHints(q) {
  const mins = (/** @type {string} */ label) => (label.match(/h (\d+)/) || [0, '0'])[1];
  const wrong =
    q.options.find((o) => o !== q.answer && mins(o) !== mins(q.answer)) || q.options.find((o) => o !== q.answer);
  return [
    { say: "La petite aiguille montre l'heure. La grande aiguille montre les minutes.", fx: { glow: '.clock-hand-h' } },
    {
      say: `J'écris les nombres autour de l'horloge. Sur quel nombre est la petite aiguille ? ${CLOCK_MINUTE_TIPS[q.minute] || ''}`,
      fx: {
        glow: '.clock-hand-h',
        dim: wrong ? solSel('.clock-opt-btn', 'v', wrong) : undefined,
        run: clockShowNumbers,
      },
    },
  ];
}

// Explication d'une erreur (track erreurs-expliquees) : l'heure touchée dit
// quelle aiguille a été mal lue. La petite d'abord (l'heure), sinon la grande
// (les minutes) ; l'aiguille brille et les nombres s'écrivent autour du cadran.
/** @type {Record<number, { on: number, say: string }>} */
const CLOCK_MINUTE_WHY = {
  0: { on: 12, say: "c'est l'heure pile" },
  15: { on: 3, say: "c'est le quart" },
  30: { on: 6, say: "c'est la demie" },
  45: { on: 9, say: "c'est 45 minutes" },
};
/**
 * @param {ClockQuestion} q
 * @param {string | undefined} v l'étiquette touchée, ex. « 3 h 30 »
 * @returns {import('../../hints/index.js').Explain | null}
 */
function clockExplain(q, v) {
  const m = /^(\d+) h(?: (\d+))?$/.exec(v || '');
  const big = CLOCK_MINUTE_WHY[q.minute];
  if (!m || !big) return null;
  const hv = Number(m[1]),
    mv = Number(m[2] || 0);
  const answerSel = solSel('.clock-opt-btn', 'v', q.answer);
  const told = `${q.hour} heure${q.hour > 1 ? 's' : ''}${q.minute ? ' ' + q.minute : ''}`;
  let say, hand;
  if (hv !== q.hour) {
    hand = 'h';
    // l'heure touchée est le nombre que montre la grande aiguille : les deux aiguilles confondues
    say =
      hv === big.on
        ? `La grande aiguille montre les minutes. Il est ${told}.`
        : `La petite aiguille est sur le ${q.hour} : il est ${told}.`;
  } else if (mv !== q.minute) {
    hand = 'm';
    say = `La grande aiguille est sur le ${big.on} : ${big.say}.`;
  } else return null;
  return { say, fx: { glow: `.clock-hand-${hand}, ${answerSel}`, run: clockShowNumbers } };
}

// inscription auprès du moteur de mini-jeux (js/features/minigame-engine)
registerGame('clock', renderClock);
registerHints('clock', clockHints);
registerExplain('clock', { wrong: clockExplain, right: () => 'Tu as lu la petite aiguille, puis la grande.' });
