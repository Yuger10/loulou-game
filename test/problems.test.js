// L'Île des Coffres : « Le trésor raconté » (problems), ses tables : critères
// 1, 2 et 20 de la spec, T1 (tirages), R1 (choix du calcul), L1 (étiquettes),
// B1 (accords des phrases), E1 (mode d'exemple), X2 (exclusions). L'écran :
// test/problems-ecran.test.js. Harnais : test/tools/coffres.js.
const t = require('./tools/coffres.js');
const { ev, json, check, section, T1 } = t;

const between = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
// T1 : les bornes de chaque type, relues ici depuis la table de la spec
const partsUp = (x, R) => between(x.t, R.min, R.max) && between(x.a, 1, x.t - 1) && x.b === x.t - x.a;
const part = (x, R) => between(x.t, R.min, R.max) && between(x.a, 1, x.t - 1);
const IN_T1 = {
  reunion: partsUp,
  ajout: partsUp,
  retrait: (x, R) => between(x.a, R.min, R.max) && between(x.b, 1, x.a - 1),
  partie: part,
  ajoutInconnu: part,
  compPlus: (x, R) => between(x.b, 1, R.ecart) && between(x.a, 1, R.max - x.b),
  compEcart: (x, R) => between(x.a, 1, R.max - 1) && between(x.b, x.a + 1, Math.min(R.max, x.a + R.ecart)),
  compMoinsPlus: (x, R) => between(x.t, Math.max(R.min, 2), R.max) && between(x.b, 1, Math.min(R.ecart, x.t - 1)),
  deuxEtapes: (x, R) =>
    ['A', 'B'].includes(x.variant) &&
    between(x.a, 1, R.max - 2) &&
    between(x.b, 1, R.max - x.a - 1) &&
    between(x.c, 1, x.a + x.b - 1),
  possible: (x, R) =>
    x.b > x.a
      ? between(x.a, 2, R.max - 1) && between(x.b, x.a + 1, Math.min(R.max, x.a + 9))
      : between(x.a, 2, R.max) && between(x.b, 1, x.a),
};

// deux lignes égales, champ par champ (l'ordre des champs ne compte pas)
const sameRow = (x, y) => json(Object.entries(x).sort()) === json(Object.entries(y).sort());
function inscription() {
  check('critère 1 : « Le trésor raconté » est inscrit une seule fois, 🪙, dès 6 ans', () => [
    ev('GAME_TYPES.filter((k) => k === "problems").length') === 1,
    json(ev('GAME_LIST.filter((x) => x.key === "problems")')) ===
      json([{ key: 'problems', emoji: '🪙', name: 'Le trésor raconté' }]),
    ev('hasHints("problems")'),
    ev('gameTypesForAge(6).includes("problems")') && ev('gameTypesForAge(0).includes("problems")'),
    !ev('gameTypesForAge(5).includes("problems")'),
  ]);
  check('GAME_TYPES et GAME_LIST sont sans doublon', () => [
    ev('new Set(GAME_TYPES).size === GAME_TYPES.length'),
    ev('new Set(GAME_LIST.map((x) => x.key)).size === GAME_LIST.length'),
  ]);
  check('critère 20 : pas de minuteur, ses essais, sa phrase de progrès, groupe « calcul »', () => [
    t.TIERS.every((p) => ev(`timerFor("problems", ${p})`) === null),
    json(ev('LIVES_TABLE.problems')) === json({ 2: 4, 3: 4, 4: 3, 5: 3 }),
    ev('livesFor("problems", 1)') === Infinity,
    ev('PROGRESS_CHEERS.problems') === 'Tu résous les problèmes de mieux en mieux !',
    ev('SKILL_GROUPS.find((x) => x.id === "calcul").games.includes("problems")'),
  ]);
  check('R1 : problemsRound(p) vaut les 5 objets littéraux de la spec', () =>
    t.TIERS.map((p) => sameRow(ev(`problemsRound(${p})`), T1[p])),
  );
}

