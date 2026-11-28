/* ---------- Mini-jeu : Mesure les crayons (Île des Crayons, saison 3) ----------
   Grandeurs et mesures : toucher le plus long (ou le plus court) de 2 crayons
   alignés, puis de 3 crayons décalés ; mesurer un crayon en gommes ; puis en
   centimètres sur la règle, posé au zéro, puis ailleurs. Les tirages :
   length-build.js ; le dessin : length-draw.js ; les paliers : `lengthRound`
   (js/entities/difficulty/difficulty-s3.js).
   Une mission = une question. Anti-devinette : chaque mauvaise réponse donne
   une phrase d'aide, puis une AUTRE question (relance du moteur). */
import { gameDiff } from '../../adaptive/index.js';
import { registerHints, setHintQuestion } from '../../hints/index.js';
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
import { openModal, setHandler, speak } from '../../../shared/ui/index.js';
import { lengthBuildRound, lengthWrongChoice } from './length-build.js';
import { lengthGuidesSVG, lengthStageHTML, lengthUnitNumSVG } from './length-draw.js';

/** @typedef {import('./length-build.js').LengthBuild} LengthBuild */
/**
 * La question des indices : `dim` = le mauvais nombre que l'indice 2 de la
 * règle écarte (tiré une fois par question), `won` = déjà réussie.
 * @typedef {{ b: LengthBuild, dim: number | null, won: boolean }} LengthQuestion
 */

// Les phrases de chaque question : à l'écran, à voix haute, et après une erreur
const LENGTH_TEXT = {
  long: {
    short: 'Le plus long !',
    say: 'Touche le crayon le plus long !',
    err: "Ce n'est pas le plus long. Regarde où chaque crayon commence et où il finit.",
  },
  short: {
    short: 'Le plus court !',
    say: 'Touche le crayon le plus court !',
    err: "Ce n'est pas le plus court. Regarde où chaque crayon commence et où il finit.",
  },
  units: {
    short: 'Combien de gommes ?',
    say: 'Combien de gommes mesure ce crayon ?',
    err: "Compte les gommes, de la première jusqu'au bout du crayon.",
  },
  ruler: {
    short: 'Combien de centimètres ?',
    say: 'Combien de centimètres mesure ce crayon ?',
    err: 'Lis le nombre juste sous la pointe du crayon.',
  },
};
/** @param {LengthBuild} b les phrases de sa question */
function lengthText(b) {
  return LENGTH_TEXT[b.mode === 'compare' ? b.ask || 'long' : b.mode];
}

/**
 * La phrase d'une mauvaise réponse. Sur la règle décalée, le nombre lu sous la
 * pointe a sa propre phrase : c'est l'erreur attendue.
 * @param {LengthBuild} b
 * @param {number} value la réponse touchée
 */
function lengthErrorSay(b, value) {
  if (b.trap === null) return lengthText(b).err;
  return value === b.trap
    ? 'Attention : le crayon ne commence pas au zéro !'
    : "Compte les centimètres, du début du crayon jusqu'à sa pointe.";
}

/**
 * Une réponse touchée : la bonne gagne la mission ; sinon la phrase d'aide,
 * dite après `loseLife` (et seulement si la mission n'est pas perdue), puis
 * une autre question.
 * @param {LengthQuestion} q
 * @param {HTMLButtonElement} btn
 * @param {number} value le rang du crayon, ou le nombre choisi
 */
function lengthPick(q, btn, value) {
  if (q.won) return;
  if (value === q.b.answer) {
    q.won = true;
    stepOk(btn);
    flashModal('ok');
    winSoon();
    return;
  }
  if (!loseLife(btn, { disable: false, onRetry: renderLength })) speak(lengthErrorSay(q.b, value));
}

// la question précédente : une relance en tire toujours une AUTRE (anti-devinette)
let lengthLast = '';
/** @param {number} dd le palier de difficulté */
function lengthNewRound(dd) {
  const key = (/** @type {LengthBuild} */ b) => JSON.stringify([b.ask, b.crayons]);
  let b = lengthBuildRound(dd);
  for (let k = 0; k < 8 && key(b) === lengthLast; k++) b = lengthBuildRound(dd);
  lengthLast = key(b);
  return b;
}

