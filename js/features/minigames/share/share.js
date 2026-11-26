/* ---------- Mini-jeu : Le gâteau partagé (Royaume des Bonbons, saison 2) ----------
   Partager en parts égales, puis la moitié, le tiers et le quart : d'abord
   avec les yeux, puis avec les mots, puis avec les écritures ½, ⅓, ¼.
   Quatre façons de jouer, selon le palier (`shareRound`, js/entities/difficulty/difficulty.js) :
     fair    « Quel gâteau est coupé en 2 (ou 4) parts égales ? »
     show    « Montre le quart du gâteau » (la part colorée)
     write   « Quelle écriture montre la part colorée ? » (½, ⅓, ¼)
     whole   « Combien de quarts pour faire une moitié ? »
   Le gâteau est rond (parts en secteurs) ou rectangulaire (une tablette,
   parts en bandes). Anti-devinette : une erreur relance un AUTRE gâteau. */
import { shareRound } from '../../../entities/difficulty/index.js';
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

/** @type {Record<number, { word: string, sym: string }>} */
const SHARE_FRACS = {
  2: { word: 'la moitié', sym: '½' },
  3: { word: 'le tiers', sym: '⅓' },
  4: { word: 'le quart', sym: '¼' },
};
// parts inégales (en fractions du gâteau) : bien différentes, puis plus proches
/** @type {Record<'far' | 'near', Record<number, number[][]>>} */
const SHARE_UNEQUAL = {
  far: {
    2: [
      [0.25, 0.75],
      [0.72, 0.28],
      [0.3, 0.7],
    ],
    3: [
      [0.2, 0.3, 0.5],
      [0.5, 0.2, 0.3],
    ],
    4: [
      [0.1, 0.2, 0.3, 0.4],
      [0.4, 0.1, 0.35, 0.15],
      [0.15, 0.35, 0.15, 0.35],
    ],
  },
  near: {
    2: [
      [0.4, 0.6],
      [0.62, 0.38],
      [0.36, 0.64],
    ],
    3: [[0.25, 0.35, 0.4]],
    4: [
      [0.2, 0.3, 0.2, 0.3],
      [0.3, 0.2, 0.25, 0.25],
    ],
  },
};
// « Combien de… pour faire… ? » : la question, la réponse, ce que l'on montre
const SHARE_WHOLE = [
  { key: 'quarts-moitie', say: 'Combien de quarts faut-il pour faire une moitié ?', ans: 2, show: [2, 4] },
  { key: 'quarts-entier', say: 'Combien de quarts faut-il pour faire le gâteau entier ?', ans: 4, show: [4] },
  { key: 'moities-entier', say: 'Combien de moitiés faut-il pour faire le gâteau entier ?', ans: 2, show: [2] },
  { key: 'tiers-entier', say: 'Combien de tiers faut-il pour faire le gâteau entier ?', ans: 3, show: [3] },
];
/** @typedef {{ parts: number[], equal: boolean, n?: number, k: number, shaded: number }} ShareOpt un gâteau proposé */
/**
 * Une question ; les champs absents d'une sorte sont `undefined` (shareKey les lit tous).
 * @typedef {{ cfg: ReturnType<typeof shareRound>, shape: 'rond' | 'carre', n: number }
 *   & ({ ask: 'fair', opts: ShareOpt[], whole?: undefined }
 *     | { ask: 'show', opts: ShareOpt[], whole?: undefined }
 *     | { ask: 'whole', whole: typeof SHARE_WHOLE[number], opts?: undefined }
 *     | { ask: 'write', opts?: undefined, whole?: undefined })} ShareRound
 */
/** @typedef {{ ask: ShareRound['ask'], n: number, whole: string | null, trap: boolean }} ShareQuestion */

const equalParts = (/** @type {number} */ n) => Array.from({ length: n }, () => 1 / n);

/* Un gâteau (SVG 100×100). parts : fractions du gâteau (somme 1) ;
   shaded : la part colorée (-1 : aucune). Chaque part a la classe share-part. */
/**
 * @param {string} shape 'rond' ou 'carre'
 * @param {number[]} parts
 * @param {number} shaded
 */
