// La carte de Zap en 5 morceaux (track saison3-ouverture, lignes 22 à 29) :
// ses morceaux, ce qu'elle dit, sa place dans le journal, le prologue relu et
// les chapitres de la saison 3. Harnais et île d'essai : test/tools/saison3.js.
const t = require('./tools/saison3.js');
const { d, ev, json, check, section, shown, text, said, click, spoken, parseSVG, sameMap } = t;
const { PIECES, CHAPTER, ESSAI3, PROLOGUE_1 } = t;

/* ================= La carte de Zap ================= */
function morceaux() {
  check("ligne 22 : les cinq morceaux, dans l'ordre des îles", json(ev('ZAP_MAP_PIECES')) === json(PIECES));
  ev('state.storySolved = { lagon: true, coffres: true, crayons: true }');
  check("ligne 23 : les morceaux trouvés, dans l'ordre de la carte", () => [
    json(ev('zapMapFound()')) === json(['crayons', 'coffres']),
    ev('zapMapPieces()') === 2,
  ]);
  ev('state.storySolved = {}');
  check('ligne 23 : aucun morceau au départ', () => [json(ev('zapMapFound()')) === '[]', ev('zapMapPieces()') === 0]);
}

/** @param {string[]} found les morceaux trouvés */
function carteAvec(found) {
  const svg = parseSVG(`zapMapSVG(${json(found)})`);
  check(`ligne 24 : la carte avec ${found.length} morceau(x)`, () => {
    const paths = [...svg.querySelectorAll('path.zm-piece')];
    const xs = paths.map((n) => Number((/^M\s*(-?[\d.]+)/.exec(n.getAttribute('d')) || [])[1]));
    return [
      svg.classList.contains('zap-map'),
      svg.getAttribute('viewBox') === '0 0 200 120',
      svg.getAttribute('data-found') === String(found.length),
      paths.length === 5,
      json(paths.map((n) => n.getAttribute('data-piece'))) === json(PIECES),
      xs.every((x, i) => Number.isFinite(x) && (i === 0 || x > xs[i - 1])),
      paths.every((n) => n.getAttribute('data-found') === String(found.includes(n.getAttribute('data-piece')))),
      svg.getAttribute('aria-label') === ev(`zapMapSay(${found.length})`),
      !svg.querySelector('.zm-new'),
    ];
  });
}

function morceauQuiBrille() {
  const lone = parseSVG(`zapMapSVG(['crayons', 'coffres'], { fresh: 'coffres' })`);
  check('ligne 24 : avec `fresh`, ce seul morceau brille', () => {
    const fresh = [...lone.querySelectorAll('.zm-new')];
    return [
      fresh.length === 1,
      fresh[0].getAttribute('data-piece') === 'coffres',
      fresh[0].classList.contains('zm-piece'),
    ];
  });
  ev('state.storySolved = { crayons: true, coffres: true }');
  const svg = parseSVG(`zapMapSVG(zapMapFound(), { fresh: 'coffres' })`);
  const piece = (id) => svg.querySelector(`.zm-piece[data-piece="${id}"]`);
  check('ligne 24b : les Coffres résolus avant les Dumplings, chaque morceau reste à sa place', () => [
    piece('coffres').getAttribute('data-found') === 'true',
    piece('coffres').classList.contains('zm-new'),
    piece('dumplings').getAttribute('data-found') === 'false',
    svg.getAttribute('data-found') === '2',
  ]);
}

function ceQueDitLaCarte() {
  check('ligne 25 : ce que dit la carte', () => [
    ev('zapMapSay(0)') ===
      "La carte de Zap : aucun morceau pour l'instant. Résous l'énigme de chaque île pour les retrouver !",
    ev('zapMapSay(1)') === 'La carte de Zap : tu as trouvé 1 morceau sur 5.',
    [2, 3, 4].every((n) => ev(`zapMapSay(${n})`) === `La carte de Zap : tu as trouvé ${n} morceaux sur 5.`),
    ev('zapMapSay(5)') === 'La carte de Zap est complète ! Les 5 morceaux sont réunis.',
  ]);
}

/* ================= Dans le journal et les chapitres ================= */
const sec = () => d.querySelector('section.story-season[data-saison="3"]');

function journalOuvert() {
  ev(`closeModal(); state.missions = 345; state.skyIntroSeen = true; state.expeditionIntroSeen = true; ${t.VISIT_ALL}
      state.storySolved = { crayons: true }; save(); openStoryJournal()`);
  check('ligne 26 : la saison 3 a sa section', () => [text(sec().querySelector('h3')) === '🧭 La Grande Expédition']);
  check('ligne 26 : la ligne du prologue « La carte déchirée »', () => {
    const line = text(sec().querySelector('[data-prologue="3"]'));
    return [
      !!sec().querySelector('[data-prologue="3"]'),
      /La carte déchirée/.test(line),
      /🧭/.test(line),
      /📜/.test(line),
    ];
  });
  const row = () => sec().querySelector('.story-zapmap-row');
  check('ligne 26 : la carte de Zap, son compte et son bouton 🔈', () => [
    sameMap(row().querySelector('svg.zap-map'), `zapMapSVG(['crayons'])`),
    /🗺️ La carte de Zap : 1 \/ 5/.test(text(row())),
    /🔈/.test(text(row().querySelector('button[data-say]'))),
    row().querySelector('button[data-say]').getAttribute('data-say') === ev('zapMapSay(1)'),
  ]);
  spoken.length = 0;
  click(d.querySelector('section.story-season[data-saison="3"] .story-zapmap-row button[data-say]'));
  check('ligne 26 : le bouton 🔈 décrit la carte', said('La carte de Zap : tu as trouvé 1 morceau sur 5.'));
  check(
    'la saison 2 du journal garde Grisou hors de la saison 3',
    !d.querySelector('.story-season[data-saison="2"] .story-zapmap-row'),
  );
}

