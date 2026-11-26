// L'Île des Crayons : le mini-jeu « Mesure les crayons » (length), sans écran :
// paliers et tirages (lignes 25 à 30 de la spec), puis ses tables (ligne 34).
// L'écran : test/crayons-length-ecran.test.js. Harnais : test/tools/crayons.js.
const t = require('./tools/crayons.js');
const { ev, json, check, section } = t;

// 40 tirages du palier p ; chaque tirage doit vérifier toute la liste de `fn`
const DRAWS = 40;
const draws = (p) => Array.from({ length: DRAWS }, () => ev(`lengthBuildRound(${p})`));
const allDraws = (p, fn) => draws(p).map((b) => fn(b).every(Boolean));
const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const lens = (b) => b.crayons.map((c) => c.len);
// l'index du plus long (ou du plus court) crayon
function wanted(b) {
  const want = b.ask === 'long' ? Math.max(...lens(b)) : Math.min(...lens(b));
  return lens(b).indexOf(want);
}
// l'index du crayon qui finit le plus à droite
const furthest = (b) => {
  const ends = b.crayons.map((c) => c.start + c.len);
  return ends.indexOf(Math.max(...ends));
};
const noChoice = (b) => [b.start === 0, json(b.choices) === '[]', b.trap === null];
const distinct = (list) => new Set(list).size === list.length;

const LENGTH_TIERS = {
  1: { mode: 'compare', n: 2, aligned: true, minRatio: 1.3 },
  2: { mode: 'compare', n: 3, aligned: false, minRatio: 1.15, trap: 0.5 },
  3: { mode: 'units', min: 2, max: 6, choices: 3, unit: 12 },
  4: { mode: 'ruler', min: 3, max: 12, offset: false, choices: 4, cm: 6 },
  5: { mode: 'ruler', min: 3, max: 10, offset: true, choices: 4, cm: 6 },
};

function paliers() {
  check('ligne 25 : lengthRound(p) vaut la table des paliers, de 1 à 5', () =>
    t.TIERS.map((p) => json(ev(`lengthRound(${p})`)) === json(LENGTH_TIERS[p])),
  );
  check('chaque tirage porte les règles de son palier et son mode', () =>
    t.TIERS.map((p) => {
      const b = ev(`lengthBuildRound(${p})`);
      return json(b.rules) === json(LENGTH_TIERS[p]) && b.mode === LENGTH_TIERS[p].mode;
    }),
  );
}

function comparer() {
  check('ligne 26 : palier 1, deux crayons alignés (départ 5), de 25 à 90, bien différents', () =>
    allDraws(1, (b) => [
      b.mode === 'compare',
      b.crayons.length === 2,
      b.crayons.every((c) => c.start === 5 && int(c.len, 25, 90)),
      Math.max(...lens(b)) >= 1.3 * Math.min(...lens(b)),
      b.answer === wanted(b),
      ...noChoice(b),
    ]),
  );
  check('ligne 26 : on demande le plus long ou le plus court (les deux apparaissent)', () => {
    const asks = draws(1).map((b) => b.ask);
    return [asks.every((a) => a === 'long' || a === 'short'), asks.includes('long'), asks.includes('short')];
  });
  check('ligne 27 : palier 2, trois crayons décalés (départ de 5 à 25, fin à 95 au plus)', () =>
    allDraws(2, (b) => {
      const sorted = lens(b).sort((x, y) => x - y);
      return [
        b.mode === 'compare',
        b.crayons.length === 3,
        b.crayons.every((c) => int(c.start, 5, 25) && int(c.len, 25, 90) && c.start + c.len <= 95),
        sorted[1] >= 1.15 * sorted[0],
        sorted[2] >= 1.15 * sorted[1],
        b.answer === wanted(b),
        ...noChoice(b),
      ];
    }),
  );
  check("ligne 27 : le piège du décalage : souvent, le crayon qui va le plus loin n'est pas la réponse", () => [
    draws(2).filter((b) => furthest(b) !== b.answer).length >= 10,
  ]);
}

