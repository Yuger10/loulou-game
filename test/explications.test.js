// @shards 8
// Les erreurs expliquées (track erreurs-expliquees) : après une erreur, une
// phrase dite et un geste sur l'écran pendant 4 secondes, puis une autre
// question. Garde des jeux exemptés, table de chaque jeu, parcours par palier.
// Même harnais que test/companions.test.js : le temps du jeu est accéléré ×10,
// la voix est notée au lieu d'être dite. Les délais demandés à setTimeout sont
// notés tels quels : un délai se vérifie alors sans dépendre de la machine.
const { JSDOM } = require('jsdom');
const { inShard, shard } = require('./tools/shard.js');
const html = require('./tools/page.js').buildHtml();

const SPEED = 0.1;
const spoken = [];
const timeouts = []; // les délais demandés (en ms du jeu, avant accélération)
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/?saison=aucune',
  beforeParse(win) {
    const st = win.setTimeout.bind(win),
      si = win.setInterval.bind(win);
    win.setTimeout = (fn, ms, ...a) => {
      timeouts.push(ms || 0);
      return st(fn, Math.round((ms || 0) * SPEED), ...a);
    };
    win.setInterval = (fn, ms, ...a) => si(fn, Math.max(1, Math.round((ms || 0) * SPEED)), ...a);
    win.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };
    win.speechSynthesis = {
      speaking: false,
      cancel() {},
      getVoices: () => [],
      speak(u) {
        spoken.push(u.text);
      },
    };
  },
});
const w = dom.window,
  d = w.document;
w.confirm = () => true;
const errs = [];
w.addEventListener('error', (e) => errs.push(e.message));
// un nom pas encore écrit (test rouge) donne undefined et un ❌, pas un arrêt de la suite
const evErrs = [];
const ev = (code) => {
  try {
    return w.eval(code);
  } catch (e) {
    evErrs.push(`${e.message} ← ${code.slice(0, 80)}`);
    return undefined;
  }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(cond, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (cond()) return true;
    await wait(5);
  }
  return !!cond();
}
let failed = 0,
  passed = 0;
function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
function section(name) {
  console.log('— ' + name);
}
const lastSaid = () => spoken[spoken.length - 1] || '';
const shown = (sel) => d.getElementById('overlay').classList.contains('show') && !!d.querySelector(sel);
const toSpoken = (s) => ev('toSpoken(' + JSON.stringify(s) + ')');

const ISLAND_FOR_TIER = { 1: 'lagon', 2: 'foret', 3: 'montagne', 4: 'chateau', 5: 'jungle', 6: 'volcan' };
function startGame(key, tier) {
  ev(`closeModal(); party.active = false; race.active = false; currentProfile().age = 0;
      state.missions = 200; currentWorld = ${JSON.stringify(ISLAND_FOR_TIER[tier || 1])};
      state.skills = { ${key}: { wins:0, fails:0, errors:0, last:null, recent:[], lvl:${tier || 1} } };
      playGame(${JSON.stringify(key)})`);
}

/* ---------- Le garde (ligne 17 de la spec) ---------- */
// les 30 jeux inscrits quand la track a été écrite : seuls eux peuvent être exemptés
const LEGACY_GAMES = [
  'memory',
  'count',
  'diff',
  'puzzle',
  'sequence',
  'simon',
  'math',
  'reading',
  'determinants',
  'volume',
  'compare',
  'money',
  'clock',
  'calendar',
  'calc',
  'shapes',
  'planets',
  'jigsaw',
  'nesting',
  'cubes',
  'packs',
  'shelf',
  'share',
  'recipe',
  'rhythm',
  'pitch',
  'lifecycle',
  'ladybugs',
  'potions',
  'mirror',
];
// jamais d'explication : une erreur est le jeu lui-même (mémoire), ou la suite est déjà rejouée (Simon)
const EXPLAIN_NEVER = ['memory', 'simon'];
// en attente : cette liste ne peut que diminuer (chaque suite retire ses jeux et baisse le maximum)
const EXPLAIN_EXEMPT = [
  'diff',
  'sequence',
  'reading',
  'determinants',
  'volume',
  'calendar',
  'shapes',
  'planets',
  'jigsaw',
  'nesting',
  'cubes',
  'shelf',
  'recipe',
  'rhythm',
  'pitch',
  'lifecycle',
  'potions',
  'mirror',
];
const EXPLAIN_EXEMPT_MAX = 18;
// couples jeu et palier qui n'ont qu'une question possible (ligne 5 sans objet) : aucun
const SINGLE_QUESTION = [];
// les jeux qui ont leurs explications, phase par phase
const EXPLAINED = ['count', 'compare', 'math', 'calc', 'clock', 'puzzle', 'money', 'packs', 'share', 'ladybugs'];

// Le garde, pur : la liste des erreurs (vide si tout va bien)
function explainGuard(games, explained, exempt, never, legacy, max) {
  const errors = [];
  for (const g of games)
    if (!explained.includes(g) && !exempt.includes(g) && !never.includes(g))
      errors.push(`${g} : ni explication, ni exemption`);
  for (const g of exempt) {
    if (explained.includes(g)) errors.push(`${g} : exempté alors qu'il a des explications`);
    if (!legacy.includes(g)) errors.push(`${g} : exempté alors que c'est un nouveau jeu`);
  }
  if (exempt.length > max) errors.push(`EXPLAIN_EXEMPT : ${exempt.length} jeux, le maximum est ${max}`);
  return errors;
}

/* ---------- Les tables (ligne 14) ---------- */
const G1 = '.math-illustration .math-group:first-child',
  G2 = '.math-illustration .math-group:last-child';
const strip = (...cells) => `<span class="hint-strip">${cells.map((c) => `<i>${c}</i>`).join('')}</span>`;
const countMarks = (n) =>
  Array.from({ length: n }, (_, i) => ({ sel: `.count-row span:nth-child(${i + 1})`, text: String(i + 1) }));
