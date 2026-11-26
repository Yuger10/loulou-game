/* ---------- Le banc des tests du lecteur de clips de la voix ----------
   (track voix-naturelle, test/voix-lecteur*.test.js)
   Ouvre le jeu dans jsdom avec un faux speechSynthesis (une phrase à la fois,
   sa fin déclenchée par le test) et un temps accéléré. La page compte d'abord
   ce que le jeu touche sans aucun clip (`touched`) ; `installFakes()` pose
   ensuite le faux navigateur qui lit le MP3 (test/tools/fake-voice.js) et le
   faux moteur audio, et `fresh()` repart d'un lecteur neuf avec trois clips. */
const { JSDOM, VirtualConsole } = require('jsdom');
const page = require('./page.js');
const { FAKE_VOICE_SRC } = require('./fake-voice.js');
const { FAKE_AUDIO_SRC } = require('./fake-audio.js');

const SPEED = 0.05; // le temps du jeu est accéléré ×20 : 1 500 ms = 75 ms, 5 s = 250 ms
const A = 'aaaaaaaaaaaa',
  B = 'bbbbbbbbbbbb',
  C = 'cccccccccccc';
const TABLE = { 'Bonjour.': A, 'Au revoir.': B, 'Encore une histoire.': C };
const UNLOCK = 'data:audio/mpeg;base64,AAAA';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(cond, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (cond()) return true;
    await wait(10);
  }
  return !!cond();
}
const tick = () => wait(15); // laisse passer les promesses du faux fetch

// Faux speechSynthesis : une phrase à la fois, sa fin déclenchée par le test.
function makeSynth() {
  return {
    speaking: false,
    pending: false,
    current: null,
    log: [],
    rates: [],
    cancels: 0,
    getVoices: () => [],
    speak(u) {
      this.log.push(u.text);
      this.rates.push(u.rate);
      this.current = u;
      this.speaking = true;
      if (u.onstart) u.onstart();
    },
    cancel() {
      this.cancels++;
      const u = this.current;
      this.current = null;
      this.speaking = false;
      if (u && u.onerror) u.onerror();
    },
    end() {
      const u = this.current;
      this.current = null;
      this.speaking = false;
      if (u && u.onend) u.onend();
    },
  };
}

// La page du jeu. Avant les faux : `touched` compte ce que le jeu touche quand il n'a aucun clip.
function openPage({ synth, touched, jsdomErrors }) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => jsdomErrors.push(String(e && e.message)));
  return new JSDOM(page.buildHtml(), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/?saison=aucune',
    virtualConsole: vc,
    beforeParse(win) {
      const st = win.setTimeout.bind(win);
      win.setTimeout = (fn, ms, ...a) => st(fn, Math.round((ms || 0) * SPEED), ...a);
      win.SpeechSynthesisUtterance = function (text) {
        this.text = text;
      };
      win.speechSynthesis = synth;
      const NativeAudio = win.Audio;
      win.Audio = function (...a) {
        touched.audios++;
        return new NativeAudio(...a);
      };
      win.fetch = () => {
        touched.fetches++;
        return Promise.reject(new TypeError('pas de réseau dans ce test'));
      };
      win.caches = {
        open: async () => {
          touched.caches++;
          throw new Error('pas de cache dans ce test');
        },
      };
    },
  });
}

// les vérifications d'une suite et sa dernière ligne
function makeChecker(label) {
  let failed = 0,
    passed = 0;
  const check = (name, cond, detail) => {
    if (cond) {
      passed++;
      console.log('✅ ' + name);
    } else {
      failed++;
      console.log('❌ ' + name + (detail !== undefined ? `\n     → ${detail}` : ''));
    }
  };
  const finish = () => {
    console.log(failed ? `\n${failed} test(s) ${label} en échec` : `\nTous les tests ${label} passent (${passed})`);
    process.exit(failed ? 1 : 0);
  };
  return { check, finish };
}

// ce que les tests font au jeu et lisent de lui
function voiceHelpers({ w, ev, synth }) {
  const V = () => w.fakeVoice;
  const audio = () => V().audios[V().audios.length - 1];
  // les clips demandés pour être joués (le téléchargement de fond passe `cache: 'no-store'`)
  const urls = (background) =>
    V()
      .fetches.filter((f) => !!f.opts === background)
      .map((f) => f.url);
  // repart d'un lecteur neuf ; hors ligne par défaut, pour que le téléchargement de fond ne se mêle pas aux lectures
  function fresh(table = TABLE, { online = false } = {}) {
    ev('stopSpeech()');
    synth.log.length = 0;
    synth.rates.length = 0;
    Object.assign(V(), { playMode: 'ok', clipMode: 'ok', pitch: true, canPlay: 'probably', online, saveData: false });
    Object.assign(V(), { putError: null, waiting: [] });
    V().store.clear();
    for (const k of ['audios', 'fetches', 'created', 'revoked', 'puts', 'deletes', 'cacheNames']) V()[k].length = 0;
    V().opens = 0;
    ev('setVoiceClips')(table, UNLOCK);
  }
  return {
    V,
    audio,
    fresh,
    speak: (text, opts) => ev('speak')(text, opts),
    said: () => synth.log.join(' | '),
    touch: () => w.document.body.dispatchEvent(new w.Event('pointerdown', { bubbles: true })),
    played: () => urls(false),
    fetched: () => urls(true),
    state: () => JSON.stringify(ev('voiceOfflineState()')),
    // le faux navigateur qui lit le MP3, et le faux moteur audio (pour voir les sons baisser)
    installFakes() {
      ev(FAKE_VOICE_SRC);
      ev(FAKE_AUDIO_SRC);
      ev('audioCtx = null; ensureAudioCtx()');
    },
    duck() {
      const calls = ev('soundBus.duck.gain.calls');
      return calls.length ? calls[calls.length - 1][1] < 1 : false;
    },
  };
}

// `label` finit la dernière ligne : « Tous les tests <label> passent (N) »
function openVoiceBench(label) {
  const synth = makeSynth();
  const touched = { audios: 0, fetches: 0, caches: 0 };
  const jsdomErrors = [];
  const errs = [];
  const w = openPage({ synth, touched, jsdomErrors }).window;
  const ev = (code) => w.eval(code);
  w.addEventListener('error', (e) => errs.push(e.message));
  const checker = makeChecker(label);
  const noErrors = (name) =>
    checker.check(name, errs.length === 0 && jsdomErrors.length === 0, [...errs, ...jsdomErrors].join(' | '));
  return { ...checker, ...voiceHelpers({ w, ev, synth }), w, d: w.document, ev, synth, touched, noErrors };
}

module.exports = { A, B, C, TABLE, UNLOCK, openVoiceBench, tick, wait, waitFor };