function shareCakeSVG(shape, parts, shaded) {
  const cream = '#FFF1D6',
    pink = '#FF8FB8',
    edge = '#B5702E';
  let body = '';
  if (shape === 'rond') {
    const cx = 50,
      cy = 54,
      r = 40;
    let a = -90;
    parts.forEach((f, i) => {
      const a2 = a + f * 360;
      const p = (/** @type {number} */ deg) =>
        [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)]
          .map((v) => v.toFixed(1))
          .join(' ');
      body +=
        parts.length === 1
          ? `<circle class="share-part" cx="${cx}" cy="${cy}" r="${r}" fill="${i === shaded ? pink : cream}"/>`
          : `<path class="share-part" d="M${cx} ${cy} L${p(a)} A${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${p(a2)}Z" fill="${i === shaded ? pink : cream}"/>`;
      a = a2;
    });
    body = `<g stroke="${edge}" stroke-width="2.6" stroke-linejoin="round">${body}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${edge}" stroke-width="3.5"/>`;
  } else {
    const x0 = 8,
      y0 = 22,
      w = 84,
      h = 60;
    let x = x0;
    parts.forEach((f, i) => {
      body += `<rect class="share-part" x="${x.toFixed(1)}" y="${y0}" width="${(f * w).toFixed(1)}" height="${h}" fill="${i === shaded ? pink : cream}"/>`;
      x += f * w;
    });
    body = `<rect x="${x0}" y="${y0 - 6}" width="${w}" height="10" rx="5" fill="#fff" stroke="${edge}" stroke-width="2.5"/>
      <g stroke="${edge}" stroke-width="2.6">${body}</g><rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="4" fill="none" stroke="${edge}" stroke-width="3.5"/>`;
  }
  return `<svg class="share-cake" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
}

/**
 * @param {number} dd le palier de difficulté
 * @returns {ShareRound}
 */
function shareBuildRound(dd, rng = random) {
  const cfg = shareRound(dd);
  /**
   * @template T
   * @param {T[]} arr
   * @returns {T}
   */
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const shape = rng() < 0.5 ? 'rond' : 'carre';
  if (cfg.ask === 'fair') {
    const n = pick(/** @type {number[]} */ (cfg.parts)); // les paliers « fair » ont toujours `parts`
    const pool = shuffle(SHARE_UNEQUAL[cfg.near ? 'near' : 'far'][n].slice());
    // même forme que les options des autres questions (n est absent ici) : le type de r.opts reste unique
    /** @type {Array<{ parts: number[], equal: boolean, n?: number }>} */
    const opts = shuffle([
      { parts: equalParts(n), equal: true },
      { parts: pool[0], equal: false },
      { parts: pool[1 % pool.length].slice().reverse(), equal: false },
    ]);
    return { cfg, ask: 'fair', shape, n, opts: opts.map((o, k) => Object.assign(o, { k, shaded: -1 })) };
  }
  if (cfg.ask === 'show') {
    const n = pick(/** @type {number[]} */ (cfg.fracs)); // les paliers « show » ont toujours `fracs`
    const others = shuffle([2, 3, 4].filter((x) => x !== n));
    /** @type {Array<{ parts: number[], n: number, equal: boolean, shaded?: number }>} */
    const list = [
      { parts: equalParts(n), n, equal: true },
      { parts: equalParts(others[0]), n: others[0], equal: true },
    ];
    if (cfg.trap) {
      // le piège : le bon nombre de parts, mais pas égales (la plus grosse est colorée)
      const un = pick(SHARE_UNEQUAL.far[n]);
      list.push({ parts: un, n, equal: false, shaded: un.indexOf(Math.max(...un)) });
    } else list.push({ parts: equalParts(others[1]), n: others[1], equal: true });
    const opts = shuffle(list).map((o, k) => Object.assign({ shaded: 0 }, o, { k }));
    return { cfg, ask: 'show', shape, n, opts };
  }
  // palier 5 : l'écriture, ou « combien de… pour faire… ? »
  if (rng() < /** @type {number} */ (cfg.whole)) {
    const w = pick(SHARE_WHOLE);
    return { cfg, ask: 'whole', shape, whole: w, n: w.ans };
  }
  const n = pick(/** @type {number[]} */ (cfg.fracs));
  return { cfg, ask: 'write', shape, n };
}
const shareKey = (/** @type {ShareRound} */ r) =>
  `${r.ask}-${r.n}-${r.shape}-${r.whole ? r.whole.key : ''}-${(r.opts || []).map((o) => o.parts.join(',')).join('|')}`;

// les gâteaux à choisir ; `shaded` : la part rose est montrée (sinon aucune)
/** @param {ShareRound['shape']} shape @param {ShareOpt[]} opts @param {boolean} shaded */
function shareCakeButtons(shape, opts, shaded) {
  return opts
    .map(
      (o) =>
        `<button class="share-opt" data-k="${o.k}" data-equal="${o.equal ? 1 : 0}" data-n="${o.parts.length}" aria-label="Gâteau ${o.k + 1}">${shareCakeSVG(shape, o.parts, shaded ? o.shaded : -1)}</button>`,
    )
    .join('');
}
// la question affichée : son titre, sa phrase dite, le gâteau montré et les réponses
/** @param {ShareRound} r */
function shareView(r) {
  let title,
    say,
    stage = '',
    options,
    good;
  if (r.ask === 'fair') {
    title = `Quel gâteau est coupé en ${r.n} parts égales ?`;
    say = `Chouquette veut partager son gâteau entre ${r.n} amis. Quel gâteau est coupé en ${r.n} parts égales ?`;
    options = shareCakeButtons(r.shape, r.opts, false);
    good = /** @type {ShareOpt} */ (r.opts.find((o) => o.equal)).k; // un gâteau est toujours juste
  } else if (r.ask === 'show') {
    const fr = SHARE_FRACS[r.n];
    title = `Sur quel gâteau la part rose est-elle ${fr.word} ?`;
    say = `Sur quel gâteau la part rose est-elle ${fr.word} du gâteau ?`;
    options = shareCakeButtons(r.shape, r.opts, true);
    good = /** @type {ShareOpt} */ (r.opts.find((o) => o.equal && o.n === r.n)).k;
  } else if (r.ask === 'write') {
    title = 'Quelle écriture montre la part rose ?';
    say = 'Quelle écriture montre la part rose du gâteau ?';
    stage = `<div class="share-stage" data-n="${r.n}">${shareCakeSVG(r.shape, equalParts(r.n), 0)}</div>`;
    options = shuffle([2, 3, 4])
      .map(
        (n) =>
          `<button class="num-btn share-opt share-frac" data-k="${n}" data-v="1/${n}" aria-label="un ${n === 2 ? 'demi' : n === 3 ? 'tiers' : 'quart'}">${SHARE_FRACS[n].sym}</button>`,
      )
      .join('');
    good = r.n;
  } else {
    title = r.whole.say;
    say = r.whole.say;
    stage = `<div class="share-stage" data-q="${r.whole.key}">${r.whole.show.map((n) => shareCakeSVG(r.shape, equalParts(n), 0)).join('')}</div>`;
    options = shuffle([2, 3, 4])
      .map(
        (n) => `<button class="num-btn share-opt" data-k="${n}" data-v="${n}" aria-label="${n}"><b>${n}</b></button>`,
      )
      .join('');
    good = r.whole.ans;
  }
  return { title, say, stage, options, good };
}

let shareLast = '';
/**
 * Un gâteau, jamais le même que le précédent.
 * @param {number} dd le palier de difficulté
 * @returns {ShareRound}
 */
function shareQuestion(dd) {
  const r = drawOther(() => shareBuildRound(dd), shareKey, {
    last: shareLast,
    // après 8 tirages identiques : le même partage sur l'autre forme de gâteau
    fallback: (x) => ({ ...x, shape: /** @type {ShareRound['shape']} */ (x.shape === 'rond' ? 'carre' : 'rond') }),
  });
  shareLast = shareKey(r);
  return r;
}
function renderShare() {
  setupLives('share');
  const r = shareQuestion(gameDiff());
  /** @type {ShareQuestion} */
  const q = { ask: r.ask, n: r.n, whole: r.whole ? r.whole.key : null, trap: !!r.cfg.trap };
  const { title, say, stage, options, good } = shareView(r);
  openModal(`
    ${gameHeader('🎂 Le gâteau partagé', title, say)}
    ${livesBar()}
    ${stage}
    <div class="share-options${r.ask === 'write' || r.ask === 'whole' ? ' num-options' : ''}" data-ask="${r.ask}" data-n="${r.n}">${options}</div>
  `);
  bindQuit();
  startTimerIfNeeded('share');
  setSolution([solSel('.share-opt', 'k', good)]);
  setHintQuestion('share', q, { choices: '.share-opt' });
  document.querySelectorAll('.share-opt').forEach((btn) => {
    setHandler(btn, 'click', () => {
      if (btn.dataset.k === String(good)) {
        clearActiveTimer();
        stepOk(btn);
        flashModal('ok');
        winSoon();
      } else
        loseLife(btn, {
          onRetry: renderShare,
          wrong: { equal: btn.dataset.equal === '1', n: Number(btn.dataset.n), k: btn.dataset.k },
        });
    });
  });
}

// Indices (v52) : 1. ce que veut dire « parts égales » ou « le quart » ;
// 2. ce qu'il faut regarder ou compter. Jamais le bon gâteau ni le nombre.
/** @param {ShareQuestion} q */
function shareHints(q) {
  if (q.ask === 'fair')
    return [
      {
        say: "Des parts égales ont toutes exactement la même taille : aucune n'est plus grosse que les autres.",
        fx: { glow: '.share-options' },
      },
      {
        say: `Regarde chaque gâteau, une part après l'autre : ses ${q.n} parts sont-elles toutes aussi grandes ?`,
        fx: { glow: '.share-options' },
      },
    ];
  if (q.ask === 'show')
    return [
      {
        say: "La moitié, c'est une part sur 2 parts égales ; le tiers, une part sur 3 ; le quart, une part sur 4.",
        fx: { glow: '.share-options' },
      },
      {
        say: `Pour ${SHARE_FRACS[q.n].word}, le gâteau doit être coupé en ${q.n} parts égales. Compte les parts de chaque gâteau${q.trap ? ", et vérifie qu'elles sont pareilles" : ''}.`,
        fx: { glow: '.share-options' },
      },
    ];
  if (q.ask === 'write')
    return [
      {
        say: 'Dans ½, ⅓ ou ¼, le chiffre du bas dit en combien de parts égales le gâteau est coupé.',
        fx: { glow: '.share-stage' },
      },
      {
        say: "Compte les parts du gâteau, puis cherche l'écriture qui a ce nombre en bas.",
        fx: { glow: '.share-stage' },
      },
    ];
  /** @type {Record<string, string>} */
  const tips = {
    'quarts-moitie': 'Coupe la moitié en deux dans ta tête : chaque petite part est un quart. Combien y en a-t-il ?',
    'quarts-entier': "Un quart, c'est une part d'un gâteau coupé en parts égales. Compte toutes les parts du gâteau.",
    'moities-entier':
      "Une moitié, c'est une part d'un gâteau coupé en parts égales. Compte toutes les parts du gâteau.",
    'tiers-entier': "Un tiers, c'est une part d'un gâteau coupé en parts égales. Compte toutes les parts du gâteau.",
  };
  return [
    {
      say: "Un quart, c'est une part d'un gâteau coupé en 4 ; une moitié, une part d'un gâteau coupé en 2.",
      fx: { glow: '.share-stage' },
    },
    { say: (q.whole && tips[q.whole]) || tips['quarts-entier'], fx: { glow: '.share-stage' } },
  ];
}