const num = (v) => `.num-btn[data-v="${v}"]`;
const plusFx = (a, b) => ({
  fill: { sel: '.eq-q', text: String(a + b) },
  marks: [{ sel: `${G1} span:last-child`, text: String(a) }].concat(
    Array.from({ length: b }, (_, i) => ({ sel: `${G2} span:nth-child(${i + 1})`, text: String(a + i + 1) })),
  ),
  glow: num(a + b),
});
const minusFx = (a, b) => ({
  fill: { sel: '.eq-q', text: String(a - b) },
  strike: `${G1} span:nth-last-child(-n+${b})`,
  marks: Array.from({ length: a - b }, (_, i) => ({ sel: `${G1} span:nth-child(${i + 1})`, text: String(i + 1) })),
  glow: num(a - b),
});
const calcFx = (r, band) => ({ fill: { sel: '.eq-q', text: String(r) }, html: band, glow: num(r) });
const calc2 = (first, sign, n) => ({
  text: `${first} ${sign} ${n}`,
  result: sign === '+' ? first + n : first - n,
  first,
  ops: [{ sign, n }],
});
const mult = (a, b) => ({ text: `${a} × ${b}`, result: a * b, mult: { a, b } });
const clockQ = (hour, minute) => ({
  hour,
  minute,
  answer: `${hour} h${minute ? ' ' + minute : ''}`,
  options: [],
});
const clockFx = (hand, answer) => ({ glow: `.clock-hand-${hand}, .clock-opt-btn[data-v="${answer}"]` });

const MONEY_Q = {
  target: 8,
  piles: [
    { pile: [5, 2, 2], total: 9 },
    { pile: [5, 2, 1], total: 8 },
    { pile: [2, 2, 1], total: 5 },
  ],
};
const pileSel = (v) => `.money-pile-btn[data-v="${v}"]`;
const moneyFx = (v, sum) => ({
  marks: [
    { sel: pileSel(v), text: sum },
    { sel: pileSel(8), text: '5 + 2 + 1 = 8' },
  ],
  glow: pileSel(8),
});
const PACKS_Q = { size: 5, n: 3, extra: 0, label: false, total: 15 },
  PACKS_Q1 = { size: 2, n: 4, extra: 1, label: false, total: 9 };
const packsFx = (size, n, extra) => ({
  marks: Array.from({ length: n }, (_, i) => ({ sel: `.pack[data-pack="${i}"]`, text: String(size * (i + 1)) })).concat(
    extra ? [{ sel: '.pack-single', text: String(size * n + 1) }] : [],
  ),
  glow: `.pack-opt[data-v="${size * n + extra}"]`,
});
const wholeQ = (whole, n) => ({ ask: 'whole', n, whole, trap: false });
const WHOLE_V = '({ equal: false, n: NaN, k: "9" })';
const wholeFx = (ans) => ({ glow: `.share-stage, .share-opt[data-k="${ans}"]` });
const lbFx = (answer, n, total) => ({
  glow: `#lb-stage, .lb-opt[data-v="${answer}"]`,
  html: strip(`${n} + ${n} = ${total}`),
});

