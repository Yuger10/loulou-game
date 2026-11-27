const { EMPTY, J, item, boot, profilesOf, wait, check, done, section, P, storageOf } = require('./fixtures.js');

/* ============ S3 et ligne 5 : la sauvegarde, la migration, l'import ============ */
const SAVE_DAY = '2026-11-22';
const EMPTY_JSON = J(EMPTY);
const IMG = '<img id="pwn" src="x">';
// une file trafiquée : 2 items valides au milieu de tout ce qu'on peut y glisser
const RIGGED = {
  items: [
    item('math', { p: { g: 'math', a: 70, b: 5, op: '+' }, k: 'math:70+5' }),
    item('reading', { p: { g: 'reading', w: IMG, img: true }, k: `reading:${IMG}-1` }),
    item('clock', { due: 'demain' }),
    item('math'),
    { ...item('compare', { due: '2031-01-01' }), html: IMG },
    item('math', { box: 7 }),
    ...Array.from({ length: 500 }, (_, i) => item('clock', { k: IMG + i })),
  ],
  offered: IMG,
};
const CLEANED = J({ items: [item('math'), item('compare', { due: '2026-11-29' })], offered: null });
const BASE_SAVE = { v: 9, name: 'Nina', avatar: '👧', coins: 12, missions: 7, inventory: { perle: 2 } };
// Nina et sa partie enregistrée, au jour des tests de sauvegarde
const ninaSaved = (save, more = {}) =>
  boot({
    day: SAVE_DAY,
    saved: { 'lagon-magique-profiles': profilesOf(), 'lagon-magique-save:p1': J(save), ...more },
  });

async function oldSaveCase(old) {
  const pg = ninaSaved(old);
  const { ev, js, w } = pg;
  await wait(200);
  const v = old.v === undefined ? 0 : old.v;
  check(`v${v} : la version de sauvegarde a augmenté`, () => ev('SAVE_VERSION') > 9);
  check(
    `v${v} : la partie reçoit une file vide`,
    () => js('state.review') === EMPTY_JSON,
    () => js('state.review'),
  );
  check(`v${v} : la partie est à la version actuelle`, () => ev('state.v') === ev('SAVE_VERSION'));
  check(
    `v${v} : le reste est identique`,
    () => js('[state.name, state.coins, state.missions, state.inventory]') === J(['Nina', 12, 7, { perle: 2 }]),
  );
  check(
    `v${v} : la partie réenregistrée porte la file`,
    () => J(JSON.parse(w.localStorage.getItem('lagon-magique-save:p1')).review) === EMPTY_JSON,
  );
  check(`v${v} : une partie neuve a une file vide`, () => js('freshState().review') === EMPTY_JSON);
  done(pg, `v${v} : aucune erreur JS`);
}

// une partie trafiquée chargée, à la version `v` : la file attendue après lecture
async function riggedLoadCase([name, review, expected], v) {
  const pg = ninaSaved({ ...BASE_SAVE, v, review });
  const { ev, js, d, errs, w } = pg;
  await wait(200);
  check(
    `${name} (v${v}) : la file est remise en forme`,
    () => js('state.review') === expected,
    () => js('state.review'),
  );
  check(
    `${name} (v${v}) : rien n'est injecté, aucune erreur JS`,
    !d.getElementById('pwn') && errs.length === 0,
    errs.join(' | '),
  );
  check(`${name} (v${v}) : le jeu a démarré`, () => ev('state.name') === 'Nina');
  w.close();
}
const RIGGED_CASES = [
  ['file trafiquée', RIGGED, CLEANED],
  ['review: "x"', 'x', EMPTY_JSON],
  ['review: null', null, EMPTY_JSON],
  ['review: []', [], EMPTY_JSON],
  ['items: "x"', { items: 'x', offered: SAVE_DAY }, J({ items: [], offered: SAVE_DAY })],
];

async function parentSpaceChecks(pg) {
  const { ev, js, d, errs, w } = pg;
  check(
    "espace parents : la file d'un autre joueur passe par readSave",
    () => js('profileState("p2").review') === CLEANED,
    () => js('profileState("p2").review'),
  );
  ev('parentUnlockedUntil = Date.now() + 60000; openParentSpace("p2")');
  await wait(100);
  check("espace parents : rien n'est injecté", !d.getElementById('pwn') && errs.length === 0, errs.join(' | '));
  check(
    "espace parents : la partie lue n'est pas réécrite",
    () => JSON.parse(w.localStorage.getItem('lagon-magique-save:p2')).review.items.length === RIGGED.items.length,
  );
  ev('closeModal()');
}

async function importChecks(pg) {
  const { ev, js, d, errs } = pg;
  const backup = {
    at: '2026-11-22T10:00:00.000Z',
    data: {
      'lagon-magique-profiles': profilesOf(),
      'lagon-magique-save:p1': J({ ...BASE_SAVE, coins: 77, review: RIGGED }),
    },
  };
  let imported = 'ok';
  try {
    ev(`applyBackup(${J(backup)})`);
  } catch (e) {
    imported = e.message;
  }
  await wait(100);
  check("import : la sauvegarde s'applique sans erreur", imported === 'ok', imported);
  check('import : la partie importée est bien chargée', () => ev('state.coins') === 77);
  check(
    'import : la file est remise en forme',
    () => js('state.review') === CLEANED,
    () => js('state.review'),
  );
  check(
    "import : rien n'est injecté, aucune erreur JS",
    !d.getElementById('pwn') && errs.length === 0,
    errs.join(' | '),
  );
}

async function restartTests() {
  section('Une file enregistrée survit au redémarrage');
  const a = boot({ day: SAVE_DAY });
  await wait(200);
  a.d.getElementById('btn-splash-play').click();
  a.d.getElementById('name-input').value = 'Zoé';
  a.d.querySelector('.avatar-opt').click();
  a.d.getElementById('btn-start').click();
  await wait(300);
  const review = { items: Object.keys(P).map((n) => item(n)), offered: SAVE_DAY };
  a.ev(`closeModal(); state.review = ${J(review)}; save()`);
  const saved = storageOf(a.w);
  a.w.close();
  const b = boot({ day: SAVE_DAY, saved });
  await wait(300);
  check(
    'la file est retrouvée telle quelle',
    () => b.js('state.review') === J(review),
    () => b.js('state.review'),
  );
  b.ev('load()');
  check('et encore après un second chargement', () => b.js('state.review') === J(review));
  done(b);
}

async function saveTests() {
  section("Ligne 5 : une partie d'une version antérieure");
  const noVersion = { name: 'Nina', avatar: '👧', coins: 12, missions: 7, inventory: { perle: 2 } };
  for (const old of [BASE_SAVE, noVersion]) await oldSaveCase(old);

  section('S3 : une partie trafiquée, chargée');
  // à une ancienne version (migration) comme à une version sans migration
  for (const rigged of RIGGED_CASES) for (const v of [9, 99]) await riggedLoadCase(rigged, v);

  section("S3 : une partie trafiquée, importée (applyBackup) ou lue par l'espace parents");
  const pg = ninaSaved(BASE_SAVE, { 'lagon-magique-save:p2': J({ ...BASE_SAVE, name: 'Léo', review: RIGGED }) });
  await wait(200);
  await parentSpaceChecks(pg);
  await importChecks(pg);
  pg.w.close();

  await restartTests();
}

module.exports = { EMPTY_JSON, saveTests };
