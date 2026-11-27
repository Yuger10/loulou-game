const { section, P, KEY, J, check } = require('./fixtures.js');

function dayTests(eq) {
  section('S1 : les jours');
  eq('dayKey : la date locale AAAA-MM-JJ', 'dayKey(new Date(2026, 0, 5, 23, 30))', '2026-01-05');
  eq('addDays : le lendemain', 'addDays("2026-11-20", 1)', '2026-11-21');
  eq('addDays : changement de mois', 'addDays("2026-11-30", 1)', '2026-12-01');
  eq("addDays : changement d'année", 'addDays("2026-12-31", 1)', '2027-01-01');
  eq('addDays : 29 février', 'addDays("2028-02-28", 1)', '2028-02-29');
  eq("addDays : passage à l'heure d'été (28 mars 2027)", '[addDays("2027-03-27", 1), addDays("2027-03-28", 1)]', [
    '2027-03-28',
    '2027-03-29',
  ]);
  eq("addDays : passage à l'heure d'hiver (25 octobre 2026)", '[addDays("2026-10-24", 1), addDays("2026-10-25", 1)]', [
    '2026-10-25',
    '2026-10-26',
  ]);
  eq("addDays : 7 jours par-dessus le changement d'heure", 'addDays("2026-10-22", 7)', '2026-10-29');
  eq('addDays : 3 et 7 jours', '[addDays("2026-11-21", 3), addDays("2026-11-24", 7)]', ['2026-11-24', '2026-12-01']);
}

function keyTests(eq) {
  section('S1 : la clé');
  for (const name of Object.keys(P)) eq(`reviewKey ${name} : ${KEY[name]}`, `reviewKey(${J(P[name])})`, KEY[name]);
  eq(
    'reviewKey : les autres exemples de la table',
    `[reviewKey({ g:'calc', mult:{ a:10, b:10 } }), reviewKey({ g:'compare', a:8, b:8 }), reviewKey({ g:'clock', h:12, m:0 }), reviewKey({ g:'reading', w:'cheval', img:false })]`,
    ['calc:10x10', 'compare:8-8', 'clock:12-0', 'reading:cheval-0'],
  );
}

// des paramètres dans les bornes de la table de la spec, puis hors des bornes
const INSIDE = [
  ...Object.values(P),
  { g: 'math', a: 1, b: 1, op: '+' },
  { g: 'math', a: 15, b: 15, op: '+' },
  { g: 'math', a: 2, b: 1, op: '-' },
  { g: 'math', a: 30, b: 29, op: '-' },
  { g: 'calc', first: 1, ops: [{ s: '+', n: 99 }] },
  { g: 'calc', first: 100, ops: [{ s: '-', n: 100 }] },
  { g: 'calc', mult: { a: 2, b: 1 } },
  { g: 'calc', mult: { a: 10, b: 10 } },
  { g: 'compare', a: 1, b: 100 },
  { g: 'compare', a: 8, b: 8 },
  { g: 'clock', h: 1, m: 0 },
  { g: 'clock', h: 12, m: 45 },
  { g: 'clock', h: 6, m: 15 },
  { g: 'reading', w: 'cheval', img: false },
];
const OUTSIDE = [
  null,
  'x',
  42,
  [],
  {},
  { g: 'count', a: 1 },
  { g: 'math', a: 0, b: 5, op: '+' },
  { g: 'math', a: 5, b: 0, op: '+' },
  { g: 'math', a: 16, b: 15, op: '+' },
  { g: 'math', a: 1.5, b: 2, op: '+' },
  { g: 'math', a: '7', b: 5, op: '+' },
  { g: 'math', a: 7, b: 5, op: '−' },
  { g: 'math', a: 7, b: 5, op: 'x' },
  { g: 'math', a: 5, b: 5, op: '-' },
  { g: 'math', a: 4, b: 5, op: '-' },
  { g: 'math', a: 31, b: 5, op: '-' },
  { g: 'math', a: 5, b: 0, op: '-' },
  { g: 'calc', first: 0, ops: [{ s: '+', n: 5 }] },
  { g: 'calc', first: 101, ops: [{ s: '-', n: 5 }] },
  { g: 'calc', first: 60, ops: [{ s: '+', n: 41 }] },
  { g: 'calc', first: 5, ops: [{ s: '-', n: 6 }] },
  { g: 'calc', first: 5, ops: [{ s: '+', n: 0 }] },
  { g: 'calc', first: 5, ops: [{ s: '+', n: 101 }] },
  { g: 'calc', first: 5, ops: [] },
  { g: 'calc', first: 5, ops: 'x' },
  {
    g: 'calc',
    first: 5,
    ops: [
      { s: '+', n: 1 },
      { s: '+', n: 1 },
      { s: '+', n: 1 },
    ],
  },
  { g: 'calc', first: 5, ops: [{ s: 'x', n: 2 }] },
  { g: 'calc', first: 5, ops: [{ s: '−', n: 2 }] },
  {
    g: 'calc',
    first: 50,
    ops: [
      { s: '+', n: 50 },
      { s: '+', n: 1 },
    ],
  },
  { g: 'calc', first: 5.5, ops: [{ s: '+', n: 1 }] },
  { g: 'calc', first: 5, ops: [null] },
  { g: 'calc', mult: { a: 3, b: 4 } },
  { g: 'calc', mult: { a: 2, b: 0 } },
  { g: 'calc', mult: { a: 2, b: 11 } },
  { g: 'calc', mult: { a: 2, b: 2.5 } },
  { g: 'calc', mult: null },
  { g: 'calc' },
  { g: 'compare', a: 0, b: 5 },
  { g: 'compare', a: 5, b: 101 },
  { g: 'compare', a: 5, b: '6' },
  { g: 'compare', a: 5.5, b: 6 },
  { g: 'clock', h: 0, m: 0 },
  { g: 'clock', h: 13, m: 0 },
  { g: 'clock', h: 3, m: 10 },
  { g: 'clock', h: 3, m: '30' },
  { g: 'clock', h: 3.5, m: 30 },
  { g: 'reading', w: 'licorne-inconnue', img: true },
  { g: 'reading', w: '<img src=x onerror=alert(1)>', img: true },
  { g: 'reading', w: 'chat', img: 1 },
  { g: 'reading', w: 42, img: true },
  { g: 'reading', img: true },
];
function boundsTests(ev) {
  section('S1 : les bornes (validParams)');
  INSIDE.forEach((p) => check(`dedans : ${J(p)}`, () => ev(`validParams(${J(p)})`) === true));
  OUTSIDE.forEach((p) => check(`dehors : ${J(p)}`, () => ev(`validParams(${J(p)})`) === false));
}

module.exports = { dayTests, keyTests, boundsTests };