// chaque ligne : [jeu, question, mauvaise réponse (source JS), say attendu, fx attendu, run attendu ?]
const ROWS = [
  // count
  [
    'count',
    { n: 5, emoji: '⭐' },
    '4',
    'Il ne faut en oublier aucun. Il y en a 5.',
    { marks: countMarks(5), glow: num(5) },
  ],
  [
    'count',
    { n: 3, emoji: '🐚' },
    '5',
    'Chaque coquillage se compte une seule fois. Il y en a 3.',
    { marks: countMarks(3), glow: num(3) },
  ],
  [
    'count',
    { n: 4, emoji: '❓' },
    '6',
    'Chaque image se compte une seule fois. Il y en a 4.',
    { marks: countMarks(4), glow: num(4) },
  ],
  // compare
  [
    'compare',
    { a: 42, b: 47, answer: '<' },
    '">"',
    "47 est plus grand que 42 : la bouche s'ouvre vers 47.",
    { fill: { sel: '.cmp-q', text: '<' }, glow: '.cmp-equation .cmp-num:last-child, .cmp-btn[data-v="<"]' },
  ],
  [
    'compare',
    { a: 9, b: 4, answer: '>' },
    '"<"',
    "9 est plus grand que 4 : la bouche s'ouvre vers 9.",
    { fill: { sel: '.cmp-q', text: '>' }, glow: '.cmp-equation .cmp-num:first-child, .cmp-btn[data-v=">"]' },
  ],
  [
    'compare',
    { a: 9, b: 4, answer: '>' },
    '"="',
    '9 et 4 ne sont pas pareils : 9 est plus grand.',
    { fill: { sel: '.cmp-q', text: '>' }, glow: '.cmp-equation .cmp-num:first-child, .cmp-btn[data-v=">"]' },
  ],
  [
    'compare',
    { a: 5, b: 5, answer: '=' },
    '"<"',
    "5 et 5 sont pareils : c'est le signe égal.",
    { fill: { sel: '.cmp-q', text: '=' }, glow: '.cmp-num, .cmp-btn[data-v="="]' },
  ],
  // math
  [
    'math',
    { a: 4, b: 3, op: '+', result: 7, emoji: '🐚' },
    '6',
    "Il en manque. Je pars de 4 et j'avance de 3 : 7.",
    plusFx(4, 3),
  ],
  [
    'math',
    { a: 4, b: 3, op: '+', result: 7, emoji: '🐚' },
    '9',
    "C'est trop. Je pars de 4 et j'avance de 3 : 7.",
    plusFx(4, 3),
  ],
  [
    'math',
    { a: 5, b: 2, op: '+', result: 7, emoji: '⭐' },
    '3',
    "On ajoute 2, on n'enlève pas. 5 plus 2, ça fait 7.",
    plusFx(5, 2),
  ],
  [
    'math',
    { a: 6, b: 2, op: '−', result: 4, emoji: '⭐' },
    '8',
    "On enlève 2, on n'ajoute pas. 6 moins 2, ça fait 4.",
    minusFx(6, 2),
  ],
  [
    'math',
    { a: 6, b: 2, op: '−', result: 4, emoji: '⭐' },
    '5',
    "Il en reste moins. J'enlève 2 : il en reste 4.",
    minusFx(6, 2),
  ],
  [
    'math',
    { a: 6, b: 2, op: '−', result: 4, emoji: '⭐' },
    '3',
    "Il en reste plus. J'enlève 2 : il en reste 4.",
    minusFx(6, 2),
  ],
  // calc : les 8 exemples de la spec, puis les autres lignes de la table
  [
    'calc',
    calc2(23, '+', 14),
    '38',
    "D'abord les dizaines : 33. Puis les unités : 37.",
    calcFx(37, strip('23 + 10 = 33', '33 + 4 = 37')),
  ],
  [
    'calc',
    calc2(58, '−', 23),
    '34',
    "D'abord les dizaines : 38. Puis les unités : 35.",
    calcFx(35, strip('58 − 20 = 38', '38 − 3 = 35')),
  ],
  ['calc', calc2(7, '+', 3), '9', 'On ne compte pas 7 lui-même. 7 plus 3, ça fait 10.', calcFx(10, strip(7, 8, 9, 10))],
  [
    'calc',
    calc2(31, '+', 24),
    '54',
    'On ne compte pas 31 lui-même. 31 plus 24, ça fait 55.',
    calcFx(55, strip('31 + 20 = 51', '51 + 4 = 55')),
  ],
  ['calc', calc2(40, '−', 7), '32', 'Je pars de 40 et je recule de 7 : 33.', calcFx(33, strip('40 − 7 = 33'))],
  ['calc', calc2(40, '−', 2), '37', 'Je pars de 40 et je recule de 2 : 38.', calcFx(38, strip(40, 39, 38))],
  [
    'calc',
    {
      text: '12 + 5 − 3',
      result: 14,
      first: 12,
      ops: [
        { sign: '+', n: 5 },
        { sign: '−', n: 3 },
      ],
    },
    '15',
    "D'abord 12 plus 5, ça fait 17. Puis moins 3 : 14.",
    calcFx(14, strip('12 + 5 = 17', '17 − 3 = 14')),
  ],
  ['calc', mult(5, 3), '10', 'Il manque un paquet de 5. 3 paquets de 5 : 15.', calcFx(15, strip(5, 10, 15))],
  ['calc', mult(5, 3), '20', 'Un paquet de 5 en trop. 3 paquets de 5 : 15.', calcFx(15, strip(5, 10, 15))],
  ['calc', mult(5, 3), '14', "5 fois 3, c'est 3 paquets de 5 : 15.", calcFx(15, strip(5, 10, 15))],
  ['calc', mult(2, 1), '5', "2 fois 1, c'est 1 paquet de 2 : 2.", calcFx(2, strip(2))],
  ['calc', calc2(7, '+', 3), '12', "Je pars de 7 et j'avance de 3 : 10.", calcFx(10, strip(7, 8, 9, 10))],
  [
    'calc',
    calc2(40, '−', 2),
    '39',
    'On ne compte pas 40 lui-même. 40 moins 2, ça fait 38.',
    calcFx(38, strip(40, 39, 38)),
  ],
  [
    'calc',
    calc2(20, '+', 7),
    '26',
    'On ne compte pas 20 lui-même. 20 plus 7, ça fait 27.',
    calcFx(27, strip('20 + 7 = 27')),
  ],
  ['calc', calc2(20, '+', 30), '55', "Je pars de 20 et j'avance de 30 : 50.", calcFx(50, strip('20 + 30 = 50'))],
  // clock
  [
    'clock',
    clockQ(3, 30),
    '"4 h 30"',
    'La petite aiguille est sur le 3 : il est 3 heures 30.',
    clockFx('h', '3 h 30'),
    true,
  ],
  [
    'clock',
    clockQ(3, 30),
    '"6 h 30"',
    'La grande aiguille montre les minutes. Il est 3 heures 30.',
    clockFx('h', '3 h 30'),
    true,
  ],
  ['clock', clockQ(1, 0), '"5 h"', 'La petite aiguille est sur le 1 : il est 1 heure.', clockFx('h', '1 h'), true],
  [
    'clock',
    clockQ(12, 45),
    '"9 h 45"',
    'La grande aiguille montre les minutes. Il est 12 heures 45.',
    clockFx('h', '12 h 45'),
    true,
  ],
  [
    'clock',
    clockQ(12, 45),
    '"2 h 45"',
    'La petite aiguille est sur le 12 : il est 12 heures 45.',
    clockFx('h', '12 h 45'),
    true,
  ],
  [
    'clock',
    clockQ(3, 0),
    '"3 h 30"',
    "La grande aiguille est sur le 12 : c'est l'heure pile.",
    clockFx('m', '3 h'),
    true,
  ],
  ['clock', clockQ(3, 30), '"3 h"', "La grande aiguille est sur le 6 : c'est la demie.", clockFx('m', '3 h 30'), true],
  [
    'clock',
    clockQ(3, 15),
    '"3 h 45"',
    "La grande aiguille est sur le 3 : c'est le quart.",
    clockFx('m', '3 h 15'),
    true,
  ],
  [
    'clock',
    clockQ(3, 45),
    '"3 h 15"',
    "La grande aiguille est sur le 9 : c'est 45 minutes.",
    clockFx('m', '3 h 45'),
    true,
  ],
  // puzzle : la question continue, jamais la réponse
  [
    'puzzle',
    { seq: [3, 4, 5, 6, 7], idx: 2, variant: 'start' },
    '6',
    '6 vient plus tard. Quel nombre vient juste après 4 ?',
    { glow: '.puzzle-btn.done' },
  ],
  [
    'puzzle',
    { seq: [1, 2, 3, 4], idx: 2, variant: 'from1' },
    '4',
    '4 vient plus tard. Quel nombre vient juste après 2 ?',
    { glow: '.puzzle-btn.done' },
  ],
  [
    'puzzle',
    { seq: [9, 8, 7, 6], idx: 1, variant: 'desc' },
    '6',
    '6 vient plus tard. Quel nombre vient juste avant 9 ?',
    { glow: '.puzzle-btn.done' },
  ],
  [
    'puzzle',
    { seq: [2, 4, 6, 8], idx: 1, variant: 'step2' },
    '8',
    '8 vient plus tard. On compte de 2 en 2 après 2.',
    { glow: '.puzzle-btn.done' },
  ],
  [
    'puzzle',
    { seq: [1, 2, 3], idx: 0, variant: 'from1' },
    '3',
    "3 n'est pas le plus petit. Cherche le plus petit nombre.",
    { glow: '.puzzle-row' },
  ],
  [
    'puzzle',
    { seq: [4, 5, 6], idx: 0, variant: 'start' },
    '6',
    "6 n'est pas le plus petit. Cherche le plus petit nombre.",
    { glow: '.puzzle-row' },
  ],
  [
    'puzzle',
    { seq: [2, 4, 6], idx: 0, variant: 'step2' },
    '6',
    "6 n'est pas le plus petit. Cherche le plus petit nombre.",
    { glow: '.puzzle-row' },
  ],
  [
    'puzzle',
    { seq: [9, 8, 7], idx: 0, variant: 'desc' },
    '7',
    "7 n'est pas le plus grand. Cherche le plus grand nombre.",
    { glow: '.puzzle-row' },
  ],
  // money
  ['money', MONEY_Q, '9', "Cette pile fait 9 : c'est plus que 8.", moneyFx(9, '5 + 2 + 2 = 9')],
  ['money', MONEY_Q, '5', "Cette pile fait 5 : c'est moins que 8.", moneyFx(5, '2 + 2 + 1 = 5')],
  // packs
  ['packs', PACKS_Q, '10', 'Il manque un paquet. 3 paquets de 5 : 15.', packsFx(5, 3, 0)],
  ['packs', PACKS_Q, '8', 'On ne fait pas 3 plus 5. On compte par paquets : 15.', packsFx(5, 3, 0)],
  ['packs', PACKS_Q, '20', 'Un paquet de trop. 3 paquets de 5 : 15.', packsFx(5, 3, 0)],
  ['packs', PACKS_Q, '16', 'Je compte de 5 en 5 : 15.', packsFx(5, 3, 0)],
  ['packs', PACKS_Q1, '8', "N'oublie pas le jouet seul : 9.", packsFx(2, 4, 1)],
  ['packs', PACKS_Q1, '7', 'Il manque un paquet. 4 paquets de 2 et 1 : 9.', packsFx(2, 4, 1)],
  ['packs', PACKS_Q1, '11', 'Un paquet de trop. 4 paquets de 2 et 1 : 9.', packsFx(2, 4, 1)],
  // share
  [
    'share',
    { ask: 'fair', n: 4, whole: null, trap: false },
    '({ equal: false, n: 4, k: "1" })',
    'Ces parts ne sont pas pareilles : une est plus grosse.',
    { glow: '.share-opt[data-equal="1"]' },
  ],
  [
    'share',
    { ask: 'show', n: 2, whole: null, trap: false },
    '({ equal: true, n: 3, k: "0" })',
    "Ce gâteau a 3 parts. La moitié, c'est 2 parts égales.",
    { glow: '.share-opt[data-equal="1"][data-n="2"]' },
  ],
  [
    'share',
    { ask: 'show', n: 3, whole: null, trap: false },
    '({ equal: true, n: 4, k: "0" })',
    "Ce gâteau a 4 parts. Le tiers, c'est 3 parts égales.",
    { glow: '.share-opt[data-equal="1"][data-n="3"]' },
  ],
  [
    'share',
    { ask: 'show', n: 4, whole: null, trap: true },
    '({ equal: false, n: 4, k: "2" })',
    "Ces parts ne sont pas égales : ce n'est pas le quart.",
    { glow: '.share-opt[data-equal="1"][data-n="4"]' },
  ],
  [
    'share',
    { ask: 'write', n: 3, whole: null, trap: false },
    '({ equal: false, n: NaN, k: "4" })',
    "Le gâteau a 3 parts égales : c'est un tiers.",
    { glow: '.share-stage, .share-opt[data-k="3"]', html: strip('⅓') },
  ],
  [
    'share',
    { ask: 'write', n: 2, whole: null, trap: false },
    '({ equal: false, n: NaN, k: "4" })',
    "Le gâteau a 2 parts égales : c'est un demi.",
    { glow: '.share-stage, .share-opt[data-k="2"]', html: strip('½') },
  ],
  [
    'share',
    { ask: 'write', n: 4, whole: null, trap: false },
    '({ equal: false, n: NaN, k: "2" })',
    "Le gâteau a 4 parts égales : c'est un quart.",
    { glow: '.share-stage, .share-opt[data-k="4"]', html: strip('¼') },
  ],
  ['share', wholeQ('quarts-moitie', 2), WHOLE_V, 'Deux quarts font une moitié.', wholeFx(2)],
  ['share', wholeQ('quarts-entier', 4), WHOLE_V, 'Quatre quarts font le gâteau entier.', wholeFx(4)],
  ['share', wholeQ('moities-entier', 2), WHOLE_V, 'Deux moitiés font le gâteau entier.', wholeFx(2)],
  ['share', wholeQ('tiers-entier', 3), WHOLE_V, 'Trois tiers font le gâteau entier.', wholeFx(3)],
  // ladybugs
  [
    'ladybugs',
    { mode: 'double', n: 4, total: 8 },
    '4',
    'Tu as compté une seule aile. 4 plus 4, ça fait 8.',
    lbFx(8, 4, 8),
  ],
  ['ladybugs', { mode: 'double', n: 4, total: 8 }, '9', '4 points sur chaque aile : 4 plus 4, 8.', lbFx(8, 4, 8)],
  ['ladybugs', { mode: 'count', n: 1, total: 2 }, '3', '1 point sur chaque aile : 1 plus 1, 2.', lbFx(2, 1, 2)],
  [
    'ladybugs',
    { mode: 'count', n: 3, total: 6 },
    '3',
    'Tu as compté une seule aile. 3 plus 3, ça fait 6.',
    lbFx(6, 3, 6),
  ],
  ['ladybugs', { mode: 'half', n: 7, total: 14 }, '9', "9 plus 9, ça fait 18, pas 14. C'est 7.", lbFx(7, 7, 14)],
  [
    'ladybugs',
    { mode: 'complete', n: 5, total: 10 },
    '3',
    'Il manque des points : il en faut 5, comme à gauche.',
    { glow: '#lb-stage' },
    true,
  ],
  [
    'ladybugs',
    { mode: 'complete', n: 5, total: 10 },
    '7',
    'Trop de points : il en faut 5, comme à gauche.',
    { glow: '#lb-stage' },
    true,
  ],
];

