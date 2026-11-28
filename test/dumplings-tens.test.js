// L'Île des Squishy Dumplings : le mini-jeu « Les paniers de dix » (tens), sans
// écran : accords R3, pièges R1 (exemples et bornes de la spec), tirages par
// mode (200 par palier), écritures T2. L'écran : test/dumplings-tens-ecran.test.js ;
// les indices : test/dumplings-tens-indices.test.js. Harnais : test/tools/dumplings.js.
const t = require('./tools/dumplings.js');
const { ev, json, check, section, digits } = t;

const DRAWS = 200;
const draws = (p) => Array.from({ length: DRAWS }, () => ev(`tensNewQuestion(${p})`));
const traps = (n, p) => json(ev(`tensTraps(${n}, ${p})`));
const cap = (p) => (p === 5 ? 999 : 99);
const distinct = (list) => new Set(list).size === list.length;
const sum = (list) => list.reduce((a, b) => a + b, 0);

function accords() {
  check('R3 : « 1 tout seul », « 2 tout seuls », « 1 panier », « 3 paniers », « 1 pile », « 2 piles »', () => [
    ev('tensQty(1, "tout seul", "tout seuls")') === '1 tout seul',
    ev('tensQty(2, "tout seul", "tout seuls")') === '2 tout seuls',
    ev('tensQty(1, "panier", "paniers")') === '1 panier',
    ev('tensQty(3, "panier", "paniers")') === '3 paniers',
    ev('tensQty(1, "pile", "piles")') === '1 pile',
    ev('tensQty(2, "pile", "piles")') === '2 piles',
    ev('tensQty(1, "dumpling", "dumplings")') === '1 dumpling',
  ]);
}

function pieges() {
  check('R1, exemples de la table : 14 ; 34 et 33 (palier 2) ; 34, 30, 33 (paliers 3 et 4)', () => [
    traps(14, 1) === json([5, 15]),
    traps(34, 2) === json([43, 7]),
    traps(33, 2) === json([6, 34]),
    traps(34, 3) === json([43, 44, 24]),
    traps(30, 3) === json([40, 20, 31]),
    traps(33, 4) === json([43, 23, 34]),
  ]);
  check('R1, exemples du palier 5 : 345, 305, 300, 950', () => [
    traps(345, 5) === json([354, 435, 445]),
    traps(305, 5) === json([350, 405, 315]),
    traps(300, 5) === json([400, 310, 301]),
    traps(950, 5) === json([905, 590, 960]),
  ]);
  check('R1, bornes des paliers 1 et 2 : 11, 19, 21, 69', () => [
    traps(11, 1) === json([2, 12]),
    traps(19, 1) === json([10, 20]),
    traps(21, 2) === json([12, 3]),
    traps(69, 2) === json([96, 15]),
  ]);
  check('R1, bornes des paliers 3 à 5 : 20, 99, 100, et 999 par le repli vers le bas', () => [
    traps(20, 3) === json([30, 10, 21]),
    traps(99, 4) === json([89, 18, 98]),
    traps(100, 5) === json([200, 110, 101]),
    traps(999, 5) === json([989, 997, 996]),
  ]);
}

// les réponses d'un tirage : le bon nombre de choix, tous différents, dans les
// bornes, une seule juste, et les pièges de R1 (mélangés avec la bonne réponse)
function answersOk(q, p) {
  if (q.mode === 'make') return q.options.length === 0;
  const want = [q.n, ...ev(`tensTraps(${q.n}, ${p})`)].sort((a, b) => a - b);
  return (
    q.options.length === t.T1[p].choices &&
    distinct(q.options) &&
    q.options.every((v) => Number.isInteger(v) && v >= 1 && v <= cap(p)) &&
    q.options.filter((v) => v === q.n).length === 1 &&
    json(q.options.slice().sort((a, b) => a - b)) === json(want)
  );
}
// le mode est du palier, le nombre dans ses bornes, et le dessin montre bien ce nombre
function inTier(q, p) {
  const cfg = t.T1[p];
  return (
    q.mode in cfg.modes &&
    q.tier === p &&
    q.n >= cfg.min &&
    q.n <= cfg.max &&
    100 * q.piles + 10 * q.baskets + q.loose === q.n
  );
}
// le nombre et son dessin tiennent la règle du mode (tirage du nombre, mode par mode)
function numberOk(q, p) {
  const cfg = t.T1[p],
    g = digits(q.n);
  if (!inTier(q, p)) return false;
  if (q.mode === 'build') return q.n >= 11 && q.n <= 19 && q.baskets === 1;
  if (!cfg.zero && g.u === 0) return false;
  if (q.mode === 'write') return q.terms.length >= 2 && (p === 5 ? g.d + g.u > 0 : g.u > 0);
  if (q.loose > 9) return p === 4 && q.mode === 'read' && q.loose <= 19 && q.baskets >= 1 && q.baskets <= 8;
  return q.piles === g.c && q.baskets === g.d && q.loose === g.u;
}

