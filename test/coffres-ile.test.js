// L'Île des Coffres (saison 3 « La Grande Expédition », île 3) : l'île, son
// thème, son paysage, sa musique, ses 4 personnages, ses objets, son ouverture
// au niveau 86 et son jeu favori (critères 31, 36 et 37 de la spec, tables W1,
// M1, K1, O1, R2, D1). L'histoire et les squishies :
// test/coffres-histoire.test.js. Harnais : test/tools/coffres.js.
const page = require('./tools/page.js');
const t = require('./tools/coffres.js');
const { d, ev, json, check, section, LEVEL } = t;

/* ================= W1, M1 : l'île, son thème, son paysage, sa musique ================= */
const WORLD = {
  name: "L'Île des Coffres",
  emoji: '🗝️',
  level: 86,
  diff: 6,
  saison: 3,
  short: 'Coffres',
  subtitle: "L'île aux mille serrures",
  game: 'problems',
  map: { x: 82, y: 70 },
  shape: 'coffres',
  icon: '🗝️',
  sand: '#F6E3B4',
  land: '#C8955A',
  intro: "Bienvenue sur l'Île des Coffres, où chaque coffre garde un secret 🗝️",
  sceneEmpty: 'Ton île attend ses décorations pleines de secrets !',
};
const same = (a, b) => json(Object.entries(a).sort()) === json(Object.entries(b).sort());
function ile() {
  check("critère 31 : WORLDS.coffres vaut exactement l'entrée de W1 (niveau 86, saison 3, palier 6)", () => [
    same(ev('WORLDS.coffres'), WORLD),
  ]);
  check('critère 31 : troisième île de La Grande Expédition, juste après les Dumplings', () => [
    json(ev('worldsOf(3).slice(0, 3)')) === json(['crayons', 'dumplings', 'coffres']),
    ev('worldsOf(3).indexOf("coffres")') === 2,
    ev('archipelagoOf("coffres")') === 3,
  ]);
  check('critère 31 : sur la carte de la saison 3, sans chevaucher une autre île', () => {
    const at = ev('worldsOf(3).map((id) => WORLDS[id].map)');
    const me = WORLD.map;
    return [
      me.x >= 10 && me.x <= 90 && me.y >= 10 && me.y <= 90,
      at.filter((m) => Math.hypot(m.x - me.x, m.y - me.y) < 20).length === 1,
    ];
  });
  check('critère 36 : son thème de couleurs (sable doré et turquoise), les 5 variables de W1', () => {
    const css = page
      .manifestCss()
      .map((f) => page.read(f))
      .join('\n');
    const rule = /body\[data-world=["']coffres["']\]\s*\{([^}]*)\}/.exec(css);
    const want = {
      '--world-sky': '#fff4dc',
      '--world-sea': '#3fa7a3',
      '--world-deep': '#6b3f1d',
      '--world-scene-top': '#fffaf0',
      '--world-scene-floor': '#f2d29b',
    };
    return [!!rule, ...Object.entries(want).map(([k, v]) => new RegExp(`${k}:\\s*${v}\\s*;`, 'i').test(rule[1]))];
  });
  check(
    'critère 36 : son paysage (grand coffre cerclé d’or, arbre à clés qui se balancent, porte ronde, pièces)',
    () => {
      const svg = ev('ISLE_SCENERY.coffres(WORLDS.coffres)');
      return [
        svg.includes('<rect') && svg.includes('<path') && svg.includes('<circle'),
        svg.includes('ls-lolly l1') && svg.includes('ls-lolly l2'),
        ...['#F6E3B4', '#8A5A2B', '#E0A800', '#3FA7A3'].map((c) => svg.toUpperCase().includes(c)),
        !/undefined|NaN/.test(svg),
        ev('Object.keys(ISLE_SCENERY).filter((k) => k === "coffres").length') === 1,
      ];
    },
  );
  check('critère 36 : sa musique, un pincé léger et les « tic » des serrures', () => [
    json(ev('MUSIC_THEMES.coffres')) ===
      json({ root: 64, scale: [0, 2, 4, 7, 9], bpm: 90, lead: 'pluck', prog: [0, 9, 5, 7], tick: true }),
  ]);
}

/* ================= K1 : les personnages ================= */
const CHARS = {
  clemence: {
    emoji: '🗝️',
    name: 'Clémence',
    title: 'la gardienne des clés',
    world: 'coffres',
    gender: 'f',
    loot: ['clecuivre', 'piecedor'],
    texts: [
      "Bienvenue sur l'Île des Coffres ! J'ai une clé pour chaque serrure… sauf pour le grand coffre.",
      "Un coffre ne s'ouvre pas en forçant. Il s'ouvre en réfléchissant !",
      "Chaque mission réussie, c'est une serrure qui fait clic. On continue ?",
    ],
  },
  kadi: {
    emoji: '🔒',
    name: 'Kadi',
    title: 'le petit cadenas à code',
    world: 'coffres',
    gender: 'm',
    loot: ['petitcadenas', 'clecuivre'],
    texts: [
      'Clic, clac ! Je suis un cadenas à code. Tu trouves mon code ?',
      'Mes indices ne mentent jamais. Écoute-les bien, un par un !',
      'Dans mon code, chaque symbole ne sert qu’une fois. Ça aide, non ?'.replace('’', "'"),
    ],
  },
  grignote: {
    emoji: '🐭',
    name: 'Grignote',
    title: 'la souris qui compte tout',
    world: 'coffres',
    gender: 'f',
    loot: ['boulier', 'piecedor'],
    texts: [
      "Je compte tout : les pièces, les clés, les coffres ! Tu m'aides ?",
      'Une histoire, un dessin, un calcul… et hop, le trésor est trouvé !',
      'Écoute bien mon histoire. La réponse se cache dedans !',
    ],
  },
  pincou: {
    emoji: '🦀',
    name: 'Pinçou',
    title: 'le crabe serrurier',
    world: 'coffres',
    gender: 'm',
    loot: ['tournevis', 'petitcadenas'],
    texts: [
      "Avec mes pinces, j'ouvre les serrures… enfin, j'essaie !",
      'Clic-clic ! On joue avant que je referme mes pinces ?',
      'Le sable est plein de trésors. On cherche ensemble ?',
    ],
  },
};
const IDS = Object.keys(CHARS);
function personnages() {
  check('critère 36 : 4 personnages : Clémence, Kadi, Grignote, Pinçou', () => [
    json(ev('charsOf("coffres").map(([id]) => id)')) === json(IDS),
  ]);
  check('K1 : emoji, nom, titre, genre, butin et les 3 répliques exactes de chacun, rien d’autre', () =>
    IDS.map((id) => same(ev(`CHARACTERS.${id}`), CHARS[id])),
  );
  check("K1 : le butin de chacun : 2 objets de l'île ; aucun n'a `noGames`", () =>
    IDS.map(
      (id) =>
        ev(`CHARACTERS.${id}.loot.every((k) => ITEMS[k] && ITEMS[k].world === "coffres")`) &&
        ev(`CHARACTERS.${id}.loot.length`) === 2 &&
        !ev(`CHARACTERS.${id}.noGames`),
    ),
  );
  check('K1 : chacun a son dessin', () =>
    IDS.map((id) => {
      const svg = ev(`charArtSVG(${json(id)})`);
      return svg.startsWith('<svg') && svg.includes('viewBox="0 0 120 130"') && svg.length > 400;
    }),
  );
}

/* ================= O1, R2, D1 : objets, recettes, décorations ================= */
const of = (table) => ev(`Object.keys(${table}).filter((k) => ${table}[k].world === "coffres")`);
const row = (table, k) => {
  const x = ev(`${table}[${json(k)}]`);
  return [x.emoji, x.name, x.price, x.world].join('|');
};
const ITEMS = {
  clecuivre: '🔑|Clé de cuivre|6',
  piecedor: "🪙|Pièce d'or|5",
  petitcadenas: '🔒|Petit cadenas|6',
  boulier: '🧮|Boulier|7',
  tournevis: '🪛|Petit tournevis|6',
  loupe: '🔍|Loupe de détective|8',
  lampe: '🔦|Lampe de poche|7',
  bague: '💍|Bague au rubis|9',
};
const DECOS = {
  salleD: '🏛️|Salle des coffres|40',
  porteD: '🚪|Porte secrète|30',
  arbreclesD: '🌳|Arbre à clés|18',
  ancreD: '⚓|Ancre dorée|14',
  jarreD: '🏺|Jarre aux trésors|12',
};
function objets() {
  check('O1 : les 8 objets (emoji, nom, prix), tous de cette île', () => [
    json(of('ITEMS')) === json(Object.keys(ITEMS)),
    ...Object.keys(ITEMS).map((k) => row('ITEMS', k) === ITEMS[k] + '|coffres'),
  ]);
  check('O1 : 3 objets ne sont donnés par personne (loupe, lampe, bague)', () => [
    json(of('ITEMS').filter((k) => !IDS.some((id) => CHARS[id].loot.includes(k)))) ===
      json(['loupe', 'lampe', 'bague']),
  ]);
  check("R2 : 2 recettes, avec des ingrédients de l'île", () => [
    json(of('CRAFTED')) === json(['trousseau', 'medaillon']),
    row('CRAFTED', 'trousseau') === '🔐|Trousseau magique|22|coffres',
    json(ev('CRAFTED.trousseau.recipe')) === json({ clecuivre: 2, tournevis: 1 }),
    row('CRAFTED', 'medaillon') === '🏅|Médaillon secret|20|coffres',
    json(ev('CRAFTED.medaillon.recipe')) === json({ piecedor: 2, bague: 1 }),
    !ev('CRAFTED.trousseau.tier') && !ev('CRAFTED.medaillon.tier'),
  ]);
  check('D1 : 5 décorations', () => [
    json(ev('decosOf("coffres").map(([k]) => k)')) === json(Object.keys(DECOS)),
    ...Object.keys(DECOS).map((k) => row('DECOS', k) === DECOS[k] + '|coffres'),
  ]);
  check("critère 36 : 2 objets préférés par personnage, tous deux de l'île, hors de son propre butin", () =>
    IDS.map((id) => {
      const fav = ev(`favoritesOf(${json(id)})`);
      return (
        fav.length === 2 &&
        new Set(fav).size === 2 &&
        fav.every((k) => ev(`ITEMS[${json(k)}].world`) === 'coffres' && !CHARS[id].loot.includes(k))
      );
    }),
  );
}

/* ================= Critères 31 et 37 : sur l'île, et son jeu favori ================= */
function surIle() {
  ev(`closeModal(); state.missions = ${LEVEL(86)}; state.expeditionIntroSeen = true; ${t.VISIT_ALL}
      state.storySolved = { lagon: true, crayons: true, dumplings: true, coffres: true }; save();
      setWorld("coffres", true); switchView("ile")`);
  check('critère 31 : au niveau 86, les 4 personnages sont dans le paysage, le thème est appliqué', () => [
    ev('level()') === 86,
    ev('worldUnlocked("coffres")') === true,
    IDS.every((id) => !!d.querySelector(`#scene [data-char="${id}"]`)),
    d.body.dataset.world === 'coffres',
    ev('availableItems().includes("loupe")'),
  ]);
  ev(`setWorld("lagon", true); state.missions = ${LEVEL(86) - 1}; save()`);
  check("critère 31 : une mission avant (niveau 85), l'île est verrouillée et ses objets absents", () => [
    ev('level()') === 85,
    ev('worldUnlocked("coffres")') === false,
    ev('worldUnlocked("dumplings")') === true,
    ev('availableItems().includes("loupe")') === false,
  ]);
}
function jeuFavori() {
  check('critère 37 : le jeu favori de l’île est « Le trésor raconté » à tout âge', () =>
    [0, 4, 5, 6, 7, 9].map((age) => ev(`worldGame("coffres", ${age})`) === 'problems'),
  );
  ev(`closeModal(); currentProfile().age = 6; state.missions = ${LEVEL(86)}; save();
      setWorld("coffres", true); openGamePicker("grignote")`);
  check("critère 37 : sur l'île, à 6 ans, « choisir un jeu » le propose toujours", () => [
    !!d.querySelector('.game-choice[data-game="problems"]'),
  ]);
  ev('closeModal(); currentProfile().age = 0; setWorld("lagon", true)');
}

(async () => {
  await t.start();
  section("L'Île des Coffres : l'île, son thème, son paysage, sa musique");
  ile();
  section("L'Île des Coffres : ses 4 personnages");
  personnages();
  section("L'Île des Coffres : ses objets");
  objets();
  section("L'Île des Coffres : ouverture au niveau 86, jeu favori");
  surIle();
  jeuFavori();
  await t.finish("l'Île des Coffres (l'île)");
})();
