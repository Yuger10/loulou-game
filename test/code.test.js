// L'Île des Coffres : « Le code secret » (code), ses tables et sa fabrique de
// cadenas : critères 21 à 23, 29 et 30 de la spec, tables T2 (paliers), S2
// (symboles), I2 (phrases des indices), A2 (forme des indices), H2 (indices du
// compagnon). 200 cadenas par palier, résolus par le solveur du test (par
// permutations). L'écran : test/code-ecran.test.js. Harnais : test/tools/coffres.js.
const t = require('./tools/coffres.js');
const { ev, json, check, section, T2 } = t;

const sameRow = (x, y) => json(Object.entries(x).sort()) === json(Object.entries(y).sort());
const SYMBOLS = [
  ['poisson', '🐟', 'le poisson', 'du poisson', 'm'],
  ['etoile', '⭐', "l'étoile", "de l'étoile", 'f'],
  ['lune', '🌙', 'la lune', 'de la lune', 'f'],
  ['pomme', '🍎', 'la pomme', 'de la pomme', 'f'],
  ['fleur', '🌸', 'la fleur', 'de la fleur', 'f'],
  ['coquillage', '🐚', 'le coquillage', 'du coquillage', 'm'],
];
const IDS = SYMBOLS.map((x) => x[0]);
// A2 : les clés permises de chaque type d'indice
const KEYS = { est: 's,t,w', pas: 's,t,w', absent: 's,t', voisins: 's,s2,t', bout: 's,t' };

function inscription() {
  check('critère 21 : « Le code secret » est inscrit une seule fois, 🔐, dès 6 ans', () => [
    ev('GAME_TYPES.filter((k) => k === "code").length') === 1,
    json(ev('GAME_LIST.filter((x) => x.key === "code")')) ===
      json([{ key: 'code', emoji: '🔐', name: 'Le code secret' }]),
    ev('hasHints("code")'),
    ev('gameTypesForAge(6).includes("code")') && ev('gameTypesForAge(0).includes("code")'),
    !ev('gameTypesForAge(5).includes("code")'),
    ev('new Set(GAME_TYPES).size === GAME_TYPES.length'),
  ]);
  check('critère 30 : pas de minuteur, jeu généreux, sa phrase de progrès, groupe « logique »', () => [
    t.TIERS.every((p) => ev(`timerFor("code", ${p})`) === null),
    [2, 3, 4, 5].every((p) => ev(`livesFor("code", ${p})`) === ev(`LIVES_TABLE.generous[${p}]`)),
    ev('PROGRESS_CHEERS.code') === 'Tu trouves les codes secrets de mieux en mieux !',
    ev('SKILL_GROUPS.find((x) => x.id === "logique").games.includes("code")'),
  ]);
  check('T2 : codeRound(p) vaut les 5 objets littéraux de la spec', () =>
    t.TIERS.map((p) => sameRow(ev(`codeRound(${p})`), T2[p])),
  );
  check('S2 : les 6 symboles, leur nom dit, avec « de », leur genre ; T2 : les 4 couleurs des roues', () => [
    json(ev('Object.entries(CODE_SYMBOLS).map(([k, x]) => [k, x.emoji, x.name, x.of, x.gender])')) === json(SYMBOLS),
    json(ev('CODE_COLORS.map((c) => [c.name, c.hex])')) ===
      json([
        ['rouge', '#E8344E'],
        ['bleue', '#2F7CC0'],
        ['verte', '#2F9551'],
        ['jaune', '#E0A800'],
      ]),
  ]);
}

