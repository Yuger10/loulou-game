// Harnais des suites test/explications*.test.js (track erreurs-expliquees) :
// le même que test/companions.test.js. Le temps du jeu est accéléré ×10, la
// voix est notée au lieu d'être dite. Les délais demandés à setTimeout sont
// notés tels quels : un délai se vérifie alors sans dépendre de la machine.
const { JSDOM } = require('jsdom');
const html = require('../tools/page.js').buildHtml();

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
// les premiers problèmes d'une liste, sous le ❌ qui les annonce
function list(problems, max = 12) {
  if (problems.length) console.log('   ' + problems.slice(0, max).join('\n   '));
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

const solEl = () => d.querySelector((ev('gameSolution') || [])[0]);
const otherChoice = (sel) => [...d.querySelectorAll(sel)].find((b) => b !== solEl() && !b.disabled);
const glows = (el) => !!el && el.classList.contains('hint-glow');
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

// entrer dans le jeu : un profil « Lou », l'histoire du lagon déjà vue
async function boot() {
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal(); state.storySolved = { lagon: true }; save()');
}

// les deux dernières vérifications de chaque suite, le total, et la sortie
function finish(what) {
  check('aucune erreur JS', errs.length === 0, errs.slice(0, 5).join(' ; '));
  check('aucun nom manquant dans le jeu', evErrs.length === 0, [...new Set(evErrs)].slice(0, 5).join(' ; '));
  console.log(
    failed ? `\n${failed} test(s) en échec sur ${passed + failed}` : `\nTous les tests ${what} passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
}

module.exports = {
  SPEED,
  spoken,
  timeouts,
  d,
  ev,
  wait,
  waitFor,
  check,
  section,
  list,
  lastSaid,
  shown,
  toSpoken,
  startGame,
  solEl,
  otherChoice,
  glows,
  WRONG_HINTS,
  EXPLAIN_MS,
  explainReal,
  winNow,
  boot,
  finish,
};
