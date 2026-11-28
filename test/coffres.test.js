// L'Île des Coffres : aucune clé en double (table X1 de la spec). Chaque clé
// nouvelle de l'île n'existe qu'une fois dans son registre, les prénoms des 4
// personnages ne sont portés par personne d'autre, et les deux mini-jeux de
// l'île ne dépendent d'aucune entité de l'île (table P0). L'île :
// test/coffres-ile.test.js ; l'histoire : test/coffres-histoire.test.js.
// Harnais : test/tools/coffres.js.
const fs = require('fs');
const path = require('path');
const t = require('./tools/coffres.js');
const { ev, json, check, section } = t;

const IDS = ['clemence', 'kadi', 'grignote', 'pincou'];
const NAMES = ['Clémence', 'Kadi', 'Grignote', 'Pinçou'];
// X1 : les clés nouvelles, par registre
const KEYS = {
  ITEMS: ['clecuivre', 'piecedor', 'petitcadenas', 'boulier', 'tournevis', 'loupe', 'lampe', 'bague'],
  CRAFTED: ['trousseau', 'medaillon'],
  DECOS: ['salleD', 'porteD', 'arbreclesD', 'ancreD', 'jarreD'],
  SQUISHIES: ['coffre-mochi', 'cadenas-coeur', 'cle-lune', 'piece-souriante', 'kadi', 'coffre-etoiles'],
  CHARACTERS: IDS,
};
const ISLAND_TABLES = [
  'WORLDS',
  'STORY',
  'EPISODES',
  'MUSIC_THEMES',
  'ISLE_SCENERY',
  'SQUISHY_SERIES',
  'SQUISHY_ISLAND_SERIES',
];

function personnages() {
  check('clés uniques : les 4 personnages ne sont ni des compagnons ni d’autres personnages', () => [
    ...IDS.map((id) => !ev(`${json(id)} in COMPANIONS`)),
    ...IDS.map((id) => ev(`Object.keys(CHARACTERS).filter((k) => k === ${json(id)}).length`) === 1),
    ...IDS.map((id) => ev(`CHARACTERS[${json(id)}].world`) === 'coffres'),
  ]);
  check('prénoms : Clémence, Kadi, Grignote et Pinçou ne sont portés par personne d’autre', () => {
    const names = ev('Object.values(CHARACTERS).map((c) => c.name)').concat(
      ev('Object.values(COMPANIONS).map((c) => c.name)'),
    );
    return NAMES.map((n) => names.filter((x) => x === n).length === 1);
  });
}
function registres() {
  check('clés uniques : objets, recettes et décorations sont disjoints deux à deux', () => {
    const keys = ev('[...Object.keys(ITEMS), ...Object.keys(CRAFTED), ...Object.keys(DECOS)]');
    return [new Set(keys).size === keys.length];
  });
  check('X1 : chaque clé nouvelle de l’île est présente une seule fois dans son registre', () =>
    Object.entries(KEYS).flatMap(([table, keys]) =>
      keys.map((k) => ev(`Object.keys(${table}).filter((x) => x === ${json(k)}).length`) === 1),
    ),
  );
  check('X1 : une seule entrée « coffres » dans chaque table de l’île, une seule fois dans l’ordre des séries', () => [
    ...ISLAND_TABLES.map((table) => ev(`Object.keys(${table}).filter((k) => k === "coffres").length`) === 1),
    ev('SQUISHY_SERIES_ORDER.filter((s) => s === "coffres").length') === 1,
    ev('WORLD_ORDER.filter((id) => id === "coffres").length') === 1,
  ]);
  check('X1 : le squishy rare « kadi » et le personnage Kadi sont le même être, dans deux registres', () => [
    ev('SQUISHIES.kadi.series') === 'coffres' && ev('SQUISHIES.kadi.rarity') === 'rare',
    ev('CHARACTERS.kadi.name') === 'Kadi',
  ]);
}
// P0 : un jeu livré avant son île ne dépend d'aucune entité de l'île
function jeuxSansIle() {
  const root = path.join(__dirname, '..', 'js', 'features', 'minigames');
  const imports = (dir) =>
    fs
      .readdirSync(path.join(root, dir))
      .filter((f) => f.endsWith('.js'))
      .flatMap((f) =>
        [...fs.readFileSync(path.join(root, dir, f), 'utf8').matchAll(/from '([^']+)'/g)].map((m) => m[1]),
      );
  const ISLAND = /entities\/(character|item|squishy|world)\/|features\/(story|island|music|squishies)\//;
  check('P0 : « problems » et « code » n’importent ni personnages, ni objets, ni squishies, ni île', () => [
    imports('problems').length > 10 && imports('code').length > 5,
    !imports('problems').some((x) => ISLAND.test(x)),
    !imports('code').some((x) => ISLAND.test(x)),
  ]);
  check('P0 : les personnages des histoires sont une table locale, aux prénoms de l’île', () => [
    json(ev('Object.values(PB_PEOPLE).map((x) => x.name)').slice(0, 4)) === json(NAMES),
    json(IDS.map((id) => ev(`PB_PEOPLE[${json(id)}].emoji`))) ===
      json(IDS.map((id) => ev(`CHARACTERS[${json(id)}].emoji`))),
  ]);
}

(async () => {
  await t.start();
  section("L'Île des Coffres : aucune clé en double (X1)");
  personnages();
  registres();
  section("L'Île des Coffres : ses deux jeux ne dépendent pas d'elle (P0)");
  jeuxSansIle();
  await t.finish("l'Île des Coffres (les clés)");
})();
