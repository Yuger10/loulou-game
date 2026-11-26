// La révision espacée (« les souvenirs », track revision-espacee_20261122).
// Une question ratée dans math, calc, compare, clock ou reading est gardée
// (state.review), puis reposée 1, 3 et 7 jours plus tard dans une petite
// mission proposée par le compagnon en début de séance.
//   S1  fonctions pures de l'entité (dates fixes)
//   S2  capture des questions ratées, avec une horloge simulée
//   S3  parties trafiquées : chargées, importées, lues par l'espace parents
//   S4  aller-retour item / render de chaque jeu, à chaque palier
//   S6  la mission « souvenirs » ; S7 refus, fermeture, abandon, à plusieurs, pause
// Le fuseau est fixé pour que les changements d'heure testés soient ceux de Paris.
process.env.TZ = 'Europe/Paris';
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');

const html = page.buildHtml();
const SPEED = 0.1; // minuteries du jeu 10 fois plus courtes (1500 ms deviennent 150 ms)
let failed = 0,
  passed = 0;
// `cond` peut être une fonction : une erreur (nom pas encore défini…) compte comme un échec
function check(name, cond, detail) {
  let ok = false,
    info = detail;
  try {
    ok = typeof cond === 'function' ? cond() : cond;
  } catch (e) {
    info = e.message;
  }
  if (ok) passed++;
  else {
    failed++;
    console.log('❌ ' + name + (info ? `\n     → ${typeof info === 'function' ? info() : info}` : ''));
  }
}
function section(name) {
  console.log('— ' + name);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(cond, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      if (cond()) return true;
    } catch {
      // la condition lit un nom pas encore défini : on réessaie
    }
    await wait(10);
  }
  return false;
}

const noon = (k) => {
  const [y, m, dd] = k.split('-').map(Number);
  return new Date(y, m - 1, dd, 12).getTime();
};
// les minuteries du jeu, 10 fois plus courtes
function fastTimers(win) {
  const st = win.setTimeout.bind(win),
    si = win.setInterval.bind(win);
  win.setTimeout = (fn, ms, ...a) => st(fn, Math.round((ms || 0) * SPEED), ...a);
  win.setInterval = (fn, ms, ...a) => si(fn, Math.max(1, Math.round((ms || 0) * SPEED)), ...a);
}
// une classe Date qui part de l'instant simulé et avance avec le temps réel
function fakeDate(win, clock) {
  const Real = win.Date;
  const now = () => clock.base + (Real.now() - clock.t0);
  win.Date = class extends Real {
    constructor(...a) {
      if (a.length) super(...a);
      else super(now());
    }
    static now() {
      return now();
    }
  };
}
// une voix qui note ce qu'on lui fait dire
function fakeVoice(win, spoken) {
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
}
/* Une page du jeu. `day` : le jour simulé (la classe Date de la page part de
   midi ce jour-là et avance avec le temps réel ; `setDay` change de jour).
   `fast` : minuteries du jeu ×0,1. `saved` : le stockage de départ. */
function boot({ saved, day, fast } = {}) {
  const spoken = [];
  const clock = { base: day ? noon(day) : 0, t0: Date.now() };
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      if (fast) fastTimers(win);
      if (day) fakeDate(win, clock);
      fakeVoice(win, spoken);
      if (saved) for (const [k, v] of Object.entries(saved)) win.localStorage.setItem(k, v);
    },
  });
  const w = dom.window;
  w.confirm = () => true;
  const errs = [];
  w.addEventListener('error', (e) => errs.push(e.message));
  const ev = (code) => w.eval(code);
  return {
    w,
    d: w.document,
    ev,
    // une valeur du jeu, copiée hors de la page (comparable avec ===, par JSON)
    js: (code) => ev(`JSON.stringify(${code})`),
    errs,
    spoken,
    setDay(k) {
      clock.base = noon(k);
      clock.t0 = Date.now();
    },
  };
}
// la fin d'une page : aucune erreur JS pendant ses tests, puis on la ferme
function done(pg, name = 'aucune erreur JS') {
  check(name, pg.errs.length === 0, pg.errs.join(' | '));
  pg.w.close();
}
const J = JSON.stringify;
// le stockage d'une page, pour la rouvrir (redémarrage)
function storageOf(w) {
  const out = {};
  for (let i = 0; i < w.localStorage.length; i++) {
    const k = w.localStorage.key(i);
    out[k] = w.localStorage.getItem(k);
  }
  return out;
}
// un joueur déjà connu, avec sa partie
const profilesOf = (current = 'p1') =>
  J({
    list: [
      { id: 'p1', name: 'Nina', avatar: '👧' },
      { id: 'p2', name: 'Léo', avatar: '👦' },
    ],
    current,
  });
const P = {
  math: { g: 'math', a: 7, b: 5, op: '+' },
  minus: { g: 'math', a: 9, b: 4, op: '-' },
  calc: { g: 'calc', first: 23, ops: [{ s: '+', n: 14 }] },
  calc2: {
    g: 'calc',
    first: 40,
    ops: [
      { s: '-', n: 12 },
      { s: '+', n: 7 },
    ],
  },
  mult: { g: 'calc', mult: { a: 5, b: 3 } },
  compare: { g: 'compare', a: 42, b: 47 },
  clock: { g: 'clock', h: 3, m: 30 },
  reading: { g: 'reading', w: 'chat', img: true },
};
const KEY = {
  math: 'math:7+5',
  minus: 'math:9-4',
  calc: 'calc:23+14',
  calc2: 'calc:40-12+7',
  mult: 'calc:5x3',
  compare: 'compare:42-47',
  clock: 'clock:3-30',
  reading: 'reading:chat-1',
};
const item = (name, more = {}) => ({
  k: KEY[name],
  p: P[name],
  t: 2,
  due: '2026-11-21',
  box: 1,
  fails: 0,
  added: '2026-11-20',
  ...more,
});
/* ===================== S1 : les fonctions pures ===================== */
const EMPTY = { items: [], offered: null };
// une comparaison par JSON d'une valeur calculée dans la page
const makeEq = (js) => (name, code, expected) =>
  check(
    name,
    () => js(code) === J(expected),
    () => {
      try {
        return `${js(code)} au lieu de ${J(expected)}`;
      } catch (e) {
        return e.message;
      }
    },
  );

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

function addMissTests(eq) {
  section('S1 : une question ratée entre dans la file (addMiss)');
  eq('ligne 1 : ajout (box 1, dû le lendemain)', `addMiss(${J(EMPTY)}, ${J(P.math)}, 2, '2026-11-20')`, {
    items: [item('math')],
    offered: null,
  });
  const before = {
    items: [item('clock'), item('math', { due: '2026-11-27', box: 3 }), item('compare')],
    offered: '2026-11-23',
  };
  eq('ligne 2 : raté de nouveau en jeu', `addMiss(${J(before)}, ${J(P.math)}, 3, '2026-11-24')`, {
    items: [item('clock'), item('math', { t: 3, due: '2026-11-25', box: 1 }), item('compare')],
    offered: '2026-11-23',
  });
  eq(
    'ligne 2 : `fails` ne change pas',
    `addMiss(${J({ items: [item('math', { fails: 2, box: 7 })], offered: null })}, ${J(P.math)}, 1, '2026-11-24').items[0]`,
    item('math', { fails: 2, box: 1, t: 1, due: '2026-11-25' }),
  );
  eq(
    "addMiss ne modifie pas la file qu'on lui donne",
    `(() => { const rv = ${J(before)}; const s = JSON.stringify(rv); addMiss(rv, ${J(P.math)}, 3, '2026-11-24'); addMiss(rv, ${J(P.reading)}, 3, '2026-11-24'); return JSON.stringify(rv) === s; })()`,
    true,
  );
}

// 30 items : des comparaisons 1-2, 1-3… ; les rangs de `oldest` sont les plus anciens
const fullQueue = (oldest) =>
  Array.from({ length: 30 }, (_, i) => ({
    k: `compare:1-${i + 2}`,
    p: { g: 'compare', a: 1, b: i + 2 },
    t: 1,
    due: '2026-11-21',
    box: 1,
    fails: 0,
    added: oldest.includes(i) ? '2026-11-01' : '2026-11-10',
  }));
function fullQueueTests(eq) {
  // le plus ancien est le 5e, et le 9e a la même date
  const full = fullQueue([4, 8]);
  const after = `addMiss(${J({ items: full, offered: null })}, ${J(P.math)}, 2, '2026-11-20').items`;
  eq('ligne 4 : la file garde 30 items', `${after}.length`, 30);
  eq(
    'ligne 4 : le plus ancien sort (le premier du tableau à égalité)',
    `${after}.map((x) => x.k)`,
    full
      .filter((_, i) => i !== 4)
      .map((x) => x.k)
      .concat('math:7+5'),
  );
  eq(
    'ligne 4 : une question déjà dans une file pleine ne fait sortir personne',
    `addMiss(${J({ items: full, offered: null })}, ${J(full[3].p)}, 2, '2026-11-20').items.map((x) => x.k)`,
    full.map((x) => x.k),
  );
}