function tirages(p) {
  const list = draws(p);
  check(`palier ${p} : 200 tirages tiennent la règle de leur mode (bornes, zéros, dessin)`, () =>
    list.map((q) => numberOk(q, p)),
  );
  check(`palier ${p} : ${t.T1[p].choices} réponses construites par R1, une seule juste (ligne 6)`, () =>
    list.map((q) => answersOk(q, p)),
  );
  check(`palier ${p} : deux tirages de suite ne posent jamais la même question (mode, nombre)`, () =>
    list.slice(1).map((q, i) => q.mode !== list[i].mode || q.n !== list[i].n),
  );
  check(`palier ${p} : tous les modes du palier apparaissent`, () =>
    Object.keys(t.T1[p].modes).map((m) => list.some((q) => q.mode === m)),
  );
  return list;
}

// T2 : les termes non nuls, dans l'ordre affiché ; leur somme est le nombre
function ecritures(lists) {
  const writes = (p) => lists[p].filter((q) => q.mode === 'write');
  const canon = (q) => [100 * digits(q.n).c, 10 * digits(q.n).d, digits(q.n).u].filter(Boolean);
  const sorted = (q) => json(q.terms.slice().sort((a, b) => b - a)) === json(canon(q));
  check("T2 : l'écriture a au moins 2 termes, aucun nul, et leur somme vaut le nombre", () =>
    [3, 4, 5].flatMap((p) => writes(p).map((q) => q.terms.length >= 2 && !q.terms.includes(0) && sum(q.terms) === q.n)),
  );
  check('T2, palier 3 : toujours les dizaines puis les unités (30 + 5)', () =>
    writes(3).map((q) => json(q.terms) === json(canon(q))),
  );
  check('T2, palier 4 : « 30 + 5 » ou « 5 + 30 », les deux ordres apparaissent', () => [
    writes(4).every(sorted),
    writes(4).some((q) => json(q.terms) === json(canon(q))),
    writes(4).some((q) => json(q.terms) !== json(canon(q))),
  ]);
  check('T2, palier 5 : centaines, dizaines, unités, ou un ordre mélangé', () => [
    writes(5).every(sorted),
    writes(5).some((q) => json(q.terms) === json(canon(q))),
    writes(5).some((q) => json(q.terms) !== json(canon(q))),
  ]);
  check('hors du mode « écrire », aucun terme', () =>
    t.TIERS.map((p) => lists[p].filter((q) => q.mode !== 'write').every((q) => q.terms.length === 0)),
  );
}

function variantes(lists) {
  const reads4 = lists[4].filter((q) => q.mode === 'read');
  check('palier 2 : jamais un multiple de 10 ; paliers 3 et 4 : les dizaines rondes apparaissent', () => [
    lists[2].every((q) => q.n % 10 !== 0),
    [...lists[3], ...lists[4]].some((q) => q.n % 10 === 0),
  ]);
  check('palier 4, lire : tantôt 0 à 9 tout seuls, tantôt 10 à 19 (looseBig)', () => [
    reads4.some((q) => q.loose >= 10),
    reads4.some((q) => q.loose <= 9),
  ]);
  check('palier 5 : des piles de cent, jamais ailleurs', () => [
    lists[5].every((q) => q.piles >= 1),
    [1, 2, 3, 4].every((p) => lists[p].every((q) => q.piles === 0)),
  ]);
}

(async () => {
  await t.start();
  section('Les paniers de dix : accords (R3) et pièges (R1)');
  accords();
  pieges();
  section('Les paniers de dix : tirages');
  const lists = {};
  for (const p of t.TIERS) lists[p] = tirages(p);
  ecritures(lists);
  variantes(lists);
  await t.finish("l'Île des Squishy Dumplings (tens, la logique)");
})();
