// L'Île des Squishy Dumplings (saison 3 « La Grande Expédition », île 2) :
// l'île, son thème, son paysage, sa musique, ses 4 personnages, ses objets,
// son ouverture au niveau 78 et son jeu favori (lignes 30 à 34 et 39 de la
// spec, tables T6 à T8). L'histoire et les squishies :
// test/dumplings-histoire.test.js. Harnais : test/tools/dumplings.js.
const page = require('./tools/page.js');
const t = require('./tools/dumplings.js');
const { d, ev, json, check, section, LEVEL } = t;

/* ================= T6 : l'île, son thème, son paysage, sa musique ================= */
const WORLD = {
  name: "L'Île des Squishy Dumplings",
  emoji: '🥟',
  level: 78,
  diff: 6,
  saison: 3,
  short: 'Dumplings',
  subtitle: 'La cuisine à vapeur',
  game: 'tens',
  map: { x: 50, y: 74 },
  shape: 'dumplings',
  icon: '🥟',
  sand: '#FFF6E6',
  land: '#A8D5A2',
  intro: "Bienvenue sur l'Île des Squishy Dumplings, où ça sent bon la vapeur 🥟",
  sceneEmpty: 'Ta cuisine attend ses décorations toutes chaudes !',
};
const same = (a, b) => json(Object.entries(a).sort()) === json(Object.entries(b).sort());
function ile() {
  check("ligne 30 : WORLDS.dumplings vaut exactement l'entrée de T6 (niveau 78, saison 3, palier 6)", () => [
    same(ev('WORLDS.dumplings'), WORLD),
  ]);
  check('ligne 30 : juste après les Crayons dans La Grande Expédition', () => [
    ev('worldsOf(3).indexOf("dumplings")') === ev('worldsOf(3).indexOf("crayons")') + 1,
    ev('worldsOf(3).indexOf("crayons")') >= 0,
    ev('archipelagoOf("dumplings")') === 3,
    ev('ARCHIPELAGOS[3].level') === 70,
  ]);
  check('ligne 34 : son thème de couleurs (vert bambou et crème), les 5 variables de T6', () => {
    const css = page
      .manifestCss()
      .map((f) => page.read(f))
      .join('\n');
    const rule = /body\[data-world=["']dumplings["']\]\s*\{([^}]*)\}/.exec(css);
    const want = {
      '--world-sky': '#eef7ea',
      '--world-sea': '#a8d5a2',
      '--world-deep': '#3f7a4a',
      '--world-scene-top': '#f7fbf2',
      '--world-scene-floor': '#f3e3c3',
    };
    return [!!rule, ...Object.entries(want).map(([k, v]) => new RegExp(`${k}:\\s*${v}\\s*;`, 'i').test(rule[1]))];
  });
  check('ligne 34 : son paysage (paniers vapeur, volutes, bambous, petits dumplings)', () => {
    const svg = ev('ISLE_SCENERY.dumplings(WORLDS.dumplings)');
    return [
      svg.includes('<rect') && svg.includes('<path'),
      ...['#D9B27A', '#8A5A2B', '#6FBF73', '#FFF3DC', '#A8D5A2'].map((c) => svg.includes(c)),
      !/undefined|NaN/.test(svg),
    ];
  });
  check('ligne 34 : sa musique, une flûte et le shaker des grains de riz', () => [
    json(ev('MUSIC_THEMES.dumplings')) ===
      json({ root: 62, scale: [0, 2, 4, 7, 9], bpm: 84, lead: 'flute', prog: [0, 5, 9, 7], shaker: true }),
  ]);
}

/* ================= T7 : les personnages ================= */
const CHARS = {
  bao: {
    emoji: '🥟',
    name: 'Bao',
    title: 'le chef dumpling',
    world: 'dumplings',
    gender: 'm',
    loot: ['pate', 'feuillechou'],
    texts: [
      'Bienvenue dans ma cuisine ! Ici, tout cuit à la vapeur, tout doucement.',
      "Un bon dumpling, c'est tout mou, tout chaud, et ça sourit !",
      "Tu m'aides en cuisine ? J'ai plein de commandes !",
    ],
  },
  bambou: {
    emoji: '🎋',
    name: 'Bambou',
    title: 'la pousse de bambou qui empile les paniers',
    world: 'dumplings',
    gender: 'f',
    loot: ['feuillechou', 'brocoli'],
    texts: [
      "Un panier, c'est dix places. Quand il est plein, hop, on en prend un autre !",
      'Je range les dumplings par dix. Comme ça, on compte bien plus vite !',
      'Tu viens empiler les paniers avec moi ?',
    ],
  },
  sesame: {
    emoji: '🛎️',
    name: 'Sésame',
    title: 'la petite serveuse dumpling',
    world: 'dumplings',
    gender: 'f',
    loot: ['tassethe', 'boiteemporter'],
    texts: [
      'Ding ding ! Une nouvelle commande ! Tu la retiens avec moi ?',
      "Je dis la commande tout bas, pour ne pas l'oublier.",
      'Un client attend son plateau. On le prépare ensemble ?',
    ],
  },
  theo: {
    emoji: '🫖',
    name: 'Théo',
    title: 'la théière qui fait la vapeur',
    world: 'dumplings',
    gender: 'm',
    loot: ['tassethe', 'pate'],
    texts: [
      'Fiou ! Je fais la vapeur pour toute la cuisine.',
      "Attention, c'est chaud ! On souffle un peu avant de croquer.",
      'Une petite tasse de thé, et on joue ?',
    ],
  },
};
const IDS = Object.keys(CHARS);
function personnages() {
  check('ligne 32 : 4 personnages : Bao, Bambou, Sésame, Théo', () => [
    json(ev('charsOf("dumplings").map(([id]) => id)')) === json(IDS),
  ]);
  check('ligne 32 : emoji, nom, titre, butin et les 3 répliques exactes de chacun (T7)', () =>
    IDS.map((id) => same(ev(`CHARACTERS.${id}`), CHARS[id])),
  );
  check("ligne 32 : le butin de chacun : 2 objets de l'île ; aucun n'a `noGames`", () =>
    IDS.map(
      (id) =>
        ev(`CHARACTERS.${id}.loot.every((k) => ITEMS[k] && ITEMS[k].world === "dumplings")`) &&
        ev(`CHARACTERS.${id}.loot.length`) === 2 &&
        !ev(`CHARACTERS.${id}.noGames`),
    ),
  );
  check('ligne 32 : chacun a son dessin', () =>
    IDS.map((id) => {
      const svg = ev(`charArtSVG(${json(id)})`);
      return svg.startsWith('<svg') && svg.includes('viewBox="0 0 120 130"') && svg.length > 400;
    }),
  );
  check("clés uniques : aucun personnage de l'île n'est un compagnon ; leurs prénoms sont à eux seuls", () => {
    const names = ev('Object.values(CHARACTERS).map((c) => c.name)').concat(
      ev('Object.values(COMPANIONS).map((c) => c.name)'),
    );
    return [
      ...IDS.map((id) => !ev(`${json(id)} in COMPANIONS`)),
      ...IDS.map((id) => names.filter((n) => n === CHARS[id].name).length === 1),
    ];
  });
}

/* ================= T8 : objets, recettes, décorations ================= */
const of = (table) => ev(`Object.keys(${table}).filter((k) => ${table}[k].world === "dumplings")`);
const row = (table, k) => {
  const x = ev(`${table}[${json(k)}]`);
  return [x.emoji, x.name, x.price, x.world].join('|');
};
const ITEMS = {
  pate: '🫓|Galette de pâte|6',
  feuillechou: '🥬|Feuille de chou|5',
  brocoli: '🥦|Petit brocoli|5',
  tassethe: '🍵|Tasse de thé|6',
  boiteemporter: '🥡|Boîte à emporter|7',
  bolriz: '🍚|Bol de riz|6',
  potsauce: '🥫|Pot de sauce|7',
  eventail: '🌬️|Éventail|8',
};
const DECOS = {
  marmiteD: '🫕|Grande marmite à vapeur|40',
  bambouD: '🎋|Bosquet de bambous|30',
  vapeurD: '♨️|Source de vapeur|18',
  lotusD: '💮|Bassin de lotus|14',
  tabouretsD: '🪑|Tabourets du comptoir|12',
};
function objets() {
  check('ligne 33 : les 8 objets de T8 (emoji, nom, prix), tous de cette île', () => [
    json(of('ITEMS')) === json(Object.keys(ITEMS)),
    ...Object.keys(ITEMS).map((k) => row('ITEMS', k) === ITEMS[k] + '|dumplings'),
  ]);
  check('ligne 33 : 3 objets ne sont donnés par personne (bol de riz, pot de sauce, éventail)', () => [
    json(of('ITEMS').filter((k) => !IDS.some((id) => CHARS[id].loot.includes(k)))) ===
      json(['bolriz', 'potsauce', 'eventail']),
  ]);
  check("ligne 33 : 2 recettes, avec des ingrédients de l'île", () => [
    json(of('CRAFTED')) === json(['plateauchef', 'soupe']),
    row('CRAFTED', 'plateauchef') === '🍱|Plateau du chef|22|dumplings',
    json(ev('CRAFTED.plateauchef.recipe')) === json({ pate: 2, feuillechou: 1 }),
    row('CRAFTED', 'soupe') === '🍜|Soupe aux dumplings|20|dumplings',
    json(ev('CRAFTED.soupe.recipe')) === json({ bolriz: 1, potsauce: 1 }),
    ev(
      '["plateauchef", "soupe"].every((k) => Object.keys(CRAFTED[k].recipe).every((i) => ITEMS[i].world === "dumplings"))',
    ),
  ]);
  check('ligne 33 : 5 décorations', () => [
    json(ev('decosOf("dumplings").map(([k]) => k)')) === json(Object.keys(DECOS)),
    ...Object.keys(DECOS).map((k) => row('DECOS', k) === DECOS[k] + '|dumplings'),
  ]);
  check("ligne 32 : 2 objets préférés par personnage, de l'île, hors de son propre butin", () =>
    IDS.map((id) => {
      const fav = ev(`favoritesOf(${json(id)})`);
      return (
        fav.length === 2 &&
        new Set(fav).size === 2 &&
        fav.every((k) => ev(`ITEMS[${json(k)}].world`) === 'dumplings' && !CHARS[id].loot.includes(k))
      );
    }),
  );
  check('clés uniques : aucune clé commune entre objets, recettes et décorations', () => {
    const keys = ev('[...Object.keys(ITEMS), ...Object.keys(CRAFTED), ...Object.keys(DECOS)]');
    return [new Set(keys).size === keys.length];
  });
}

/* ================= Lignes 31 et 39 : sur l'île, et son jeu favori ================= */
function surIle() {
  ev(`closeModal(); state.missions = ${LEVEL(78)}; state.expeditionIntroSeen = true; ${t.VISIT_ALL}
      state.storySolved = { lagon: true, crayons: true, dumplings: true }; save();
      setWorld("dumplings", true); switchView("ile")`);
  check('ligne 31 : au niveau 78, les 4 personnages sont dans le paysage, le thème est appliqué', () => [
    ev('level()') === 78,
    ev('worldUnlocked("dumplings")') === true,
    IDS.every((id) => !!d.querySelector(`#scene [data-char="${id}"]`)),
    d.body.dataset.world === 'dumplings',
    ev('availableItems().includes("eventail")'),
  ]);
  ev(`setWorld("lagon", true); state.missions = ${LEVEL(78) - 1}; save()`);
  check("ligne 31 : une mission avant (niveau 77), l'île est verrouillée et ses objets absents", () => [
    ev('level()') === 77,
    ev('worldUnlocked("dumplings")') === false,
    ev('worldUnlocked("crayons")') === true,
    ev('availableItems().includes("eventail")') === false,
  ]);
}
function jeuFavori() {
  check('ligne 39 : le jeu favori de l’île est « Les paniers de dix » à tout âge', () =>
    [0, 4, 5, 6, 7, 9].map((age) => ev(`worldGame("dumplings", ${age})`) === 'tens'),
  );
  ev(`closeModal(); currentProfile().age = 6; state.missions = ${LEVEL(78)}; save();
      setWorld("dumplings", true); openGamePicker("bambou")`);
  check("ligne 39 : sur l'île, à 6 ans, « choisir un jeu » le propose toujours", () => [
    !!d.querySelector('.game-choice[data-game="tens"]'),
  ]);
  ev('closeModal(); currentProfile().age = 4; openGamePicker("bao")');
  check('ligne 39 : à 4 ans, il n’est pas proposé (filtre de l’âge)', () => [
    !d.querySelector('.game-choice[data-game="tens"]'),
    !d.querySelector('.game-choice[data-game="order"]'),
    d.querySelectorAll('.game-choice').length > 0,
  ]);
  ev('closeModal(); currentProfile().age = 0; setWorld("lagon", true)');
}

(async () => {
  await t.start();
  section("L'Île des Squishy Dumplings : l'île, son thème, son paysage, sa musique");
  ile();
  section("L'Île des Squishy Dumplings : ses 4 personnages");
  personnages();
  section("L'Île des Squishy Dumplings : ses objets");
  objets();
  section("L'Île des Squishy Dumplings : ouverture au niveau 78, jeu favori");
  surIle();
  jeuFavori();
  await t.finish("l'Île des Squishy Dumplings (l'île)");
})();