// une réponse en révision sur une file d'un seul item
const answerOne = (it, ok, day) =>
  `reviewAnswer(${J({ items: [it], offered: null })}, ${J(it.k)}, ${ok}, '${day}').items`;
function scheduleTests(eq) {
  section("S1 : l'échéancier (reviewAnswer)");
  const one = answerOne;
  eq('réussite, box 1 : box 3, dû 3 jours après', one(item('math'), true, '2026-11-21'), [
    item('math', { due: '2026-11-24', box: 3 }),
  ]);
  eq(
    'réussite, box 3 : box 7, dû 7 jours après',
    one(item('math', { due: '2026-11-24', box: 3 }), true, '2026-11-24'),
    [item('math', { due: '2026-12-01', box: 7 })],
  );
  eq('réussite, box 7 : sorti de la file', one(item('math', { due: '2026-12-01', box: 7 }), true, '2026-12-01'), []);
  eq('échec, box 3 : box 1, dû le lendemain, fails + 1', one(item('math', { box: 3 }), false, '2026-11-24'), [
    item('math', { due: '2026-11-25', box: 1, fails: 1 }),
  ]);
  eq('échec, box 7 : box 1, dû le lendemain, fails + 1', one(item('math', { box: 7, fails: 1 }), false, '2026-12-01'), [
    item('math', { due: '2026-12-02', box: 1, fails: 2 }),
  ]);
  eq('échec, box 1 : reste box 1', one(item('math'), false, '2026-11-21'), [
    item('math', { due: '2026-11-22', fails: 1 }),
  ]);
  eq('3ᵉ échec : sorti de la file', one(item('math', { fails: 2 }), false, '2026-11-24'), []);
  eq(
    'le délai compte à partir du jour de la révision réelle (10 jours de retard)',
    one(item('math'), true, '2026-12-01'),
    [item('math', { due: '2026-12-04', box: 3 })],
  );
}

function scheduleQueueTests(eq) {
  eq(
    'les autres items, leur ordre et `offered` ne changent pas',
    `reviewAnswer(${J({ items: [item('clock'), item('math'), item('compare')], offered: '2026-11-21' })}, 'math:7+5', true, '2026-11-21')`,
    { items: [item('clock'), item('math', { due: '2026-11-24', box: 3 }), item('compare')], offered: '2026-11-21' },
  );
  eq(
    'une clé inconnue ne change rien',
    `reviewAnswer(${J({ items: [item('clock')], offered: null })}, 'math:1+1', true, '2026-11-21')`,
    { items: [item('clock')], offered: null },
  );
  eq(
    "reviewAnswer ne modifie pas la file qu'on lui donne",
    `(() => { const rv = ${J({ items: [item('math')], offered: null })}; const s = JSON.stringify(rv); reviewAnswer(rv, 'math:7+5', true, '2026-11-21'); reviewAnswer(rv, 'math:7+5', false, '2026-11-21'); return JSON.stringify(rv) === s; })()`,
    true,
  );
  eq(
    'ligne 19 : raté le 1er, réussi le 2, le 5 et le 12',
    `(() => {
      const due = [];
      let rv = addMiss(${J(EMPTY)}, ${J(P.math)}, 2, '2026-12-01');
      due.push(rv.items[0].due);
      for (const day of ['2026-12-02', '2026-12-05', '2026-12-12']) {
        rv = reviewAnswer(rv, 'math:7+5', true, day);
        due.push(rv.items.length ? rv.items[0].due : 'sorti');
      }
      return due;
    })()`,
    ['2026-12-02', '2026-12-05', '2026-12-12', 'sorti'],
  );
  eq(
    'ligne 19 : raté le 1er, raté en révision le 2 : dû le 3',
    `reviewAnswer(addMiss(${J(EMPTY)}, ${J(P.math)}, 2, '2026-12-01'), 'math:7+5', false, '2026-12-02').items[0].due`,
    '2026-12-03',
  );
}

// un item des exemples de pickDue : son rang, son jeu, puis sa boîte et son jour
const PICK_PARAMS = {
  math: (id) => ({ g: 'math', a: 1, b: id, op: '+' }),
  clock: (id) => ({ g: 'clock', h: id, m: 0 }),
  compare: (id) => ({ g: 'compare', a: 1, b: id }),
  reading: () => P.reading,
  calc: (id) => ({ g: 'calc', mult: { a: 2, b: id } }),
};
const mk = (id, g, [box, due]) => ({
  k: `${g}#${id}`,
  p: PICK_PARAMS[g](id),
  t: 1,
  due,
  box,
  fails: 0,
  added: '2026-11-01',
});
const PICK_EX1 = [
  mk(1, 'math', [1, '2026-11-20']), // A
  mk(2, 'math', [3, '2026-11-19']), // B
  mk(3, 'clock', [1, '2026-11-21']), // C
  mk(4, 'compare', [7, '2026-11-22']), // D
  mk(5, 'reading', [1, '2026-11-23']), // E
  mk(6, 'calc', [3, '2026-11-21']), // F
];
const PICK_EX2 = [
  mk(1, 'math', [1, '2026-11-20']), // X
  mk(2, 'math', [3, '2026-11-21']), // Y
  mk(3, 'math', [1, '2026-11-19']), // Z
  mk(4, 'math', [7, '2026-11-22']), // W
];
function pickDueTests(eq) {
  section('S1 : le choix des souvenirs (pickDue)');
  const ex1 = PICK_EX1;
  eq('exemple 1 : B, F, C', `pickDue(${J({ items: ex1, offered: null })}, '2026-11-22', 3).map((x) => x.k)`, [
    'math#2',
    'calc#6',
    'clock#3',
  ]);
  eq(
    'exemple 2 (passe 2) : Y, Z, X',
    `pickDue(${J({ items: PICK_EX2, offered: null })}, '2026-11-22', 3).map((x) => x.k)`,
    ['math#2', 'math#3', 'math#1'],
  );
  eq(
    'exemple 3 : aucun item dû',
    `pickDue(${J({ items: [mk(5, 'reading', [1, '2026-11-23'])], offered: null })}, '2026-11-22', 3)`,
    [],
  );
  eq('une file vide', `pickDue(${J(EMPTY)}, '2026-11-22', 3)`, []);
  eq(
    'pickDue rend les items entiers, sans modifier la file',
    `(() => { const rv = ${J({ items: ex1, offered: null })}; const s = JSON.stringify(rv); const out = pickDue(rv, '2026-11-22', 3); return JSON.stringify(rv) === s && JSON.stringify(out[0]) === JSON.stringify(rv.items[1]); })()`,
    true,
  );
  eq('pas plus de `max`', `pickDue(${J({ items: ex1, offered: null })}, '2026-11-22', 2).map((x) => x.k)`, [
    'math#2',
    'clock#3',
  ]);
}

const SAN_DAY = '2026-11-22';
const san = (raw) => `sanitizeReview(${J(raw)}, '${SAN_DAY}')`;
// tout ce qui n'est pas un item valide
const BAD_ITEMS = [
  null,
  'x',
  item('math', { p: { g: 'math', a: 70, b: 5, op: '+' }, k: 'math:70+5' }),
  item('reading', { p: { g: 'reading', w: '<img id=pwn src=x>', img: true }, k: 'reading:<img id=pwn src=x>-1' }),
  item('math', { k: 'math:7+6' }),
  item('math', { k: '<img id=pwn src=x>' }),
  item('math', { t: 0 }),
  item('math', { t: 7 }),
  item('math', { t: 1.5 }),
  item('math', { t: '2' }),
  item('math', { due: '21/11/2026' }),
  item('math', { due: '2026-02-30' }),
  item('math', { due: '2026-13-01' }),
  item('math', { due: 20261121 }),
  item('math', { added: 'hier' }),
  item('math', { added: '2026-11-31' }),
  item('math', { box: 2 }),
  item('math', { box: '1' }),
  item('math', { fails: 3 }),
  item('math', { fails: -1 }),
  item('math', { fails: 0.5 }),
  { k: 'math:7+5' },
];
function sanitizeItemTests(eq) {
  section('S1 : une file lue du stockage (sanitizeReview)');
  for (const raw of [undefined, null, 'x', 42, [], { items: 'x' }, { items: null, offered: 5 }])
    eq(
      `illisible (${J(raw)}) : une file vide`,
      `sanitizeReview(${raw === undefined ? 'undefined' : J(raw)}, '${SAN_DAY}')`,
      {
        items: [],
        offered: null,
      },
    );
  eq('une file valide est gardée telle quelle', san({ items: Object.keys(P).map((n) => item(n)), offered: SAN_DAY }), {
    items: Object.keys(P).map((n) => item(n)),
    offered: SAN_DAY,
  });
  eq('chaque item invalide est retiré', san({ items: [...BAD_ITEMS, item('clock')], offered: null }), {
    items: [item('clock')],
    offered: null,
  });
  eq(
    "les champs inconnus sont retirés (de l'item et de ses paramètres)",
    san({
      items: [{ ...item('math'), html: '<b>x</b>', p: { ...P.math, extra: 1 } }],
      offered: null,
      autre: 1,
    }),
    { items: [item('math')], offered: null },
  );
  eq(
    'les doublons de clé sont retirés (le premier est gardé)',
    san({ items: [item('math'), item('clock'), item('math', { box: 7, t: 5 })], offered: null }),
    { items: [item('math'), item('clock')], offered: null },
  );
}

