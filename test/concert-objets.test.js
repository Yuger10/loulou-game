// L'Île du Grand Concert : ses objets, ses recettes, ses décorations, les
// objets préférés de ses personnages, sa série de squishies « Concert », et
// aucune clé en double (critères 29 et 30 de la spec, tâche 16 du plan).
// Harnais : test/tools/concert.js.
const page = require('./tools/page.js');
const t = require('./tools/concert.js');
const { d, ev, json, check, section, LEVEL } = t;

const IDS = ['stella', 'doremi', 'xylo', 'trompi'];
const NAMES = ['Stella', 'Dorémi', 'Xylo', 'Trompi'];
const of = (table) => ev(`Object.keys(${table}).filter((k) => ${table}[k].world === "concert")`);
const row = (table, k) => {
  const x = ev(`${table}[${json(k)}]`);
  return [x.emoji, x.name, x.price, x.world].join('|');
};
const ITEMS = {
  billetconcert: '🎟️|Billet de concert|5',
  programme: '📋|Programme du concert|4',
  etoilescene: '🌟|Étoile de la scène|8',
  lunettesstar: '🕶️|Lunettes de star|6',
  ampoule: '💡|Ampoule de scène|5',
  projecteur: '🔦|Projecteur|7',
  casque: '🎧|Casque de musique|6',
  saxo: '🎷|Saxophone doré|9',
};
const DECOS = {
  sceneD: '🏟️|Grande scène|40',
  roueD: '🎡|Grande roue de la fête|30',
  enceinteD: '🔊|Enceinte géante|18',
  banderolesD: '🎏|Banderoles|14',
  chaisesD: '🪑|Rang de chaises|12',
};
const CRAFTED = ['etincelles', 'medaille'];

function objets() {
  check('critère 29 : les 8 objets (emoji, nom, prix), tous de cette île', () => [
    json(of('ITEMS')) === json(Object.keys(ITEMS)),
    ...Object.keys(ITEMS).map((k) => row('ITEMS', k) === ITEMS[k] + '|concert'),
  ]);
  check("critère 29 : 2 recettes, avec des ingrédients de l'île", () => [
    json(of('CRAFTED')) === json(CRAFTED),
    row('CRAFTED', 'etincelles') === '🎇|Feu d’étincelles|22|concert'.replace('’', "'"),
    json(ev('CRAFTED.etincelles.recipe')) === json({ ampoule: 2, etoilescene: 1 }),
    row('CRAFTED', 'medaille') === '🥇|Médaille du concert|20|concert',
    json(ev('CRAFTED.medaille.recipe')) === json({ saxo: 1, programme: 1, billetconcert: 1 }),
  ]);
  check('critère 29 : 5 décorations', () => [
    json(ev('decosOf("concert").map(([k]) => k)')) === json(Object.keys(DECOS)),
    ...Object.keys(DECOS).map((k) => row('DECOS', k) === DECOS[k] + '|concert'),
  ]);
  const loot = (id) => ev(`CHARACTERS.${id}.loot`);
  check("critère 30 : 2 objets préférés par personnage, de l'île, hors de son propre butin", () =>
    IDS.map((id) => {
      const fav = ev(`favoritesOf(${json(id)})`);
      return (
        fav.length === 2 &&
        new Set(fav).size === 2 &&
        fav.every((k) => ev(`ITEMS[${json(k)}].world`) === 'concert' && !loot(id).includes(k))
      );
    }),
  );
  check('critère 30 : 3 objets ne sont dans le butin de personne', () => [
    json(of('ITEMS').filter((k) => !IDS.some((id) => loot(id).includes(k)))) === json(['projecteur', 'casque', 'saxo']),
  ]);
}

