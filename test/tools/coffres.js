// Harnais des suites de l'Île des Coffres (test/problems*.test.js,
// test/code*.test.js, test/coffres*.test.js, track monde-coffres) : la page et
// les aides de test/tools/crayons.js (lancement d'un mini-jeu à un palier,
// voix), plus les tables de la spec (T1, L1, G1, T2) recalculées ici, sans
// rien lire du jeu : le test a son propre solveur.
const t = require('./crayons.js');
const { d, ev, json } = t;

// R1 : `problemsRound(dd)`, paliers 1 à 5
const PT = ['reunion', 'ajout', 'retrait', 'partie', 'ajoutInconnu', 'compPlus', 'compEcart'];
const T1 = {
  1: {
    types: PT.slice(0, 3),
    min: 2,
    max: 6,
    ecart: 0,
    rep: 'concret',
    eqUnder: false,
    choices: 3,
    gap: 3,
    tens: false,
  },
  2: {
    types: PT.slice(0, 4),
    min: 4,
    max: 10,
    ecart: 0,
    rep: 'concret-barre',
    eqUnder: false,
    choices: 3,
    gap: 3,
    tens: false,
  },
  3: { types: PT, min: 5, max: 20, ecart: 9, rep: 'barres', eqUnder: false, choices: 4, gap: 3, tens: false },
  4: {
    types: ['retrait', 'partie', 'ajoutInconnu', 'compPlus', 'compEcart', 'compMoinsPlus', 'deuxEtapes', 'possible'],
    min: 10,
    max: 50,
    ecart: 20,
    rep: 'barres',
    eqUnder: true,
    choices: 4,
    gap: 10,
    tens: true,
  },
  5: {
    types: ['partie', 'ajoutInconnu', 'compEcart', 'compMoinsPlus', 'deuxEtapes', 'possible'],
    min: 20,
    max: 100,
    ecart: 40,
    rep: 'egalite',
    eqUnder: false,
    choices: 4,
    gap: 10,
    tens: true,
  },
};
// T2 : `codeRound(dd)`, paliers 1 à 5
const T2 = {
  1: { wheels: 2, palette: 4, types: ['est', 'absent'], maxEst: 1, maxClues: 3 },
  2: { wheels: 3, palette: 4, types: ['est', 'pas', 'absent'], maxEst: 1, maxClues: 4 },
  3: { wheels: 3, palette: 5, types: ['est', 'pas', 'absent', 'voisins'], maxEst: 1, maxClues: 4 },
  4: { wheels: 4, palette: 5, types: ['est', 'pas', 'absent', 'voisins'], maxEst: 1, maxClues: 5 },
  5: { wheels: 4, palette: 6, types: ['pas', 'absent', 'voisins', 'bout'], maxEst: 0, maxClues: 6 },
};

const all = (sel) => [...d.querySelectorAll(sel)];
const one = (sel) => d.querySelector(sel);
const hidden = (sel) => !!one(sel) && !!one(sel).closest('[hidden]');
const question = () => ev('hint.q');
const hintBtn = () => one('#modal-body .hint-btn');
const sol = () => ev('gameSolution') || [];