function sanitizeQueueTests(eq) {
  const many = Array.from({ length: 500 }, (_, i) => ({
    k: `compare:${1 + (i % 100)}-${1 + Math.floor(i / 100)}`,
    p: { g: 'compare', a: 1 + (i % 100), b: 1 + Math.floor(i / 100) },
    t: 1,
    due: '2026-11-21',
    box: 1,
    fails: 0,
    added: '2026-11-20',
  }));
  eq(
    '500 items : les 30 premiers valides sont gardés',
    `sanitizeReview(${J({ items: [null, ...many], offered: null })}, '${SAN_DAY}').items.map((x) => x.k)`,
    many.slice(0, 30).map((x) => x.k),
  );
  eq(
    "une date `due` trop lointaine est ramenée à aujourd'hui + 7",
    san({ items: [item('math', { due: '2031-01-01' }), item('clock', { due: '2026-11-29' })], offered: null }).concat(
      '.items.map((x) => x.due)',
    ),
    ['2026-11-29', '2026-11-29'],
  );
  for (const offered of ['demain', '2026-02-30', 5, {}, '<img id=pwn src=x>'])
    eq(`offered invalide (${J(offered)}) devient null`, san({ items: [], offered }).concat('.offered'), null);
}

async function pureTests() {
  const pg = boot();
  await wait(100);
  const eq = makeEq(pg.js);
  dayTests(eq);
  keyTests(eq);
  boundsTests(pg.ev);
  addMissTests(eq);
  fullQueueTests(eq);
  scheduleTests(eq);
  scheduleQueueTests(eq);
  pickDueTests(eq);
  sanitizeItemTests(eq);
  sanitizeQueueTests(eq);
  done(pg);
}
/* ============ S3 et ligne 5 : la sauvegarde, la migration, l'import ============ */
const SAVE_DAY = '2026-11-22';
const EMPTY_JSON = J(EMPTY);
const IMG = '<img id="pwn" src="x">';
// une file trafiquée : 2 items valides au milieu de tout ce qu'on peut y glisser
const RIGGED = {
  items: [
    item('math', { p: { g: 'math', a: 70, b: 5, op: '+' }, k: 'math:70+5' }),
    item('reading', { p: { g: 'reading', w: IMG, img: true }, k: `reading:${IMG}-1` }),
    item('clock', { due: 'demain' }),
    item('math'),
    { ...item('compare', { due: '2031-01-01' }), html: IMG },
    item('math', { box: 7 }),
    ...Array.from({ length: 500 }, (_, i) => item('clock', { k: IMG + i })),
  ],
  offered: IMG,
};
const CLEANED = J({ items: [item('math'), item('compare', { due: '2026-11-29' })], offered: null });
const BASE_SAVE = { v: 9, name: 'Nina', avatar: '👧', coins: 12, missions: 7, inventory: { perle: 2 } };
// Nina et sa partie enregistrée, au jour des tests de sauvegarde
const ninaSaved = (save, more = {}) =>
  boot({
    day: SAVE_DAY,
    saved: { 'lagon-magique-profiles': profilesOf(), 'lagon-magique-save:p1': J(save), ...more },
  });

async function oldSaveCase(old) {
  const pg = ninaSaved(old);
  const { ev, js, w } = pg;
  await wait(200);
  const v = old.v === undefined ? 0 : old.v;
  check(`v${v} : la version de sauvegarde a augmenté`, () => ev('SAVE_VERSION') > 9);
  check(
    `v${v} : la partie reçoit une file vide`,
    () => js('state.review') === EMPTY_JSON,
    () => js('state.review'),
  );
  check(`v${v} : la partie est à la version actuelle`, () => ev('state.v') === ev('SAVE_VERSION'));
  check(
    `v${v} : le reste est identique`,
    () => js('[state.name, state.coins, state.missions, state.inventory]') === J(['Nina', 12, 7, { perle: 2 }]),
  );
  check(
    `v${v} : la partie réenregistrée porte la file`,
    () => J(JSON.parse(w.localStorage.getItem('lagon-magique-save:p1')).review) === EMPTY_JSON,
  );
  check(`v${v} : une partie neuve a une file vide`, () => js('freshState().review') === EMPTY_JSON);
  done(pg, `v${v} : aucune erreur JS`);
}

// une partie trafiquée chargée, à la version `v` : la file attendue après lecture
async function riggedLoadCase([name, review, expected], v) {
  const pg = ninaSaved({ ...BASE_SAVE, v, review });
  const { ev, js, d, errs, w } = pg;
  await wait(200);
  check(
    `${name} (v${v}) : la file est remise en forme`,
    () => js('state.review') === expected,
    () => js('state.review'),
  );
  check(
    `${name} (v${v}) : rien n'est injecté, aucune erreur JS`,
    !d.getElementById('pwn') && errs.length === 0,
    errs.join(' | '),
  );
  check(`${name} (v${v}) : le jeu a démarré`, () => ev('state.name') === 'Nina');
  w.close();
}
const RIGGED_CASES = [
  ['file trafiquée', RIGGED, CLEANED],
  ['review: "x"', 'x', EMPTY_JSON],
  ['review: null', null, EMPTY_JSON],
  ['review: []', [], EMPTY_JSON],
  ['items: "x"', { items: 'x', offered: SAVE_DAY }, J({ items: [], offered: SAVE_DAY })],
];

async function parentSpaceChecks(pg) {
  const { ev, js, d, errs, w } = pg;
  check(
    "espace parents : la file d'un autre joueur passe par readSave",
    () => js('profileState("p2").review') === CLEANED,
    () => js('profileState("p2").review'),
  );
  ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace("p2")');
  await wait(100);
  check("espace parents : rien n'est injecté", !d.getElementById('pwn') && errs.length === 0, errs.join(' | '));
  check(
    "espace parents : la partie lue n'est pas réécrite",
    () => JSON.parse(w.localStorage.getItem('lagon-magique-save:p2')).review.items.length === RIGGED.items.length,
  );
  ev('closeModal()');
}

async function importChecks(pg) {
  const { ev, js, d, errs } = pg;
  const backup = {
    at: '2026-11-22T10:00:00.000Z',
    data: {
      'lagon-magique-profiles': profilesOf(),
      'lagon-magique-save:p1': J({ ...BASE_SAVE, coins: 77, review: RIGGED }),
    },
  };
  let imported = 'ok';
  try {
    ev(`applyBackup(${J(backup)})`);
  } catch (e) {
    imported = e.message;
  }
  await wait(100);
  check("import : la sauvegarde s'applique sans erreur", imported === 'ok', imported);
  check('import : la partie importée est bien chargée', () => ev('state.coins') === 77);
  check(
    'import : la file est remise en forme',
    () => js('state.review') === CLEANED,
    () => js('state.review'),
  );
  check(
    "import : rien n'est injecté, aucune erreur JS",
    !d.getElementById('pwn') && errs.length === 0,
    errs.join(' | '),
  );
}

async function restartTests() {
  section('Une file enregistrée survit au redémarrage');
  const a = boot({ day: SAVE_DAY });
  await wait(200);
  a.d.getElementById('btn-splash-play').click();
  a.d.getElementById('name-input').value = 'Zoé';
  a.d.querySelector('.avatar-opt').click();
  a.d.getElementById('btn-start').click();
  await wait(300);
  const review = { items: Object.keys(P).map((n) => item(n)), offered: SAVE_DAY };
  a.ev(`closeModal(); state.review = ${J(review)}; save()`);
  const saved = storageOf(a.w);
  a.w.close();
  const b = boot({ day: SAVE_DAY, saved });
  await wait(300);
  check(
    'la file est retrouvée telle quelle',
    () => b.js('state.review') === J(review),
    () => b.js('state.review'),
  );
  b.ev('load()');
  check('et encore après un second chargement', () => b.js('state.review') === J(review));
  done(b);
}

async function saveTests() {
  section("Ligne 5 : une partie d'une version antérieure");
  const noVersion = { name: 'Nina', avatar: '👧', coins: 12, missions: 7, inventory: { perle: 2 } };
  for (const old of [BASE_SAVE, noVersion]) await oldSaveCase(old);

  section('S3 : une partie trafiquée, chargée');
  // à une ancienne version (migration) comme à une version sans migration
  for (const rigged of RIGGED_CASES) for (const v of [9, 99]) await riggedLoadCase(rigged, v);

  section("S3 : une partie trafiquée, importée (applyBackup) ou lue par l'espace parents");
  const pg = ninaSaved(BASE_SAVE, { 'lagon-magique-save:p2': J({ ...BASE_SAVE, name: 'Léo', review: RIGGED }) });
  await wait(200);
  await parentSpaceChecks(pg);
  await importChecks(pg);
  pg.w.close();

  await restartTests();
}

