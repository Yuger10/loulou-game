// Le Monde des Chatouilles : ses objets, ses recettes, ses décorations, les
// objets préférés de ses personnages, et aucune clé en double (critère 35 de
// la spec, table I4). Harnais : test/tools/chatouilles.js.
const page = require('./tools/page.js');
const t = require('./tools/chatouilles.js');
const { ev, json, check, section } = t;

const IDS = ['plumette', 'guili', 'lulu', 'pic'];
const LOOT = {
  plumette: ['plumeguili', 'chaussettes'],
  guili: ['plumeguili', 'yoyofarceur'],
  lulu: ['nezclown', 'boiterires'],
  pic: ['chaussettes', 'nezclown'],
};
/* ================= I4 : objets, recettes, décorations ================= */
const of = (table) => ev(`Object.keys(${table}).filter((k) => ${table}[k].world === "chatouilles")`);
const row = (table, k) => {
  const x = ev(`${table}[${json(k)}]`);
  return [x.emoji, x.name, x.price, x.world].join('|');
};
const ITEMS = {
  plumeguili: '🪶|Plume à guilis|6',
  nezclown: '🔴|Nez de clown|5',
  chaussettes: '🧦|Chaussettes à pois|5',
  boiterires: '🎁|Boîte à rires|7',
  yoyofarceur: '🪀|Yo-yo farceur|6',
  lunettesrigolotes: '🥸|Lunettes rigolotes|8',
  bonbonpetillant: '🍬|Bonbon qui pétille|5',
  sifflet: '📯|Trompette à rires|7',
};
const DECOS = {
  arbreplumesD: '🌳|Arbre à plumes|40',
  trampolineD: '🤸|Trampoline des fous rires|30',
  fanionsrireD: '🎏|Fanions rigolos|18',
  canapeD: '🛋️|Canapé des guilis|14',
  nuagecoussinD: '☁️|Nuage-coussin|12',
};
function objets() {
  check('critère 35, I4 : les 8 objets (emoji, nom, prix), tous de cette île', () => [
    json(of('ITEMS')) === json(Object.keys(ITEMS)),
    ...Object.keys(ITEMS).map((k) => row('ITEMS', k) === ITEMS[k] + '|chatouilles'),
  ]);
  check('I4 : 3 objets ne sont donnés par personne', () => [
    json(of('ITEMS').filter((k) => !IDS.some((id) => LOOT[id].includes(k)))) ===
      json(['lunettesrigolotes', 'bonbonpetillant', 'sifflet']),
  ]);
  check("I4 : 2 recettes, avec des ingrédients de l'île", () => [
    json(of('CRAFTED')) === json(['chapeauplumes', 'mallefarces']),
    row('CRAFTED', 'chapeauplumes') === '👒|Chapeau à plumes|22|chatouilles',
    json(ev('CRAFTED.chapeauplumes.recipe')) === json({ plumeguili: 2, lunettesrigolotes: 1 }),
    row('CRAFTED', 'mallefarces') === '🧳|Malle des farces|20|chatouilles',
    json(ev('CRAFTED.mallefarces.recipe')) === json({ nezclown: 1, boiterires: 1, sifflet: 1 }),
  ]);
  check('I4 : 5 décorations', () => [
    json(ev('decosOf("chatouilles").map(([k]) => k)')) === json(Object.keys(DECOS)),
    ...Object.keys(DECOS).map((k) => row('DECOS', k) === DECOS[k] + '|chatouilles'),
  ]);
  check("critère 35 : 2 objets préférés par personnage, tous deux de l'île, hors de son propre butin", () =>
    IDS.map((id) => {
      const fav = ev(`favoritesOf(${json(id)})`);
      return (
        fav.length === 2 &&
        new Set(fav).size === 2 &&
        fav.every((k) => ev(`ITEMS[${json(k)}].world`) === 'chatouilles' && !LOOT[id].includes(k))
      );
    }),
  );
  // une clé écrite deux fois dans une table s'écraserait sans bruit : on compte dans le source
  const times = (files, key) =>
    files
      .map((f) => page.read(f))
      .join('\n')
      .split('\n')
      .filter((line) => new RegExp(`^\\s*'?${key}'?: [{[]`).test(line)).length;
  const once = (files, keys) => keys.every((k) => times(files, k) === 1);
  check('aucune clé nouvelle n’existait déjà dans sa table (objets, recettes, décorations, personnages)', () => [
    once(['js/entities/item/items.js'], [...Object.keys(ITEMS), 'chapeauplumes', 'mallefarces', ...Object.keys(DECOS)]),
    IDS.every((id) => times(['js/entities/character/characters.js'], id) === 0),
    IDS.every((id) => times(['js/entities/character/characters-s3.js'], id) === 2), // le personnage et sa fiche
    times(['js/entities/item/items.js'], 'yoyo') === 1 && ev('ITEMS.yoyo.name') === 'Yo-yo doux',
  ]);
}

(async () => {
  await t.start();
  section('Le Monde des Chatouilles : ses objets (I4)');
  objets();
  await t.finish('le Monde des Chatouilles (les objets)');
})();