// JSON aux clés triées : deux objets égaux en profondeur donnent le même texte
function sorted(x) {
  if (Array.isArray(x)) return x.map(sorted);
  if (x && typeof x === 'object')
    return Object.fromEntries(
      Object.keys(x)
        .sort()
        .map((k) => [k, sorted(x[k])]),
    );
  return x;
}
const same = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
// ligne 2 : 3 à 12 mots (la ponctuation seule ne compte pas), aucun signe
const words = (say) => say.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
const sayProblem = (say) =>
  typeof say !== 'string'
    ? 'pas de phrase'
    : words(say) < 3 || words(say) > 12
      ? `${words(say)} mots`
      : /[+−×=<>]/.test(say)
        ? 'un signe dans la phrase'
        : '';

/* ---------- Le parcours (ligne 18) : ce que le test sait de chaque jeu ---------- */
const solEl = () => d.querySelector((ev('gameSolution') || [])[0]);
const otherChoice = (sel) => [...d.querySelectorAll(sel)].find((b) => b !== solEl() && !b.disabled);
const glows = (el) => !!el && el.classList.contains('hint-glow');
const filled = (sel, text) => {
  const el = d.querySelector(sel);
  return !!el && el.textContent === String(text) && el.classList.contains('explain-fill');
};
/* wrong : le bouton faux à toucher ; v : la mauvaise réponse passée au jeu (source JS) ;
   key : la clé de la question (ce qui fixe la réponse) ; shows : la bonne réponse de la
   question ratée est montrée comme la table « Où est la bonne réponse » l'exige */
