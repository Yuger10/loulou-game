// Le Monde des Chatouilles : « Le chemin de la plume » (coding), ses tables et
// sa fabrique de grilles : critères 1 à 3 et 28 à 31 de la spec, tables T1
// (paliers), T2 (grilles de secours), règles G0 à G7, son `giggle` (T5).
// 300 grilles par palier, résolues par le solveur du test. L'écran :
// test/chatouilles-coding-ecran.test.js. Harnais : test/tools/chatouilles.js.
const t = require('./tools/chatouilles.js');
const { ev, json, check, section, T1, T2 } = t;

const sameRow = (x, y) => json(Object.entries(x).sort()) === json(Object.entries(y).sort());
const between = (v, [lo, hi]) => v >= lo && v <= hi;

function inscription() {
  check('critère 28 : « Le chemin de la plume » est inscrit une seule fois, 🪶, dès 6 ans', () => [
    ev('GAME_TYPES.filter((k) => k === "coding").length') === 1,
    json(ev('GAME_LIST.filter((x) => x.key === "coding")')) ===
      json([{ key: 'coding', emoji: '🪶', name: 'Le chemin de la plume' }]),
    ev('hasHints("coding")'),
    ev('gameTypesForAge(6).includes("coding")') && ev('gameTypesForAge(0).includes("coding")'),
    !ev('gameTypesForAge(5).includes("coding")') && !ev('gameTypesForAge(4).includes("coding")'),
    ev('new Set(GAME_TYPES).size === GAME_TYPES.length'),
    ev('new Set(GAME_LIST.map((x) => x.key)).size === GAME_LIST.length'),
  ]);
  check('critère 29 : pas de minuteur, barème généreux (illimités, 4, 3, 3, 2)', () => [
    t.TIERS.every((p) => ev(`timerFor("coding", ${p})`) === null),
    ev('livesFor("coding", 1)') === Infinity,
    json([2, 3, 4, 5].map((p) => ev(`livesFor("coding", ${p})`))) === json([4, 3, 3, 2]),
  ]);
  check('critère 30 : sa phrase de progrès, groupe « formes » de l’espace parents', () => [
    ev('PROGRESS_CHEERS.coding') === 'Tu programmes de mieux en mieux !',
    ev('SKILL_GROUPS.find((x) => x.id === "formes").games.includes("coding")'),
    ev('SKILL_GROUPS.filter((x) => x.games.includes("coding")).length') === 1,
  ]);
  check('critère 31 : le son `giggle` existe, famille 0,9 ; constantes du jeu', () => [
    ev('typeof SOUND_PALETTE.giggle') === 'function',
    ev('SOUND_FAMILY.giggle') === 0.9,
    ev('CODING_STEP_MS') === 450,
    ev('CODING_MAX_TRIES') === 500,
  ]);
  check('critère 1, T1 : codingRound(p) vaut les 5 objets littéraux de la spec', () =>
    t.TIERS.map((p) => sameRow(ev(`codingRound(${p})`), T1[p])),
  );
  check('les amis à chatouiller : Plumette, Guili, Lulu (jamais Pic), table locale du jeu', () => [
    json(ev('CODING_FRIENDS')) === json(t.FRIENDS),
  ]);
}

// 300 grilles du palier p, graines différentes
function grilles(p) {
  const R = T1[p];
  const build = ev('codingBuildRound');
  const rounds = Array.from({ length: 300 }, (_, k) => build(p, t.seeded(t.SEED + 1000 * p + k)));
  const cellsOf = (g) => [g.start, g.goal, ...g.rocks].map((x) => x.join());
  check(
    `G0, G5, palier ${p} : forme du retour, grille ${R.size} × ${R.size}, ${R.rocks} cactus, cases distinctes`,
    () => [
      rounds.every((r) => json(Object.keys(r).sort()) === json(['best', 'cfg', 'fallback', 'grid', 'tries'])),
      rounds.every((r) => sameRow(r.cfg, R)),
      rounds.every((r) => r.grid.size === R.size && r.grid.mode === R.mode && r.grid.rocks.length === R.rocks),
      rounds.every((r) => new Set(cellsOf(r.grid)).size === 2 + R.rocks),
      rounds.every((r) =>
        [r.grid.start, r.grid.goal, ...r.grid.rocks].every(([a, b]) => a >= 0 && b >= 0 && a < R.size && b < R.size),
      ),
      rounds.every((r) => t.FRIENDS.some((f) => f.e === r.grid.friend.e && f.name === r.grid.friend.name)),
    ],
  );
  check(`critère 2, palier ${p} : le plus court programme existe, sa longueur et ses virages sont dans T1`, () => [
    rounds.every((r) => {
      const mine = t.shortest(r.grid);
      return !!mine && between(mine.len, R.len) && between(mine.turns, R.turns);
    }),
    // G4 : le jeu trouve la même longueur et les mêmes virages que le solveur du test
    rounds.every((r) => json([r.best.len, r.best.turns]) === json(Object.values(t.shortest(r.grid)))),
    rounds.every((r) => r.best.prog.length === r.best.len && t.turnsOf(R.mode, r.best.prog) === r.best.turns),
  ]);
  check(`critère 2, palier ${p} : au moins un cactus dans le rectangle de la plume à l'ami`, () =>
    rounds.map((r) => {
      const g = r.grid;
      const inRect = ([a, b]) =>
        between(a, [Math.min(g.start[0], g.goal[0]), Math.max(g.start[0], g.goal[0])]) &&
        between(b, [Math.min(g.start[1], g.goal[1]), Math.max(g.start[1], g.goal[1])]);
      return R.rocks === 0 || g.rocks.some(inRect);
    }),
  );
  check(`critère 3, palier ${p} : aucune grille de secours, 500 essais au plus, le programme arrive chez l'ami`, () => [
    rounds.every((r) => r.fallback === false && r.tries >= 1 && r.tries <= 500),
    rounds.every((r) => ev('codingRun')(r.grid, r.best.prog).end === 'goal'),
    rounds.every((r) => t.run(r.grid, r.best.prog).end === 'goal'),
  ]);
  const dirs = new Set(rounds.map((r) => r.grid.dir));
  check(`critère 15, palier ${p} : la direction de départ suit T1`, () => [
    p === 1 ? json([...dirs]) === json([1]) : p === 2 ? json([...dirs]) === json([0]) : dirs.size === 4,
  ]);
}