const SQUISHIES = {
  'micro-mochi': 'Micro mochi|un micro mochi|commun|rose|rond|petit',
  'guitare-guimauve': 'Guitare guimauve|une guitare guimauve|commun|orange|ovale|grand',
  'note-croche': 'Note croche|une note croche|commun|bleu|ovale|petit',
  'billet-dore': 'Billet doré|un billet doré|commun|jaune|carre|petit',
  'fauvette-doremi': 'Dorémi|Dorémi, la petite fauvette|rare|vert|rond|petit',
  'cle-sol-etoilee': 'Clé de sol étoilée|une clé de sol étoilée|brille|violet|ovale|grand',
};
const BODIES = ['rond', 'ovale-v', 'ovale-v', 'carre', 'rond', 'ovale-v'];
function serie() {
  const ids = ev('squishiesOf("concert")');
  check('critère 29 : la série Concert, sur son île, à la fin des séries, sa boîte or et rouge velours', () => [
    json(ev('SQUISHY_SERIES.concert')) === json({ name: 'Concert', emoji: '🎼', world: 'concert' }),
    ev('SQUISHY_ISLAND_SERIES.concert') === 'concert',
    ev('SQUISHY_SERIES_ORDER.indexOf("concert")') > ev('SQUISHY_SERIES_ORDER.indexOf("guilis")'),
    ev('SQUISHY_SERIES_ORDER.filter((s) => s === "concert").length') === 1,
    json(ev('SQ_BOX_COLORS.concert')) === json(['#FFE7A8', '#8A2E3B']),
  ]);
  check('critère 29 : 6 modèles (4 communs, Dorémi rare, la clé de sol ✨), données exactes', () => [
    json(ids) === json(Object.keys(SQUISHIES)),
    ...ids.map((id) => {
      const m = ev(`SQUISHIES[${json(id)}]`);
      return [m.name, m.say, m.rarity, m.color, m.shape, m.size].join('|') === SQUISHIES[id] && m.series === 'concert';
    }),
  ]);
  check('critère 29 : chaque modèle a son dessin, sur le corps demandé', () => [
    ...Object.keys(SQUISHIES).map((id) => {
      const svg = ev(`squishyArtSVG(${json(id)})`);
      return svg !== '' && svg.includes('<svg') && svg.includes('sq-face') && !/undefined|NaN/.test(svg);
    }),
    json(Object.keys(SQUISHIES).map((id) => ev(`SQ_ART_S3[${json(id)}].body`))) === json(BODIES),
    Object.keys(SQUISHIES).every((id) => ev(`!!(SQ_ART_S3[${json(id)}].back || SQ_ART_S3[${json(id)}].front)`)),
  ]);
  ev(`closeModal(); state.missions = ${LEVEL(102) - 1}; save()`);
  const before = ev('squishySeriesAvailable("concert")');
  ev(`state.missions = ${LEVEL(102)}; save(); openSquishyRoom("collection")`);
  check('la série apparaît dans la chambre au niveau 102, pas avant', () => [
    before === false,
    ev('squishySeriesAvailable("concert")') === true,
    !!d.querySelector('.sq-series[data-series="concert"]'),
  ]);
  ev('closeModal()');
}

// Tâche 16 : une clé écrite deux fois dans une table s'écraserait sans bruit
function clesUniques() {
  check('clés uniques : 4 personnages, 8 objets, 2 recettes, 5 décorations, 6 squishies pour cette île', () => [
    ev('Object.values(CHARACTERS).filter((c) => c.world === "concert").length') === 4,
    of('ITEMS').length === 8 && of('CRAFTED').length === 2 && of('DECOS').length === 5,
    ev('Object.values(SQUISHIES).filter((m) => m.series === "concert").length') === 6,
    json(IDS.map((id) => ev(`CHARACTERS.${id}.name`))) === json(NAMES),
  ]);
  const times = (files, key) =>
    files
      .map((f) => page.read(f))
      .join('\n')
      .split('\n')
      .filter((line) => new RegExp(`^\\s*'?${key}'?: [{[]`).test(line)).length;
  const items = ['js/entities/item/items.js'];
  check('clés uniques : aucune clé nouvelle n’existait déjà dans sa table', () => [
    [...Object.keys(ITEMS), ...CRAFTED, ...Object.keys(DECOS)].every((k) => times(items, k) === 1),
    IDS.every(
      (id) => times(['js/entities/character/characters.js', 'js/entities/character/characters-s3.js'], id) === 0,
    ),
    IDS.every((id) => times(['js/entities/character/characters-concert.js'], id) === 1),
    Object.keys(SQUISHIES).every((id) => times(['js/entities/squishy/squishies.js'], id) === 0),
    Object.keys(SQUISHIES).every((id) => times(['js/entities/squishy/squishies-s3.js'], id) === 1),
  ]);
  check('clés uniques : ni vêtement, ni compagnon, ni prénom déjà porté', () => [
    [...of('ITEMS'), ...of('CRAFTED'), ...of('DECOS')].every((k) => !ev(`WARDROBE[${json(k)}]`)),
    ev('Object.keys(CHARACTERS).every((id) => !COMPANIONS[id])'),
    NAMES.every((n) => ev(`Object.values(CHARACTERS).filter((c) => c.name === ${json(n)}).length`) === 1),
    NAMES.every((n) => !ev('Object.values(COMPANIONS).map((c) => c.name)').includes(n)),
    ev('new Set(GAME_TYPES).size === GAME_TYPES.length'),
    ev('SQUISHIES.xylophone.series') === 'instruments',
  ]);
}

(async () => {
  await t.start();
  section('L’Île du Grand Concert : objets, recettes, décorations (critères 29 et 30)');
  objets();
  section('L’Île du Grand Concert : la série de squishies « Concert »');
  serie();
  section('L’Île du Grand Concert : clés uniques');
  clesUniques();
  await t.finish('l’Île du Grand Concert (les objets)');
})();
