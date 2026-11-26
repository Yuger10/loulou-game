// La saison 3 « La Grande Expédition » (track saison3-ouverture) : un archipel
// sans île reste caché partout ; avec une île d'essai (posée par les suites
// seules, jamais dans le jeu) : troisième onglet, écran d'ouverture une fois par
// profil, prologue de Zap, carte vieux papier, avion. Harnais : test/tools/saison3.js.
// La suite : test/saison3-migration.test.js (lignes 18 à 21) et
// test/saison3-carte-zap.test.js (lignes 22 à 29).
const t = require('./tools/saison3.js');
const { d, ev, json, check, section, modalOpen, shown, text, clean, said, click, waitFor, spoken } = t;
const { VISIT_ALL, LEVEL, PROLOGUE_1 } = t;

/* ================= Sans aucune île dans la saison 3 ================= */
function sansIleCarte() {
  check("ligne 1 : l'archipel 3 est déclaré, sans niveau", () => [
    json(ev('ARCHIPELAGOS[3]')) ===
      json({
        name: 'La Grande Expédition',
        short: "L'Expédition",
        emoji: '🧭',
        vehicle: '✈️',
        sky: false,
        paper: true,
        level: null,
      }),
    json(ev('ARCHIPELAGO_ORDER')) === json([1, 2, 3]),
  ]);
  check(
    'les archipels 1 et 2 ne sont pas en vieux papier',
    ev('ARCHIPELAGOS[1].paper === false && ARCHIPELAGOS[2].paper === false'),
  );
  ev(`closeModal(); state.missions = 995; state.skyIntroSeen = true; ${VISIT_ALL} save(); setCurrentWorld("lagon")`);
  check('ligne 2 : jamais ouvert, même au niveau 200', () => [
    ev('level()') === 200,
    ev('archipelagoUnlocked(3)') === false,
  ]);
  check('ligne 3 : deux archipels affichés', json(ev('shownArchipelagos()')) === json([1, 2]));
  ev('switchView("carte")');
  check('ligne 4 : la carte garde ses 2 onglets, sans texte cassé', () => [
    d.querySelectorAll('#map-tabs .map-tab').length === 2,
    !d.querySelector('#map-tabs [data-saison="3"]'),
    clean(text(d.getElementById('map-tabs'))),
    clean(text(d.getElementById('map-next'))),
  ]);
}

function sansIleEcrans() {
  ev('openStoryJournal()');
  check('ligne 5 : le journal garde ses 2 saisons, sans texte cassé', () => [
    shown('.story-journal'),
    d.querySelectorAll('section.story-season').length === 2,
    !d.querySelector('section.story-season[data-saison="3"]'),
    clean(text(d.querySelector('.story-journal'))),
  ]);
  ev('closeModal(); state.expeditionIntroSeen = false; state.skyIntroSeen = true; save()');
  check('ligne 6 : aucune ouverture de saison', () => [ev('maybeSeasonOpening()') === false, !modalOpen()]);
  check('ligne 7 : aucune erreur JS', t.errs.length === 0);
  // ligne 21b : la saison 2 sans île nouvelle ne montre rien (comportement gardé)
  ev(`closeModal(); state.missions = ${LEVEL(37)}; state.skyIntroSeen = false; ${VISIT_ALL} save()`);
  check("ligne 21b : saison 2 due mais aucune île nouvelle, rien ne s'ouvre", () => [
    ev('maybeSeasonOpening()') === false,
    !modalOpen(),
  ]);
  ev('state.skyIntroSeen = true; save()');
}