// Explication d'une erreur (track erreurs-expliquees) : ce que le gâteau touché
// a de faux (parts inégales, pas le bon nombre de parts), ou la règle que la
// réponse ne suit pas ; le bon gâteau ou la bonne écriture brille.
/** @type {Record<number, string>} */
const SHARE_ONE = { 2: 'un demi', 3: 'un tiers', 4: 'un quart' };
/** @type {Record<string, string>} */
const SHARE_WHOLE_WHY = {
  'quarts-moitie': 'Deux quarts font une moitié.',
  'quarts-entier': 'Quatre quarts font le gâteau entier.',
  'moities-entier': 'Deux moitiés font le gâteau entier.',
  'tiers-entier': 'Trois tiers font le gâteau entier.',
};
/** @typedef {{ equal: boolean, n: number, k: string | undefined }} ShareWrong ce que porte le bouton touché */
/**
 * @param {ShareQuestion} q
 * @param {ShareWrong} w
 * @returns {import('../../hints/index.js').Explain | null}
 */
function shareExplain(q, w) {
  if (q.ask === 'fair')
    return {
      say: 'Ces parts ne sont pas pareilles : une est plus grosse.',
      fx: { glow: '.share-opt[data-equal="1"]' },
    };
  if (q.ask === 'show') {
    const part = SHARE_FRACS[q.n].word;
    return {
      say: w.equal
        ? `Ce gâteau a ${w.n} parts. ${part[0].toUpperCase()}${part.slice(1)}, c'est ${q.n} parts égales.`
        : `Ces parts ne sont pas égales : ce n'est pas ${part}.`,
      fx: { glow: `.share-opt[data-equal="1"][data-n="${q.n}"]` },
    };
  }
  const glow = `.share-stage, ${solSel('.share-opt', 'k', q.n)}`;
  if (q.ask === 'write')
    return {
      say: `Le gâteau a ${q.n} parts égales : c'est ${SHARE_ONE[q.n]}.`,
      fx: { glow, html: `<span class="hint-strip"><i>${SHARE_FRACS[q.n].sym}</i></span>` },
    };
  const why = q.whole ? SHARE_WHOLE_WHY[q.whole] : '';
  return why ? { say: why, fx: { glow } } : null;
}

registerGame('share', renderShare);
registerHints('share', shareHints);
// la stratégie d'une réussite, dite sur l'écran de victoire
/** @type {Record<ShareQuestion['ask'], string>} */
const SHARE_STRATEGY = {
  fair: 'Tu as vérifié que les parts sont pareilles.',
  show: 'Tu as compté les parts égales.',
  write: 'Tu as compté les parts du gâteau.',
  whole: 'Tu as assemblé les parts dans ta tête.',
};
registerExplain('share', { wrong: shareExplain, right: (q) => SHARE_STRATEGY[q.ask] });