function mesurer() {
  check('ligne 28 : palier 3, un crayon de 2 à 6 gommes, trois choix voisins', () =>
    allDraws(3, (b) => {
      const k = b.answer;
      return [
        b.mode === 'units',
        int(k, 2, 6),
        json(b.crayons) === json([{ start: 0, len: k }]),
        json(b.choices.slice().sort((x, y) => x - y)) === json([k - 1, k, k + 1]),
        b.start === 0,
        b.ask === null,
        b.trap === null,
      ];
    }),
  );
  check('ligne 29 : palier 4, un crayon de 3 à 12 cm posé au zéro, 4 choix de 1 à 15', () =>
    allDraws(4, (b) => {
      const k = b.answer;
      return [
        b.mode === 'ruler',
        int(k, 3, 12),
        json(b.crayons) === json([{ start: 0, len: k }]),
        b.choices.length === 4 && distinct(b.choices),
        b.choices.every((v) => int(v, 1, 15) && Math.abs(v - k) <= 2),
        b.choices.includes(k),
        b.start === 0 && b.ask === null && b.trap === null,
      ];
    }),
  );
  check('ligne 30 : palier 5, le crayon part de 1 à 4 ; le piège est la graduation sous la pointe', () =>
    allDraws(5, (b) => {
      const k = b.answer,
        s = b.start;
      return [
        b.mode === 'ruler',
        int(s, 1, 4) && int(k, 3, 10) && s + k <= 14,
        json(b.crayons) === json([{ start: s, len: k }]),
        b.trap === s + k,
        b.choices.length === 4 && distinct(b.choices),
        b.choices.includes(k) && b.choices.includes(s + k),
        b.choices.every((v) => v === s + k || Math.abs(v - k) <= 2),
        b.ask === null,
      ];
    }),
  );
  check('les choix sont mélangés : la bonne réponse change de place', () => [
    new Set(draws(4).map((b) => b.choices.indexOf(b.answer))).size >= 3,
  ]);
}

function tables() {
  check('ligne 34 : pas de minuteur, essais généreux (illimités au palier 1, puis 4, 3, 3, 2)', () => [
    ev('timerFor("length", 5)') === null,
    ev('timerFor("length", 3)') === null,
    ev('livesFor("length", 1)') === Infinity,
    json([2, 3, 4, 5].map((p) => ev(`livesFor("length", ${p})`))) === json([4, 3, 3, 2]),
  ]);
  check('ligne 34 : le jeu est inscrit, dans « choisir un jeu », dès 5 ans', () => [
    ev('GAME_TYPES.includes("length")'),
    ev('hasHints("length")'),
    json(ev('GAME_LIST.find((x) => x.key === "length")')) ===
      json({ key: 'length', emoji: '📏', name: 'Mesure les crayons' }),
    ev('gameTypesForAge(5).includes("length")'),
    !ev('gameTypesForAge(4).includes("length")'),
    ev('gameTypesForAge(8).includes("length")'),
  ]);
  check('ligne 34 : compétence « Temps et mesures » des parents, et sa phrase de progrès', () => [
    ev('SKILL_GROUPS.find((x) => x.id === "mesures").games.includes("length")'),
    ev('PROGRESS_CHEERS.length') === 'Tu mesures de mieux en mieux !',
  ]);
  check("D10 : la clé « length » ne se confond avec la propriété d'aucune table du jeu", () => [
    ev('GAME_TYPES.filter((k) => k === "length").length') === 1,
    typeof ev('PROGRESS_CHEERS.length') === 'string',
    ev('typeof LIVES_TABLE.length') === 'undefined',
    ev('typeof TIMER_SECONDS.length') === 'undefined',
    ev('typeof GAME_TIER_MAX.length') === 'undefined',
  ]);
}

(async () => {
  await t.start();
  section('Mesure les crayons : paliers');
  paliers();
  section('Mesure les crayons : comparer (paliers 1 et 2)');
  comparer();
  section('Mesure les crayons : mesurer (paliers 3 à 5)');
  mesurer();
  section('Mesure les crayons : tables');
  tables();
  await t.finish("l'Île des Crayons (length, la logique)");
})();