/* ================= Avec l'île d'essai ================= */
function ongletFerme() {
  check("ligne 8 : l'archipel prend le niveau de sa première île", () => [
    ev('ARCHIPELAGOS[3].level') === 70,
    json(ev('worldsOf(3)')) === json(['essai3']),
    json(ev('shownArchipelagos()')) === json([1, 2, 3]),
    ev('WORLD_ORDER[WORLD_ORDER.length - 1]') === 'essai3',
  ]);
  ev(`closeModal(); state.missions = 340; state.skyIntroSeen = true; state.expeditionIntroSeen = true; ${VISIT_ALL} save();
      setCurrentWorld("lagon"); switchView("carte")`);
  const tabs = d.querySelectorAll('#map-tabs .map-tab');
  check('ligne 9 : niveau 69, un troisième onglet fermé (cadenas, « Niveau 70 »)', () => [
    ev('level()') === 69,
    tabs.length === 3,
    tabs[2].classList.contains('locked'),
    /🔒/.test(tabs[2].textContent),
    /Niveau 70/.test(tabs[2].textContent),
    /La Grande Expédition/.test(tabs[2].textContent),
  ]);
  spoken.length = 0;
  click(tabs[2]);
  check("ligne 10 : toucher l'onglet fermé, la voix dit quand il s'ouvre et la carte ne change pas", () => [
    said("La Grande Expédition s'ouvrira au niveau 70. Continue tes missions !"),
    d.querySelectorAll('.map-island').length === 8,
  ]);
  check(
    'ligne 11 : sous la carte, le prochain monde',
    /Prochain monde : La Grande Expédition au niveau 70/.test(text(d.getElementById('map-next'))),
  );
}

async function ecranOuverture() {
  ev(
    `closeModal(); state.missions = 344; state.expeditionIntroSeen = false; ${VISIT_ALL} save(); setCurrentWorld("lagon")`,
  );
  spoken.length = 0;
  ev('playGame("count"); onMissionWin()');
  check('la mission qui fait passer au niveau 70', ev('level()') === 70);
  d.getElementById('btn-yay').click(); // « Continuer » sur l'écran de victoire
  await waitFor(() => shown('.expedition-open'), 1500);
  check("ligne 12 : l'écran « Une nouvelle expédition commence ! » s'affiche", () => [
    shown('.expedition-open'),
    text(d.querySelector('.expedition-open h2')) === 'Une nouvelle expédition commence ! ✈️',
  ]);
  check('ligne 12 : sa bulle et son bouton', () => [
    text(d.querySelector('.expedition-open .speech')) ===
      "La Grande Expédition : une troisième carte, avec ses îles et son histoire. Tu passes d'une carte à l'autre avec les onglets.",
    text(d.getElementById('expedition-go')) === 'Partir en expédition ✈️',
    !!d.querySelector('.expedition-open-art .eo-plane'),
  ]);
  check('ligne 12 : il est dit avec le prénom', said('Lou, une nouvelle expédition commence ! La Grande Expédition.'));
  check("ligne 12 : il ne sera montré qu'une fois (sauvegardé)", () => [
    ev('state.expeditionIntroSeen') === true,
    ev('JSON.parse(localStorage.getItem(currentSaveKey())).expeditionIntroSeen') === true,
  ]);
}

async function prologueDeZap() {
  spoken.length = 0;
  click(d.getElementById('expedition-go'));
  check('ligne 13 : le prologue « La carte déchirée », raconté par Zap, avec sa carte vide', () => [
    shown('.story-zapmap svg.zap-map'),
    text(d.querySelector('.char-header h2')) === 'La carte déchirée',
    !!d.querySelector('.char-header [aria-label*="Zap"]'),
    d.querySelector('.story-zapmap svg.zap-map').getAttribute('data-found') === '0',
    !d.querySelector('.story-zapmap .zm-new'),
    said(PROLOGUE_1),
  ]);
  const next = () => d.getElementById('story-next');
  check('ligne 14 : « Suite ➡️ »', () => [!!next(), text(next()) === 'Suite ➡️']);
  click(next());
  click(next());
  check('ligne 14 : la dernière phrase, puis « En route ! ✈️ »', () => [
    !!next(),
    text(next()) === 'En route ! ✈️',
    said('Au bout de la carte, il y a un trésor. Aide-moi à retrouver les morceaux, île après île !'),
  ]);
  click(next());
  await waitFor(() => shown('#btn-go'), 1000);
  check("ligne 14 : puis l'écran habituel « Nouvelle île ! » de l'île d'essai", () => [
    shown('#btn-go'),
    /Nouvelle île !/.test(text(d.querySelector('.reward-box'))),
    /L'Île d'essai/.test(text(d.querySelector('.reward-box'))),
  ]);
  ev('closeModal()');
  check('ligne 15 : une seule fois par profil', () => [
    ev('maybeSeasonOpening()') === false,
    !modalOpen(),
    ev('state.visited.includes("essai3")'),
  ]);
}