/* ============ S2 et S4 : la capture en jeu, l'aller-retour item / render ============ */
// une page avec un joueur tout neuf (Zoé), fenêtre fermée
async function newPlayer(opts) {
  const pg = boot(opts);
  await wait(200);
  pg.d.getElementById('btn-splash-play').click();
  pg.d.getElementById('name-input').value = 'Zoé';
  pg.d.querySelector('.avatar-opt').click();
  pg.d.getElementById('btn-start').click();
  await wait(300);
  pg.ev('closeModal()');
  return pg;
}
// L'âge et l'île fixent le palier ; le niveau propre au jeu le plafonne (comme test/games.test.js)
const ISLAND_FOR_TIER = { 1: 'lagon', 2: 'foret', 3: 'montagne', 4: 'chateau', 5: 'jungle', 6: 'volcan' };
const setTier = (pg, key, tier) =>
  pg.ev(`closeModal(); party.active = false; race.active = false; currentProfile().age = 0;
      state.missions = 200; currentWorld = ${J(ISLAND_FOR_TIER[tier])};
      state.skills = { ${key}: { wins:0, fails:0, errors:0, last:null, recent:[], lvl:${tier} } }`);
function startGame(pg, key, tier) {
  setTier(pg, key, tier);
  pg.ev(`playGame(${J(key)})`);
}
const ascii = (s) => (s === '−' ? '-' : s);
// Les paramètres attendus, relus sur la question que le jeu a posée (sans passer par son `item`)
const EXPECTED_PARAMS = {
  math: (q) => ({ g: 'math', a: q.a, b: q.b, op: ascii(q.op) }),
  calc: (q) =>
    q.mult
      ? { g: 'calc', mult: { a: q.mult.a, b: q.mult.b } }
      : { g: 'calc', first: q.first, ops: q.ops.map((o) => ({ s: ascii(o.sign), n: o.n })) },
  compare: (q) => ({ g: 'compare', a: q.a, b: q.b }),
  clock: (q) => ({ g: 'clock', h: q.hour, m: q.minute }),
  reading: (q) => ({ g: 'reading', w: q.correct.word, img: q.wordToImage }),
};
const calcValue = (p) =>
  p.mult ? p.mult.a * p.mult.b : p.ops.reduce((v, o) => (o.s === '+' ? v + o.n : v - o.n), p.first);
const calcText = (p) =>
  p.mult ? `${p.mult.a} × ${p.mult.b}` : `${p.first}${p.ops.map((o) => ` ${o.s === '+' ? '+' : '−'} ${o.n}`).join('')}`;
const clockLabel = (p) => (p.m === 0 ? `${p.h} h` : `${p.h} h ${p.m}`);
// Ce que l'écran montre pour des paramètres donnés : la question, et la bonne réponse (data-…)
const SHOWN = {
  math: (d, p) =>
    [...d.querySelectorAll('.math-equation .eq-num')].map((x) => x.textContent).join() === `${p.a},${p.b}` &&
    d.querySelector('.math-equation .eq-op').textContent === (p.op === '+' ? '+' : '−') &&
    d.querySelectorAll('.math-group')[0].children.length === p.a &&
    d.querySelectorAll('.math-group')[1].children.length === p.b,
  calc: (d, p) => d.querySelector('.calc-expr').textContent === calcText(p),
  compare: (d, p) => [...d.querySelectorAll('.cmp-num')].map((x) => x.textContent).join() === `${p.a},${p.b}`,
  clock: (d, p) =>
    d.querySelector('.clock-hand-h').style.transform === `rotate(${((p.h % 12) + p.m / 60) * 30}deg)` &&
    d.querySelector('.clock-hand-m').style.transform === `rotate(${p.m * 6}deg)`,
  reading: (d, p) =>
    p.img
      ? d.querySelector('.reading-word').textContent === p.w && !d.querySelector('.reading-image-box')
      : !!d.querySelector('.reading-image-box') && !d.querySelector('.reading-word'),
};
const ANSWER = {
  math: (p) => String(p.op === '+' ? p.a + p.b : p.a - p.b),
  calc: (p) => String(calcValue(p)),
  compare: (p) => (p.a < p.b ? '<' : p.a > p.b ? '>' : '='),
  clock: clockLabel,
  reading: (p) => p.w,
};
const CHOICES = {
  math: '.num-btn',
  calc: '.num-btn',
  compare: '.cmp-btn',
  clock: '.clock-opt-btn',
  reading: '.reading-opt',
};
const answerOf = (btn) => btn.dataset.v || btn.dataset.w;
const rightBtn = (pg) => pg.d.querySelector(pg.ev('gameSolution')[0]);
const wrongBtn = (pg, key) => [...pg.d.querySelectorAll(CHOICES[key])].find((b) => b !== rightBtn(pg) && !b.disabled);
const hintQ = (pg) => JSON.parse(pg.js('hint.q'));

const queue = (pg) => JSON.parse(pg.js('state.review'));
const stored = (pg) => JSON.parse(pg.w.localStorage.getItem(pg.ev('currentSaveKey()'))).review;
const CAPTURE_DAY = '2026-11-20';

function captureKeptTests(pg) {
  section('S2 : une mauvaise réponse est gardée (ligne 1)');
  for (const [key, tier] of [
    ['math', 2],
    ['calc', 4],
    ['compare', 3],
    ['clock', 5],
    ['reading', 1],
    ['reading', 3],
  ]) {
    pg.ev('state.review = { items: [], offered: null }; save()');
    startGame(pg, key, tier);
    const p = EXPECTED_PARAMS[key](hintQ(pg));
    wrongBtn(pg, key).click();
    const expected = {
      k: pg.ev(`reviewKey(${J(p)})`),
      p,
      t: tier,
      due: '2026-11-21',
      box: 1,
      fails: 0,
      added: CAPTURE_DAY,
    };
    check(`${key}, palier ${tier} : l'item entre dans la file`, J(queue(pg).items) === J([expected]), J(queue(pg)));
    check(`${key}, palier ${tier} : la partie est enregistrée`, J(stored(pg)) === J(queue(pg)), J(stored(pg)));
    check(`${key}, palier ${tier} : le palier gardé est celui du moment`, pg.ev('gameDiff()') === tier);
  }
}

function captureAgainTests(pg) {
  section('S2 : la même question ratée à nouveau (ligne 2)');
  const before = { items: [item('clock'), item('math', { due: '2026-11-27', box: 3, fails: 1 })], offered: null };
  pg.ev(`state.review = ${J(before)}; save()`);
  startGame(pg, 'math', 3);
  pg.ev(`renderMath(${J(P.math)})`); // la question 7 + 5, en jeu normal
  wrongBtn(pg, 'math').click();
  check(
    'pas de doublon : box 1, dû demain, palier du moment, même place',
    J(queue(pg)) ===
      J({
        items: [item('clock'), item('math', { t: 3, due: '2026-11-21', box: 1, fails: 1 })],
        offered: null,
      }),
    J(queue(pg)),
  );
}

async function captureNothingTests(pg) {
  section('S2 : ce qui ne se garde pas (ligne 3)');
  const { ev } = pg;
  const reset = () => ev('closeModal(); endBonusChallenge(); state.review = { items: [], offered: null }; save()');
  const nothing = (name) => check(name, J(queue(pg)) === EMPTY_JSON, J(queue(pg)));
  reset();
  startGame(pg, 'math', 3);
  ev('party.active = true');
  wrongBtn(pg, 'math').click();
  ev('party.active = false');
  nothing('à plusieurs (chacun son tour) : rien');
  reset();
  startGame(pg, 'math', 3);
  ev('race.active = true');
  wrongBtn(pg, 'math').click();
  ev('race.active = false');
  nothing('à plusieurs (course) : rien');
  reset();
  setTier(pg, 'math', 3);
  ev('startBonusChallenge("math")');
  check('le défi bonus de Zap est bien en cours', ev('inBonusChallenge()') === true);
  wrongBtn(pg, 'math').click();
  nothing('défi bonus de Zap : rien');
  reset();
  startGame(pg, 'math', 3);
  ev('loseLife(null)');
  nothing('temps écoulé : rien');
  reset();
  startGame(pg, 'count', 2);
  [...pg.d.querySelectorAll('.num-btn')].find((b) => b !== rightBtn(pg)).click();
  nothing('un jeu hors de la liste (count) : rien');
  reset();
  startGame(pg, 'math', 3);
  rightBtn(pg).click();
  nothing('une bonne réponse : rien');
  await waitFor(() => pg.d.getElementById('btn-yay'));
  reset();
}

function captureFullTests(pg) {
  section('S2 : une file pleine (ligne 4)');
  const full = fullQueue([6]);
  pg.ev(`state.review = ${J({ items: full, offered: null })}; save()`);
  startGame(pg, 'clock', 2);
  wrongBtn(pg, 'clock').click();
  const q = queue(pg).items;
  check(
    'le plus ancien sort, le nouveau entre en fin de tableau, 30 items',
    q.length === 30 && !q.some((x) => x.k === full[6].k) && q[29].p.g === 'clock' && q[0].k === full[0].k,
    J(q.map((x) => x.k)),
  );
  pg.ev('closeModal(); state.review = { items: [], offered: null }; save()');
}

