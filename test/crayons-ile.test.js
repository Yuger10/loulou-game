// L'Île des Crayons (saison 3 « La Grande Expédition », île 1) : l'île, son
// thème, son paysage, sa musique, ses 4 personnages, ses objets, son ouverture
// au niveau 70 et son jeu favori (lignes 36 à 40 et 46 de la spec).
// L'histoire et les squishies : test/crayons-histoire.test.js.
// Harnais : test/tools/crayons.js.
const page = require('./tools/page.js');
const t = require('./tools/crayons.js');
const { d, ev, json, check, section, LEVEL } = t;

/* ================= Ligne 36 et 37 : l'île, son thème, son paysage, sa musique ================= */
const WORLD = {
  name: "L'Île des Crayons",
  emoji: '✏️',
  level: 70,
  diff: 6,
  saison: 3,
  short: 'Crayons',
  subtitle: "L'île où tout se dessine",
  map: { x: 18, y: 78 },
  shape: 'crayons',
  icon: '✏️',
  sand: '#FFF6DC',
  land: '#F7C948',
  intro: "Bienvenue sur l'Île des Crayons, où tout se dessine ✏️",
  sceneEmpty: 'Ton île attend ses décorations en couleurs !',
};
function ile() {
  check("ligne 36 : l'Île des Crayons, saison 3, niveau 70, palier 6 (données de la spec)", () => {
    const w = ev('WORLDS.crayons');
    return [
      json(Object.keys(WORLD).map((k) => w[k])) === json(Object.values(WORLD)),
      Object.keys(w).length === Object.keys(WORLD).length + 1, // plus `game`
      typeof w.game === 'function',
    ];
  });
  check("ligne 36 : c'est la première île de La Grande Expédition, qui s'ouvre au niveau 70", () => [
    ev('worldsOf(3)[0]') === 'crayons',
    ev('ARCHIPELAGOS[3].level') === 70,
    ev('shownArchipelagos().includes(3)'),
    ev('archipelagoOf("crayons")') === 3,
  ]);
  check('ligne 37 : son thème de couleurs (jaune crayon, bleu peinture)', () => {
    const css = page
      .manifestCss()
      .map((f) => page.read(f))
      .join('\n');
    const rule = /body\[data-world=["']crayons["']\]\s*\{([^}]*)\}/.exec(css);
    const want = {
      '--world-sky': '#fff6dc',
      '--world-sea': '#8fd3f4',
      '--world-deep': '#3a4a8c',
      '--world-scene-top': '#fffbef',
      '--world-scene-floor': '#fbe3a1',
    };
    return [
      !!rule,
      /^\s*--world-sky/.test(rule[1]),
      ...Object.entries(want).map(([k, v]) => new RegExp(`${k}:\\s*${v}\\s*;`, 'i').test(rule[1])),
    ];
  });
  check('ligne 37 : son paysage (crayons géants, pont en règle, maison taille-crayon)', () => {
    const svg = ev('ISLE_SCENERY.crayons(WORLDS.crayons)');
    return ['F7C948', 'B8901A', 'F1D3A2', '4A4A4A', 'FF9CC8', '6FB8F5', 'E8344E', '#FFF6DC'].map((c) =>
      svg.includes(c),
    );
  });
  check('ligne 37 : sa musique, un crayon qui tapote (pizzicato, 96 battements par minute)', () => [
    ev('MUSIC_THEMES.crayons.lead') === 'pluck',
    ev('MUSIC_THEMES.crayons.bpm') === 96,
    json(ev('MUSIC_THEMES.crayons')) ===
      json({ root: 64, scale: [0, 2, 4, 7, 9], bpm: 96, lead: 'pluck', prog: [0, 5, 9, 7], tick: true }),
  ]);
}

/* ================= Ligne 38 : les personnages ================= */
const CHARS = {
  gribouille: {
    emoji: '✏️',
    name: 'Gribouille',
    title: 'le crayon à papier',
    world: 'crayons',
    gender: 'm',
    loot: ['cahier', 'craie'],
    texts: [
      "Bienvenue sur mon île ! Ici, tout ce qu'on dessine prend vie. Tu dessines avec moi ?",
      "Un trait, puis un autre trait… et voilà une maison ! Dessiner, c'est facile quand on prend son temps.",
      "Chaque mission réussie, c'est un nouveau dessin sur mon cahier. Allez, au travail !",
    ],
  },
  gommette: {
    emoji: '🧽',
    name: 'Gommette',
    title: 'la gomme rose',
    world: 'crayons',
    gender: 'f',
    loot: ['gomme', 'cahier'],
    texts: [
      "Coucou ! Moi, je n'efface pas les erreurs : je t'aide à recommencer.",
      'Pose ton doigt sur le point vert, et suis les flèches. Pas grave si ça dépasse !',
      "Une lettre bien tracée, c'est une lettre qu'on peut lire. On s'entraîne ?",
    ],
  },
  taillou: {
    emoji: '🌀',
    name: 'Taillou',
    title: 'le taille-crayon',
    world: 'crayons',
    gender: 'm',
    loot: ['copeaux', 'craie'],
    texts: [
      'Tourne, tourne ! Je taille les crayons, et après ils sont plus courts.',
      'Lequel est le plus long ? Pour savoir, je regarde où il commence et où il finit.',
      'Avec ma règle, je mesure tout ! Tu veux essayer ?',
    ],
  },
  aquarelle: {
    emoji: '🖌️',
    name: 'Aquarelle',
    title: 'le pinceau magique',
    world: 'crayons',
    gender: 'f',
    loot: ['palette', 'gomme'],
    texts: [
      'Bonjour ! Je peins le ciel en bleu et les nuages en rose.',
      'Un peu de jaune, un peu de bleu… et ça fait du vert !',
      "J'ai peint une carte au trésor pour Zap. Tu crois qu'elle ressemble à la vraie ?",
    ],
  },
};
const IDS = Object.keys(CHARS);
const same = (a, b) => json(Object.entries(a).sort()) === json(Object.entries(b).sort());
function personnages() {
  check('ligne 38 : 4 personnages : Gribouille, Gommette, Taillou, Aquarelle', () => [
    json(ev('charsOf("crayons").map(([id]) => id)')) === json(IDS),
  ]);
  check('ligne 38 : nom, titre, butin et les 3 répliques exactes de chacun', () =>
    IDS.map((id) => same(ev(`CHARACTERS.${id}`), CHARS[id])),
  );
  check("ligne 38 : le butin de chacun : 2 objets de l'île", () =>
    IDS.map((id) => ev(`CHARACTERS.${id}.loot.every((k) => ITEMS[k] && ITEMS[k].world === "crayons")`)),
  );
  check('ligne 38 : chacun a son dessin', () =>
    IDS.map((id) => {
      const svg = ev(`charArtSVG(${json(id)})`);
      return svg.startsWith('<svg') && svg.includes('viewBox="0 0 120 130"') && svg.length > 400;
    }),
  );
}

/* ================= Ligne 39 : les objets ================= */
const of = (table) => ev(`Object.keys(${table}).filter((k) => ${table}[k].world === "crayons")`);
const row = (table, k) => {
  const x = ev(`${table}[${json(k)}]`);
  return [x.emoji, x.name, x.price, x.world].join('|');
};
function objets() {
  const ITEMS = {
    cahier: '📒|Cahier à lignes|6',
    craie: '🖍️|Craie grasse|6',
    gomme: '🧽|Gomme rose|5',
    copeaux: '🪵|Copeaux de crayon|5',
    palette: '🎨|Palette de couleurs|8',
    regle: '📏|Règle magique|7',
    feutre: '🖊️|Feutre pailleté|7',
    equerre: '📐|Équerre|6',
  };
  const DECOS = {
    potcrayonsD: '🏺|Pot à crayons géant|40',
    chevaletD: '🖼️|Chevalet de peintre|30',
    fanionsD: '🚩|Fanions dessinés|18',
    lampeD: '💡|Lampe de bureau|14',
    marquepageD: '🔖|Marque-page géant|12',
  };
  check('ligne 39 : les 8 objets de la table (emoji, nom, prix)', () => [
    json(of('ITEMS')) === json(Object.keys(ITEMS)),
    ...Object.keys(ITEMS).map((k) => row('ITEMS', k) === ITEMS[k] + '|crayons'),
  ]);
  check('ligne 39 : au moins 3 objets ne sont dans aucun butin (règle, feutre, équerre)', () => [
    json(of('ITEMS').filter((k) => !IDS.some((id) => CHARS[id].loot.includes(k)))) ===
      json(['regle', 'feutre', 'equerre']),
  ]);
  check("ligne 39 : 2 recettes de fusion, avec des ingrédients de l'île", () => [
    json(of('CRAFTED')) === json(['trousse', 'fresque']),
    row('CRAFTED', 'trousse') === '👝|Trousse arc-en-ciel|22|crayons',
    json(ev('CRAFTED.trousse.recipe')) === json({ craie: 2, gomme: 1 }),
    row('CRAFTED', 'fresque') === '🌄|Fresque du matin|20|crayons',
    json(ev('CRAFTED.fresque.recipe')) === json({ palette: 1, feutre: 1, cahier: 1 }),
  ]);
  check('ligne 39 : 5 décorations', () => [
    json(ev('decosOf("crayons").map(([k]) => k)')) === json(Object.keys(DECOS)),
    ...Object.keys(DECOS).map((k) => row('DECOS', k) === DECOS[k] + '|crayons'),
  ]);
  check("ligne 39 : 2 objets préférés par personnage, de l'île, hors de son propre butin", () =>
    IDS.map((id) => {
      const fav = ev(`favoritesOf(${json(id)})`);
      return (
        fav.length === 2 &&
        new Set(fav).size === 2 &&
        fav.every((k) => ev(`ITEMS[${json(k)}].world`) === 'crayons' && !CHARS[id].loot.includes(k))
      );
    }),
  );
}

/* ================= Lignes 40 et 46 : sur l'île, et son jeu favori ================= */
function surIle() {
  ev(`closeModal(); state.missions = ${LEVEL(70)}; state.expeditionIntroSeen = true; ${t.VISIT_ALL}
      state.storySolved = { lagon: true, crayons: true }; save(); setWorld("crayons", true); switchView("ile")`);
  check('ligne 40 : au niveau 70, les 4 personnages sont dans le paysage', () => [
    ev('level()') === 70,
    ev('worldUnlocked("crayons")') === true,
    d.querySelectorAll('#scene [data-char]').length === 4 || d.querySelectorAll('#scene .isle-char').length === 4,
    IDS.every((id) => !!d.querySelector(`#scene [data-char="${id}"]`)),
  ]);
  check("ligne 40 : le thème de l'île est appliqué, la règle est disponible", () => [
    d.body.dataset.world === 'crayons',
    ev('availableItems().includes("regle")'),
  ]);
  ev(`setWorld("lagon", true); state.missions = ${LEVEL(70) - 1}; save()`);
  check("ligne 40 : une mission avant (niveau 69), l'île est fermée et ses objets absents", () => [
    ev('level()') === 69,
    ev('worldUnlocked("crayons")') === false,
    ev('availableItems().includes("regle")') === false,
    ev('archipelagoUnlocked(3)') === false,
  ]);
}

function jeuFavori() {
  check('ligne 46 : tracer avant 7 ans, mesurer ensuite', () => [
    ev('worldGame("crayons", 5)') === 'trace',
    ev('worldGame("crayons", 6)') === 'trace',
    ev('worldGame("crayons", 7)') === 'length',
    ev('worldGame("crayons", 8)') === 'length',
    ev('worldGame("crayons", 0)') === 'length',
  ]);
  ev(`closeModal(); currentProfile().age = 5; state.missions = ${LEVEL(70)}; save();
      setWorld("crayons", true); openGamePicker("gommette")`);
  check("ligne 46 : sur l'île, à 5 ans, « choisir un jeu » propose de tracer", () => [
    !!d.querySelector('.game-choice[data-game="trace"]'),
  ]);
  ev('closeModal(); currentProfile().age = 8; openGamePicker("taillou")');
  check('ligne 46 : à 8 ans, de mesurer', () => [!!d.querySelector('.game-choice[data-game="length"]')]);
  ev('closeModal(); currentProfile().age = 0; setWorld("lagon", true)');
}

(async () => {
  await t.start();
  section("L'Île des Crayons : l'île, son thème, son paysage, sa musique");
  ile();
  section("L'Île des Crayons : ses 4 personnages");
  personnages();
  section("L'Île des Crayons : ses objets");
  objets();
  section("L'Île des Crayons : ouverture au niveau 70, jeu favori");
  surIle();
  jeuFavori();
  await t.finish("l'Île des Crayons (l'île)");
})();