function journalFermeEtRelecture() {
  ev('closeModal(); state.missions = 340; save(); openStoryJournal()');
  check('ligne 27 : niveau 69, la section est fermée, sans prologue ni carte', () => [
    text(sec().querySelector('h3')) === '🔒 La Grande Expédition (niveau 70)',
    !sec().querySelector('[data-prologue]'),
    !sec().querySelector('.story-zapmap-row'),
  ]);

  ev('closeModal(); state.missions = 345; state.expeditionIntroSeen = false; save(); openStoryJournal()');
  const snap = ev('JSON.stringify(state)');
  spoken.length = 0;
  click(d.querySelector('[data-prologue="3"]'));
  check('ligne 28 : relire le prologue de Zap', () => [
    shown('.story-zapmap svg.zap-map'),
    text(d.querySelector('.char-header h2')) === 'La carte déchirée',
    sameMap(d.querySelector('.story-zapmap svg.zap-map'), `zapMapSVG(['crayons'])`),
    said(PROLOGUE_1),
  ]);
  for (let k = 0; k < 3 && d.getElementById('story-next'); k++) d.getElementById('story-next').click();
  check("ligne 28 : la relecture ne change pas l'état", ev('JSON.stringify(state)') === snap);
  ev('closeModal(); state.expeditionIntroSeen = true; save()');
}

// ligne 29 : un chapitre de saison 3 (posé par le test) montre la carte, pas Grisou
function chapitreEssai() {
  ev(`window.__story = { essai3: STORY.essai3, crayons: STORY.crayons };
      STORY.essai3 = ${json(CHAPTER)}; state.storySolved = { crayons: true }; save(); openStoryChapter('essai3')`);
  check('ligne 29 : le chapitre montre la carte de Zap (sans morceau qui brille), pas Grisou', () => [
    shown('.story-zapmap svg.zap-map'),
    !d.querySelector('.story-grisou'),
    sameMap(d.querySelector('.story-zapmap svg.zap-map'), `zapMapSVG(['crayons'])`),
  ]);
  spoken.length = 0;
  ev('storyWin("essai3")');
  const want = ev('toSpoken(zapMapSay(zapMapPieces()))');
  check('ligne 29 : la victoire montre la carte', () => [
    shown('.story-zapmap.happy svg.zap-map'),
    sameMap(d.querySelector('.story-zapmap.happy svg.zap-map'), `zapMapSVG(zapMapFound(), { fresh: 'essai3' })`),
    !d.querySelector('.story-zapmap .zm-new'),
  ]);
  check('ligne 29 : la voix dit la carte à la fin de la phrase de victoire (un seul speak)', () => [
    spoken.some((x) => x.includes(want)),
    spoken.filter((x) => x.includes(want)).every((x) => /Tu gagnes 20 pièces/.test(x) && x.trim().endsWith(want)),
  ]);
}

// une île de la carte (posée par le test) : son morceau brille à la victoire
function chapitreDeLaCarte() {
  ev(`closeModal(); WORLDS.essai3b = Object.assign(${json(ESSAI3)}, { level: 78 }); refreshArchipelagos();
      STORY.essai3b = ${json(CHAPTER)}; ZAP_MAP_PIECES[1] = 'essai3b'; state.storySolved = { crayons: true }; save()`);
  spoken.length = 0;
  ev('storyWin("essai3b")');
  check('ligne 29 : pour une île de la carte, son morceau brille et le compte suit', () => {
    const svg = d.querySelector('.story-zapmap.happy svg.zap-map');
    const fresh = [...svg.querySelectorAll('.zm-new')];
    return [
      svg.getAttribute('data-found') === '2',
      fresh.length === 1,
      fresh[0].getAttribute('data-piece') === 'essai3b',
      said('La carte de Zap : tu as trouvé 2 morceaux sur 5.'),
    ];
  });
  ev(`closeModal(); ZAP_MAP_PIECES[1] = 'dumplings'; delete WORLDS.essai3b; delete STORY.essai3b; refreshArchipelagos();
      ['essai3', 'crayons'].forEach((id) => { if (__story[id]) STORY[id] = __story[id]; else delete STORY[id]; });
      state.storySolved = { lagon: true }; save()`);
  check('la carte retrouve ses cinq îles', json(ev('ZAP_MAP_PIECES')) === json(PIECES));
  // la saison 2 garde Grisou (ligne 30)
  ev(`state.missions = 345; save(); openStoryChapter('boites')`);
  check('un chapitre de la saison 2 montre toujours Grisou', () => [
    shown('.story-grisou .grisou'),
    !d.querySelector('.story-zapmap'),
  ]);
  ev('closeModal()');
}

(async () => {
  await t.start();

  section('La carte de Zap (lignes 22 à 25)');
  const before = ev('JSON.stringify(state.storySolved)');
  morceaux();
  [[], ['crayons'], ['crayons', 'coffres'], ['dumplings', 'chatouilles', 'concert'], PIECES].forEach(carteAvec);
  morceauQuiBrille();
  ceQueDitLaCarte();
  ev(`state.storySolved = ${before}`);

  section('La carte de Zap dans le journal et les chapitres (lignes 26 à 29)');
  t.setIslands(true);
  journalOuvert();
  journalFermeEtRelecture();
  chapitreEssai();
  chapitreDeLaCarte();
  t.restoreIslands();
  check('tout est remis en place', () => [
    json(ev('worldsOf(3)')) === json(ev('Object.keys(WORLDS).filter((id) => WORLDS[id].saison === 3)')),
    !ev('WORLDS.essai3'),
  ]);

  await t.finish('la carte de Zap');
})();
