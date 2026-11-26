// La saison 3 « La Grande Expédition » (track saison3-ouverture) : un archipel
// sans île reste caché partout ; avec une île d'essai (posée par ce fichier
// seul, jamais dans le jeu) : troisième onglet, écran d'ouverture une fois par
// profil, prologue de Zap, carte vieux papier, avion, carte de Zap en 5
// morceaux. Même harnais que test/saison2.test.js.
const { JSDOM } = require('jsdom');
const page = require('./tools/page.js');
const html = page.buildHtml();

const SPEED = 0.1;
const spoken = [];
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
  },
});
const w = dom.window,
  d = w.document;
w.confirm = () => true;
const errs = [];
w.addEventListener('error', (e) => errs.push(e.message));
const ev = (code) => w.eval(code);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0,
  passed = 0;
function check(name, cond) {
  if (cond) {
    passed++;
    console.log('✅ ' + name);
  } else {
    failed++;
    console.log('❌ ' + name);
  }
}
function section(name) {
  console.log('— ' + name);
}
const modalOpen = () => d.getElementById('overlay').classList.contains('show');
const json = (x) => JSON.stringify(x);
const LEVEL = (n) => (n - 1) * 5; // missions pour être au niveau n
// l'île d'essai (spec, Contrats partagés) : posée et retirée par ce fichier seul
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

(async () => {
  await wait(100);
  d.getElementById('btn-splash-play').click();
  d.getElementById('name-input').value = 'Lou';
  d.querySelector('.avatar-opt').click();
  d.getElementById('btn-start').click();
  await wait(150);
  ev('closeModal(); state.storySolved = { lagon: true }; save()');

  /* ================= Phase 1 : archipel posé par le test ================= */
  section('phase 1 : archipel posé par le test');
  {
    ev(`ARCHIPELAGOS[3] = { name: "L'Archipel d'essai", short: 'Essai', emoji: '🧪', vehicle: '✈️', sky: false };
        ARCHIPELAGO_ORDER.push(3);
        WORLDS.essai3 = ${json(ESSAI3)};
        refreshArchipelagos()`);
    check("l'archipel prend le niveau de sa première île (70)", ev('ARCHIPELAGOS[3].level') === 70);
    check("worldsOf(3) : l'île d'essai seule", json(ev('worldsOf(3)')) === json(['essai3']));
    check('trois archipels affichés', json(ev('shownArchipelagos()')) === json([1, 2, 3]));
    check("WORLD_ORDER finit par l'île d'essai", ev('WORLD_ORDER[WORLD_ORDER.length - 1]') === 'essai3');
    ev('delete WORLDS.essai3; refreshArchipelagos()');
    check('sans île : pas de niveau (null)', ev('ARCHIPELAGOS[3].level') === null);
    check('sans île : archipel caché', json(ev('shownArchipelagos()')) === json([1, 2]));
    check(
      'sans île : jamais ouvert, même au niveau 200',
      ev('(state.missions = 995, archipelagoUnlocked(3))') === false,
    );
    ev('ARCHIPELAGO_ORDER.pop(); delete ARCHIPELAGOS[3]; refreshArchipelagos()');
    check('tout est remis en place (ligne 3)', json(ev('shownArchipelagos()')) === json([1, 2]));
    check("WORLD_ORDER ne contient plus l'île d'essai", ev('WORLD_ORDER.includes("essai3")') === false);
  }

  section("L'ouverture d'une saison (généralisée)");
  {
    check(
      'openSeasonOpening et maybeSeasonOpening existent',
      ev('typeof openSeasonOpening') === 'function' && ev('typeof maybeSeasonOpening') === 'function',
    );
    // ligne 21b : la saison 2 sans île nouvelle ne montre rien (comportement gardé)
    ev(`closeModal(); state.missions = ${LEVEL(37)}; state.skyIntroSeen = false;
        state.visited = WORLD_ORDER.filter((id) => worldUnlocked(id)); save()`);
    check(
      "saison 2 due mais aucune île nouvelle : rien ne s'ouvre",
      ev('maybeSeasonOpening()') === false && !modalOpen(),
    );
    ev('state.skyIntroSeen = true; save()');
  }

  await wait(200);
  check('aucune erreur JS', errs.length === 0);
  if (errs.length) console.log(errs);
  console.log(
    failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests de la saison 3 passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
})();
