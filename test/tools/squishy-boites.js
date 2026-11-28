// Le harnais des suites test/squishy-boites-*.test.js (track squishy-boites) :
// le jeu démarré dans jsdom, les vérifications, et de quoi poser une
// collection de squishies avec ses boîtes de rangement. Même harnais que
// test/squishies.test.js : le temps du jeu est accéléré ×10, la voix est
// notée au lieu d'être dite. Chaque suite tourne dans son propre processus,
// donc sur un jeu neuf.
const { JSDOM } = require('jsdom');
const html = require('./page.js').buildHtml();

const SPEED = 0.1;
const spoken = [];
function boot(saved) {
  const dom = new JSDOM(html, {
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
      if (saved) for (const [k, v] of Object.entries(saved)) win.localStorage.setItem(k, v);
    },
  });
  const win = dom.window;
  const errors = [];
  win.addEventListener('error', (e) => errors.push(e.message));
  return { w: win, d: win.document, ev: (code) => win.eval(code), errs: errors };
}
const { w, d, ev, errs } = boot();
w.confirm = () => true;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(cond, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (cond()) return true;
    await wait(10);
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
    console.log(
      '❌ ' +
        name +
        (detail === undefined ? '' : `\n     → ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`),
    );
  }
}
function section(name) {
  console.log('— ' + name);
}
const shown = (sel) => d.getElementById('overlay').classList.contains('show') && !!d.querySelector(sel);
const json = (x) => JSON.stringify(x);
const same = (a, b) => json(a) === json(b);

// une boîte de rangement, et la boîte vide
const crate = (label, items = [], done = false) => ({ label, items, done });
const E = crate(null);
const rep = (id, n) => Array(n).fill(id);
// la collection du joueur : les champs donnés par-dessus un état neuf
const setSq = (o) => ev(`state.squishies = Object.assign(squishyFreshState(), ${json(o)}); save()`);
const crates = () => ev('state.squishies.crates');
const stored = () => JSON.parse(w.localStorage.getItem(ev('currentSaveKey()')));
// une partie enregistrée à la version courante, avec cette collection
const sqSave = (sq) => ({
  v: ev('SAVE_VERSION'),
  name: 'Lou',
  avatar: '👧',
  squishies: Object.assign(ev('squishyFreshState()'), sq),
});
// posée dans le stockage puis lue par le vrai chargement (readSave)
const loadSave = (saved) => {
  ev(`localStorage.setItem(currentSaveKey(), ${json(json(saved))}); load()`);
  return ev('state.squishies');
};
const cleaned = (sq) => loadSave(sqSave(sq)).crates;
const OK = (o) => Object.assign({ ok: true, full: false, coins: 0, newCrate: false, unlock: false }, o);
const NO = (reason) => ({ ok: false, reason });

// passer l'accueil : une partie neuve, celle de Lou
async function start() {
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal()');
}
// la fin d'une suite : aucune erreur JS, le bilan, le code de sortie
async function finish(what) {
  await wait(200);
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  console.log(
    failed
      ? `\n${failed} échec(s), ${passed} réussi(s)`
      : `\nTous les tests des boîtes de rangement (${what}) passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
}

module.exports = {
  boot,
  w,
  d,
  ev,
  errs,
  spoken,
  wait,
  waitFor,
  check,
  section,
  shown,
  json,
  same,
  crate,
  E,
  rep,
  setSq,
  crates,
  stored,
  sqSave,
  loadSave,
  cleaned,
  OK,
  NO,
  start,
  finish,
};