/* ================= « Le trésor raconté » ================= */
// L1 (propre au test) : les deux nombres, leurs cases, la case du « ? », l'opération, l'ordre Q
const PARTS_UP = (n1, n2) => ({ n1, s1: 'partie1', n2, s2: 'partie2', sq: 'tout', op: '+', order: [1, 2] });
const PART_DOWN = (n1, n2) => ({ n1, s1: 'tout', n2, s2: 'partie1', sq: 'partie2', op: '-', order: [1, 2] });
const L1 = {
  reunion: (n) => PARTS_UP(n.a, n.b),
  ajout: (n) => PARTS_UP(n.a, n.b),
  retrait: (n) => PART_DOWN(n.a, n.b),
  partie: (n) => PART_DOWN(n.t, n.a),
  ajoutInconnu: (n) => ({ n1: n.a, s1: 'partie1', n2: n.t, s2: 'tout', sq: 'partie2', op: '-', order: [2, 1] }),
  compPlus: (n) => ({ n1: n.a, s1: 'petit', n2: n.b, s2: 'ecart', sq: 'grand', op: '+', order: [1, 2] }),
  compEcart: (n) => ({ n1: n.a, s1: 'petit', n2: n.b, s2: 'grand', sq: 'ecart', op: '-', order: [2, 1] }),
  compMoinsPlus: (n) => ({ n1: n.t, s1: 'grand', n2: n.b, s2: 'ecart', sq: 'petit', op: '-', order: [1, 2] }),
};
const withR = (s) => ({ ...s, r: s.op === '+' ? s.n1 + s.n2 : Math.abs(s.n1 - s.n2) });
// les étapes de calcul d'un problème (aucune pour « possible »)
function stagesOf(n) {
  if (n.type === 'possible') return [];
  if (n.type === 'deuxEtapes') return [withR(PARTS_UP(n.a, n.b)), withR(PART_DOWN(n.a + n.b, n.c))];
  return [withR(L1[n.type](n))];
}
// A1 : le résultat recalculé depuis les nombres seuls
function resultOf(n) {
  if (n.type === 'possible') return n.b <= n.a ? 'oui' : 'non';
  const st = stagesOf(n);
  return String(st[st.length - 1].r);
}
// les nombres portés par #pb-root (A1) ; une valeur sans objet vaut 0 ici
function data() {
  const ds = one('#pb-root').dataset;
  const num = (k) => (ds[k] === '' || ds[k] === undefined ? 0 : Number(ds[k]));
  return { type: ds.type, variant: ds.variant || '', a: num('a'), b: num('b'), c: num('c'), t: num('t'), r: ds.r };
}
const CONCRETE = ['concret', 'concret-barre'];
const sign = (op) => `.pb-sign[data-v="${op}"]`;
// G1 : ce que l'enfant fait pour dessiner l'étape `e` (bloc B, conteneur C)
function drawSteps(s, rep, { C, B }) {
  if (CONCRETE.includes(rep)) {
    if (s.op === '+') return Array.from({ length: s.r }, (_, i) => `${C} .pb-scene .pb-token[data-i="${i}"]`);
    return [...Array.from({ length: s.n2 }, (_, i) => `${B} .pb-chest .pb-token[data-i="${i}"]`), `${B} .pb-done`];
  }
  if (rep === 'egalite') return s.order.map((k) => `${B} .pb-eq-num[data-k="${k}"]`).concat(`${B} ${sign(s.op)}`);
  return [
    `${B} .pb-label[data-l="n1"]`,
    `${B} .pb-slot[data-s="${s.s1}"]`,
    `${B} .pb-label[data-l="n2"]`,
    `${B} .pb-slot[data-s="${s.s2}"]`,
    `${B} .pb-label[data-l="q"]`,
    `${B} .pb-slot[data-s="${s.sq}"]`,
  ];
}
const hasSign = (rep) => rep === 'barres' || rep === 'concret-barre';
// G1 : la solution d'un problème joué dans le conteneur `box` ; `own` : l'enfant dessine lui-même
function solutionOf(n, rep, { box, own }) {
  const C = `#${box}`;
  if (n.type === 'possible') return [`${C} .pb-yesno[data-v="${resultOf(n)}"]`];
  const steps = stagesOf(n).flatMap((s, e) => {
    const B = `${C}-e${e + 1}`;
    return [
      ...(own ? drawSteps(s, rep, { C, B }) : []),
      ...(hasSign(rep) ? [`${B} ${sign(s.op)}`] : []),
      `${B} .pb-num[data-v="${s.r}"]`,
    ];
  });
  return [...steps, `${C} .pb-answer`];
}
const exSteps = (n) => (n.type === 'deuxEtapes' ? 7 : 5);
// la liste G1 attendue pour le mode `mode` (0 : exemple puis jumeau ; 'twin' : jumeau seul)
function expectedSolution(n, rep, mode) {
  if (mode === 'twin') return solutionOf(n, rep, { box: 'pb-twin', own: false });
  if (mode === 0)
    return [
      ...Array.from({ length: exSteps(n) }, (_, k) => `#pb-ex .pb-next[data-step="ex${k + 1}"]`),
      ...solutionOf(n, rep, { box: 'pb-twin', own: false }),
    ];
  return ['#pb-main .pb-next[data-step="comprendre"]', ...solutionOf(n, rep, { box: 'pb-main', own: true })];
}