const GAMES = {
  count: {
    wrong: () => otherChoice('.num-btn'),
    v: (b) => b.dataset.v,
    key: () => ev('String(hint.q.n)'),
    shows: (q) => glows(solEl()) && d.querySelectorAll('.count-row .explain-mark').length === q.n,
  },
  compare: {
    wrong: () => otherChoice('.cmp-btn'),
    v: (b) => JSON.stringify(b.dataset.v),
    key: () => ev('hint.q.a + "-" + hint.q.b'),
    shows: (q) => glows(solEl()) && filled('.cmp-q', q.answer),
  },
  math: {
    wrong: () => otherChoice('.num-btn'),
    v: (b) => b.dataset.v,
    key: () => ev('hint.q.a + " " + hint.q.op + " " + hint.q.b'),
    shows: (q) => glows(solEl()) && filled('.eq-q', q.result),
  },
  calc: {
    wrong: () => otherChoice('.num-btn'),
    v: (b) => b.dataset.v,
    key: () => ev('hint.q.text'),
    shows: (q) => glows(solEl()) && filled('.eq-q', q.result),
  },
  clock: {
    wrong: () => otherChoice('.clock-opt-btn'),
    v: (b) => JSON.stringify(b.dataset.v),
    key: () => ev('hint.q.hour + "-" + hint.q.minute'),
    shows: () => glows(solEl()) && !!d.querySelector('.clock-face .clock-nums'),
  },
  // la question continue : pas de clé, pas de bonne réponse montrée (ligne 7)
  puzzle: {
    continued: true,
    wrong: () => [...d.querySelectorAll('.puzzle-btn:not(.done)')].find((b) => b !== puzzleNext()),
    v: (b) => b.dataset.n,
  },
  money: {
    wrong: () => otherChoice('.money-pile-btn'),
    v: (b) => b.dataset.v,
    key: () => ev('String(hint.q.target)'),
    shows: (q) =>
      glows(solEl()) && new RegExp(`= ${q.target}$`).test((solEl().querySelector('.explain-mark') || {}).textContent),
  },
  packs: {
    wrong: () => otherChoice('.pack-opt'),
    v: (b) => b.dataset.v,
    key: () => ev('hint.q.size + "-" + hint.q.n + "-" + hint.q.extra'),
    shows: () => glows(solEl()),
  },
  share: {
    wrong: () => otherChoice('.share-opt'),
    v: (b) => `({ equal: ${b.dataset.equal === '1'}, n: ${Number(b.dataset.n)}, k: ${JSON.stringify(b.dataset.k)} })`,
    key: () => ev('shareLast'),
    shows: (q) => {
      const sel =
        q.ask === 'fair'
          ? '.share-opt[data-equal="1"]'
          : q.ask === 'show'
            ? `.share-opt[data-equal="1"][data-n="${q.n}"]`
            : `.share-opt[data-k="${q.n}"]`;
      const els = [...d.querySelectorAll(sel)];
      return els.length === 1 && els[0] === solEl() && glows(els[0]);
    },
  },
  ladybugs: {
    wrong: () => (ev('hint.q.mode') === 'complete' ? d.getElementById('lb-done') : otherChoice('.lb-opt')),
    v: (b) => (b.id === 'lb-done' ? '0' : b.dataset.v),
    key: () => ev('hint.q.mode + hint.q.n'),
    shows: (q) =>
      q.mode === 'complete'
        ? glows(d.getElementById('lb-stage')) && d.querySelectorAll('#lb-right .lb-dot').length === q.n
        : glows(solEl()),
  },
};
// puzzle : le bouton du prochain nombre attendu
const puzzleNext = () => d.querySelector(ev('gameSolution')[ev('hint.q.idx')]);
const MAX_TIER = { calc: 6 };
const WRONG_HINTS = () => (ev('WRONG_HINTS') || []).map(toSpoken);
const EXPLAIN_MS = () => ev('EXPLAIN_MS');
// le temps réel d'une explication, moins la marge d'arrondi des minuteries
const explainReal = () => EXPLAIN_MS() * SPEED - 15;

// gagner la question affichée
async function winNow() {
  for (const x of ev('gameSolution') || []) {
    const el = d.querySelector(x);
    if (el) el.click();
    await wait(5);
  }
  return waitFor(() => shown('.win-box'), 2000);
}

/* Une partie : une erreur, puis tout ce que les lignes 1 à 8 exigent.
   Renvoie la liste des problèmes (vide si tout va bien). */
