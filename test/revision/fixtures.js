// Le fuseau est fixé pour que les changements d'heure testés soient ceux de Paris.
process.env.TZ = 'Europe/Paris';
const { JSDOM } = require('jsdom');
const page = require('../tools/page.js');

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

const EMPTY = { items: [], offered: null };

function report() {
  console.log(`\n${failed ? '❌' : '✅'} révision : ${passed} vérifications réussies, ${failed} en échec`);
  process.exit(failed ? 1 : 0);
}

module.exports = {
  EMPTY,
  section,
  P,
  KEY,
  J,
  check,
  item,
  boot,
  wait,
  done,
  profilesOf,
  storageOf,
  waitFor,
  SPEED,
  report,
};