// lance « problems » au palier p, en mode d'exemple n (E1 : `atLvl` compte n missions)
function startPb(p, n = 2) {
  ev(`closeModal(); party.active = false; currentProfile().age = 0;
      state.missions = 200; currentWorld = ${json(['', 'lagon', 'foret', 'montagne', 'chateau', 'jungle'][p])};
      state.skills = { problems: { wins: 0, fails: 0, errors: 0, last: null, recent: [], lvl: ${p},
        atLvl: ${json(Array.from({ length: n }, () => ({ ok: true, e: 0 })))} } };
      playGame("problems")`);
}
const PEOPLE = { p: 'grignote', q: 'kadi', obj: 'piece' };
const make = (spec) => ev('pbMake')({ ...PEOPLE, ...spec });
// ouvre un problème choisi par le test (mêmes fonctions que le jeu : pbMake, pbOpen) ;
// `spec.ex` : l'exemple résolu du mode n = 0 (par défaut les mêmes nombres, avec des clés)
function openPb(p, n, { ex, ...spec }) {
  startPb(p, n);
  ev('pbOpen')({
    n,
    row: ev(`problemsRound(${p})`),
    ex: n === 0 ? make({ ...(ex || spec), obj: 'cle' }) : null,
    cur: make(spec),
    retried: false,
  });
}
// un problème de chaque type, dans les bornes de T1 : paliers 1 à 3, palier 4, palier 5
const SAMPLES = {
  1: {
    reunion: { a: 2, b: 3 },
    ajout: { a: 3, b: 2 },
    retrait: { a: 5, b: 2 },
    partie: { t: 5, a: 2 },
    ajoutInconnu: { a: 7, t: 12 },
    compPlus: { a: 8, b: 4 },
    compEcart: { a: 6, b: 13 },
  },
  4: {
    retrait: { a: 30, b: 12 },
    partie: { t: 40, a: 15 },
    ajoutInconnu: { a: 15, t: 40 },
    compPlus: { a: 23, b: 9 },
    compEcart: { a: 17, b: 35 },
    compMoinsPlus: { t: 44, b: 6 },
    deuxEtapes: { variant: 'A', a: 20, b: 14, c: 9 },
    possible: { a: 25, b: 31 },
  },
  5: {
    partie: { t: 63, a: 18 },
    ajoutInconnu: { a: 28, t: 71 },
    compEcart: { a: 45, b: 80 },
    compMoinsPlus: { t: 90, b: 35 },
    deuxEtapes: { variant: 'B', a: 30, b: 12, c: 7 },
    possible: { a: 40, b: 22 },
  },
};
const sample = (type, p) => ({ type, ...SAMPLES[p < 4 ? 1 : p][type] });
// joue une liste de sélecteurs, d'un clic chacun, sans attendre
function play(steps) {
  for (const s of steps) {
    const el = one(s);
    if (!el) return false;
    el.click();
  }
  return true;
}
const won = () => t.waitFor(() => !!one('.win-box'), 2500);
// une erreur notée, pas de victoire, puis un AUTRE problème (ou cadenas) s'affiche
async function wrongThenNew(el, changed) {
  const errors = ev('missionErrors');
  el.click();
  const noted = ev('missionErrors') === errors + 1 && !one('.win-box');
  return noted && (await t.waitFor(changed, 1500));
}
// le tuple de nombres d'un problème (X2)
const tuple = (n) => [n.type, n.variant, n.a, n.b, n.c, n.t].join('|');

/* ================= « Le code secret » ================= */
function startCode(p) {
  t.startGame('code', p);
}
// A2 : ce que porte #code-root
function lock() {
  const ds = one('#code-root').dataset;
  return {
    wheels: Number(ds.wheels),
    palette: JSON.parse(ds.palette),
    code: JSON.parse(ds.code),
    clues: JSON.parse(ds.clues),
  };
}
// toutes les suites de `n` symboles distincts de la palette
function candidates(palette, n) {
  if (n === 0) return [[]];
  return palette.flatMap((s) =>
    candidates(
      palette.filter((x) => x !== s),
      n - 1,
    ).map((rest) => [s, ...rest]),
  );
}
// le sens de chaque indice (A2), propre au test
const TRUE = {
  est: (c, k) => c[k.w] === k.s,
  pas: (c, k) => c.includes(k.s) && c[k.w] !== k.s,
  absent: (c, k) => !c.includes(k.s),
  voisins: (c, k) => c.some((s, i) => s === k.s && c[i + 1] === k.s2),
  bout: (c, k) => c[0] === k.s || c[c.length - 1] === k.s,
};
// les codes que tous les indices laissent possibles
const solutions = (x, clues = x.clues) =>
  candidates(x.palette, x.wheels).filter((c) => clues.every((k) => TRUE[k.t](c, k)));
// G2 : la solution attendue, depuis le code
const codeSolution = (code) =>
  code.flatMap((s, w) => [`.code-wheel[data-w="${w}"]`, `.code-sym[data-s="${s}"]`]).concat('#code-open');

module.exports = {
  ...t,
  T1,
  T2,
  all,
  one,
  hidden,
  question,
  hintBtn,
  sol,
  stagesOf,
  resultOf,
  data,
  expectedSolution,
  solutionOf,
  exSteps,
  startPb,
  make,
  openPb,
  sample,
  play,
  won,
  wrongThenNew,
  tuple,
  startCode,
  lock,
  candidates,
  TRUE,
  solutions,
  codeSolution,
};