async function errorRound(key, tier) {
  const cfg = GAMES[key],
    where = `${key} palier ${tier}`,
    out = [];
  const bad = (msg) => out.push(`${where} : ${msg}`);
  startGame(key, tier);
  const btn = cfg.wrong();
  if (!btn) return [`${where} : aucune mauvaise réponse à toucher`];
  const exp = ev(`explainFor(${JSON.stringify(key)}, hint.q, ${cfg.v(btn)})`);
  if (!exp) return [`${where} : pas d'explication pour ${cfg.v(btn)}`];
  const q = ev('JSON.parse(JSON.stringify(hint.q))'),
    key0 = cfg.key ? cfg.key() : '',
    sol0 = ev('gameSolution').slice();
  const lastTry = ev('lives') === 1,
    missions = ev('state.missions');
  ev('window.__q0 = hint.q');
  const markT = timeouts.length,
    markS = spoken.length,
    t0 = Date.now();
  btn.click();
  const since = () => Date.now() - t0;

  // lignes 1 et 2 : la bulle, la phrase exacte, dite telle quelle, et rien d'autre
  const bub = d.querySelector('#modal-body .explain-bubble');
  if (!bub) return [`${where} : pas de bulle .explain-bubble`];
  if (bub.getAttribute('role') !== 'status' || !bub.querySelector('.hint-bface svg')) bad('bulle mal formée');
  const anchor =
    d.querySelector('#modal-body #challenge-timer') ||
    d.querySelector('#modal-body .puzzle-hint') ||
    d.querySelector('#modal-body .game-head');
  if (bub.previousElementSibling !== anchor) bad("la bulle n'est pas sous la consigne");
  if ((bub.querySelector('.explain-text') || {}).textContent !== exp.say) bad('le texte de la bulle diffère de say');
  if (lastSaid() !== toSpoken(exp.say)) bad(`la voix dit « ${lastSaid()} » au lieu de say`);
  if (spoken.slice(markS).some((s) => WRONG_HINTS().includes(s))) bad('une phrase générique a été dite');
  if (sayProblem(exp.say)) bad(`say : ${sayProblem(exp.say)} (« ${exp.say} »)`);
  if ('dim' in exp.fx) bad('fx.dim est interdit');
  if (exp.fx.html && (bub.querySelector('.hint-extra') || {}).innerHTML !== exp.fx.html) bad('fx.html absent');
  if (d.querySelector('#modal-body .hint-bubble')) bad("une bulle d'indice reste affichée");
  // ligne 3 : le verrou
  const body = d.getElementById('modal-body');
  if (!body.classList.contains('explaining')) bad('pas de classe explaining');
  const open = [...body.querySelectorAll('button')].filter((b) => !b.disabled && !b.classList.contains('btn-speak'));
  if (open.length) bad(`${open.length} bouton(s) encore actif(s) pendant l'explication`);
  if (body.querySelector('.btn-speak') && body.querySelector('.btn-speak').disabled) bad('le bouton 🔈 est désactivé');
  sol0.forEach((x) => d.querySelector(x) && d.querySelector(x).click()); // la bonne réponse, touchée pendant l'explication
  const asked = timeouts.slice(markT);

  if (cfg.continued) {
    // ligne 7 : la question continue, la réponse n'est jamais donnée
    const next = ev('hint.q.seq[hint.q.idx]');
    if (new RegExp(`(^|[^0-9])${next}([^0-9]|$)`).test(exp.say)) bad(`say donne la réponse (${next})`);
    if (glows(d.querySelector(sol0[ev('hint.q.idx')]))) bad('la bonne réponse brille');
    if (!asked.includes(EXPLAIN_MS()) || asked.includes(700)) bad('le verrou ne dure pas EXPLAIN_MS');
    if (lastTry) return out.concat(await failAfterExplain(key, tier, where, asked, since));
    await waitFor(() => !d.querySelector('.explain-bubble'));
    if (since() < explainReal()) bad(`l'explication s'efface trop tôt (${since()} ms)`);
    if (d.querySelector('.explain-bubble, .explain-mark') || body.classList.contains('explaining'))
      bad("l'explication ne s'efface pas");
    if ([...body.querySelectorAll('.puzzle-btn:not(.done)')].some((b) => b.disabled))
      bad('les boutons ne se réactivent pas');
    if (ev('state.missions') !== missions) bad("la bonne réponse touchée pendant l'explication a compté");
  } else {
    // ligne 6 : la bonne réponse de la question ratée est montrée
    if (!cfg.shows(q)) bad("la bonne réponse de la question ratée n'est pas montrée");
    if (lastTry) return out.concat(await failAfterExplain(key, tier, where, asked, since));
    // ligne 4 : la question suivante arrive après EXPLAIN_MS, et non 900 ms
    if (!asked.includes(EXPLAIN_MS()) || asked.includes(900)) bad('la relance est programmée à 900 ms');
    if (!(await waitFor(() => ev('hint.q !== window.__q0')))) return out.concat(`${where} : pas de question suivante`);
    if (since() < explainReal()) bad(`question suivante trop tôt (${since()} ms)`);
    if (shown('.win-box') || ev('state.missions') !== missions) bad("gagné en touchant pendant l'explication");
    if (d.querySelector('.explain-bubble') || body.classList.contains('explaining'))
      bad("l'explication reste sur la question suivante");
    // ligne 5 : jamais la même question
    if (!SINGLE_QUESTION.includes(`${key}-${tier}`) && cfg.key() === key0)
      bad(`la même question revient (${key0}) : l'explication donnerait la réponse`);
  }
  if (!(await winNow())) bad("plus gagnable après l'explication");
  return out;
}
// ligne 8 : le dernier essai est perdu, « Raté ! » attend la fin de l'explication
async function failAfterExplain(key, tier, where, asked, since) {
  const out = [];
  if (!asked.includes(EXPLAIN_MS()) || asked.includes(520)) out.push(`${where} : « Raté ! » programmé à 520 ms`);
  if (!(await waitFor(() => shown('.fail-box')))) return [`${where} : pas d'écran « Raté ! »`];
  if (since() < explainReal()) out.push(`${where} : « Raté ! » trop tôt (${since()} ms)`);
  startGame(key, tier);
  if (!(await winNow())) out.push(`${where} : la mission relancée ne se gagne pas`);
  return out;
}

