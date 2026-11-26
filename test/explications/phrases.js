// Ce que les suites test/explications*.test.js savent des phrases : la forme
// d'une explication (ligne 2 de la spec), les phrases de stratégie (ligne 15)
// et les éloges de l'écran de victoire (ligne 16).
const { calc2, mult, clockQ } = require('./tables-phase1.js');
const { MONEY_Q, PACKS_Q, PACKS_Q1, wholeQ } = require('./tables-phase2.js');

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

/* ---------- Les phrases de stratégie (ligne 15) : [jeu, question, phrase] ---------- */
const STRATEGIES = [
  ['count', { n: 5, emoji: '⭐' }, 'Tu as compté chaque étoile une seule fois.'],
  ['count', { n: 5, emoji: '❓' }, 'Tu as compté chaque image une seule fois.'],
  ['compare', { a: 7, b: 7, answer: '=' }, "Tu as vu qu'ils sont pareils."],
  ['compare', { a: 42, b: 57, answer: '<' }, 'Tu as bien regardé les dizaines.'],
  ['compare', { a: 42, b: 47, answer: '<' }, 'Tu as trouvé le plus grand nombre.'],
  ['compare', { a: 8, b: 23, answer: '<' }, 'Tu as trouvé le plus grand nombre.'],
  ['math', { a: 4, b: 3, op: '+', result: 7, emoji: '⭐' }, 'Tu as compté les deux groupes ensemble.'],
  ['math', { a: 6, b: 2, op: '−', result: 4, emoji: '⭐' }, 'Tu as enlevé, puis compté ceux qui restent.'],
  ['calc', mult(5, 3), 'Tu as compté de 5 en 5.'],
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
    'Tu as fait les calculs un par un.',
  ],
  ['calc', calc2(23, '+', 14), 'Tu as fait les dizaines, puis les unités.'],
  ['calc', calc2(58, '−', 23), 'Tu as fait les dizaines, puis les unités.'],
  ['calc', calc2(7, '+', 3), 'Tu as avancé depuis le premier nombre.'],
  ['calc', calc2(20, '+', 30), 'Tu as avancé depuis le premier nombre.'],
  ['calc', calc2(40, '−', 7), 'Tu as reculé depuis le premier nombre.'],
  ['puzzle', { seq: [1, 2, 3], idx: 3, variant: 'from1' }, "Tu as suivi l'ordre des nombres."],
  ['puzzle', { seq: [4, 5, 6], idx: 3, variant: 'start' }, "Tu as suivi l'ordre des nombres."],
  ['puzzle', { seq: [9, 8, 7], idx: 3, variant: 'desc' }, "Tu as compté à l'envers."],
  ['puzzle', { seq: [2, 4, 6], idx: 3, variant: 'step2' }, 'Tu as compté de 2 en 2.'],
  ['money', MONEY_Q, 'Tu as additionné les pièces de chaque pile.'],
  ['packs', PACKS_Q, 'Tu as compté de 5 en 5.'],
  ['packs', PACKS_Q1, 'Tu as compté de 2 en 2.'],
  ['share', { ask: 'fair', n: 4, whole: null, trap: false }, 'Tu as vérifié que les parts sont pareilles.'],
  ['share', { ask: 'show', n: 2, whole: null, trap: false }, 'Tu as compté les parts égales.'],
  ['share', { ask: 'write', n: 3, whole: null, trap: false }, 'Tu as compté les parts du gâteau.'],
  ['share', wholeQ('quarts-moitie', 2), 'Tu as assemblé les parts dans ta tête.'],
  ['ladybugs', { mode: 'count', n: 2, total: 4 }, 'Tu as compté les deux ailes.'],
  ['ladybugs', { mode: 'double', n: 4, total: 8 }, 'Tu as trouvé le double.'],
  ['ladybugs', { mode: 'complete', n: 5, total: 10 }, 'Tu as rendu les deux ailes pareilles.'],
  ['ladybugs', { mode: 'half', n: 7, total: 14 }, 'Tu as partagé en deux parts égales.'],
  ['clock', clockQ(3, 30), 'Tu as lu la petite aiguille, puis la grande.'],
];
// les éloges de l'écran de victoire (ligne 16) : ce que l'enfant a fait, jamais ce qu'elle est
const PRAISES = (who) => [
  `Bravo${who}, bien joué !`,
  `Super${who}, tu as bien cherché !`,
  "Génial, c'est réussi !",
  `Waouh${who}, tu as bien réfléchi !`,
  'Incroyable, tu as tout trouvé !',
  'Tu as bien travaillé ! 💪',
];
const plain = (t) => String(t).replace(/ /g, ' ');

module.exports = { same, words, sayProblem, STRATEGIES, PRAISES, plain };
