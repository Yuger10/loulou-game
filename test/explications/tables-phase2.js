// Tables des explications (ligne 14 de la spec erreurs-expliquees), phase 2 :
// puzzle, money, packs, share, ladybugs. Début : ./tables-phase1.js.
// Chaque ligne : [jeu, question, mauvaise réponse (source JS), say attendu, fx attendu, run attendu ?]
const { strip } = require('./tables-phase1.js');

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

const ROWS_PHASE2 = [
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

module.exports = { ROWS_PHASE2, MONEY_Q, PACKS_Q, PACKS_Q1, wholeQ };