const replay = (pg, key, p) => pg.ev(`setLastGame(${J(key)}); REVIEW_REPLAYS[${J(key)}].render(${J(p)})`);
// un item rejoué au palier donné : la question, sa bonne réponse, ses indices
function replayCase(pg, name, tier) {
  const p = P[name],
    key = p.g;
  setTier(pg, key, tier);
  check(`${name}, palier ${tier} : la question affichée est celle de l'item`, () => {
    replay(pg, key, p);
    return SHOWN[key](pg.d, p);
  });
  check(
    `${name}, palier ${tier} : la bonne réponse est proposée`,
    () => answerOf(rightBtn(pg)) === ANSWER[key](p),
    () => answerOf(rightBtn(pg)),
  );
  check(
    `${name}, palier ${tier} : la question des indices est celle de l'item`,
    () => pg.js('currentHintQuestion().kind') === J(key) && J(EXPECTED_PARAMS[key](hintQ(pg))) === J(p),
    () => pg.js('currentHintQuestion()'),
  );
  check(`${name}, palier ${tier} : deux niveaux d'indice`, () => {
    const hints = JSON.parse(pg.js(`hintsFor(${J(key)}, currentHintQuestion().q)`));
    return hints.length === 2 && hints.every((h) => h.say.length > 10);
  });
}
const REPLAY_CASES = [
  ['math', 1],
  ['minus', 1],
  ['calc', 1],
  ['calc2', 1],
  ['mult', 1],
  ['compare', 1],
  ['clock', 1],
  ['reading', 1],
  ['math', 5],
  ['calc2', 6],
  ['clock', 5],
  ['reading', 5],
];

function replayTests(pg) {
  section('S4 : chaque jeu rejoue un item (ligne 7)');
  for (const [name, tier] of REPLAY_CASES) replayCase(pg, name, tier);
  // lecture : le sens de lecture de l'item, quel que soit le palier du moment
  const other = { g: 'reading', w: 'cheval', img: false };
  setTier(pg, 'reading', 5);
  check("lecture, palier 5 : un item « image vers mot » montre l'image et des mots", () => {
    replay(pg, 'reading', other);
    return (
      pg.d.querySelector('.reading-image').textContent === '🐴' &&
      pg.d.querySelectorAll('.reading-word-btn').length === 5 &&
      answerOf(rightBtn(pg)) === 'cheval'
    );
  });
  // horloge : un quart d'heure au palier 1 (où le jeu ne tire que des heures pleines)
  const quarter = { g: 'clock', h: 9, m: 45 };
  setTier(pg, 'clock', 1);
  check("horloge, palier 1 : un item au quart d'heure garde son heure", () => {
    replay(pg, 'clock', quarter);
    return SHOWN.clock(pg.d, quarter) && answerOf(rightBtn(pg)) === '9 h 45';
  });
}

// Un item rejoué (`p`, tiré de la question `q1`) : ce qui ne va pas, ou '' si tout est retrouvé
function replayedBad(pg, key, { tier, p, q1 }) {
  replay(pg, key, p);
  const q2 = hintQ(pg);
  const back = pg.js(`REVIEW_REPLAYS[${J(key)}].item(hint.q)`);
  // les indices d'une question rejouée : ceux de la question d'origine (au tirage près)
  const same = (q) => pg.js(`hintsFor(${J(key)}, ${J({ ...q, emoji: q1.emoji, options: q1.options })})`);
  if (back !== J(p)) return `palier ${tier} : retour ${back} au lieu de ${J(p)}`;
  if (!SHOWN[key](pg.d, p)) return `palier ${tier} : ${J(p)} mal affiché`;
  if (answerOf(rightBtn(pg)) !== ANSWER[key](p)) return `palier ${tier} : mauvaise solution pour ${J(p)}`;
  if (J(Object.keys(q2).sort()) !== J(Object.keys(q1).sort()))
    return `palier ${tier} : question des indices ${J(Object.keys(q2))} au lieu de ${J(Object.keys(q1))}`;
  if (same(q2) !== same(q1)) return `palier ${tier} : indices différents pour ${J(p)}`;
  return '';
}
// Une question tirée par le jeu, puis item, render, item : `bad` dit ce qui ne va pas,
// `counted` si la question compte (un calcul qui dépasse 100 n'est pas gardé)
function roundTripOnce(pg, key, tier) {
  startGame(pg, key, tier);
  const q1 = hintQ(pg);
  let p;
  try {
    p = JSON.parse(pg.js(`REVIEW_REPLAYS[${J(key)}].item(hint.q)`));
  } catch (e) {
    return { bad: e.message, counted: false };
  }
  const expected = EXPECTED_PARAMS[key](q1);
  // seule exception : un calcul qui dépasse 100 (palier 5 ou 6) n'est pas gardé
  if (p === null && key === 'calc' && !pg.ev(`validParams(${J(expected)})`)) return { bad: '', counted: false };
  if (J(p) !== J(expected)) return { bad: `palier ${tier} : item ${J(p)} au lieu de ${J(expected)}`, counted: true };
  return { bad: replayedBad(pg, key, { tier, p, q1 }), counted: true };
}
function roundTripGame(pg, key) {
  const tiers = key === 'calc' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  let bad = '',
    n = 0;
  for (const tier of tiers) {
    for (let round = 0; round < 6 && !bad; round++) {
      const r = roundTripOnce(pg, key, tier);
      bad = r.bad;
      if (r.counted) n++;
    }
  }
  check(`${key} : item, render, item redonne le même item (${n} questions)`, !bad && n >= 20, bad || `${n} questions`);
}

async function roundTripTests(pg) {
  section('S4 : aller-retour item / render, à chaque palier (ligne 8)');
  for (const key of Object.keys(CHOICES)) roundTripGame(pg, key);
  startGame(pg, 'compare', 2);
  pg.ev(`renderCompare(${J(P.compare)})`);
  rightBtn(pg).click();
  check(
    'un jeu rejoué gagne comme avant (hors mission, la victoire normale)',
    await waitFor(() => pg.d.getElementById('btn-yay')),
  );
  pg.ev('closeModal()');
  check('une question qui ne ressemble à rien ne donne aucun item', () =>
    ['math', 'calc', 'compare', 'clock', 'reading'].every((key) =>
      [null, 'x', 42, {}, { a: 'x' }, { ops: 'x' }, { correct: null }].every(
        (q) => pg.ev(`REVIEW_REPLAYS[${J(key)}].item(${J(q)})`) === null,
      ),
    ),
  );
}

async function captureTests() {
  const pg = await newPlayer({ day: CAPTURE_DAY, fast: true });
  captureKeptTests(pg);
  captureAgainTests(pg);
  await captureNothingTests(pg);
  captureFullTests(pg);
  replayTests(pg);
  await roundTripTests(pg);
  done(pg);
}

/* ============ S6 et S7 : la mission « souvenirs » ============ */
// Nina, déjà connue, avec une file donnée, à un jour donné ; minuteries ×0,1
async function ninaPage(review, day) {
  const pg = boot({
    day,
    fast: true,
    saved: {
      'lagon-magique-profiles': profilesOf(),
      'lagon-magique-save:p1': J({ v: 9, name: 'Nina', avatar: '👧', coins: 12, missions: 7, review }),
    },
  });
  await wait(200);
  // les appels de la pause (game:before, game:after) sont comptés
  pg.ev(`window.__before = []; window.__after = [];
    on('game:before', (k) => { __before.push(k); }); on('game:after', (r) => { __after.push(r); });
    window.__badges = [];
    const body = document.getElementById('modal-body');
    new MutationObserver(() => {
      const b = body.querySelector('.review-badge');
      if (b && __badges[__badges.length - 1] !== b.textContent) __badges.push(b.textContent);
    }).observe(body, { childList: true, subtree: true });`);
  return pg;
}
// une séance commence : l'enfant touche « Jouer » sur l'écran titre
async function startSession(pg) {
  if (!pg.d.getElementById('splash').classList.contains('show')) pg.ev('closeModal(); showSplash()');
  pg.d.getElementById('btn-splash-play').click();
  await wait(200); // la chaîne de début de séance passe 700 ms après (70 ms ici)
}
// la phrase a été dite (la voix reçoit le texte mis en forme par toSpoken)
const heard = (pg, text) => pg.spoken.includes(pg.ev(`toSpoken(${J(text)})`));
const offerOpen = (pg) => !!pg.d.getElementById('review-offer') && modalOpen(pg);
const modalOpen = (pg) => pg.d.getElementById('overlay').classList.contains('show');
const badge = (pg) => (pg.d.querySelector('.review-badge') || { textContent: '' }).textContent;
const currentGame = (pg) => pg.ev('lastGame');
const REVIEW_SHOW = 1500 * SPEED,
  WIN = 400 * SPEED;
// tout ce que la mission ne doit pas changer (le temps de jeu, lui, avance tout seul)
const untouched = (pg) => pg.js('Object.assign({}, state, { review: 0, playTime: 0 })');
// le palier 3 pour tous : un jeu normal y a des cœurs et un minuteur
const tier3 = (pg) =>
  pg.ev(`currentProfile().age = 0; state.missions = 200; currentWorld = 'montagne';
    ['math', 'calc', 'compare', 'clock', 'reading', 'count'].forEach((k) => {
      state.skills[k] = { wins: 0, fails: 0, errors: 0, last: null, recent: [], lvl: 3 };
    }); save()`);
