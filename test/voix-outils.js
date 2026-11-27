/* ---------- L'atelier des tests de la voix ----------
   Partagé par les suites test/voix-partout*.test.js et
   test/voix-file-coupures.test.js (track voix-partout) : la page du jeu dans
   jsdom, un faux speechSynthesis qui note les phrases, l'accueil passé, et les
   petits outils (toucher, phrases dites, remise à zéro de l'écran).
   VOIX_DEBUG=1 affiche chaque vérification réussie. */
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');

const DEBUG = !!process.env.VOIX_DEBUG;
const counts = { passed: 0, failed: 0 };
function check(name, cond, detail) {
  if (cond) {
    counts.passed++;
    if (DEBUG) console.log('✅ ' + name);
  } else {
    counts.failed++;
    console.log('❌ ' + name + (detail ? `\n     → ${detail}` : ''));
  }
}
function section(name) {
  console.log('— ' + name);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const SPEED = 0.05; // le temps du jeu est accéléré ×20
const spoken = []; // les phrases dites depuis la dernière remise à zéro
const everSaid = []; // toutes les phrases dites par la suite (couverture des clips)

// Faux speechSynthesis qui note les phrases. Par défaut rien ne « parle » :
// chaque phrase part tout de suite. En pas à pas (`manual`), une phrase
// « parle » jusqu'à finish(). `cancels` compte les phrases coupées.
function fakeSynth() {
  return {
    speaking: false,
    pending: false,
    current: null,
    manual: false,
    cancels: 0,
    cancel() {
      this.cancels++;
      this.speaking = false;
      this.current = null;
    },
    getVoices: () => [],
    speak(u) {
      everSaid.push(u.text);
      spoken.push(u.text);
      if (!this.manual) return;
      this.current = u;
      this.speaking = true;
    },
    finish() {
      const u = this.current;
      this.current = null;
      this.speaking = false;
      if (u && u.onend) u.onend();
    },
  };
}

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
    win.speechSynthesis = fakeSynth();
  },
});
const w = dom.window,
  d = w.document;
const synth = w.speechSynthesis;
const ev = (code) => w.eval(code);
const errs = [];
w.addEventListener('error', (e) => errs.push(e.message));
const $ = (sel) => d.querySelector(sel);
const said = () => spoken.join(' | ');
// un toucher, puis le temps que les handlers et le retour sonore passent
async function tap(el) {
  el.click();
  await wait(15);
}

// comparaison de deux phrases : forme dite, sans casse, accents ni ponctuation
function norm(text) {
  return ev('toSpoken')(String(text))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const BASE_STATE =
  "party.active = false; currentProfile().age = 6; state.missions = 200; state.coins = 500; state.sound = true; state.voice = true; currentWorld = 'lagon'";
async function resetScreen() {
  ev(`${BASE_STATE}; closeModal(); switchView('carte')`);
  await wait(15);
  spoken.length = 0;
}

// état de départ commun : l'accueil passé comme dans test/smoke.test.js
async function start() {
  await wait(150);
  ev('setSeasonPreview("aucune")');
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lina';
  d.querySelector('.avatar-opt[data-av="🦄"]').click();
  d.getElementById('btn-start').click();
  await wait(120); // le premier chapitre de l'histoire s'ouvre, puis on le referme
  d.body.dispatchEvent(new w.Event('pointerdown', { bubbles: true })); // premier geste
  await resetScreen();
}

// fin d'une suite : aucune erreur JS, le bilan, le code de sortie
function finish(name, beforeSummary) {
  check('aucune erreur JS', errs.length === 0, errs.join(' | '));
  if (beforeSummary) beforeSummary();
  console.log(
    `\n${counts.failed ? '❌' : '✅'} ${name} : ${counts.passed} vérifications réussies, ${counts.failed} en échec`,
  );
  process.exit(counts.failed ? 1 : 0);
}

module.exports = {
  DEBUG,
  check,
  section,
  wait,
  spoken,
  everSaid,
  w,
  d,
  synth,
  ev,
  $,
  said,
  tap,
  norm,
  resetScreen,
  start,
  finish,
};
