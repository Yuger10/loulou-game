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
const shown = (sel) => modalOpen() && !!d.querySelector(sel);
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
const clean = (t) => !/undefined|null|Infinity|NaN/.test(t);
const said = (phrase) => {
  const want = ev(`toSpoken(${json(phrase)})`);
  return spoken.some((x) => x.includes(want));
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
// Chaque section met de côté les vraies îles de la saison 3 (aucune à la
// livraison de cette track), pose ou non l'île d'essai, puis remet tout en place.
function setIslands(withEssai) {
  ev(`window.__s3 = window.__s3 || {};
      worldsOf(3).filter((id) => id !== 'essai3').forEach((id) => { __s3[id] = WORLDS[id]; delete WORLDS[id]; });
      delete WORLDS.essai3;
      ${withEssai ? `WORLDS.essai3 = ${json(ESSAI3)};` : ''}
      refreshArchipelagos()`);
}
function restoreIslands() {
  ev('delete WORLDS.essai3; Object.assign(WORLDS, window.__s3 || {}); window.__s3 = {}; refreshArchipelagos()');
}
// toutes les îles ouvertes au niveau courant
const VISIT_ALL = 'state.visited = WORLD_ORDER.filter((id) => worldUnlocked(id));';
const json = (x) => JSON.stringify(x);
const LEVEL = (n) => (n - 1) * 5; // missions pour être au niveau n
const PROLOGUE_1 =
  "Zap le super-héros, à ton service ! En rangeant mon grenier, j'ai trouvé une vieille carte d'explorateur 🗺️";
const PIECES = ['crayons', 'dumplings', 'coffres', 'chatouilles', 'concert'];
// un chapitre d'essai (ligne 29) : posé et retiré par ce fichier seul
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

  /* ================= Sans aucune île dans la saison 3 ================= */
  section('Sans île de saison 3 : rien ne se voit (lignes 1 à 7)');
  {
    setIslands(false);
    check(
      "ligne 1 : l'archipel 3 est déclaré, sans niveau",
      json(ev('ARCHIPELAGOS[3]')) ===
        json({
          name: 'La Grande Expédition',
          short: "L'Expédition",
          emoji: '🧭',
          vehicle: '✈️',
          sky: false,
          paper: true,
          level: null,
        }) && json(ev('ARCHIPELAGO_ORDER')) === json([1, 2, 3]),
    );
    check(
      'les archipels 1 et 2 ne sont pas en vieux papier',
      ev('ARCHIPELAGOS[1].paper === false && ARCHIPELAGOS[2].paper === false'),
    );
    ev(`closeModal(); state.missions = 995; state.skyIntroSeen = true; ${VISIT_ALL} save(); setCurrentWorld("lagon")`);
    check(
      'ligne 2 : jamais ouvert, même au niveau 200',
      ev('level()') === 200 && ev('archipelagoUnlocked(3)') === false,
    );
    check('ligne 3 : deux archipels affichés', json(ev('shownArchipelagos()')) === json([1, 2]));
    ev('switchView("carte")');
    check(
      'ligne 4 : la carte garde ses 2 onglets, sans texte cassé',
      d.querySelectorAll('#map-tabs .map-tab').length === 2 &&
        !d.querySelector('#map-tabs [data-saison="3"]') &&
        clean(text(d.getElementById('map-tabs'))) &&
        clean(text(d.getElementById('map-next'))),
    );
    ev('openStoryJournal()');
    check(
      'ligne 5 : le journal garde ses 2 saisons, sans texte cassé',
      shown('.story-journal') &&
        d.querySelectorAll('section.story-season').length === 2 &&
        !d.querySelector('section.story-season[data-saison="3"]') &&
        clean(text(d.querySelector('.story-journal'))),
    );
    ev('closeModal(); state.expeditionIntroSeen = false; state.skyIntroSeen = true; save()');
    check('ligne 6 : aucune ouverture de saison', ev('maybeSeasonOpening()') === false && !modalOpen());
    check('ligne 7 : aucune erreur JS', errs.length === 0);
    // ligne 21b : la saison 2 sans île nouvelle ne montre rien (comportement gardé)
    ev(`closeModal(); state.missions = ${LEVEL(37)}; state.skyIntroSeen = false; ${VISIT_ALL} save()`);
    check(
      "ligne 21b : saison 2 due mais aucune île nouvelle, rien ne s'ouvre",
      ev('maybeSeasonOpening()') === false && !modalOpen(),
    );
    ev('state.skyIntroSeen = true; save()');
    restoreIslands();
  }

  /* ================= Avec l'île d'essai ================= */
  section("Avec l'île d'essai : onglet, ouverture, prologue, avion (lignes 8 à 17)");
  {
    setIslands(true);
    check(
      "ligne 8 : l'archipel prend le niveau de sa première île",
      ev('ARCHIPELAGOS[3].level') === 70 &&
        json(ev('worldsOf(3)')) === json(['essai3']) &&
        json(ev('shownArchipelagos()')) === json([1, 2, 3]) &&
        ev('WORLD_ORDER[WORLD_ORDER.length - 1]') === 'essai3',
    );
    ev(`closeModal(); state.missions = 340; state.skyIntroSeen = true; state.expeditionIntroSeen = true; ${VISIT_ALL} save();
        setCurrentWorld("lagon"); switchView("carte")`);
    const tabs = d.querySelectorAll('#map-tabs .map-tab');
    check(
      'ligne 9 : niveau 69, un troisième onglet fermé (cadenas, « Niveau 70 »)',
      ev('level()') === 69 &&
        tabs.length === 3 &&
        tabs[2].classList.contains('locked') &&
        /🔒/.test(tabs[2].textContent) &&
        /Niveau 70/.test(tabs[2].textContent) &&
        /La Grande Expédition/.test(tabs[2].textContent),
    );
    spoken.length = 0;
    if (tabs[2]) tabs[2].click();
    check(
      "ligne 10 : toucher l'onglet fermé, la voix dit quand il s'ouvre et la carte ne change pas",
      said("La Grande Expédition s'ouvrira au niveau 70. Continue tes missions !") &&
        d.querySelectorAll('.map-island').length === 8,
    );
    check(
      'ligne 11 : sous la carte, le prochain monde',
      /Prochain monde : La Grande Expédition au niveau 70/.test(text(d.getElementById('map-next'))),
    );

    ev(
      `closeModal(); state.missions = 344; state.expeditionIntroSeen = false; ${VISIT_ALL} save(); setCurrentWorld("lagon")`,
    );
    spoken.length = 0;
    ev('playGame("count"); onMissionWin()');
    check('la mission qui fait passer au niveau 70', ev('level()') === 70);
    d.getElementById('btn-yay').click(); // « Continuer » sur l'écran de victoire
    await waitFor(() => shown('.expedition-open'), 1500);
    check(
      "ligne 12 : l'écran « Une nouvelle expédition commence ! » s'affiche",
      shown('.expedition-open') &&
        text(d.querySelector('.expedition-open h2')) === 'Une nouvelle expédition commence ! ✈️',
    );
    check(
      'ligne 12 : sa bulle et son bouton',
      text(d.querySelector('.expedition-open .speech')) ===
        "La Grande Expédition : une troisième carte, avec ses îles et son histoire. Tu passes d'une carte à l'autre avec les onglets." &&
        text(d.getElementById('expedition-go')) === 'Partir en expédition ✈️' &&
        !!d.querySelector('.expedition-open-art .eo-plane'),
    );
    check(
      'ligne 12 : il est dit avec le prénom',
      said('Lou, une nouvelle expédition commence ! La Grande Expédition.'),
    );
    check(
      "ligne 12 : il ne sera montré qu'une fois (sauvegardé)",
      ev('state.expeditionIntroSeen') === true &&
        ev('JSON.parse(localStorage.getItem(currentSaveKey())).expeditionIntroSeen') === true,
    );
    spoken.length = 0;
    if (d.getElementById('expedition-go')) d.getElementById('expedition-go').click();
    check(
      'ligne 13 : le prologue « La carte déchirée », raconté par Zap, avec sa carte vide',
      shown('.story-zapmap svg.zap-map') &&
        text(d.querySelector('.char-header h2')) === 'La carte déchirée' &&
        !!d.querySelector('.char-header [aria-label*="Zap"]') &&
        d.querySelector('.story-zapmap svg.zap-map').getAttribute('data-found') === '0' &&
        !d.querySelector('.story-zapmap .zm-new') &&
        said(PROLOGUE_1),
    );
    const next = () => d.getElementById('story-next');
    check('ligne 14 : « Suite ➡️ »', !!next() && text(next()) === 'Suite ➡️');
    if (next()) next().click();
    if (next()) next().click();
    check(
      'ligne 14 : la dernière phrase, puis « En route ! ✈️ »',
      !!next() &&
        text(next()) === 'En route ! ✈️' &&
        said('Au bout de la carte, il y a un trésor. Aide-moi à retrouver les morceaux, île après île !'),
    );
    if (next()) next().click();
    await waitFor(() => shown('#btn-go'), 1000);
    check(
      "ligne 14 : puis l'écran habituel « Nouvelle île ! » de l'île d'essai",
      shown('#btn-go') &&
        /Nouvelle île !/.test(text(d.querySelector('.reward-box'))) &&
        /L'Île d'essai/.test(text(d.querySelector('.reward-box'))),
    );
    ev('closeModal()');
    check(
      'ligne 15 : une seule fois par profil',
      ev('maybeSeasonOpening()') === false && !modalOpen() && ev('state.visited.includes("essai3")'),
    );

    ev('closeModal(); setCurrentWorld("lagon"); switchView("carte")');
    const tab3 = d.querySelector('#map-tabs .map-tab[data-saison="3"]');
    check(
      "ligne 16 : niveau 70, l'onglet est ouvert",
      !!tab3 && !tab3.classList.contains('locked') && /🧭/.test(tab3.textContent),
    );
    if (tab3) tab3.click();
    const map = d.getElementById('island-map'),
      boat = d.getElementById('map-boat');
    check(
      'ligne 16 : la carte vieux papier, son île seule',
      map.classList.contains('paper') &&
        !map.classList.contains('sky') &&
        d.querySelectorAll('.map-island').length === 1 &&
        !!d.querySelector('.map-island[data-world="essai3"]'),
    );
    check(
      "ligne 16 : l'avion en papier attend à la première île",
      boat.classList.contains('plane') && /✈️/.test(boat.textContent) && boat.classList.contains('parked'),
    );
    d.querySelector('#map-tabs .map-tab[data-saison="1"]').click();
    check('revenir au Lagon : plus de vieux papier', !d.getElementById('island-map').classList.contains('paper'));
    const pos = ev('WORLDS.essai3.map');
    check("ligne 17 : l'île d'essai tient dans le cadre", pos.x >= 14 && pos.x <= 86 && pos.y >= 15 && pos.y <= 85);
    restoreIslands();
  }

  /* ================= Partie existante, migration ================= */
  section('Partie existante, migration, plusieurs ouvertures dues (lignes 18 à 21)');
  {
    setIslands(true);
    const V = ev('SAVE_VERSION');
    const old = {
      v: V - 1,
      name: 'Lou',
      coins: 12,
      missions: 370,
      inventory: { coquillage: 3 },
      storySolved: { lagon: true, foret: true },
      skyIntroSeen: true,
      visited: ev('WORLD_ORDER.filter((id) => WORLDS[id].level <= 75 && id !== "essai3")'),
      squishies: {
        owned: { donut: 2 },
        boxes: ['capy'],
        shelf: Array(12).fill(null),
        dry: 0,
        done: {},
        fromStory: { lagon: true, foret: true },
        day: null,
        sorted: 3,
        hello: true,
        treasures: [],
      },
    };
    const m = ev(`migrate(${json(old)})`);
    check(
      "ligne 18 : migration depuis la version précédente, rien n'est perdu",
      m.v === V &&
        m.expeditionIntroSeen === false &&
        m.coins === 12 &&
        m.missions === 370 &&
        m.inventory.coquillage === 3 &&
        m.squishies.owned.donut === 2 &&
        m.squishies.sorted === 3 &&
        json(m.visited) === json(old.visited),
    );
    check('une partie neuve : ouverture pas encore montrée', ev('freshState().expeditionIntroSeen') === false);
    ev(`closeModal(); localStorage.setItem(currentSaveKey(), ${json(json(old))}); load(); refreshAll()`);
    check(
      "ligne 19 : une partie déjà au niveau 75, l'expédition s'ouvre au lancement",
      ev('level()') === 75 &&
        ev('state.expeditionIntroSeen') === false &&
        ev('maybeSeasonOpening()') === true &&
        shown('.expedition-open'),
    );
    ev(`closeModal(); state.missions = 370; state.skyIntroSeen = false; state.expeditionIntroSeen = false;
        state.visited = worldsOf(1).slice(); save()`);
    check(
      "ligne 20 : deux ouvertures dues, seule celle de la saison la plus haute s'affiche",
      ev('maybeSeasonOpening()') === true && shown('.expedition-open') && !d.querySelector('.sky-open'),
    );
    check(
      'ligne 20 : les deux drapeaux sont posés',
      ev('state.skyIntroSeen') === true && ev('state.expeditionIntroSeen') === true,
    );
    ev(
      `closeModal(); state.missions = 370; state.skyIntroSeen = true; state.expeditionIntroSeen = false; ${VISIT_ALL} save()`,
    );
    check(
      "ligne 21 : sans île nouvelle, l'ouverture s'affiche quand même",
      ev('state.visited.includes("essai3")') && ev('maybeSeasonOpening()') === true && shown('.expedition-open'),
    );
    if (d.getElementById('expedition-go')) d.getElementById('expedition-go').click();
    check('ligne 21 : puis le prologue', shown('.story-zapmap svg.zap-map'));
    for (let k = 0; k < 3 && d.getElementById('story-next'); k++) d.getElementById('story-next').click();
    await wait(60);
    check('ligne 21 : il se ferme sur « En route ! ✈️ », sans autre écran', !modalOpen());
    check('… et ne revient pas', ev('maybeSeasonOpening()') === false && !modalOpen());
    restoreIslands();
  }

  /* ================= La carte de Zap ================= */
  section('La carte de Zap (lignes 22 à 25)');
  {
    check("ligne 22 : les cinq morceaux, dans l'ordre des îles", json(ev('ZAP_MAP_PIECES')) === json(PIECES));
    const before = ev('JSON.stringify(state.storySolved)');
    ev('state.storySolved = { lagon: true, coffres: true, crayons: true }');
    check(
      "ligne 23 : les morceaux trouvés, dans l'ordre de la carte",
      json(ev('zapMapFound()')) === json(['crayons', 'coffres']) && ev('zapMapPieces()') === 2,
    );
    ev('state.storySolved = {}');
    check('ligne 23 : aucun morceau au départ', json(ev('zapMapFound()')) === '[]' && ev('zapMapPieces()') === 0);
    [[], ['crayons'], ['crayons', 'coffres'], ['dumplings', 'chatouilles', 'concert'], PIECES].forEach((found) => {
      const svg = parseSVG(`zapMapSVG(${json(found)})`);
      const paths = svg ? [...svg.querySelectorAll('path.zm-piece')] : [];
      const xs = paths.map((n) => Number((/^M\s*(-?[\d.]+)/.exec(n.getAttribute('d')) || [])[1]));
      check(
        `ligne 24 : la carte avec ${found.length} morceau(x)`,
        !!svg &&
          svg.classList.contains('zap-map') &&
          svg.getAttribute('viewBox') === '0 0 200 120' &&
          svg.getAttribute('data-found') === String(found.length) &&
          paths.length === 5 &&
          json(paths.map((n) => n.getAttribute('data-piece'))) === json(PIECES) &&
          xs.every((x, i) => Number.isFinite(x) && (i === 0 || x > xs[i - 1])) &&
          paths.every((n) => n.getAttribute('data-found') === String(found.includes(n.getAttribute('data-piece')))) &&
          svg.getAttribute('aria-label') === ev(`zapMapSay(${found.length})`) &&
          !svg.querySelector('.zm-new'),
      );
    });
    {
      const svg = parseSVG(`zapMapSVG(['crayons', 'coffres'], { fresh: 'coffres' })`);
      const fresh = svg ? [...svg.querySelectorAll('.zm-new')] : [];
      check(
        'ligne 24 : avec `fresh`, ce seul morceau brille',
        fresh.length === 1 &&
          fresh[0].getAttribute('data-piece') === 'coffres' &&
          fresh[0].classList.contains('zm-piece'),
      );
    }
    ev('state.storySolved = { crayons: true, coffres: true }');
    {
      const svg = parseSVG(`zapMapSVG(zapMapFound(), { fresh: 'coffres' })`);
      const piece = (id) => svg && svg.querySelector(`.zm-piece[data-piece="${id}"]`);
      check(
        'ligne 24b : les Coffres résolus avant les Dumplings, chaque morceau reste à sa place',
        !!svg &&
          piece('coffres').getAttribute('data-found') === 'true' &&
          piece('coffres').classList.contains('zm-new') &&
          piece('dumplings').getAttribute('data-found') === 'false' &&
          svg.getAttribute('data-found') === '2',
      );
    }
    check(
      'ligne 25 : ce que dit la carte',
      ev('zapMapSay(0)') ===
        "La carte de Zap : aucun morceau pour l'instant. Résous l'énigme de chaque île pour les retrouver !" &&
        ev('zapMapSay(1)') === 'La carte de Zap : tu as trouvé 1 morceau sur 5.' &&
        [2, 3, 4].every((n) => ev(`zapMapSay(${n})`) === `La carte de Zap : tu as trouvé ${n} morceaux sur 5.`) &&
        ev('zapMapSay(5)') === 'La carte de Zap est complète ! Les 5 morceaux sont réunis.',
    );
    ev(`state.storySolved = ${before}`);
  }

  section('La carte de Zap dans le journal et les chapitres (lignes 26 à 29)');
  {
    setIslands(true);
    ev(`closeModal(); state.missions = 345; state.skyIntroSeen = true; state.expeditionIntroSeen = true; ${VISIT_ALL}
        state.storySolved = { crayons: true }; save(); openStoryJournal()`);
    const sec = () => d.querySelector('section.story-season[data-saison="3"]');
    const row = sec() && sec().querySelector('.story-zapmap-row');
    check(
      'ligne 26 : la saison 3 a sa section',
      !!sec() && text(sec().querySelector('h3')) === '🧭 La Grande Expédition',
    );
    check(
      'ligne 26 : la ligne du prologue « La carte déchirée »',
      !!sec() &&
        !!sec().querySelector('[data-prologue="3"]') &&
        /La carte déchirée/.test(text(sec().querySelector('[data-prologue="3"]'))) &&
        /🧭/.test(text(sec().querySelector('[data-prologue="3"]'))) &&
        /📜/.test(text(sec().querySelector('[data-prologue="3"]'))),
    );
    check(
      'ligne 26 : la carte de Zap, son compte et son bouton 🔈',
      !!row &&
        sameMap(row.querySelector('svg.zap-map'), `zapMapSVG(['crayons'])`) &&
        /🗺️ La carte de Zap : 1 \/ 5/.test(text(row)) &&
        !!row.querySelector('button[data-say]') &&
        /🔈/.test(text(row.querySelector('button[data-say]'))) &&
        row.querySelector('button[data-say]').getAttribute('data-say') === ev('zapMapSay(1)'),
    );
    spoken.length = 0;
    if (row && row.querySelector('button[data-say]')) row.querySelector('button[data-say]').click();
    check('ligne 26 : le bouton 🔈 décrit la carte', said('La carte de Zap : tu as trouvé 1 morceau sur 5.'));
    check(
      'la saison 2 du journal garde Grisou hors de la saison 3',
      !d.querySelector('.story-season[data-saison="2"] .story-zapmap-row'),
    );

    ev('closeModal(); state.missions = 340; save(); openStoryJournal()');
    check(
      'ligne 27 : niveau 69, la section est fermée, sans prologue ni carte',
      !!sec() &&
        text(sec().querySelector('h3')) === '🔒 La Grande Expédition (niveau 70)' &&
        !sec().querySelector('[data-prologue]') &&
        !sec().querySelector('.story-zapmap-row'),
    );

    ev('closeModal(); state.missions = 345; state.expeditionIntroSeen = false; save(); openStoryJournal()');
    const snap = ev('JSON.stringify(state)');
    spoken.length = 0;
    if (d.querySelector('[data-prologue="3"]')) d.querySelector('[data-prologue="3"]').click();
    check(
      'ligne 28 : relire le prologue de Zap',
      shown('.story-zapmap svg.zap-map') &&
        text(d.querySelector('.char-header h2')) === 'La carte déchirée' &&
        sameMap(d.querySelector('.story-zapmap svg.zap-map'), `zapMapSVG(['crayons'])`) &&
        said(PROLOGUE_1),
    );
    for (let k = 0; k < 3 && d.getElementById('story-next'); k++) d.getElementById('story-next').click();
    check("ligne 28 : la relecture ne change pas l'état", ev('JSON.stringify(state)') === snap);
    ev('closeModal(); state.expeditionIntroSeen = true; save()');

    // ligne 29 : un chapitre de saison 3 (posé par le test) montre la carte, pas Grisou
    ev(`window.__story = { essai3: STORY.essai3, crayons: STORY.crayons };
        STORY.essai3 = ${json(CHAPTER)}; state.storySolved = { crayons: true }; save(); openStoryChapter('essai3')`);
    check(
      'ligne 29 : le chapitre montre la carte de Zap (sans morceau qui brille), pas Grisou',
      shown('.story-zapmap svg.zap-map') &&
        !d.querySelector('.story-grisou') &&
        sameMap(d.querySelector('.story-zapmap svg.zap-map'), `zapMapSVG(['crayons'])`),
    );
    spoken.length = 0;
    ev('storyWin("essai3")');
    const want = ev('toSpoken(zapMapSay(zapMapPieces()))');
    check(
      'ligne 29 : la victoire montre la carte',
      shown('.story-zapmap.happy svg.zap-map') &&
        sameMap(d.querySelector('.story-zapmap.happy svg.zap-map'), `zapMapSVG(zapMapFound(), { fresh: 'essai3' })`) &&
        !d.querySelector('.story-zapmap .zm-new'),
    );
    check(
      'ligne 29 : la voix dit la carte à la fin de la phrase de victoire (un seul speak)',
      spoken.some((x) => x.includes(want)) &&
        spoken.filter((x) => x.includes(want)).every((x) => /Tu gagnes 20 pièces/.test(x) && x.trim().endsWith(want)),
    );
    // une île de la carte (posée par le test) : son morceau brille à la victoire
    ev(`closeModal(); WORLDS.essai3b = Object.assign(${json(ESSAI3)}, { level: 78 }); refreshArchipelagos();
        STORY.essai3b = ${json(CHAPTER)}; ZAP_MAP_PIECES[1] = 'essai3b'; state.storySolved = { crayons: true }; save()`);
    spoken.length = 0;
    ev('storyWin("essai3b")');
    {
      const svg = d.querySelector('.story-zapmap.happy svg.zap-map');
      const fresh = svg ? [...svg.querySelectorAll('.zm-new')] : [];
      check(
        'ligne 29 : pour une île de la carte, son morceau brille et le compte suit',
        !!svg &&
          svg.getAttribute('data-found') === '2' &&
          fresh.length === 1 &&
          fresh[0].getAttribute('data-piece') === 'essai3b' &&
          said('La carte de Zap : tu as trouvé 2 morceaux sur 5.'),
      );
    }
    ev(`closeModal(); ZAP_MAP_PIECES[1] = 'dumplings'; delete WORLDS.essai3b; delete STORY.essai3b; refreshArchipelagos();
        ['essai3', 'crayons'].forEach((id) => { if (__story[id]) STORY[id] = __story[id]; else delete STORY[id]; });
        state.storySolved = { lagon: true }; save()`);
    check('la carte retrouve ses cinq îles', json(ev('ZAP_MAP_PIECES')) === json(PIECES));
    // la saison 2 garde Grisou (ligne 30)
    ev(`state.missions = 345; save(); openStoryChapter('boites')`);
    check(
      'un chapitre de la saison 2 montre toujours Grisou',
      shown('.story-grisou .grisou') && !d.querySelector('.story-zapmap'),
    );
    ev('closeModal()');
    restoreIslands();
    check(
      'tout est remis en place',
      json(ev('worldsOf(3)')) === json(ev('Object.keys(WORLDS).filter((id) => WORLDS[id].saison === 3)')) &&
        !ev('WORLDS.essai3'),
    );
  }

  /* ================= Les fichiers -s3 (spec D19) ================= */
  section('fichiers -s3');
  {
    // ligne 32 : retirée par la première île de la saison 3 (monde-crayons), qui remplit les tables
    check(
      'les cinq tables de la saison 3 existent et sont vides',
      ['CHARACTERS_S3', 'SQUISHIES_S3', 'STORY_S3', 'ISLE_SCENERY_S3', 'SQ_ART_S3'].every(
        (t) => ev(`typeof ${t}`) === 'object' && ev(`Object.keys(${t}).length`) === 0,
      ),
    );
    check(
      'season3Art existe et ne dessine encore rien',
      ev('typeof season3Art') === 'function' &&
        ev('(() => { const a = {}; season3Art(a, {}); return Object.keys(a).length; })()') === 0,
    );
    // ligne 32b : gardée après les îles
    const PAIRS = [
      ['CHARACTERS', 'CHARACTERS_S3'],
      ['SQUISHIES', 'SQUISHIES_S3'],
      ['STORY', 'STORY_S3'],
      ['ISLE_SCENERY', 'ISLE_SCENERY_S3'],
      ['SQ_ART', 'SQ_ART_S3'],
    ];
    PAIRS.forEach(([t, t3]) => {
      check(
        `${t3} est étalée à la fin de ${t}`,
        ev(`typeof ${t3}`) === 'object' &&
          ev(`Object.keys(${t3}).every((k) => ${t}[k] === ${t3}[k])`) &&
          ev(
            `(() => { const k3 = Object.keys(${t3}); return JSON.stringify(Object.keys(${t}).slice(Object.keys(${t}).length - k3.length)) === JSON.stringify(k3); })()`,
          ),
      );
    });
  }

  await wait(200);
  check('aucune erreur JS', errs.length === 0);
  if (errs.length) console.log(errs);
  console.log(
    failed ? `\n${failed} échec(s), ${passed} réussi(s)` : `\nTous les tests de la saison 3 passent (${passed})`,
  );
  process.exit(failed ? 1 : 0);
})();