function renderLength() {
  setupLives('length');
  const b = lengthNewRound(gameDiff());
  /** @type {LengthQuestion} */
  const q = { b, dim: b.mode === 'ruler' ? lengthWrongChoice(b) : null, won: false };
  const text = lengthText(b);
  const choices = b.mode === 'compare' ? 'button.ln-crayon' : '.ln-opt';
  openModal(`
    ${gameHeader('📏 Mesure les crayons', text.short, text.say)}
    ${livesBar()}
    ${lengthStageHTML(b)}
  `);
  bindQuit();
  setSolution([b.mode === 'compare' ? solSel('.ln-crayon', 'i', b.answer) : solSel('.ln-opt', 'v', b.answer)]);
  setHintQuestion('length', q, { choices });
  /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll(choices)).forEach((btn) => {
    setHandler(btn, 'click', () => lengthPick(q, btn, Number(b.mode === 'compare' ? btn.dataset.i : btn.dataset.v)));
  });
}

/* Indices (v52) : 1. la méthode ; 2. le début du raisonnement, jamais la réponse. */
/**
 * Comparer : où regarder, puis les traits en pointillés au début et à la fin de chaque crayon.
 * @param {LengthBuild} b
 */
function lengthHintsCompare(b) {
  const aligned = `Les crayons partent tous du même bord : regarde lequel ${b.ask === 'short' ? "s'arrête le plus tôt" : 'va le plus loin'}.`;
  return [
    {
      say: b.rules.aligned
        ? aligned
        : 'Attention, les crayons ne partent pas du même endroit : regarde où chacun commence et où il finit.',
      fx: { glow: 'button.ln-crayon' },
    },
    {
      say: 'Regarde les traits en pointillés : ils montrent le début et la fin de chaque crayon.',
      fx: {
        run: (/** @type {HTMLElement} */ root) => {
          const stage = root.querySelector('#ln-stage');
          if (stage && !stage.querySelector('.ln-guides')) stage.insertAdjacentHTML('beforeend', lengthGuidesSVG(b));
        },
      },
    },
  ];
}
/**
 * Mesurer : compter les gommes (la première porte le « 1 »), ou lire la règle
 * entre les deux graduations qui brillent (un seul mauvais nombre écarté).
 * @param {LengthQuestion} q
 */
function lengthHintsMeasure(q) {
  const b = q.b;
  if (b.mode === 'units') {
    return [
      { say: 'Compte les gommes sous le crayon, une par une.', fx: { glow: '.ln-units' } },
      {
        say: "Compte avec moi : un… et continue jusqu'au bout du crayon !",
        fx: {
          marks: [{ sel: '.ln-unit[data-u="0"]', text: '1' }],
          // l'étiquette du moteur ne se voit pas dans un dessin SVG : le « 1 » s'y écrit aussi
          run: (/** @type {HTMLElement} */ root) => {
            const row = root.querySelector('.ln-units');
            if (row && !row.querySelector('.ln-unit-num'))
              row.insertAdjacentHTML('beforeend', lengthUnitNumSVG(b.rules.unit || 12));
          },
        },
      },
    ];
  }
  return [
    {
      say: b.rules.offset
        ? 'Le crayon ne commence pas au zéro : compte les centimètres de son début à sa pointe.'
        : 'Le crayon commence au zéro : lis le nombre sous sa pointe.',
      fx: { glow: '.ln-crayon.solo' },
    },
    {
      say: 'Regarde les deux traits qui brillent : le début et la pointe du crayon. Combien de centimètres entre les deux ?',
      fx: {
        glow: `.ln-tick[data-cm="${b.start}"], .ln-tick[data-cm="${b.start + b.answer}"]`,
        ...(q.dim === null ? {} : { dim: `.ln-opt[data-v="${q.dim}"]` }),
      },
    },
  ];
}
/** @param {LengthQuestion} q */
function lengthHints(q) {
  return q.b.mode === 'compare' ? lengthHintsCompare(q.b) : lengthHintsMeasure(q);
}

registerGame('length', renderLength);
registerHints('length', lengthHints);
