// L'Île des Crayons, ligne 48 de la spec : aucune clé en double dans les tables
// du jeu. Le test lit le TEXTE SOURCE : une clé écrite deux fois dans un objet
// littéral, ou dans deux tables étalées l'une dans l'autre (`...CHARACTERS_S3`),
// disparaît à l'exécution (la seconde écrase la première, en silence).
// Il vérifie aussi les prénoms, et que les tables indexées par une clé de jeu
// sont des objets simples (la clé `length` y vaut alors `undefined`, spec D10).
// Harnais : test/tools/crayons.js.
const page = require('./tools/page.js');
const t = require('./tools/crayons.js');
const { ev, check, section } = t;

// Les clés déclarées au premier niveau d'une table : les lignes `  clé: …` ou
// `  'clé': …` entre `const TABLE = {` et son `};`, doublons compris.
const KEY = /^ {2}(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*|\d+)):/;
function keysOf(file, table) {
  const lines = page.read(file).split('\n');
  const start = lines.findIndex((l) => new RegExp(`^const ${table} = .*\\{$`).test(l));
  if (start < 0) throw new Error(`table ${table} introuvable dans ${file}`);
  const end = lines.findIndex((l, i) => i > start && /^\}\)?;$/.test(l));
  return lines
    .slice(start + 1, end)
    .map((l) => KEY.exec(l))
    .filter(Boolean)
    .map((m) => m[1] || m[2] || m[3]);
}
// les chaînes d'un tableau écrit une valeur par ligne (GAME_TYPES)
function stringsOf(file, table) {
  const src = page.read(file);
  const body = new RegExp(`^const ${table} = \\[([^\\]]*)\\];`, 'm').exec(src);
  if (!body) throw new Error(`tableau ${table} introuvable dans ${file}`);
  return [...body[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}
const doubles = (list) => [...new Set(list.filter((k, i) => list.indexOf(k) !== i))];
// une vérification qui nomme les clés en double
function unique(label, keys, min) {
  const twice = doubles(keys);
  check(`${label} : chaque clé une seule fois (${keys.length} clés)`, () => [keys.length >= min, twice.length === 0]);
  if (twice.length) console.log('   en double : ' + twice.join(', '));
}

const E = 'js/entities/';
function cles() {
  const items = ['ITEMS', 'CRAFTED', 'DECOS'].flatMap((x) => keysOf(E + 'item/items.js', x));
  unique('objets, recettes et décorations (ITEMS + CRAFTED + DECOS)', items, 150);
  const chars = keysOf(E + 'character/characters.js', 'CHARACTERS').concat(
    keysOf(E + 'character/characters-s3.js', 'CHARACTERS_S3'),
  );
  unique('personnages (CHARACTERS + CHARACTERS_S3)', chars, 61);
  const squishies = keysOf(E + 'squishy/squishies.js', 'SQUISHIES').concat(
    keysOf(E + 'squishy/squishies-s3.js', 'SQUISHIES_S3'),
  );
  unique('squishies (SQUISHIES + SQUISHIES_S3)', squishies, 60);
  unique('séries de squishies (SQUISHY_SERIES)', keysOf(E + 'squishy/squishies.js', 'SQUISHY_SERIES'), 10);
  unique('thèmes de musique (MUSIC_THEMES)', keysOf('js/features/music/music.js', 'MUSIC_THEMES'), 15);
  unique('types de jeux (GAME_TYPES)', stringsOf(E + 'difficulty/game-types.js', 'GAME_TYPES'), 32);
  check("le texte source et le jeu disent le même nombre de clés (rien ne s'est écrasé)", () => [
    items.length === ev('Object.keys(ITEMS).length + Object.keys(CRAFTED).length + Object.keys(DECOS).length'),
    chars.length === ev('Object.keys(CHARACTERS).length'),
    squishies.length === ev('Object.keys(SQUISHIES).length'),
    stringsOf(E + 'difficulty/game-types.js', 'GAME_TYPES').length === ev('GAME_TYPES.length'),
  ]);
  const companions = keysOf(E + 'companion/companions.js', 'COMPANIONS');
  const both = chars.filter((id) => companions.includes(id));
  check("aucun id de personnage n'est un id de compagnon", () => [companions.length >= 5, both.length === 0]);
  if (both.length) console.log('   en double : ' + both.join(', '));
}

/* Une seule exception, voulue et déjà dans le jeu avant cette track : Étincelle
   la licorne a deux fiches, celle du Lagon (`licorne`) et celle de son Royaume
   (`etincelle`, « rentrée chez elle », js/entities/character/characters.js).
   C'est le même personnage ; toute autre paire de même prénom fait échouer. */
const SAME_PERSON = { Étincelle: ['etincelle', 'licorne'] };
function prenoms() {
  const who = ev('Object.entries(CHARACTERS).map(([id, c]) => [c.name, "personnage " + id])').concat(
    ev('Object.entries(COMPANIONS).map(([id, c]) => [c.name, "compagnon " + id])'),
  );
  const twice = doubles(who.map(([name]) => name)).filter((name) => {
    const ids = who.filter(([n]) => n === name).map(([, x]) => x.replace('personnage ', ''));
    return JSON.stringify(ids.sort()) !== JSON.stringify(SAME_PERSON[name] || []);
  });
  check("aucun prénom de personnage n'est porté par un autre personnage ni par un compagnon", () => [
    who.length >= 66,
    twice.length === 0,
  ]);
  if (twice.length) console.log('   en double : ' + twice.join(', '));
  check("les 4 prénoms de l'île (Gribouille, Gommette, Taillou, Aquarelle) ne sont portés par personne d'autre", () =>
    ['Gribouille', 'Gommette', 'Taillou', 'Aquarelle'].map((name) => who.filter(([n]) => n === name).length === 1),
  );
}

// spec D10 : toute table indexée par une clé de jeu est un objet simple, jamais un tableau
function tablesDeJeux() {
  const TABLES = [
    'GAME_RENDERERS',
    'HINT_PROVIDERS',
    'GAME_TIER_MAX',
    'PROGRESS_CHEERS',
    'SKILL_ERR_TOLERANCE',
    'LIVES_TABLE',
    'TIMER_SECONDS',
    'leoSession.primed',
    'state.skills',
    'state.gameCounts',
  ];
  ev('state.skills = state.skills || {}; state.gameCounts = state.gameCounts || {}');
  check('les tables indexées par une clé de jeu sont des objets simples (la clé « length » y est libre)', () =>
    TABLES.map((x) => ev(`!Array.isArray(${x}) && typeof ${x} === 'object' && ${x} !== null`)),
  );
  check('« length » est une clé de jeu comme une autre', () => [
    ev('typeof GAME_RENDERERS.length') === 'function',
    ev('typeof HINT_PROVIDERS.length') === 'function',
    ev('typeof PROGRESS_CHEERS.length') === 'string',
  ]);
}

(async () => {
  await t.start();
  section('Ligne 48 : aucune clé en double (texte source)');
  cles();
  prenoms();
  section('Ligne 48 : les tables indexées par une clé de jeu');
  tablesDeJeux();
  await t.finish("l'Île des Crayons (clés en double)");
})();