const D = '2026-11-21';
const byKey = (pg, k) => queue(pg).items.find((x) => x.k === k);
const GLOW_PHRASE = `toSpoken("Regarde, c'était celle-ci.")`;

async function offerShownTests(pg) {
  const { ev, d, spoken, w } = pg;
  check('rien avant « Jouer »', !offerOpen(pg));
  await startSession(pg);
  check("la proposition s'ouvre en début de séance (#review-offer)", offerOpen(pg));
  const name = ev('COMPANIONS[currentCompanion()].name');
  check('son titre : 🌟 Les souvenirs', () => d.querySelector('#review-offer h2').textContent === '🌟 Les souvenirs');
  check(
    'le compagnon principal propose, sa phrase est écrite avec son nom',
    () =>
      d
        .getElementById('review-offer')
        .textContent.replace(/\s+/g, ' ')
        .includes(`${name} : J'ai un souvenir pour toi. On joue ensemble ?`) &&
      !!d.querySelector('#review-offer .buddy-slot svg'),
    () => d.getElementById('review-offer').textContent,
  );
  check('sa phrase est dite, sans le nom', heard(pg, "J'ai un souvenir pour toi. On joue ensemble ?"), J(spoken));
  check(
    'deux boutons : « 🌟 On joue ! » et « Plus tard »',
    () =>
      d.getElementById('review-yes').textContent === '🌟 On joue !' &&
      d.getElementById('review-later').textContent === 'Plus tard',
  );
  check("`offered` vaut aujourd'hui, et c'est enregistré", () => {
    const saved = JSON.parse(w.localStorage.getItem('lagon-magique-save:p1')).review;
    return ev('state.review.offered') === D && saved.offered === D;
  });
  check('la pause a été consultée une seule fois, pour « souvenirs »', pg.js('__before') === J(['souvenirs']));
  check(
    'jamais « erreur », « raté » ni « faux » dans la proposition',
    () => !/erreur|rat[ée]|faux/i.test(d.getElementById('modal-body').textContent),
  );
}

async function offerRefusedTests(pg) {
  section('S7 : refuser (ligne 10)');
  const { ev, d } = pg;
  const before = pg.js('state.review');
  d.getElementById('review-later').click();
  check('« Plus tard » ferme la fenêtre, la file ne change pas', !modalOpen(pg) && pg.js('state.review') === before);
  check("la proposition ne revient pas aujourd'hui", ev('maybeOfferReview()') === false && !modalOpen(pg));
  await startSession(pg);
  check('ni à la séance suivante du même jour', !offerOpen(pg));
  pg.setDay('2026-11-22');
  await startSession(pg);
  check('elle revient le lendemain', offerOpen(pg) && ev('state.review.offered') === '2026-11-22');
  d.getElementById('modal-close').click();
  check('fermer la fenêtre (croix) : rien ne change non plus', () => {
    const q = queue(pg);
    return !modalOpen(pg) && J(q.items) === J([item('math')]) && ev('maybeOfferReview()') === false;
  });
  check("un refus n'annonce aucune fin de mission", pg.js('__after') === '[]');
}

// la fenêtre fermée et une file d'un item dû, puis un réglage de plus
const freshOffer = (pg, more = '') =>
  pg.ev(`closeModal(); state.review = ${J({ items: [item('math')], offered: null })}; ${more}`);

async function offerAbsentTests(pg) {
  section('S6 : quand la proposition ne vient pas');
  const { ev, d } = pg;
  const fresh = (more) => freshOffer(pg, more);
  const none = () => ev('maybeOfferReview()') === false && !modalOpen(pg);
  fresh();
  check('contrôle : avec ces réglages, elle vient', ev('maybeOfferReview()') === true && offerOpen(pg));
  fresh(`state.review.items[0].due = ${J(ev('addDays(dayKey(new Date()), 1)'))}`);
  check("aucun item dû aujourd'hui", none());
  fresh('party.active = true');
  check('à plusieurs, chacun son tour (ligne 18)', none());
  await startSession(pg);
  check('à plusieurs : rien non plus en début de séance (ligne 18)', !offerOpen(pg));
  fresh('party.active = false; race.active = true');
  check('à plusieurs, en course (ligne 18)', none());
  fresh('race.active = false; openModal("<p id=autre>autre fenêtre</p>")');
  check('une fenêtre est déjà ouverte', ev('maybeOfferReview()') === false && !!d.getElementById('autre'));
  fresh('window.__name = state.name; state.name = ""');
  check('pas de prénom', none());
  ev('state.name = __name');
  check('dans tous ces cas, `offered` reste libre', ev('state.review.offered') === null);
}

function offerPauseTests(pg) {
  section('S7 : la pause gagne toujours');
  const { ev, d } = pg;
  freshOffer(
    pg,
    'window.__before.length = 0; currentProfile().pauseMin = 20; saveProfiles(); state.pauseExtra = null; state.playTime = { [todayKey()]: 25 * 60 }; save()',
  );
  const offered = ev('maybeOfferReview()');
  const veil = d.getElementById('rest-veil');
  check('pause due : aucune proposition', offered === false && !offerOpen(pg));
  check('le voile de la pause est là', !!veil && !veil.hidden);
  check('la pause a été consultée une fois', pg.js('__before') === J(['souvenirs']));
  check('`offered` reste libre : la proposition viendra après la pause', ev('state.review.offered') === null);
  ev('currentProfile().pauseMin = 0; saveProfiles(); state.playTime = {}; save(); restWake()');
}

function offerCountTests(pg) {
  section('S6 : un, deux ou trois souvenirs');
  for (const [names, words] of [
    [['math', 'clock'], 'deux souvenirs'],
    [['math', 'clock', 'compare'], 'trois souvenirs'],
    [['math', 'clock', 'compare', 'reading', 'calc'], 'trois souvenirs'],
  ]) {
    pg.ev(`closeModal(); state.review = ${J({ items: names.map((n) => item(n)), offered: null })}`);
    pg.spoken.length = 0;
    pg.ev('maybeOfferReview()');
    check(
      `${names.length} items dus : « ${words} »`,
      heard(pg, `J'ai ${words} pour toi. On joue ensemble ?`),
      J(pg.spoken),
    );
  }
}

async function offerTests() {
  section('S6 : la proposition du compagnon (ligne 9)');
  const pg = await ninaPage({ items: [item('math')], offered: null }, D);
  await offerShownTests(pg);
  await offerRefusedTests(pg);
  await offerAbsentTests(pg);
  offerPauseTests(pg);
  offerCountTests(pg);
  done(pg);
}

// l'exemple 1 de pickDue, au jour J : B (math, box 3), F (calc, box 3), C (clock, box 1)
const RUN_ITEMS = [
  item('math', { due: '2026-11-20' }), // A : même jeu que B, refusé à la passe 1
  item('minus', { box: 3, due: '2026-11-19', t: 5 }), // B
  item('clock', { due: '2026-11-21' }), // C
  item('compare', { box: 7, due: '2026-11-22' }), // D : pas encore dû
  item('reading', { due: '2026-11-23' }), // E : pas encore dû
  item('calc', { box: 3, due: '2026-11-21' }), // F
];
const noTimerNoLives = (d) => !d.getElementById('challenge-timer') && !d.getElementById('lives-bar');

// question 1 : B (9 − 4), telle qu'elle s'affiche
function runFirstShown(pg) {
  const { ev, d } = pg;
  check('ligne 11 : la première question est celle choisie par pickDue (9 − 4)', () => SHOWN.math(d, P.minus));
  check('ligne 11 : son jeu est le jeu courant (setLastGame)', currentGame(pg) === 'math');
  check(
    "ligne 11 : le badge 🌟 1/3, dans l'en-tête",
    () =>
      badge(pg) === '🌟 1/3' &&
      d.querySelector('.game-head .review-badge').getAttribute('aria-label') === 'Souvenir 1 sur 3',
    () => badge(pg),
  );
  check('ligne 12 : ni minuteur, ni cœurs', noTimerNoLives(d));
  check('ligne 12 : le bouton 💡 est là et donne un indice', () => {
    d.querySelector('.hint-btn').click();
    return ev('hintLevel()') === 1;
  });
  ev('delete state.skills.math.hints; save()'); // l'indice demandé pour ce test n'est pas compté plus bas
}

// question 1 : une bonne réponse
async function runFirstRight(pg) {
  pg.spoken.length = 0;
  rightBtn(pg).click();
  check(
    'ligne 13 : rien ne change avant WIN_DELAY',
    J(byKey(pg, KEY.minus)) === J(RUN_ITEMS[1]) && badge(pg) === '🌟 1/3',
  );
  const t1 = Date.now();
  check('ligne 13 : la question suivante arrive', await waitFor(() => badge(pg) === '🌟 2/3', 1000));
  check(`ligne 13 : … WIN_DELAY après (${Date.now() - t1} ms)`, Date.now() - t1 >= WIN - 15);
  check(
    'ligne 13 : box 3 devient box 7, dû 7 jours après (le palier `t` ne change pas)',
    J(byKey(pg, KEY.minus)) === J(item('minus', { box: 7, due: '2026-11-28', t: 5 })),
    J(byKey(pg, KEY.minus)),
  );
  check(
    'ligne 13 : la partie est enregistrée',
    () => J(JSON.parse(pg.w.localStorage.getItem('lagon-magique-save:p1')).review) === pg.js('state.review'),
  );
}

