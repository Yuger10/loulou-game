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

/* Une page du jeu. `day` : le jour simulé (la classe Date de la page part de
   midi ce jour-là et avance avec le temps réel ; `setDay` change de jour).
   `fast` : minuteries du jeu ×0,1. `saved` : le stockage de départ. */
function boot({ saved, day, fast } = {}) {
  const spoken = [];
  const clock = { base: 0, t0: Date.now() };
  const at = (k) => {
    const [y, m, dd] = k.split('-').map(Number);
    return new Date(y, m - 1, dd, 12).getTime();
  };
  if (day) clock.base = at(day);
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    beforeParse(win) {
      if (fast) {
        const st = win.setTimeout.bind(win),
          si = win.setInterval.bind(win);
        win.setTimeout = (fn, ms, ...a) => st(fn, Math.round((ms || 0) * SPEED), ...a);
        win.setInterval = (fn, ms, ...a) => si(fn, Math.max(1, Math.round((ms || 0) * SPEED)), ...a);
      }
      if (day) {
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
      clock.base = at(k);
      clock.t0 = Date.now();
    },
  };
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
async function pureTests() {
  const { ev, js, errs, w } = boot();
  await wait(100);
  const eq = (name, code, expected) =>
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

  section('S1 : la clé');
  for (const name of Object.keys(P)) eq(`reviewKey ${name} : ${KEY[name]}`, `reviewKey(${J(P[name])})`, KEY[name]);
  eq(
    'reviewKey : les autres exemples de la table',
    `[reviewKey({ g:'calc', mult:{ a:10, b:10 } }), reviewKey({ g:'compare', a:8, b:8 }), reviewKey({ g:'clock', h:12, m:0 }), reviewKey({ g:'reading', w:'cheval', img:false })]`,
    ['calc:10x10', 'compare:8-8', 'clock:12-0', 'reading:cheval-0'],
  );

  section('S1 : les bornes (validParams)');
  const inside = [
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
  const outside = [
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
  inside.forEach((p) => check(`dedans : ${J(p)}`, () => ev(`validParams(${J(p)})`) === true));
  outside.forEach((p) => check(`dehors : ${J(p)}`, () => ev(`validParams(${J(p)})`) === false));

  section('S1 : une question ratée entre dans la file (addMiss)');
  const empty = { items: [], offered: null };
  eq('ligne 1 : ajout (box 1, dû le lendemain)', `addMiss(${J(empty)}, ${J(P.math)}, 2, '2026-11-20')`, {
    items: [item('math')],
    offered: null,
  });
  {
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
  {
    // 30 items : des comparaisons 1-2, 1-3… ; le plus ancien est le 5e, et le 9e a la même date
    const full = Array.from({ length: 30 }, (_, i) => ({
      k: `compare:1-${i + 2}`,
      p: { g: 'compare', a: 1, b: i + 2 },
      t: 1,
      due: '2026-11-21',
      box: 1,
      fails: 0,
      added: i === 4 || i === 8 ? '2026-11-01' : '2026-11-10',
    }));
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

  section("S1 : l'échéancier (reviewAnswer)");
  const one = (it, ok, day) => `reviewAnswer(${J({ items: [it], offered: null })}, ${J(it.k)}, ${ok}, '${day}').items`;
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
      let rv = addMiss(${J(empty)}, ${J(P.math)}, 2, '2026-12-01');
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
    `reviewAnswer(addMiss(${J(empty)}, ${J(P.math)}, 2, '2026-12-01'), 'math:7+5', false, '2026-12-02').items[0].due`,
    '2026-12-03',
  );

  section('S1 : le choix des souvenirs (pickDue)');
  {
    const mk = (id, g, box, due) => {
      const p = {
        math: { g: 'math', a: 1, b: id, op: '+' },
        clock: { g: 'clock', h: id, m: 0 },
        compare: { g: 'compare', a: 1, b: id },
        reading: P.reading,
        calc: { g: 'calc', mult: { a: 2, b: id } },
      }[g];
      return { k: `${g}#${id}`, p, t: 1, due, box, fails: 0, added: '2026-11-01' };
    };
    const ex1 = [
      mk(1, 'math', 1, '2026-11-20'), // A
      mk(2, 'math', 3, '2026-11-19'), // B
      mk(3, 'clock', 1, '2026-11-21'), // C
      mk(4, 'compare', 7, '2026-11-22'), // D
      mk(5, 'reading', 1, '2026-11-23'), // E
      mk(6, 'calc', 3, '2026-11-21'), // F
    ];
    eq('exemple 1 : B, F, C', `pickDue(${J({ items: ex1, offered: null })}, '2026-11-22', 3).map((x) => x.k)`, [
      'math#2',
      'calc#6',
      'clock#3',
    ]);
    const ex2 = [
      mk(1, 'math', 1, '2026-11-20'), // X
      mk(2, 'math', 3, '2026-11-21'), // Y
      mk(3, 'math', 1, '2026-11-19'), // Z
      mk(4, 'math', 7, '2026-11-22'), // W
    ];
    eq(
      'exemple 2 (passe 2) : Y, Z, X',
      `pickDue(${J({ items: ex2, offered: null })}, '2026-11-22', 3).map((x) => x.k)`,
      ['math#2', 'math#3', 'math#1'],
    );
    eq(
      'exemple 3 : aucun item dû',
      `pickDue(${J({ items: [mk(5, 'reading', 1, '2026-11-23')], offered: null })}, '2026-11-22', 3)`,
      [],
    );
    eq('une file vide', `pickDue(${J(empty)}, '2026-11-22', 3)`, []);
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

  section('S1 : une file lue du stockage (sanitizeReview)');
  const today = '2026-11-22';
  const san = (raw) => `sanitizeReview(${J(raw)}, '${today}')`;
  for (const raw of [undefined, null, 'x', 42, [], { items: 'x' }, { items: null, offered: 5 }])
    eq(
      `illisible (${J(raw)}) : une file vide`,
      `sanitizeReview(${raw === undefined ? 'undefined' : J(raw)}, '${today}')`,
      {
        items: [],
        offered: null,
      },
    );
  eq('une file valide est gardée telle quelle', san({ items: Object.keys(P).map((n) => item(n)), offered: today }), {
    items: Object.keys(P).map((n) => item(n)),
    offered: today,
  });
  const bad = [
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
  eq('chaque item invalide est retiré', san({ items: [...bad, item('clock')], offered: null }), {
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
  {
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
      `sanitizeReview(${J({ items: [null, ...many], offered: null })}, '${today}').items.map((x) => x.k)`,
      many.slice(0, 30).map((x) => x.k),
    );
  }
  eq(
    "une date `due` trop lointaine est ramenée à aujourd'hui + 7",
    san({ items: [item('math', { due: '2031-01-01' }), item('clock', { due: '2026-11-29' })], offered: null }).concat(
      '.items.map((x) => x.due)',
    ),
    ['2026-11-29', '2026-11-29'],
  );
  for (const offered of ['demain', '2026-02-30', 5, {}, '<img id=pwn src=x>'])
    eq(`offered invalide (${J(offered)}) devient null`, san({ items: [], offered }).concat('.offered'), null);
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  w.close();
}

/* ============ S3 et ligne 5 : la sauvegarde, la migration, l'import ============ */
async function saveTests() {
  const today = '2026-11-22';
  const empty = J({ items: [], offered: null });
  const IMG = '<img id="pwn" src="x">';
  // une file trafiquée : 2 items valides au milieu de tout ce qu'on peut y glisser
  const riggedReview = {
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
  const cleaned = J({ items: [item('math'), item('compare', { due: '2026-11-29' })], offered: null });
  const base = { v: 9, name: 'Nina', avatar: '👧', coins: 12, missions: 7, inventory: { perle: 2 } };

  section("Ligne 5 : une partie d'une version antérieure");
  for (const old of [base, { name: 'Nina', avatar: '👧', coins: 12, missions: 7, inventory: { perle: 2 } }]) {
    const { ev, js, errs, w } = boot({
      day: today,
      saved: { 'lagon-magique-profiles': profilesOf(), 'lagon-magique-save:p1': J(old) },
    });
    await wait(200);
    const v = old.v === undefined ? 0 : old.v;
    check(`v${v} : la version de sauvegarde a augmenté`, () => ev('SAVE_VERSION') > 9);
    check(
      `v${v} : la partie reçoit une file vide`,
      () => js('state.review') === empty,
      () => js('state.review'),
    );
    check(`v${v} : la partie est à la version actuelle`, () => ev('state.v') === ev('SAVE_VERSION'));
    check(
      `v${v} : le reste est identique`,
      () => js('[state.name, state.coins, state.missions, state.inventory]') === J(['Nina', 12, 7, { perle: 2 }]),
    );
    check(
      `v${v} : la partie réenregistrée porte la file`,
      () => J(JSON.parse(w.localStorage.getItem('lagon-magique-save:p1')).review) === empty,
    );
    check(`v${v} : une partie neuve a une file vide`, () => js('freshState().review') === empty);
    check(`v${v} : aucune erreur JS`, errs.length === 0, errs.join(' | '));
    w.close();
  }

  section('S3 : une partie trafiquée, chargée');
  for (const [name, review, expected] of [
    ['file trafiquée', riggedReview, cleaned],
    ['review: "x"', 'x', empty],
    ['review: null', null, empty],
    ['review: []', [], empty],
    ['items: "x"', { items: 'x', offered: today }, J({ items: [], offered: today })],
  ]) {
    // à une ancienne version (migration) comme à une version sans migration
    for (const v of [9, 99]) {
      const { ev, js, d, errs, w } = boot({
        day: today,
        saved: { 'lagon-magique-profiles': profilesOf(), 'lagon-magique-save:p1': J({ ...base, v, review }) },
      });
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
  }

  section("S3 : une partie trafiquée, importée (applyBackup) ou lue par l'espace parents");
  {
    const { ev, js, d, errs, w } = boot({
      day: today,
      saved: {
        'lagon-magique-profiles': profilesOf(),
        'lagon-magique-save:p1': J(base),
        'lagon-magique-save:p2': J({ ...base, name: 'Léo', review: riggedReview }),
      },
    });
    await wait(200);
    check(
      "espace parents : la file d'un autre joueur passe par readSave",
      () => js('profileState("p2").review') === cleaned,
      () => js('profileState("p2").review'),
    );
    ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace("p2")');
    await wait(100);
    check("espace parents : rien n'est injecté", !d.getElementById('pwn') && errs.length === 0, errs.join(' | '));
    check(
      "espace parents : la partie lue n'est pas réécrite",
      () =>
        JSON.parse(w.localStorage.getItem('lagon-magique-save:p2')).review.items.length === riggedReview.items.length,
    );
    ev('closeModal()');
    const backup = {
      at: '2026-11-22T10:00:00.000Z',
      data: {
        'lagon-magique-profiles': profilesOf(),
        'lagon-magique-save:p1': J({ ...base, coins: 77, review: riggedReview }),
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
      () => js('state.review') === cleaned,
      () => js('state.review'),
    );
    check(
      "import : rien n'est injecté, aucune erreur JS",
      !d.getElementById('pwn') && errs.length === 0,
      errs.join(' | '),
    );
    w.close();
  }

  section('Une file enregistrée survit au redémarrage');
  {
    const a = boot({ day: today });
    await wait(200);
    a.d.getElementById('btn-splash-play').click();
    a.d.getElementById('name-input').value = 'Zoé';
    a.d.querySelector('.avatar-opt').click();
    a.d.getElementById('btn-start').click();
    await wait(300);
    const review = { items: Object.keys(P).map((n) => item(n)), offered: today };
    a.ev(`closeModal(); state.review = ${J(review)}; save()`);
    const saved = storageOf(a.w);
    a.w.close();
    const b = boot({ day: today, saved });
    await wait(300);
    check(
      'la file est retrouvée telle quelle',
      () => b.js('state.review') === J(review),
      () => b.js('state.review'),
    );
    b.ev('load()');
    check('et encore après un second chargement', () => b.js('state.review') === J(review));
    check('aucune erreur JS', b.errs.length === 0, b.errs.join(' | '));
    b.w.close();
  }
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

async function captureTests() {
  const today = '2026-11-20';
  const pg = await newPlayer({ day: today, fast: true });
  const { ev, js, errs, w } = pg;
  const queue = () => JSON.parse(js('state.review'));
  const stored = () => JSON.parse(w.localStorage.getItem(ev('currentSaveKey()'))).review;

  section('S2 : une mauvaise réponse est gardée (ligne 1)');
  for (const [key, tier] of [
    ['math', 2],
    ['calc', 4],
    ['compare', 3],
    ['clock', 5],
    ['reading', 1],
    ['reading', 3],
  ]) {
    ev('state.review = { items: [], offered: null }; save()');
    startGame(pg, key, tier);
    const p = EXPECTED_PARAMS[key](hintQ(pg));
    wrongBtn(pg, key).click();
    const expected = {
      k: ev(`reviewKey(${J(p)})`),
      p,
      t: tier,
      due: '2026-11-21',
      box: 1,
      fails: 0,
      added: today,
    };
    check(`${key}, palier ${tier} : l'item entre dans la file`, J(queue().items) === J([expected]), J(queue()));
    check(`${key}, palier ${tier} : la partie est enregistrée`, J(stored()) === J(queue()), J(stored()));
    check(`${key}, palier ${tier} : le palier gardé est celui du moment`, ev('gameDiff()') === tier);
  }

  section('S2 : la même question ratée à nouveau (ligne 2)');
  {
    const before = { items: [item('clock'), item('math', { due: '2026-11-27', box: 3, fails: 1 })], offered: null };
    ev(`state.review = ${J(before)}; save()`);
    startGame(pg, 'math', 3);
    ev(`renderMath(${J(P.math)})`); // la question 7 + 5, en jeu normal
    wrongBtn(pg, 'math').click();
    check(
      'pas de doublon : box 1, dû demain, palier du moment, même place',
      J(queue()) ===
        J({
          items: [item('clock'), item('math', { t: 3, due: '2026-11-21', box: 1, fails: 1 })],
          offered: null,
        }),
      J(queue()),
    );
  }

  section('S2 : ce qui ne se garde pas (ligne 3)');
  {
    const empty = J({ items: [], offered: null });
    const reset = () => ev('closeModal(); endBonusChallenge(); state.review = { items: [], offered: null }; save()');
    reset();
    startGame(pg, 'math', 3);
    ev('party.active = true');
    wrongBtn(pg, 'math').click();
    ev('party.active = false');
    check('à plusieurs (chacun son tour) : rien', J(queue()) === empty, J(queue()));
    reset();
    startGame(pg, 'math', 3);
    ev('race.active = true');
    wrongBtn(pg, 'math').click();
    ev('race.active = false');
    check('à plusieurs (course) : rien', J(queue()) === empty, J(queue()));
    reset();
    setTier(pg, 'math', 3);
    ev('startBonusChallenge("math")');
    check('le défi bonus de Zap est bien en cours', ev('inBonusChallenge()') === true);
    wrongBtn(pg, 'math').click();
    check('défi bonus de Zap : rien', J(queue()) === empty, J(queue()));
    reset();
    startGame(pg, 'math', 3);
    ev('loseLife(null)');
    check('temps écoulé : rien', J(queue()) === empty, J(queue()));
    reset();
    startGame(pg, 'count', 2);
    [...pg.d.querySelectorAll('.num-btn')].find((b) => b !== rightBtn(pg)).click();
    check('un jeu hors de la liste (count) : rien', J(queue()) === empty, J(queue()));
    reset();
    startGame(pg, 'math', 3);
    rightBtn(pg).click();
    check('une bonne réponse : rien', J(queue()) === empty, J(queue()));
    await waitFor(() => pg.d.getElementById('btn-yay'));
    reset();
  }

  section('S2 : une file pleine (ligne 4)');
  {
    const full = Array.from({ length: 30 }, (_, i) => ({
      k: `compare:1-${i + 2}`,
      p: { g: 'compare', a: 1, b: i + 2 },
      t: 1,
      due: '2026-11-21',
      box: 1,
      fails: 0,
      added: i === 6 ? '2026-11-01' : '2026-11-10',
    }));
    ev(`state.review = ${J({ items: full, offered: null })}; save()`);
    startGame(pg, 'clock', 2);
    wrongBtn(pg, 'clock').click();
    const q = queue().items;
    check(
      'le plus ancien sort, le nouveau entre en fin de tableau, 30 items',
      q.length === 30 && !q.some((x) => x.k === full[6].k) && q[29].p.g === 'clock' && q[0].k === full[0].k,
      J(q.map((x) => x.k)),
    );
    ev('closeModal(); state.review = { items: [], offered: null }; save()');
  }

  section('S4 : chaque jeu rejoue un item (ligne 7)');
  const replay = (key, p) => ev(`setLastGame(${J(key)}); REVIEW_REPLAYS[${J(key)}].render(${J(p)})`);
  for (const [name, tier] of [
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
  ]) {
    const p = P[name],
      key = p.g;
    setTier(pg, key, tier);
    check(`${name}, palier ${tier} : la question affichée est celle de l'item`, () => {
      replay(key, p);
      return SHOWN[key](pg.d, p);
    });
    check(
      `${name}, palier ${tier} : la bonne réponse est proposée`,
      () => answerOf(rightBtn(pg)) === ANSWER[key](p),
      () => answerOf(rightBtn(pg)),
    );
    check(
      `${name}, palier ${tier} : la question des indices est celle de l'item`,
      () => js('currentHintQuestion().kind') === J(key) && J(EXPECTED_PARAMS[key](hintQ(pg))) === J(p),
      () => js('currentHintQuestion()'),
    );
    check(`${name}, palier ${tier} : deux niveaux d'indice`, () => {
      const hints = JSON.parse(js(`hintsFor(${J(key)}, currentHintQuestion().q)`));
      return hints.length === 2 && hints.every((h) => h.say.length > 10);
    });
  }
  {
    // lecture : le sens de lecture de l'item, quel que soit le palier du moment
    const other = { g: 'reading', w: 'cheval', img: false };
    setTier(pg, 'reading', 5);
    check("lecture, palier 5 : un item « image vers mot » montre l'image et des mots", () => {
      replay('reading', other);
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
      replay('clock', quarter);
      return SHOWN.clock(pg.d, quarter) && answerOf(rightBtn(pg)) === '9 h 45';
    });
  }

  section('S4 : aller-retour item / render, à chaque palier (ligne 8)');
  for (const key of Object.keys(CHOICES)) {
    const tiers = key === 'calc' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
    let bad = '',
      n = 0;
    for (const tier of tiers) {
      for (let round = 0; round < 6 && !bad; round++) {
        startGame(pg, key, tier);
        const q1 = hintQ(pg);
        let p;
        try {
          p = JSON.parse(js(`REVIEW_REPLAYS[${J(key)}].item(hint.q)`));
        } catch (e) {
          bad = e.message;
          break;
        }
        const expected = EXPECTED_PARAMS[key](q1);
        // seule exception : un calcul qui dépasse 100 (palier 5 ou 6) n'est pas gardé
        if (p === null && key === 'calc' && !ev(`validParams(${J(expected)})`)) continue;
        n++;
        if (J(p) !== J(expected)) bad = `palier ${tier} : item ${J(p)} au lieu de ${J(expected)}`;
        else {
          replay(key, p);
          const q2 = hintQ(pg);
          const back = js(`REVIEW_REPLAYS[${J(key)}].item(hint.q)`);
          // les indices d'une question rejouée : ceux de la question d'origine (au tirage près)
          const same = (q) => js(`hintsFor(${J(key)}, ${J({ ...q, emoji: q1.emoji, options: q1.options })})`);
          if (back !== J(p)) bad = `palier ${tier} : retour ${back} au lieu de ${J(p)}`;
          else if (!SHOWN[key](pg.d, p)) bad = `palier ${tier} : ${J(p)} mal affiché`;
          else if (answerOf(rightBtn(pg)) !== ANSWER[key](p)) bad = `palier ${tier} : mauvaise solution pour ${J(p)}`;
          else if (J(Object.keys(q2).sort()) !== J(Object.keys(q1).sort()))
            bad = `palier ${tier} : question des indices ${J(Object.keys(q2))} au lieu de ${J(Object.keys(q1))}`;
          else if (same(q2) !== same(q1)) bad = `palier ${tier} : indices différents pour ${J(p)}`;
        }
      }
    }
    check(
      `${key} : item, render, item redonne le même item (${n} questions)`,
      !bad && n >= 20,
      bad || `${n} questions`,
    );
  }
  check(
    'un jeu rejoué gagne comme avant (hors mission, la victoire normale)',
    await (async () => {
      startGame(pg, 'compare', 2);
      ev(`renderCompare(${J(P.compare)})`);
      rightBtn(pg).click();
      return waitFor(() => pg.d.getElementById('btn-yay'));
    })(),
  );
  ev('closeModal()');
  check('une question qui ne ressemble à rien ne donne aucun item', () =>
    ['math', 'calc', 'compare', 'clock', 'reading'].every((key) =>
      [null, 'x', 42, {}, { a: 'x' }, { ops: 'x' }, { correct: null }].every(
        (q) => ev(`REVIEW_REPLAYS[${J(key)}].item(${J(q)})`) === null,
      ),
    ),
  );
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  w.close();
}

(async () => {
  await pureTests();
  await saveTests();
  await captureTests();
  console.log(`\n${failed ? '❌' : '✅'} révision : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
})();