// 500 tirages libres par palier, chacun noté comme un problème joué
function tirages(p) {
  const drawn = [];
  for (let k = 0; k < 500; k++)
    drawn.push(ev(`(() => { const x = pbDraw(problemsRound(${p}), {}); pbNote(x); return x; })()`));
  const R = T1[p];
  check(`T1, palier ${p} : 500 tirages, seulement les types permis, tous présents`, () => [
    drawn.every((x) => R.types.includes(x.type)),
    R.types.every((ty) => drawn.some((x) => x.type === ty)),
  ]);
  check(`T1, palier ${p} : chaque nombre est dans ses bornes, entier, au moins 1 ; aucune plage vide`, () => [
    drawn.every((x) => IN_T1[x.type](x, R)),
    drawn.every((x) => (x.type === 'possible' ? x.r === 0 : Number.isInteger(x.r) && x.r >= 1)),
    drawn.every((x) => String(x.type === 'possible' ? t.resultOf(x) : x.r) === t.resultOf(x)),
  ]);
  check(`critère 2, palier ${p} : un tirage libre n'a jamais le type du dernier problème joué`, () => [
    drawn.every((x, i) => i === 0 || x.type !== drawn[i - 1].type),
  ]);
  check(
    `X2, palier ${p} : jamais deux fois de suite les mêmes nombres pour un type ; au moins 3 tuples par type`,
    () => {
      const last = {};
      const fresh = drawn.every((x) => {
        const same = last[x.type] === t.tuple(x);
        last[x.type] = t.tuple(x);
        return !same;
      });
      return [fresh, ...R.types.map((ty) => new Set(drawn.filter((x) => x.type === ty).map(t.tuple)).size >= 3)];
    },
  );
  check(
    `B1, palier ${p} : P et Q sont deux personnages différents, un seul objet ; Zap jamais P ni Q en deuxEtapes B`,
    () => [
      drawn.every((x) => x.p !== x.q && ev(`!!PB_PEOPLE[${json(x.p)}] && !!PB_PEOPLE[${json(x.q)}]`)),
      drawn.every((x) => ev(`!!PB_OBJECTS[${json(x.obj)}]`)),
      drawn.every((x) => x.variant !== 'B' || (x.p !== 'zap' && x.q !== 'zap')),
    ],
  );
  if (R.types.includes('possible'))
    check(`critère 2, palier ${p} : « possible » est rare (poids 0,2)`, () =>
      R.types.filter((ty) => ty !== 'possible').map((ty) => count(drawn, ty) > count(drawn, 'possible')),
    );
  return drawn;
}
const count = (drawn, ty) => drawn.filter((x) => x.type === ty).length;

function extremes(drawn1) {
  const ts = drawn1.filter((x) => x.type === 'reunion').map((x) => x.t);
  check('T1, palier 1 : les bornes basses et hautes sont atteintes (t = 2 : a = 1, b = 1 ; t = 6)', () => [
    ts.includes(2) && ts.includes(6),
    drawn1.some((x) => x.type === 'retrait' && x.a === 2 && x.b === 1),
  ]);
  check('X2 : le jumeau garde le type demandé, évite les tuples donnés et prend un autre objet', () => {
    const ex = ev('pbDraw(problemsRound(1), {})');
    const twins = Array.from({ length: 60 }, () =>
      ev('pbDraw')(T1[1], { type: ex.type, avoid: [ev('pbTuple')(ex)], notObj: ex.obj }),
    );
    return [
      twins.every((x) => x.type === ex.type),
      twins.every((x) => t.tuple(x) !== t.tuple(ex)),
      twins.every((x) => x.obj !== ex.obj),
    ];
  });
}

// R1 : les choix du calcul, étape par étape
function choix(p, drawn) {
  const R = T1[p];
  const rows = drawn
    .filter((x) => x.type !== 'possible')
    .flatMap((x) => ev('pbStages')(x).map((s) => ({ s, c: ev('pbChoices')(s, R) })));
  const other = (s) => (s.op === '+' ? Math.abs(s.n1 - s.n2) : s.n1 + s.n2);
  check(`R1, palier ${p} : ${R.choices} choix distincts, dont le résultat, tous au moins 1`, () => [
    rows.length > 100,
    rows.every((x) => x.c.length === R.choices && new Set(x.c).size === R.choices),
    rows.every((x) => x.c.includes(x.s.r) && x.c.every((v) => Number.isInteger(v) && v >= 1)),
  ]);
  check(`R1, palier ${p} : chaque leurre est à au plus ${R.gap} du résultat ; l'autre opération d'abord`, () => [
    rows.every((x) => x.c.every((v) => Math.abs(v - x.s.r) <= R.gap)),
    rows.every((x) => {
      const o = other(x.s);
      return o < 1 || o === x.s.r || Math.abs(o - x.s.r) > R.gap || x.c.includes(o);
    }),
    rows.every((x) => x.c.includes(x.s.r + 1)),
  ]);
}