function carteVieuxPapier() {
  ev('closeModal(); setCurrentWorld("lagon"); switchView("carte")');
  const tab3 = d.querySelector('#map-tabs .map-tab[data-saison="3"]');
  check("ligne 16 : niveau 70, l'onglet est ouvert", () => [
    !!tab3,
    !tab3.classList.contains('locked'),
    /🧭/.test(tab3.textContent),
  ]);
  click(tab3);
  const map = d.getElementById('island-map'),
    boat = d.getElementById('map-boat');
  check('ligne 16 : la carte vieux papier, son île seule', () => [
    map.classList.contains('paper'),
    !map.classList.contains('sky'),
    d.querySelectorAll('.map-island').length === 1,
    !!d.querySelector('.map-island[data-world="essai3"]'),
  ]);
  check("ligne 16 : l'avion en papier attend à la première île", () => [
    boat.classList.contains('plane'),
    /✈️/.test(boat.textContent),
    boat.classList.contains('parked'),
  ]);
  d.querySelector('#map-tabs .map-tab[data-saison="1"]').click();
  check('revenir au Lagon : plus de vieux papier', !d.getElementById('island-map').classList.contains('paper'));
  const pos = ev('WORLDS.essai3.map');
  check("ligne 17 : l'île d'essai tient dans le cadre", () => [pos.x >= 14, pos.x <= 86, pos.y >= 15, pos.y <= 85]);
}

/* ================= Les fichiers -s3 (spec D19) ================= */
function fichiersS3() {
  // ligne 32 : retirée par la première île de la saison 3 (monde-crayons), qui remplit les tables
  check(
    'les cinq tables de la saison 3 existent et sont vides',
    ['CHARACTERS_S3', 'SQUISHIES_S3', 'STORY_S3', 'ISLE_SCENERY_S3', 'SQ_ART_S3'].every(
      (name) => ev(`typeof ${name}`) === 'object' && ev(`Object.keys(${name}).length`) === 0,
    ),
  );
  check('season3Art existe et ne dessine encore rien', () => [
    ev('typeof season3Art') === 'function',
    ev('(() => { const a = {}; season3Art(a, {}); return Object.keys(a).length; })()') === 0,
  ]);
  // ligne 32b : gardée après les îles
  const PAIRS = [
    ['CHARACTERS', 'CHARACTERS_S3'],
    ['SQUISHIES', 'SQUISHIES_S3'],
    ['STORY', 'STORY_S3'],
    ['ISLE_SCENERY', 'ISLE_SCENERY_S3'],
    ['SQ_ART', 'SQ_ART_S3'],
  ];
  PAIRS.forEach(([all, s3]) => {
    check(`${s3} est étalée à la fin de ${all}`, () => [
      ev(`typeof ${s3}`) === 'object',
      ev(`Object.keys(${s3}).every((k) => ${all}[k] === ${s3}[k])`),
      ev(
        `(() => { const k3 = Object.keys(${s3}); return JSON.stringify(Object.keys(${all}).slice(Object.keys(${all}).length - k3.length)) === JSON.stringify(k3); })()`,
      ),
    ]);
  });
}

(async () => {
  await t.start();

  section('Sans île de saison 3 : rien ne se voit (lignes 1 à 7)');
  t.setIslands(false);
  sansIleCarte();
  sansIleEcrans();
  t.restoreIslands();

  section("Avec l'île d'essai : onglet, ouverture, prologue, avion (lignes 8 à 17)");
  t.setIslands(true);
  ongletFerme();
  await ecranOuverture();
  await prologueDeZap();
  carteVieuxPapier();
  t.restoreIslands();

  section('fichiers -s3');
  fichiersS3();

  await t.finish('la saison 3');
})();