// question 2 : F (23 + 14), une erreur ; rend la bonne réponse et l'instant de l'erreur
function runSecondWrong(pg) {
  const { ev, d, spoken } = pg;
  check('ligne 11 : deuxième question, 23 + 14 (calc)', () => SHOWN.calc(d, P.calc) && currentGame(pg) === 'calc');
  check('ligne 12 : toujours ni minuteur, ni cœurs', noTimerNoLives(d));
  spoken.length = 0;
  const right = rightBtn(pg);
  wrongBtn(pg, 'calc').click();
  const t2 = Date.now();
  const buttons = [...d.querySelectorAll('#modal-body button')];
  check(
    'ligne 14 : tous les boutons sont désactivés (sauf « écouter »)',
    buttons.length > 3 && buttons.every((b) => b.disabled === !b.classList.contains('btn-speak')),
    J(buttons.map((b) => [b.className, b.disabled])),
  );
  check('ligne 14 : la bonne réponse brille', right.classList.contains('hint-glow'));
  check('ligne 14 : une seule phrase est dite', J(spoken) === J([ev(GLOW_PHRASE)]), J(spoken));
  return { right, t2 };
}

// question 2, après l'erreur : seule la première réponse compte, puis on passe à la suite
async function runSecondLocked(pg, { right, t2 }) {
  right.click();
  right.disabled = false; // même si le bouton était encore actif, la première réponse compte seule
  right.click();
  await wait(REVIEW_SHOW / 2);
  // à mi-délai, rien n'a bougé (sans objet si la machine a pris du retard : le délai est déjà passé)
  const late = (t) => Date.now() - t >= REVIEW_SHOW - 30;
  check('ligne 14 : la bonne réponse touchée ensuite ne compte pas', () => {
    const it = byKey(pg, KEY.calc);
    return late(t2) || (badge(pg) === '🌟 2/3' && J(it) === J(RUN_ITEMS[5]));
  });
  check('ligne 14 : on passe à la suite', await waitFor(() => badge(pg) === '🌟 3/3', 1000));
  check(`ligne 14 : … REVIEW_SHOW_MS après l'erreur (${Date.now() - t2} ms)`, Date.now() - t2 >= REVIEW_SHOW - 15);
  check(
    'ligne 14 : box 1, dû le lendemain, fails + 1',
    J(byKey(pg, KEY.calc)) === J(item('calc', { box: 1, due: '2026-11-22', fails: 1 })),
    J(byKey(pg, KEY.calc)),
  );
  check(
    "ligne 14 : la même question n'est pas reposée",
    () => SHOWN.clock(pg.d, P.clock) && currentGame(pg) === 'clock',
  );
}

// question 3 : C (3 h 30), une bonne réponse, puis l'écran de fin
async function runEndScreen(pg) {
  const { ev, d, spoken } = pg;
  spoken.length = 0;
  rightBtn(pg).click();
  check("ligne 16 : l'écran de fin s'ouvre", await waitFor(() => d.getElementById('review-end'), 1000));
  const phrase = `Bravo, tu t'en es ${ev('ac("souvenu", "souvenue")')} ! On garde les autres pour bientôt.`;
  check(
    'ligne 16 : il dit et montre la phrase « au moins une juste »',
    heard(pg, phrase) && d.getElementById('review-end').textContent.includes(phrase),
    J(spoken),
  );
  check('ligne 16 : son bouton « Super ! »', () => d.getElementById('review-done').textContent === 'Super !');
  check(
    'ligne 16 : ni objet gagné, ni minuteur, ni cœurs',
    !d.querySelector('.reward-item, [data-gain-item], #lives-bar, #challenge-timer'),
  );
  check(
    'ligne 16 : une fin de mission est annoncée, une seule',
    pg.js('__after') === J([{ win: true }]),
    pg.js('__after'),
  );
  check("la pause n'a été consultée qu'une fois, avant la proposition", pg.js('__before') === J(['souvenirs']));
  check(
    'ligne 13 : box 1 devient box 3, dû 3 jours après',
    J(byKey(pg, KEY.clock)) === J(item('clock', { box: 3, due: '2026-11-24' })),
  );
  const others = [RUN_ITEMS[0], RUN_ITEMS[3], RUN_ITEMS[4]];
  check('les items non choisis ne changent pas', J(others.map((x) => byKey(pg, x.k))) === J(others));
  check('les badges vus : 1/3, 2/3, 3/3', pg.js('__badges') === J(['🌟 1/3', '🌟 2/3', '🌟 3/3']), pg.js('__badges'));
}

// après l'écran de fin : rien n'a été gagné, et un jeu normal redevient normal
function runAfter(pg, state0) {
  const { ev, d } = pg;
  d.getElementById('review-done').click();
  check('« Super ! » ferme la fenêtre', !modalOpen(pg));
  check(
    'ligne 16 : rien gagné, rien compté (pièces, objets, missions, progrès, quêtes, parties jouées)',
    untouched(pg) === state0,
    `${untouched(pg)}\n     ≠ ${state0}`,
  );
  check('ligne 16 : aucun défi bonus', ev('bonusChallenge') === null);
  check('après la mission, un jeu normal retrouve ses cœurs et son minuteur', () => {
    ev('playGame("math")');
    return (
      !!d.getElementById('lives-bar') && !!d.getElementById('challenge-timer') && !d.querySelector('.review-badge')
    );
  });
  ev('closeModal()');
}

async function runTests() {
  section("S6 : une mission, de la proposition à l'écran de fin (lignes 11 à 16)");
  const pg = await ninaPage({ items: RUN_ITEMS, offered: null }, D);
  await startSession(pg);
  tier3(pg);
  check('la proposition annonce trois souvenirs', heard(pg, "J'ai trois souvenirs pour toi. On joue ensemble ?"));
  const state0 = untouched(pg);
  pg.d.getElementById('review-yes').click();
  runFirstShown(pg);
  await runFirstRight(pg);
  await runSecondLocked(pg, runSecondWrong(pg));
  await runEndScreen(pg);
  runAfter(pg, state0);
  done(pg);
}

const STOP_ITEMS = [item('math', { box: 7 }), item('clock', { box: 3 }), item('compare')];

// deux erreurs : la bonne réponse est montrée, puis l'écran de fin remplace la question 3
async function stopAfterTwoTests(pg) {
  const { ev, d, spoken } = pg;
  check("question 1 (la mieux sue d'abord : box 7)", () => SHOWN.math(d, P.math) && badge(pg) === '🌟 1/3');
  wrongBtn(pg, 'math').click();
  const t1 = Date.now();
  check(
    'T + 1500 ms : question 2',
    (await waitFor(() => badge(pg) === '🌟 2/3', 1000)) && Date.now() - t1 >= REVIEW_SHOW - 5,
  );
  spoken.length = 0;
  const right = rightBtn(pg);
  wrongBtn(pg, 'clock').click();
  const t2 = Date.now();
  check(
    'deuxième erreur : la bonne réponse est montrée comme la première fois',
    right.classList.contains('hint-glow') &&
      J(spoken) === J([ev(GLOW_PHRASE)]) &&
      [...d.querySelectorAll('#modal-body button:not(.btn-speak)')].every((b) => b.disabled),
  );
  await wait(REVIEW_SHOW / 2);
  check(
    '… et elle reste affichée',
    Date.now() - t2 >= REVIEW_SHOW - 30 || (badge(pg) === '🌟 2/3' && !d.getElementById('review-end')),
  );
  check("T2 + 1500 ms : l'écran de fin", await waitFor(() => d.getElementById('review-end'), 1000));
  check(`… pas avant (${Date.now() - t2} ms)`, Date.now() - t2 >= REVIEW_SHOW - 15);
  await wait(REVIEW_SHOW * 2);
  check(
    "la question 3 n'est jamais affichée",
    pg.js('__badges') === J(['🌟 1/3', '🌟 2/3']) && !!d.getElementById('review-end'),
  );
}

function stopEndTests(pg) {
  const { d, spoken } = pg;
  check("l'item de la question 3 est identique", J(byKey(pg, KEY.compare)) === J(STOP_ITEMS[2]));
  check(
    'les deux items ratés : box 1, dû le lendemain, fails + 1',
    J([byKey(pg, KEY.math), byKey(pg, KEY.clock)]) ===
      J([item('math', { due: '2026-11-22', fails: 1 }), item('clock', { due: '2026-11-22', fails: 1 })]),
  );
  const none = "Merci d'avoir joué avec moi ! On en reparle bientôt.";
  check(
    'fin, aucune juste : la phrase',
    heard(pg, none) && d.getElementById('review-end').textContent.includes(none),
    J(spoken),
  );
  check('une fin de mission annoncée', pg.js('__after') === J([{ win: true }]));
  check(
    "jamais « erreur », « raté » ni « faux » à l'écran de fin",
    !/erreur|rat[ée]|faux/i.test(d.getElementById('modal-body').textContent),
  );
  d.getElementById('review-done').click();
}