// 200 cadenas du palier p
function cadenas(p) {
  const R = T2[p];
  const locks = Array.from({ length: 200 }, () => ev(`codeLock(${p})`));
  const distinct = (xs) => new Set(xs).size === xs.length;
  check(`critère 22, palier ${p} : ${R.wheels} roues, ${R.palette} symboles de S2, tous différents`, () => [
    locks.every((x) => x.wheels === R.wheels && x.code.length === R.wheels && x.palette.length === R.palette),
    locks.every((x) => distinct(x.palette) && x.palette.every((s) => IDS.includes(s))),
    locks.every((x) => distinct(x.code) && x.code.every((s) => x.palette.includes(s))),
  ]);
  check(`critère 22, palier ${p} : les types d'indices, leur nombre et celui des « est » suivent T2`, () => [
    locks.every((x) => x.clues.every((k) => R.types.includes(k.t))),
    locks.every((x) => x.clues.length >= 1 && x.clues.length <= R.maxClues),
    locks.every((x) => x.clues.filter((k) => k.t === 'est').length <= R.maxEst),
    locks.every((x) => x.clues.every((k) => Object.keys(k).sort().join() === KEYS[k.t])),
  ]);
  check(`critère 23, palier ${p} : chaque indice est vrai, un seul code les respecte tous`, () => [
    locks.every((x) => x.clues.every((k) => t.TRUE[k.t](x.code, k))),
    locks.every((x) => {
      const left = t.solutions(x);
      return left.length === 1 && json(left[0]) === json(x.code);
    }),
  ]);
  check(`critère 23, palier ${p} : chaque indice est nécessaire (sans lui, au moins deux codes)`, () => [
    locks.every((x) =>
      x.clues.every(
        (_k, i) =>
          t.solutions(
            x,
            x.clues.filter((_c, j) => j !== i),
          ).length >= 2,
      ),
    ),
  ]);
  check(`critère 22, palier ${p} : les cadenas varient (au moins 20 codes différents sur 200)`, () => [
    new Set(locks.map((x) => json(x.code))).size >= 20,
  ]);
  return locks;
}

// I2 : la phrase de chaque indice, accordée (« du poisson », « de l'étoile »)
const PHRASES = [
  [{ t: 'est', s: 'lune', w: 0 }, 'La lune est sur la roue rouge.'],
  [{ t: 'est', s: 'coquillage', w: 3 }, 'Le coquillage est sur la roue jaune.'],
  [{ t: 'pas', s: 'poisson', w: 2 }, "Le poisson n'est pas sur la roue verte."],
  [{ t: 'pas', s: 'etoile', w: 1 }, "L'étoile n'est pas sur la roue bleue."],
  [{ t: 'absent', s: 'fleur' }, "La fleur n'est pas dans le code."],
  [{ t: 'voisins', s: 'pomme', s2: 'lune' }, 'La pomme est juste à gauche de la lune.'],
  [{ t: 'voisins', s: 'lune', s2: 'poisson' }, 'La lune est juste à gauche du poisson.'],
  [{ t: 'voisins', s: 'fleur', s2: 'etoile' }, "La fleur est juste à gauche de l'étoile."],
  [{ t: 'bout', s: 'etoile' }, "L'étoile est sur une roue du bout."],
];
function phrases() {
  check('I2 : les phrases des indices, accordées, mot pour mot', () =>
    PHRASES.map(([clue, text]) => ev('codeClueSay')(clue) === text),
  );
}

// H2 : les deux indices du compagnon
const H2_FIRST =
  "Commence par l'indice le plus sûr : celui qui chasse un symbole du code, ou celui qui dit où va un symbole.";