function secours() {
  check('T2 : les 5 grilles de secours sont écrites telles quelles dans le jeu', () =>
    t.TIERS.map((p) => {
      const f = ev(`CODING_FALLBACK[${p}]`);
      const w = T2[p];
      return json([f.start, f.dir, f.goal, f.rocks]) === json([w.start, w.dir, w.goal, w.rocks]);
    }),
  );
  check('S3 : codingBest donne les longueurs et virages de T2 ; son programme arrive chez l’ami', () =>
    t.TIERS.map((p) => {
      const g = t.fallbackGrid(p);
      const best = ev('codingBest')(g);
      return (
        best.len === T2[p].len &&
        best.turns === T2[p].turns &&
        json(t.shortest(g)) === json({ len: T2[p].len, turns: T2[p].turns }) &&
        ev('codingRun')(g, best.prog).end === 'goal'
      );
    }),
  );
  check('G4 : un ami entouré de cactus est inatteignable : codingBest rend null', () => [
    ev('codingBest')({
      ...t.fallbackGrid(2),
      rocks: [
        [0, 2],
        [1, 1],
        [1, 3],
        [2, 2],
      ],
    }) === null,
  ]);
}

// G7 : les exemples de la spec, sur la grille de secours du palier 2
function trajets() {
  const g = t.fallbackGrid(2);
  const runIt = (prog) => ev('codingRun')(g, prog);
  const same = (prog) => {
    const a = runIt(prog);
    const b = t.run(g, prog);
    return a.end === b.end && a.at === b.at && json(a.path[a.path.length - 1]) === json(b.last);
  };
  check('G7 : arrivée chez l’ami : `goal`, at 4, 6 états, le départ d’abord', () => {
    const r = runIt(['F', 'F', 'TR', 'F', 'F']);
    return [r.end === 'goal', r.at === 4, r.path.length === 6, json(r.path[0]) === json({ r: 3, c: 0, dir: 0 })];
  });
  check('G7 : les instructions après l’arrivée ne sont pas jouées', () => {
    const r = runIt(['F', 'F', 'TR', 'F', 'F', 'F', 'TL']);
    return [r.end === 'goal', r.at === 4, r.path.length === 6];
  });
  check('G7 : cactus (`rock`, at 1, 2 états), bord (`edge`, at 1)', () => {
    const rock = runIt(['TR', 'F']);
    const edge = runIt(['TL', 'F']);
    return [rock.end === 'rock', rock.at === 1, rock.path.length === 2, edge.end === 'edge', edge.at === 1];
  });
  check('G7 : arrêt ailleurs (`stop`, at -1, dernier état), programme vide (`empty`)', () => {
    const stop = runIt(['F', 'TR', 'F']);
    const empty = runIt([]);
    return [
      stop.end === 'stop' && stop.at === -1,
      json(stop.path[stop.path.length - 1]) === json({ r: 2, c: 1, dir: 1 }),
      empty.end === 'empty' && empty.at === -1 && empty.path.length === 1,
    ];
  });
  check('G7 : même fin que le solveur du test sur 8 programmes', () =>
    [['F'], ['TR', 'TR', 'F'], ['F', 'F', 'F', 'F'], ['F', 'TR', 'F', 'F', 'TL', 'F'], ['TL'], ['F', 'F', 'TR', 'F']]
      .concat([
        ['TR', 'TL', 'F', 'F', 'TR', 'F', 'F'],
        ['F', 'F', 'F', 'TR', 'F', 'F', 'TR', 'F'],
      ])
      .map(same),
  );
}
function trajetsAbsolus() {
  const abs = t.fallbackGrid(1);
  check('G2 : en flèches absolues, chaque flèche tourne la plume puis avance d’une case', () => {
    const r = ev('codingRun')(abs, ['U', 'R', 'D']);
    return [
      r.end === 'stop',
      json(r.path) ===
        json([
          { r: 3, c: 0, dir: 1 },
          { r: 2, c: 0, dir: 0 },
          { r: 2, c: 1, dir: 1 },
          { r: 3, c: 1, dir: 2 },
        ]),
      ev('codingRun')(abs, ['R', 'R', 'R']).end === 'goal',
      ev('codingRun')(abs, ['D']).end === 'edge',
    ];
  });
}

(async () => {
  await t.start();
  section('Le chemin de la plume : inscription, paliers (T1), son du rire');
  inscription();
  section('Le chemin de la plume : 300 grilles par palier (G4, G5)');
  t.TIERS.forEach(grilles);
  section('Le chemin de la plume : grilles de secours (T2) et trajets (G7)');
  secours();
  trajets();
  trajetsAbsolus();
  await t.finish('le Monde des Chatouilles (coding, les grilles)');
})();
