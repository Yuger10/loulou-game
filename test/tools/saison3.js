// Harnais des suites de la saison 3 (test/saison3*.test.js, track
// saison3-ouverture) : la page dans jsdom, les aides de lecture, l'île et le
// chapitre d'essai. Même harnais que test/saison2.test.js, mis à part pour que
// chaque suite reste courte (une page par suite, comme un fichier de test seul).
const { JSDOM } = require('jsdom');
const page = require('./page.js');

const SPEED = 0.1;
const spoken = [];
const dom = new JSDOM(page.buildHtml(), {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/?saison=aucune',
  beforeParse(win) {
    const st = win.setTimeout.bind(win),
      si = win.setInterval.bind(win);
    win.setTimeout = (fn, ms, ...a) => st(fn, Math.round((ms || 0) * SPEED), ...a);
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
const ev = (code) => w.eval(code);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const json = (x) => JSON.stringify(x);
let failed = 0,
  passed = 0;

// Une condition s'écrit seule, ou en liste dans une fonction : `() => [a, b, c]`.
// La liste réussit si elle n'est pas vide et que tout y est vrai ; une erreur
// pendant sa lecture (un élément absent de la page) compte comme un échec.
function holds(cond) {
  if (typeof cond !== 'function') return !!cond;
  const v = cond();
  return Array.isArray(v) ? v.length > 0 && v.every(Boolean) : !!v;
}
function check(name, cond) {
  let ok = false,
    why = '';
  try {
    ok = holds(cond);
  } catch (e) {
    why = `\n     → ${e.message}`;
  }
  if (ok) passed++;
  else failed++;
  console.log((ok ? '✅ ' : '❌ ') + name + why);
}
function section(name) {
  console.log('— ' + name);
}
const modalOpen = () => d.getElementById('overlay').classList.contains('show');
const shown = (sel) => modalOpen() && !!d.querySelector(sel);
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
const clean = (t) => !/undefined|null|Infinity|NaN/.test(t);
const said = (phrase) => {
  const want = ev(`toSpoken(${json(phrase)})`);
  return spoken.some((x) => x.includes(want));
};
// toucher un bouton s'il est là (son absence est vue par la vérification qui suit)
const click = (el) => {
  if (el) el.click();
};
async function waitFor(cond, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (cond()) return true;
    await wait(10);
  }
  return !!cond();
}
// la forme d'une carte de Zap : ses morceaux dans l'ordre, trouvés ou non, brillants ou non.
// jsdom re-sérialise le HTML : on compare la structure, jamais la chaîne.
function mapShape(svg) {
  if (!svg) return null;
  return {
    found: svg.getAttribute('data-found'),
    pieces: [...svg.querySelectorAll('[data-piece]')].map((n) => [
      n.getAttribute('data-piece'),
      n.getAttribute('data-found'),
      n.classList.contains('zm-new'),
    ]),
  };
}
function parseSVG(code) {
  const tmp = d.createElement('div');
  tmp.innerHTML = ev(code);
  return tmp.querySelector('svg');
}
const sameMap = (el, code) => !!el && json(mapShape(el)) === json(mapShape(parseSVG(code)));

// un chapitre d'essai (ligne 29) : posé et retiré par les suites seules
const CHAPTER = {
  guide: 'sirene',
  title: "Le chapitre d'essai",
  intro: ['Une phrase.', 'Deux phrases.', 'Trois phrases.'],
  riddles: [
    { q: 'Qui brille ?', tip: 'Dans le ciel.', opts: [{ e: '☀️', ok: true }, { e: '🌙' }] },
    { q: 'Qui est ronde ?', tip: 'Elle roule.', opts: [{ e: '⚽', ok: true }, { e: '📦' }] },
  ],
  success: 'Bravo, un morceau de carte !',
  reward: 20,
};
// l'île d'essai (spec, Contrats partagés) : posée et retirée par les suites seules
const ESSAI3 = {
  name: "L'Île d'essai",
  emoji: '🧪',
  level: 70,
  diff: 6,
  saison: 3,
  short: 'Essai',
  subtitle: 'Une île pour les tests',
  map: { x: 50, y: 50 },
  shape: 'lagon',
  icon: '🧪',
  sand: '#FFE2A8',
  land: '#7FD7C4',
  intro: 'Une île pour les tests',
  sceneEmpty: 'Rien ici',
};
// Chaque section met de côté les vraies îles de la saison 3, pose ou non l'île
// d'essai, puis remet tout en place. Ce qui se lit par son île part avec elle
// (objets, recettes, décorations, personnages, série de squishies) : sans son
// île, `availableItems()` et les autres chercheraient un monde qui n'existe plus.
const WITH_ISLAND = ['ITEMS', 'CRAFTED', 'DECOS', 'CHARACTERS', 'SQUISHY_SERIES'];
function setIslands(withEssai) {
  ev(`window.__s3 = window.__s3 || {}; window.__s3deps = window.__s3deps || {};
      worldsOf(3).filter((id) => id !== 'essai3').forEach((id) => { __s3[id] = WORLDS[id]; delete WORLDS[id]; });
      ${json(WITH_ISLAND)}.forEach((name) => {
        const table = eval(name), kept = (__s3deps[name] = __s3deps[name] || {});
        Object.keys(table).filter((k) => __s3[table[k].world]).forEach((k) => { kept[k] = table[k]; delete table[k]; });
      });
      delete WORLDS.essai3;
      ${withEssai ? `WORLDS.essai3 = ${json(ESSAI3)};` : ''}
      refreshArchipelagos()`);
}
function restoreIslands() {
  ev(`delete WORLDS.essai3; Object.assign(WORLDS, window.__s3 || {}); window.__s3 = {};
      Object.keys(window.__s3deps || {}).forEach((name) => Object.assign(eval(name), __s3deps[name]));
      window.__s3deps = {}; refreshArchipelagos()`);
}

// une partie neuve au nom de Lou, l'énigme du Lagon résolue
async function start() {
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal(); state.storySolved = { lagon: true }; save()');
}
/** @param {string} what le nom de la suite dans la ligne de résultat */
async function finish(what) {
  await wait(200);
  check('aucune erreur JS', errs.length === 0);
  if (errs.length) console.log(errs);
  console.log(failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests de ${what} passent (${passed})`);
  process.exit(failed ? 1 : 0);
}

module.exports = {
  d,
  ev,
  wait,
  json,
  errs,
  spoken,
  check,
  section,
  modalOpen,
  shown,
  text,
  clean,
  said,
  click,
  waitFor,
  parseSVG,
  sameMap,
  setIslands,
  restoreIslands,
  start,
  finish,
  CHAPTER,
  ESSAI3,
  // toutes les îles ouvertes au niveau courant
  VISIT_ALL: 'state.visited = WORLD_ORDER.filter((id) => worldUnlocked(id));',
  LEVEL: (n) => (n - 1) * 5, // missions pour être au niveau n
  PROLOGUE_1:
    "Zap le super-héros, à ton service ! En rangeant mon grenier, j'ai trouvé une vieille carte d'explorateur 🗺️",
  PIECES: ['crayons', 'dumplings', 'coffres', 'chatouilles', 'concert'],
};