// tout juste, avec les dernières transitions : box 7 sort, box 3 passe à 7
async function allRightTests(pg) {
  const { ev, d, spoken } = pg;
  pg.setDay('2026-11-25');
  ev(`state.review = ${J({ items: [item('math', { box: 7 }), item('clock', { box: 3 })], offered: null })}`);
  await startSession(pg);
  d.getElementById('review-yes').click();
  spoken.length = 0;
  rightBtn(pg).click();
  await waitFor(() => badge(pg) === '🌟 2/2', 1000);
  rightBtn(pg).click();
  await waitFor(() => d.getElementById('review-end'), 1000);
  const all = 'Bravo, ta mémoire a bien travaillé !';
  check(
    'fin, tout juste : la phrase',
    heard(pg, all) && d.getElementById('review-end').textContent.includes(all),
    J(spoken),
  );
  check(
    'réussite en box 7 : sorti de la file ; en box 3 : box 7, dû 7 jours après',
    pg.js('state.review.items') === J([item('clock', { box: 7, due: '2026-12-02' })]),
    pg.js('state.review.items'),
  );
  d.getElementById('review-done').click();
}

// une 3ᵉ erreur de révision fait sortir l'item
async function thirdFailTests(pg) {
  const { ev, d } = pg;
  pg.setDay('2026-11-26');
  ev(`state.review = ${J({ items: [item('math', { fails: 2 }), item('clock')], offered: null })}`);
  await startSession(pg);
  d.getElementById('review-yes').click();
  wrongBtn(pg, ev('lastGame')).click();
  await waitFor(() => badge(pg) === '🌟 2/2', 1000);
  check(
    'échec avec fails 2 : sorti de la file',
    pg.js('state.review.items') === J([item('clock')]),
    pg.js('state.review.items'),
  );
  ev('closeModal()');
}

async function stopTests() {
  section('S6 : arrêt après deux erreurs (ligne 15), et les autres phrases de fin');
  const pg = await ninaPage({ items: STOP_ITEMS, offered: null }, D);
  await startSession(pg);
  pg.d.getElementById('review-yes').click();
  await stopAfterTwoTests(pg);
  stopEndTests(pg);
  await allRightTests(pg);
  await thirdFailTests(pg);
  done(pg);
}

// fermée pendant WIN_DELAY, après une bonne réponse ; rend la file d'avant cette réponse
async function closeDuringWinTests(pg) {
  const { d } = pg;
  d.getElementById('review-yes').click();
  rightBtn(pg).click();
  await waitFor(() => badge(pg) === '🌟 2/3', 1000);
  const after1 = pg.js('state.review');
  rightBtn(pg).click();
  d.getElementById('modal-close').click();
  await wait(WIN * 2 + 50);
  check('fermée pendant WIN_DELAY : aucune fenêtre ne revient', !modalOpen(pg));
  check(
    "… l'item de la question affichée ne change pas, les autres non plus",
    pg.js('state.review') === after1,
    pg.js('state.review'),
  );
  check("… l'item déjà joué garde son nouvel état (sorti après box 7)", !byKey(pg, KEY.math));
  return after1;
}

// fermée (Échap) pendant REVIEW_SHOW_MS, après une erreur
async function closeDuringShowTests(pg, after1) {
  const { ev, d, w } = pg;
  ev('state.review.offered = null; maybeOfferReview()');
  d.getElementById('review-yes').click();
  check('une nouvelle mission repart de la question 1', badge(pg) === '🌟 1/2');
  wrongBtn(pg, ev('lastGame')).click();
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' }));
  await wait(REVIEW_SHOW * 2);
  check('fermée (Échap) pendant REVIEW_SHOW_MS : aucune fenêtre ne revient', !modalOpen(pg));
  check(
    "… l'item de la question affichée ne change pas",
    pg.js('state.review.items') === J(JSON.parse(after1).items),
    pg.js('state.review.items'),
  );
  check("un abandon n'annonce aucune fin de mission", pg.js('__after') === '[]');
  check('après un abandon, un jeu normal a ses cœurs et son minuteur', () => {
    ev('playGame("math")');
    return !!d.getElementById('lives-bar') && !!d.getElementById('challenge-timer');
  });
  ev('closeModal()');
}

async function playOverTests(pg) {
  section('S7 : un jeu normal lancé par-dessus la mission, sans la fermer');
  const { ev, d } = pg;
  ev('state.review.offered = null; maybeOfferReview()');
  d.getElementById('review-yes').click();
  const open = pg.js('state.review');
  ev('playGame("count")');
  check('le jeu a ses cœurs et son minuteur', !!d.getElementById('lives-bar') && !!d.getElementById('challenge-timer'));
  check('plus de badge de souvenir', !d.querySelector('.review-badge'));
  const lives = () => d.querySelectorAll('#lives-bar .life.on').length;
  const full = lives();
  [...d.querySelectorAll('.num-btn')].find((b) => b !== rightBtn(pg)).click();
  check("une erreur y coûte un essai, comme d'habitude", lives() === full - 1);
  await wait(REVIEW_SHOW * 2);
  check(
    'une autre question du même jeu est reposée, jamais un souvenir',
    !!d.querySelector('.count-row') &&
      !d.querySelector('.review-badge') &&
      !d.getElementById('review-end') &&
      [...d.querySelectorAll('.num-btn')].every((b) => !b.disabled),
  );
  check('la file ne change pas (count ne se garde pas)', pg.js('state.review') === open);
  rightBtn(pg).click();
  check('et une bonne réponse y mène à la victoire normale', await waitFor(() => d.getElementById('btn-yay'), 1000));
  ev('closeModal()');
}

async function closeTests() {
  section('S7 : la fenêtre se ferme en cours de mission (ligne 17)');
  const pg = await ninaPage({ items: STOP_ITEMS, offered: null }, D);
  await startSession(pg);
  tier3(pg);
  const after1 = await closeDuringWinTests(pg);
  await closeDuringShowTests(pg, after1);
  await playOverTests(pg);
  done(pg);
}

const dueOf = (pg) => (queue(pg).items[0] || { due: 'sorti' }).due;
// le jour donné : la proposition vient, la question `p` est reposée et réussie
async function playOn(pg, p, day) {
  const { d } = pg;
  pg.setDay(day);
  await startSession(pg);
  if (!offerOpen(pg)) return false;
  d.getElementById('review-yes').click();
  if (!SHOWN.compare(d, p)) return false;
  rightBtn(pg).click();
  await waitFor(() => d.getElementById('review-end'), 1000);
  d.getElementById('review-done').click();
  return true;
}

async function lifeRightTests(pg) {
  const due = () => dueOf(pg);
  pg.ev('closeModal(); playGame("compare")'); // sur le lagon, au palier 1
  const p = EXPECTED_PARAMS.compare(hintQ(pg));
  wrongBtn(pg, 'compare').click();
  pg.ev('closeModal()');
  check('raté le 1er : dû le 2', due() === '2026-12-02', due());
  await startSession(pg);
  check('le 1er : pas de proposition', !offerOpen(pg));
  check('le 2 : proposée, réussie : dû le 5', (await playOn(pg, p, '2026-12-02')) && due() === '2026-12-05', due());
  pg.setDay('2026-12-04');
  await startSession(pg);
  check('le 4 : pas de proposition', !offerOpen(pg));
  check('le 5 : proposée, réussie : dû le 12', (await playOn(pg, p, '2026-12-05')) && due() === '2026-12-12', due());
  check(
    'le 12 : proposée, réussie : sortie de la file',
    (await playOn(pg, p, '2026-12-12')) && due() === 'sorti',
    due(),
  );
  pg.setDay('2026-12-13');
  await startSession(pg);
  check('le 13 : plus rien à proposer', !offerOpen(pg));
}

// l'autre branche : raté en révision le lendemain, dû le surlendemain
async function lifeWrongTests(pg) {
  const { ev, d } = pg;
  pg.setDay('2026-12-20');
  ev('closeModal(); playGame("compare")');
  wrongBtn(pg, 'compare').click();
  ev('closeModal()');
  const p2 = queue(pg).items[0].p;
  pg.setDay('2026-12-21');
  await startSession(pg);
  d.getElementById('review-yes').click();
  check('le lendemain, la question ratée est reposée', () => SHOWN.compare(d, p2));
  wrongBtn(pg, 'compare').click();
  await waitFor(() => d.getElementById('review-end'), 1000);
  check('ratée en révision le 21 : due le 22', dueOf(pg) === '2026-12-22', dueOf(pg));
  ev('closeModal()');
}

async function lifeTests() {
  section('Lignes 1, 9, 13, 19 : du premier raté à la sortie de la file');
  const pg = await newPlayer({ day: '2026-12-01', fast: true });
  await lifeRightTests(pg);
  await lifeWrongTests(pg);
  done(pg);
}

async function main() {
  await pureTests();
  await saveTests();
  await captureTests();
  await offerTests();
  await runTests();
  await stopTests();
  await closeTests();
  await lifeTests();
  console.log(`\n${failed ? '❌' : '✅'} révision : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
}
main();
