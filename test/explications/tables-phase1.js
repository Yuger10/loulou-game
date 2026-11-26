// Tables des explications (ligne 14 de la spec erreurs-expliquees), phase 1 :
// count, compare, math, calc, clock. Suite : ./tables-phase2.js.
// Chaque ligne : [jeu, question, mauvaise réponse (source JS), say attendu, fx attendu, run attendu ?]
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

const ROWS_PHASE1 = [
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
];

module.exports = { ROWS_PHASE1, strip, calc2, mult, clockQ };