// L1 : étiquettes, cases, opération et ordre Q de chaque type
function etiquettes() {
  const types = Object.keys(IN_T1).filter((ty) => ty !== 'possible');
  check('L1 : n1, n2, leurs cases, la case du « ? », l’opération et l’ordre Q, pour chaque type', () =>
    types.map((ty) => {
      const p = ty === 'compMoinsPlus' || ty === 'deuxEtapes' ? 4 : 3;
      const x = t.make(t.sample(ty, T1[p].types.includes(ty) ? p : 1));
      const got = ev('pbStages')(x).map((s) => [s.n1, s.slots[0], s.n2, s.slots[1], s.slots[2], s.op, s.order, s.r]);
      const want = t.stagesOf(x).map((s) => [s.n1, s.s1, s.n2, s.s2, s.sq, s.op, s.order, s.r]);
      return json(got) === json(want) && got.length === (ty === 'deuxEtapes' ? 2 : 1);
    }),
  );
  check('L1 : « possible » n’a aucune étape de calcul', () => [
    ev('pbStages')(t.make(t.sample('possible', 4))).length === 0,
  ]);
}

const { ONES } = require('./tools/coffres-textes.js');
function accords() {
  const story = (spec) => ev('pbStory')(t.make(spec));
  check('B1 : les énoncés accordés avec le nombre 1 (« une pièce », « un coquillage »), mot pour mot', () =>
    ONES.filter((x) => x[1]).map(
      ([spec, text]) =>
        story(spec)
          .lines.map((l) => l.text)
          .join(' ') === text,
    ),
  );
  check('B1 : les phrases réponses, accordées elles aussi', () =>
    ONES.map(([spec, , answer]) => story(spec).answer === answer),
  );
  check('B1 : jamais « 1 pièce » ni « 1 coquillage » dans une phrase', () =>
    ONES.map(
      ([spec]) =>
        !/(^|[^0-9])1 /.test(
          story(spec)
            .lines.map((l) => l.text)
            .join(' ') + story(spec).answer,
        ),
    ),
  );
  check('B1 : les 5 personnages et les 5 objets de la table locale', () => [
    json(ev('Object.entries(PB_PEOPLE).map(([k, x]) => [k, x.name, x.gender, x.emoji])')) ===
      json([
        ['clemence', 'Clémence', 'f', '🗝️'],
        ['kadi', 'Kadi', 'm', '🔒'],
        ['grignote', 'Grignote', 'f', '🐭'],
        ['pincou', 'Pinçou', 'm', '🦀'],
        ['zap', 'Zap', 'm', '🦸‍♂️'],
      ]),
    json(ev('Object.entries(PB_OBJECTS).map(([k, x]) => [k, x.emoji, x.one, x.many, x.gender])')) ===
      json([
        ['piece', '🪙', 'pièce', 'pièces', 'f'],
        ['cle', '🔑', 'clé', 'clés', 'f'],
        ['gemme', '💎', 'gemme', 'gemmes', 'f'],
        ['coquillage', '🐚', 'coquillage', 'coquillages', 'm'],
        ['bague', '💍', 'bague', 'bagues', 'f'],
      ]),
  ]);
}

// E1 : le mode d'exemple, définition totale
function modeExemple() {
  const mode = (s, tier, multi) => ev('pbModeOf')(s, tier, !!multi);
  const at = (k) => Array.from({ length: k }, () => ({ ok: true, e: 0 }));
  check('E1 : à plusieurs, toujours 2 ; sans niveau connu, 0 (même avec une entrée créée par un indice)', () => [
    mode(null, 3, true) === 2,
    mode({ lvl: 3, atLvl: [] }, 3, true) === 2,
    mode(null, 3) === 0,
    mode(undefined, 1) === 0,
    mode({ wins: 0, hints: 1 }, 2) === 0,
    mode({ lvl: 0, atLvl: at(3) }, 2) === 0,
  ]);
  check('E1 : palier joué au-dessus du niveau : 0 ; en dessous : 2 ; égal : le nombre de missions, 2 au plus', () => [
    mode({ lvl: 2, atLvl: at(3) }, 3) === 0,
    mode({ lvl: 4, atLvl: [] }, 3) === 2,
    mode({ lvl: 3 }, 3) === 0,
    mode({ lvl: 3, atLvl: at(1) }, 3) === 1,
    mode({ lvl: 3, atLvl: at(2) }, 3) === 2,
    mode({ lvl: 3, atLvl: at(3) }, 3) === 2,
  ]);
}

(async () => {
  await t.start();
  section('Le trésor raconté : inscription et tables');
  inscription();
  section('Le trésor raconté : tirages (T1, X2)');
  const drawn = {};
  for (const p of t.TIERS) drawn[p] = tirages(p);
  extremes(drawn[1]);
  section('Le trésor raconté : choix du calcul (R1) et étiquettes (L1)');
  t.TIERS.forEach((p) => choix(p, drawn[p]));
  etiquettes();
  section('Le trésor raconté : phrases (B1) et mode d’exemple (E1)');
  accords();
  modeExemple();
  await t.finish("l'Île des Coffres (problems, les tables)");
})();
