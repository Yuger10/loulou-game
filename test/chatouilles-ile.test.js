// Le Monde des Chatouilles (saison 3 « La Grande Expédition », île 4) : l'île,
// son thème, son paysage, sa musique, ses 4 personnages et leurs fiches de
// chatouilles, son ouverture au niveau 94 et son jeu favori
// (critères 32 à 34 et 37 de la spec, tables I1 à I3, I6, I7). Les objets :
// test/chatouilles-objets.test.js. Les
// chatouilles : test/chatouilles-guilis.test.js ; l'histoire et les
// squishies : test/chatouilles-histoire.test.js. Harnais : test/tools/chatouilles.js.
const page = require('./tools/page.js');
const t = require('./tools/chatouilles.js');
const { d, ev, json, check, section, LEVEL } = t;

/* ================= I1, I6, I7 : l'île, son thème, son paysage, sa musique ================= */
const WORLD = {
  name: 'Le Monde des Chatouilles',
  emoji: '🪶',
  level: 94,
  diff: 6,
  saison: 3,
  short: 'Chatouilles',
  subtitle: 'Le monde des plumes et des rires',
  map: { x: 82, y: 26 },
  shape: 'chatouilles',
  icon: '🪶',
  sand: '#FFF1DA',
  land: '#FFC2DA',
  giggly: true,
  intro: 'Bienvenue au Monde des Chatouilles, où tout le monde rit pour un rien 🪶',
  sceneEmpty: 'Ton monde attend ses décorations rigolotes !',
};
const same = (a, b) => json(Object.entries(a).sort()) === json(Object.entries(b).sort());
function ile() {
  check('critère 33, I1 : WORLDS.chatouilles vaut la table I1 (niveau 94, saison 3, `giggly`)', () => {
    const { game, ...rest } = ev('WORLDS.chatouilles');
    return [same(rest, WORLD), typeof game === 'function'];
  });
  check('critère 33 : quatrième île de La Grande Expédition, juste après les Coffres', () => [
    ev('WORLD_ORDER.indexOf("chatouilles")') === ev('WORLD_ORDER.indexOf("coffres")') + 1,
    ev('worldsOf(3).indexOf("chatouilles")') === 3,
    ev('archipelagoOf("chatouilles")') === 3,
    ev('Object.keys(WORLDS).filter((id) => WORLDS[id].giggly).join()') === 'chatouilles',
  ]);
  check('D20 : sur la carte de la saison 3, dans le cadre, sans chevaucher une autre île', () => {
    const at = ev('worldsOf(3).map((id) => WORLDS[id].map)');
    const me = WORLD.map;
    return [
      me.x >= 10 && me.x <= 90 && me.y >= 10 && me.y <= 90,
      at.filter((m) => Math.hypot(m.x - me.x, m.y - me.y) < 20).length === 1,
    ];
  });
  check('critère 37, I7 : son thème de couleurs, les 5 jetons', () => {
    const css = page
      .manifestCss()
      .map((f) => page.read(f))
      .join('\n');
    const rule = /body\[data-world=["']chatouilles["']\]\s*\{([^}]*)\}/.exec(css);
    const want = {
      '--world-sky': '#fff0f6',
      '--world-sea': '#ffb3d1',
      '--world-deep': '#8a3d6b',
      '--world-scene-top': '#fff7fb',
      '--world-scene-floor': '#fff1b8',
    };
    return [!!rule, ...Object.entries(want).map(([k, v]) => new RegExp(`${k}:\\s*${v}\\s*;`, 'i').test(rule[1]))];
  });
  check('son paysage : deux arbres à plumes qui se balancent, des plumes, un trampoline, un nuage, un chemin', () => {
    const svg = ev('ISLE_SCENERY.chatouilles(WORLDS.chatouilles)');
    return [
      svg.includes('<ellipse') && svg.includes('<path'),
      svg.includes('ls-lolly l1') && svg.includes('ls-lolly l2'),
      svg.toUpperCase().includes(WORLD.sand),
      !/undefined|NaN/.test(svg),
      ev('Object.keys(ISLE_SCENERY).filter((k) => k === "chatouilles").length') === 1,
    ];
  });
  check('critère 37, I6 : sa musique, des bulles qui rebondissent comme des rires', () => [
    json(ev('MUSIC_THEMES.chatouilles')) ===
      json({ root: 67, scale: [0, 2, 4, 7, 9], bpm: 108, lead: 'bubble', prog: [0, 9, 5, 7], shaker: true }),
  ]);
}

/* ================= I2, I3 : les personnages et leurs fiches de chatouilles ================= */
// une ligne de I2 : [emoji, nom, titre, genre], son butin, ses répliques
const person = ([emoji, name, title, gender], loot, texts) => ({
  emoji,
  name,
  title,
  world: 'chatouilles',
  gender,
  loot,
  texts,
});
const CHARS = {
  plumette: person(
    ['🦚', 'Plumette', 'la paonne aux plumes chatouilleuses', 'f'],
    ['plumeguili', 'chaussettes'],
    [
      'Bienvenue au Monde des Chatouilles ! Ici, on rit pour un rien… hi hi !',
      'Mes plumes chatouillent seulement ceux qui en ont envie. Tu veux jouer avec moi ?',
      'Un fou rire, ça se partage ! On fait une mission ensemble ?',
    ],
  ),
  guili: person(
    ['🐧', 'Guili', 'le petit manchot chatouilleux', 'm'],
    ['plumeguili', 'yoyofarceur'],
    [
      "Ma plume va où je lui dis ! Tu m'aides à la guider ?",
      'Avance, tourne, avance… et guili guili !',
      'Je suis chatouilleux des ailes. Chut, ne le dis à personne !',
    ],
  ),
  lulu: person(
    ['🦦', 'Lulu', 'la loutre qui adore les blagues', 'f'],
    ['nezclown', 'boiterires'],
    [
      "Mes mots se sont tout mélangés ! Tu m'aides à refaire ma phrase ?",
      "Une phrase en désordre, c'est rigolo. Une phrase en ordre, ça veut dire quelque chose !",
      'On invente une phrase rigolote ensemble ?',
    ],
  ),
  pic: person(
    ['🦔', 'Pic', 'le petit hérisson timide', 'm'],
    ['chaussettes', 'nezclown'],
    [
      "Bonjour… Moi, je n'aime pas toujours les chatouilles. Mais j'adore jouer !",
      'Quand je dis stop, mes amis s’arrêtent. Alors je joue tranquille.'.replace('’', "'"),
      'Mes piquants sont tout doux aujourd’hui. On fait un jeu ?'.replace('’', "'"),
    ],
  ),
};
const TICKLES = {
  plumette: {
    want: 0.8,
    max: 4,
    laughs: ['Hi hi hi ! Mes plumes !', 'Ha ha ha, ça chatouille !', 'Hou hou hou, mes plumes frissonnent !'],
    stop: "Stop ! J'ai assez ri pour l'instant. Merci d'avoir arrêté !",
    no: 'Pas maintenant, merci. On se fait un coucou à la place ? 👋',
  },
  guili: {
    want: 0.9,
    max: 5,
    laughs: ['Guili guili ! Hi hi hi !', 'Ha ha ha, je suis tout chatouilleux !', 'Hi hi, ma plume rigole aussi !'],
    stop: "Stop, stop ! J'ai trop ri, je n'ai plus de souffle. Merci d'avoir arrêté !",
    no: 'Pas maintenant, je suis tout essoufflé. On joue plutôt ?',
  },
  lulu: {
    want: 0.8,
    max: 3,
    laughs: ['Ha ha ha ! Ça chatouille mes moustaches !', 'Hi hi hi, ma queue rigole !'],
    stop: "Stop ! Mon ventre a trop ri. Merci d'avoir arrêté !",
    no: 'Pas maintenant, merci. Je te raconte une blague à la place ?',
  },
  pic: {
    want: 0.4,
    max: 2,
    laughs: ['Hi… hi hi ! Tout doucement, alors.'],
    stop: "Stop, ça suffit pour moi. Merci d'avoir arrêté tout de suite !",
    no: "Non merci, pas de chatouilles aujourd'hui. Mais je veux bien un sourire !",
  },
};
const IDS = Object.keys(CHARS);
function personnages() {
  check('critère 34 : 4 personnages : Plumette, Guili, Lulu, Pic', () => [
    json(ev('charsOf("chatouilles").map(([id]) => id)')) === json(IDS),
  ]);
  check('I2 : emoji, nom, titre, genre, butin et les 3 répliques exactes de chacun, rien d’autre', () =>
    IDS.map((id) => same(ev(`CHARACTERS.${id}`), CHARS[id])),
  );
  check('I3 : la fiche de chatouilles de chacun (envie, maximum, rires, « stop », « non »), textes exacts', () => [
    json(Object.keys(ev('CHARACTER_TICKLES'))) === json(IDS),
    ...IDS.map((id) => json(ev(`CHARACTER_TICKLES.${id}`)) === json(TICKLES[id])),
  ]);
  check("I2 : le butin de chacun : 2 objets de l'île ; chacun a son dessin", () =>
    IDS.map((id) => {
      const svg = ev(`charArtSVG(${json(id)})`);
      return (
        ev(`CHARACTERS.${id}.loot.every((k) => ITEMS[k] && ITEMS[k].world === "chatouilles")`) &&
        svg.startsWith('<svg') &&
        svg.includes('viewBox="0 0 120 130"') &&
        svg.length > 400
      );
    }),
  );
  check('aucun personnage de l’île ne porte l’id ou le prénom d’un compagnon (Lulu, pas Lili)', () => [
    IDS.every((id) => !ev(`COMPANIONS[${json(id)}]`)),
    !ev('Object.values(COMPANIONS).map((c) => c.name)').some((n) => IDS.some((id) => CHARS[id].name === n)),
    ev('Object.values(CHARACTERS).filter((c) => ["Plumette", "Guili", "Lulu", "Pic"].includes(c.name)).length') === 4,
  ]);
}

/* ================= Critères 32 et 33 : sur l'île, et son jeu favori ================= */
function surIle() {
  ev(`closeModal(); state.missions = ${LEVEL(94)}; state.expeditionIntroSeen = true; ${t.VISIT_ALL}
      state.storySolved = { lagon: true, crayons: true, dumplings: true, coffres: true, chatouilles: true }; save();
      setWorld("chatouilles", true); switchView("ile")`);
  check('critère 32 : au niveau 94, les 4 personnages sont dans le paysage, le thème est appliqué', () => [
    ev('level()') === 94,
    ev('worldUnlocked("chatouilles")') === true,
    IDS.every((id) => !!d.querySelector(`#scene .isle-char[data-char="${id}"] .emoji`)),
    d.body.dataset.world === 'chatouilles',
    ev('availableItems().includes("sifflet")'),
  ]);
  ev(`setWorld("lagon", true); state.missions = ${LEVEL(94) - 1}; save()`);
  check("critère 32 : une mission avant (niveau 93), l'île est verrouillée et ses objets absents", () => [
    ev('level()') === 93,
    ev('worldUnlocked("chatouilles")') === false,
    ev('worldUnlocked("coffres")') === true,
    ev('availableItems().includes("sifflet")') === false,
  ]);
}
function jeuFavori() {
  check(
    'critère 33 : jeu favori : « Le chemin de la plume » avant 7 ans, « La phrase rigolote » ensuite et sans âge',
    () => [
      ...[4, 5, 6].map((age) => ev(`worldGame("chatouilles", ${age})`) === 'coding'),
      ...[0, 7, 9].map((age) => ev(`worldGame("chatouilles", ${age})`) === 'sentence'),
    ],
  );
  ev(`closeModal(); currentProfile().age = 6; state.missions = ${LEVEL(94)}; save();
      setWorld("chatouilles", true); openGamePicker("guili")`);
  check("sur l'île, à 6 ans, « choisir un jeu » propose toujours le jeu favori", () => [
    !!d.querySelector('.game-choice[data-game="coding"]'),
  ]);
  ev('closeModal(); currentProfile().age = 0; setWorld("lagon", true)');
}

(async () => {
  await t.start();
  section('Le Monde des Chatouilles : l’île, son thème, son paysage, sa musique');
  ile();
  section('Le Monde des Chatouilles : ses 4 personnages et leurs fiches de chatouilles');
  personnages();
  section('Le Monde des Chatouilles : ouverture au niveau 94, jeu favori');
  surIle();
  jeuFavori();
  await t.finish('le Monde des Chatouilles (l’île)');
})();