const H2 = [
  [
    [{ t: 'absent', s: 'poisson' }],
    "Le poisson n'est pas dans le code : il ne va sur aucune roue. Regarde les autres symboles.",
  ],
  [
    [
      { t: 'est', s: 'pomme', w: 0 },
      { t: 'absent', s: 'lune' },
    ],
    "La lune n'est pas dans le code : elle ne va sur aucune roue. Regarde les autres symboles.",
  ],
  [[{ t: 'pas', s: 'pomme', w: 1 }], "La pomme n'est pas sur la roue bleue. Où peut-elle aller, alors ?"],
  [[{ t: 'pas', s: 'coquillage', w: 0 }], "Le coquillage n'est pas sur la roue rouge. Où peut-il aller, alors ?"],
  [
    [
      { t: 'pas', s: 'pomme', w: 1 },
      { t: 'voisins', s: 'fleur', s2: 'etoile' },
    ],
    "La fleur et l'étoile sont collées : la fleur d'abord, puis l'étoile juste à sa droite. Où peuvent-elles aller ?",
  ],
  [
    [{ t: 'voisins', s: 'poisson', s2: 'lune' }],
    'Le poisson et la lune sont collés : le poisson d’abord, puis la lune juste à sa droite. Où peuvent-ils aller ?'.replace(
      '’',
      "'",
    ),
  ],
  [
    [{ t: 'est', s: 'lune', w: 0 }],
    'Une carte dit où va la lune : la roue rouge. Commence par elle, puis cherche les autres.',
  ],
  [
    [{ t: 'bout', s: 'etoile' }],
    "L'étoile est sur une roue du bout : la première ou la dernière. Laquelle reste possible ?",
  ],
];
const hints = (clues) => ev('codeHints')({ clues });
function indicesTextes() {
  check('H2 : l’indice 2 suit le premier indice présent (absent, voisins, pas, est, bout), accordé', () =>
    H2.map(([clues, text]) => hints(clues)[1].say === text),
  );
  check('H2 : l’indice 2 fait briller la carte citée ; l’indice 1, les cartes du type le plus sûr', () => [
    hints(H2[1][0])[1].fx.glow === '.code-clue[data-k="1"]',
    hints(H2[1][0])[0].fx.glow === '.code-clue[data-t="absent"]',
    hints(H2[4][0])[0].fx.glow === '.code-clue[data-t="voisins"]',
    hints(H2[4][0])[1].fx.glow === '.code-clue[data-k="1"]',
    hints(H2[7][0])[0].fx.glow === '.code-clue[data-t="bout"]',
  ]);
}
function indices(locks) {
  const ORDER = ['absent', 'est', 'voisins', 'pas', 'bout'];
  for (const p of t.TIERS) {
    const all = locks[p].map((x) => ({ x, h: hints(x.clues) }));
    check(`critère 29, palier ${p} : 2 indices distincts sur 200 cadenas, le premier vise toujours une carte`, () => [
      all.every(({ h }) => h.length === 2 && h[0].say === H2_FIRST && h[1].say.length > 8 && h[1].say !== h[0].say),
      all.every(
        ({ x, h }) => h[0].fx.glow === `.code-clue[data-t="${ORDER.find((ty) => x.clues.some((k) => k.t === ty))}"]`,
      ),
      all.every(
        ({ x, h }) =>
          /^\.code-clue\[data-k="\d"\]$/.test(h[1].fx.glow) && Number(h[1].fx.glow.match(/\d/)[0]) < x.clues.length,
      ),
      all.every(({ h }) => h.every((y) => !y.fx.dim && !y.fx.strike)),
    ]);
  }
  check(
    'H2, couverture : palier 1, toujours 1 « est » et 2 « absent » ; ensuite, toujours un absent, voisins ou pas',
    () => [
      locks[1].every(
        (x) =>
          x.clues
            .map((k) => k.t)
            .sort()
            .join() === 'absent,absent,est',
      ),
      [2, 3, 4, 5].every((p) => locks[p].every((x) => x.clues.some((k) => ['absent', 'voisins', 'pas'].includes(k.t)))),
    ],
  );
  check('critère 29 : un indice ne dit jamais où va un symbole, sauf si une carte l’écrit telle quelle', () =>
    t.TIERS.map((p) =>
      locks[p].every((x) =>
        hints(x.clues).every((h) => {
          const m = /où va (.+?) : la roue (\S+?)\./.exec(h.say);
          return !m || x.clues.some((k) => k.t === 'est' && ev('codeClueSay')(k).includes(`roue ${m[2]}.`));
        }),
      ),
    ),
  );
}

(async () => {
  await t.start();
  section('Le code secret : inscription et tables (T2, S2)');
  inscription();
  section('Le code secret : 200 cadenas par palier (critères 22 et 23)');
  const locks = {};
  for (const p of t.TIERS) locks[p] = cadenas(p);
  section('Le code secret : phrases (I2) et indices (H2)');
  phrases();
  indicesTextes();
  indices(locks);
  await t.finish("l'Île des Coffres (code, les tables)");
})();