(async () => {
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal(); state.storySolved = { lagon: true }; save()');

  section('Garde des jeux exemptés (ligne 17, S7)');
  {
    const games = ev('GAME_TYPES');
    const explained = games.filter((g) => ev(`hasExplain(${JSON.stringify(g)})`));
    const real = explainGuard(games, explained, EXPLAIN_EXEMPT, EXPLAIN_NEVER, LEGACY_GAMES, EXPLAIN_EXEMPT_MAX);
    check('chaque jeu a ses explications, ou une exemption permise', real.length === 0, real.join(' ; '));
    check(
      `les jeux de la track ont leurs explications (${EXPLAINED.length})`,
      EXPLAINED.every((g) => explained.includes(g)),
      EXPLAINED.filter((g) => !explained.includes(g)).join(', '),
    );
    const names = (list, g) => list.length === 1 && list[0].includes(g);
    check(
      'un jeu sans explication ni exemption est refusé, par son nom',
      names(explainGuard(['a', 'b'], ['a'], [], [], [], 0), 'b'),
    );
    check(
      'un exempté qui a des explications est refusé, par son nom',
      names(explainGuard(['a'], ['a'], ['a'], [], ['a'], 1), 'a'),
    );
    check(
      'un nouveau jeu exempté est refusé, par son nom',
      names(explainGuard(['a', 'z'], ['a'], ['z'], [], [], 1), 'z'),
    );
    check(
      'une liste plus longue que le maximum est refusée',
      names(explainGuard(['a', 'b'], [], ['a', 'b'], [], ['a', 'b'], 1), 'maximum est 1'),
    );
    check(
      'un jeu exempté pour toujours passe',
      explainGuard(['memory'], [], [], ['memory'], LEGACY_GAMES, 0).length === 0,
    );
    check('EXPLAIN_MS vaut 4000', EXPLAIN_MS() === 4000);
  }

  section('Tables des explications (ligne 14, S1)');
  {
    const problems = [];
    for (const [game, q, v, say, fx, run] of ROWS.filter((r) => EXPLAINED.includes(r[0]))) {
      const got = ev(`explainFor(${JSON.stringify(game)}, ${JSON.stringify(q)}, ${v})`);
      const where = `${game} ${JSON.stringify(q)} / ${v}`;
      if (!got) {
        problems.push(`${where} : pas d'explication`);
        continue;
      }
      if (got.say !== say) problems.push(`${where} : « ${got.say} » au lieu de « ${say} »`);
      const { run: gotRun, ...rest } = got.fx;
      if (!same(rest, fx)) problems.push(`${where} : fx ${JSON.stringify(rest)} au lieu de ${JSON.stringify(fx)}`);
      if (!!run !== (typeof gotRun === 'function')) problems.push(`${where} : fx.run ${run ? 'absent' : 'en trop'}`);
      if (sayProblem(got.say)) problems.push(`${where} : ${sayProblem(got.say)}`);
    }
    const n = ROWS.filter((r) => EXPLAINED.includes(r[0])).length;
    check(`chaque ligne des tables : say exact, fx conforme (${n} lignes)`, problems.length === 0);
    if (problems.length) console.log('   ' + problems.slice(0, 12).join('\n   '));
    check('un jeu sans explication : explainFor renvoie null', ev('explainFor("reading", {}, 1)') === null);
  }

  section('Une erreur à chaque palier (ligne 18, S2, S4)');
  {
    const pairs = EXPLAINED.flatMap((key) =>
      Array.from({ length: MAX_TIER[key] || 5 }, (_, i) => ({ key, tier: i + 1 })),
    );
    const problems = [];
    let rounds = 0;
    for (const { key, tier } of inShard(pairs))
      for (let r = 0; r < 3; r++) {
        rounds++;
        problems.push(...(await errorRound(key, tier)));
      }
    check(
      `bulle, voix, verrou, bonne réponse montrée, relance à 4 s, autre question, jeu gagnable (${rounds} parties)`,
      problems.length === 0,
    );
    if (problems.length) console.log('   ' + problems.slice(0, 15).join('\n   '));
  }

  section('Dernier essai : « Raté ! » attend la fin (ligne 8, S4)');
  {
    startGame('count', 5);
    check('count au palier 5 : un seul essai', ev('lives') === 1);
    const out = await errorRound('count', 5);
    check('une erreur : explication, puis « Raté ! » après EXPLAIN_MS, mission relancée gagnable', out.length === 0);
    if (out.length) console.log('   ' + out.join('\n   '));
  }

  if (shard.k === 0) {
    section('Puzzle : une erreur à chaque rang, jamais la réponse (ligne 7, S3)');
    startGame('puzzle', 1);
    const len = ev('hint.q.seq.length'),
      body = d.getElementById('modal-body'),
      problems = [];
    for (let idx = 0; idx < len - 1; idx++) {
      const next = puzzleNext(),
        btn = GAMES.puzzle.wrong();
      const exp = ev(`explainFor("puzzle", hint.q, ${btn.dataset.n})`);
      btn.click();
      const text = (d.querySelector('.explain-text') || {}).textContent;
      if (!exp || text !== exp.say) problems.push(`rang ${idx} : pas la bonne explication`);
      else if (new RegExp(`(^|[^0-9])${next.dataset.n}([^0-9]|$)`).test(text))
        problems.push(`rang ${idx} : « ${text} » donne la réponse (${next.dataset.n})`);
      if (glows(next)) problems.push(`rang ${idx} : la bonne réponse brille`);
      if (![...body.querySelectorAll('.puzzle-btn')].every((b) => b.disabled))
        problems.push(`rang ${idx} : des boutons restent actifs`);
      await waitFor(() => !d.querySelector('.explain-bubble'));
      if (body.classList.contains('explaining') || next.disabled || btn.disabled)
        problems.push(`rang ${idx} : le verrou n'est pas levé après l'explication`);
      next.click();
      if (ev('hint.q.idx') !== idx + 1) problems.push(`rang ${idx} : la bonne réponse n'avance plus`);
    }
    check(
      `puzzle : ${len - 1} rangs, la réponse n'est jamais dite ni montrée, le verrou se lève`,
      problems.length === 0,
    );
    if (problems.length) console.log('   ' + problems.join('\n   '));
    startGame('puzzle', 5);
    check('puzzle au palier 5 : un seul essai', ev('lives') === 1);
    const out = await errorRound('puzzle', 5);
    check('puzzle, dernier essai : explication, puis « Raté ! » après EXPLAIN_MS', out.length === 0);
    if (out.length) console.log('   ' + out.join('\n   '));
  }

  section('Jeu exempté : comme avant (ligne 9, S6)');
  {
    startGame('reading', 1);
    ev('window.__q0 = hint.q; window.__rnd = Math.random; Math.random = () => 0');
    let markT = timeouts.length;
    const markS = spoken.length;
    otherChoice(ev('hint.choices')).click();
    ev('Math.random = window.__rnd');
    check('reading : aucune bulle d’explication', !d.querySelector('.explain-bubble'));
    check(
      'reading : la phrase générique est dite',
      spoken.slice(markS).some((s) => WRONG_HINTS().includes(s)),
    );
    const asked = timeouts.slice(markT);
    check('reading : relance à 900 ms', asked.includes(900) && !asked.includes(EXPLAIN_MS()));
    check(
      'reading : la fenêtre reste jouable (pas de verrou)',
      !d.getElementById('modal-body').classList.contains('explaining'),
    );
    check('reading : une autre question suit', await waitFor(() => ev('hint.q !== window.__q0')));
    startGame('diff', 5);
    check('diff au palier 5 : un seul essai', ev('lives') === 1);
    markT = timeouts.length;
    otherChoice(ev('hint.choices')).click();
    check(
      'diff : « Raté ! » à 520 ms',
      timeouts.slice(markT).includes(520) && !timeouts.slice(markT).includes(EXPLAIN_MS()),
    );
    check('diff : l’écran « Raté ! » arrive', await waitFor(() => shown('.fail-box')));
  }

  section('À plusieurs, temps écoulé (lignes 10 et 11, S5)');
  {
    startGame('count', 1);
    ev('party.active = true');
    otherChoice('.num-btn').click();
    check('à plusieurs : aucune explication', !d.querySelector('.explain-bubble'));
    ev('party.active = false');
    startGame('count', 2);
    ev('loseLife(null)');
    check('temps écoulé : aucune explication', !d.querySelector('.explain-bubble') && ev('lives') === 2);
    ev('loseLife(null, { wrong: 1 })');
    check('sans bouton touché : aucune explication, même avec une réponse', !d.querySelector('.explain-bubble'));
  }

  section("L'équipe se tait (ligne 12)");
  {
    startGame('count', 1);
    ev(`window.__ex = []; window.__on = hintPolicy.onExplain;
        hintPolicy.onExplain = (k) => { window.__ex.push(k); if (window.__on) window.__on(k); };
        teamSay(currentCompanion(), 'Coucou !'); teamSay(currentCompanion(), 'Encore moi !')`);
    check('avant : une bulle de l’équipe est affichée', d.getElementById('team-say').classList.contains('show'));
    otherChoice('.num-btn').click();
    check('hintPolicy.onExplain reçoit le jeu', JSON.stringify(ev('window.__ex')) === '["count"]');
    check(
      "la file de l'équipe est vidée, sa bulle retirée",
      ev('teamSayQueue.length === 0 && teamSaying === null') &&
        !d.getElementById('team-say').classList.contains('show'),
    );
    const said = ev('explainFor("count", window.__q0 = hint.q, 0)');
    check('une seule phrase : la dernière dite est l’explication', !!said && /Il y en a/.test(lastSaid()));
    await waitFor(() => ev('hint.q !== window.__q0'));
    check("l'équipe ne reparle pas après l'explication", !d.getElementById('team-say').classList.contains('show'));
    ev('hintPolicy.onExplain = window.__on');
  }

  section('La fenêtre se ferme ou change (ligne 13)');
  {
    startGame('count', 1);
    otherChoice('.num-btn').click();
    check('explication en cours', d.getElementById('modal-body').classList.contains('explaining'));
    ev('closeModal()');
    check(
      'fermeture : la classe explaining est retirée',
      !d.getElementById('modal-body').classList.contains('explaining'),
    );
    await wait(EXPLAIN_MS() * SPEED + 80);
    check('fermeture : la relance est annulée', !d.getElementById('overlay').classList.contains('show'));

    startGame('count', 5);
    otherChoice('.num-btn').click();
    ev('openModal("<p id=\\"autre\\">autre écran</p>")');
    check(
      'autre fenêtre : la classe explaining est retirée',
      !d.getElementById('modal-body').classList.contains('explaining'),
    );
    await wait(EXPLAIN_MS() * SPEED + 80);
    check('autre fenêtre : « Raté ! » est annulé', !!d.getElementById('autre') && !d.querySelector('.fail-box'));
    ev('closeModal()');
  }

  section('Jamais deux fois la même question : le repli (ligne 5)');
  {
    // tirages forcés : la question tirée est toujours la même, 9 fois de suite
    const cases = [
      [
        'count',
        (t) => `countQuestion(${t})`,
        'String(q.n)',
        (t) => `q.n >= countRange(${t}).min && q.n <= countRange(${t}).max`,
      ],
      [
        'compare',
        (t) => `compareQuestion(${t})`,
        'q.a + "-" + q.b',
        (t) => `q.b >= 1 && q.b <= compareRange(${t}) && q.answer === (q.a < q.b ? '<' : q.a > q.b ? '>' : '=')`,
      ],
      [
        'math',
        (t) => `mathQuestion(${t})`,
        'q.a + q.op + q.b',
        (t) =>
          `q.a >= 1 && q.b >= 1 && q.result >= 0 && q.result <= mathBounds(${t}).max && q.result === (q.op === '+' ? q.a + q.b : q.a - q.b)`,
      ],
      [
        'calc',
        (t) => `calcQuestion(${t})`,
        'q.text',
        (t) =>
          `q.result >= 0 && q.result <= calcBounds(${t}).max && q.result === Function('return ' + q.text.replace(/×/g, '*').replace(/−/g, '-'))()`,
      ],
      [
        'clock',
        (t) => `clockQuestion(${t})`,
        'q.hour + "-" + q.minute',
        () => `q.hour >= 1 && q.hour <= 12 && q.answer === timeLabel(q.hour, q.minute)`,
      ],
      [
        'money',
        (t) => `moneyQuestion(${t})`,
        'String(q.correct.total)',
        (t) =>
          `q.options.length === 3 && q.options[0] === q.correct && q.options.slice(1).every((o) => o.total !== q.correct.total) && q.correct.pile.every((c) => moneyDenoms(${t}).includes(c)) && q.correct.pile.reduce((a, b) => a + b, 0) === q.correct.total && q.correct.pile.every((c, i, l) => i === 0 || l[i - 1] >= c)`,
      ],
      [
        'packs',
        (t) => `packsQuestion(${t})`,
        'q.size + "-" + q.n + "-" + q.extra',
        (t) => `q.n >= packsRound(${t}).min && q.n <= packsRound(${t}).max && q.total === q.size * q.n + q.extra`,
      ],
      ['share', (t) => `shareQuestion(${t})`, 'shareKey(q)', () => `q.shape === 'rond' || q.shape === 'carre'`],
      [
        'ladybugs',
        (t) => `ladybugsQuestion(${t})`,
        'q.mode + q.n',
        (t) => `q.n >= ladybugsRound(${t}).min && q.n <= ladybugsRound(${t}).max && q.total === 2 * q.n`,
      ],
    ].filter((c) => EXPLAINED.includes(c[0]));
    const problems = [];
    for (const [game, draw, keyOf, valid] of cases)
      for (let tier = 1; tier <= (MAX_TIER[game] || 5); tier++)
        for (const r of [0, 0.31, 0.62, 0.999]) {
          startGame(game, tier);
          const res = ev(`(() => { const rnd = Math.random; Math.random = () => ${r};
            try { let q = ${draw(tier)}; const k1 = ${keyOf}; q = ${draw(tier)}; const k2 = ${keyOf};
              return { k1, k2, ok: !!(${valid(tier)}) }; } finally { Math.random = rnd; } })()`);
          if (!res) problems.push(`${game} palier ${tier} (${r}) : tirage impossible`);
          else if (res.k1 === res.k2) problems.push(`${game} palier ${tier} (${r}) : même question ${res.k1}`);
          else if (!res.ok) problems.push(`${game} palier ${tier} (${r}) : repli hors du palier (${res.k2})`);
        }
    check('8 tirages identiques : le repli donne une autre question, dans le palier', problems.length === 0);
    if (problems.length) console.log('   ' + problems.slice(0, 12).join('\n   '));
    check('aucun couple jeu et palier à question unique', SINGLE_QUESTION.length === 0);
    ev('closeModal()');
  }

  check('aucune erreur JS', errs.length === 0, errs.slice(0, 5).join(' ; '));
  check('aucun nom manquant dans le jeu', evErrs.length === 0, [...new Set(evErrs)].slice(0, 5).join(' ; '));
  console.log(
    failed
      ? `\n${failed} test(s) en échec sur ${passed + failed}`
      : `\nTous les tests des explications passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
})();
