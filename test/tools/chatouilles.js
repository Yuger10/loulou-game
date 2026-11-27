// Harnais des suites du Monde des Chatouilles (test/chatouilles*.test.js,
// track monde-chatouilles) : la page et les aides de test/tools/crayons.js
// (lancement d'un mini-jeu à un palier, voix), plus les tables de la spec
// (T1, T2, T3) et un solveur de grilles propre au test (règles G1 à G4),
// qui ne lit rien du jeu.
const t = require('./crayons.js');
const { d, ev, json } = t;

/* ================= « Le chemin de la plume » ================= */
// T1 : `codingRound(dd)`, paliers 1 à 5
const T1 = {
  1: { size: 4, mode: 'abs', len: [2, 3], turns: [0, 0], rocks: 0, slots: 6, startUp: false },
  2: { size: 4, mode: 'rel', len: [3, 6], turns: [1, 1], rocks: 1, slots: 10, startUp: true },
  3: { size: 5, mode: 'rel', len: [5, 10], turns: [2, 2], rocks: 2, slots: 10, startUp: false },
  4: { size: 5, mode: 'rel', len: [6, 12], turns: [2, 3], rocks: 3, slots: 12, startUp: false },
  5: { size: 6, mode: 'rel', len: [9, 15], turns: [3, 4], rocks: 5, slots: 15, startUp: false },
};
// T2 : les grilles de secours, avec la longueur et les virages de leur plus court programme
const T2 = {
  1: { start: [3, 0], dir: 1, goal: [3, 3], rocks: [], len: 3, turns: 0 },
  2: { start: [3, 0], dir: 0, goal: [1, 2], rocks: [[3, 1]], len: 5, turns: 1 },
  3: {
    start: [4, 0],
    dir: 1,
    goal: [0, 4],
    rocks: [
      [4, 2],
      [2, 4],
    ],
    len: 10,
    turns: 2,
  },
  4: {
    start: [4, 0],
    dir: 1,
    goal: [0, 4],
    rocks: [
      [4, 2],
      [2, 4],
      [1, 1],
    ],
    len: 10,
    turns: 2,
  },
  5: {
    start: [5, 0],
    dir: 0,
    goal: [0, 5],
    rocks: [
      [1, 5],
      [5, 2],
      [4, 4],
      [3, 4],
      [0, 2],
    ],
    len: 13,
    turns: 3,
  },
};
const FRIENDS = [
  { e: '🦚', name: 'Plumette' },
  { e: '🐧', name: 'Guili' },
  { e: '🦦', name: 'Lulu' },
];
// la grille de secours du palier p, au format G0
const fallbackGrid = (p, friend = FRIENDS[1]) => ({
  size: T1[p].size,
  mode: T1[p].mode,
  start: T2[p].start,
  dir: T2[p].dir,
  goal: T2[p].goal,
  rocks: T2[p].rocks,
  friend,
});

// G1 : 0 haut, 1 droite, 2 bas, 3 gauche
const STEP = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];
const ABS = { U: 0, R: 1, D: 2, L: 3 };
const at = (cells, r, c) => cells.some((x) => x[0] === r && x[1] === c);
const inside = (g, r, c) => r >= 0 && c >= 0 && r < g.size && c < g.size;
// où mène une instruction depuis l'état s (G2, G3) : le nouvel état, sans regarder les obstacles
function move(s, op) {
  if (op === 'TL') return { r: s.r, c: s.c, dir: (s.dir + 3) % 4 };
  if (op === 'TR') return { r: s.r, c: s.c, dir: (s.dir + 1) % 4 };
  const dir = op === 'F' ? s.dir : ABS[op];
  return { r: s.r + STEP[dir][0], c: s.c + STEP[dir][1], dir };
}
// G7, propre au test : joue un programme et dit comment il finit
function run(g, prog) {
  let s = { r: g.start[0], c: g.start[1], dir: g.dir };
  for (let i = 0; i < prog.length; i++) {
    const n = move(s, prog[i]);
    if (!inside(g, n.r, n.c)) return { end: 'edge', at: i, last: s };
    if (at(g.rocks, n.r, n.c)) return { end: 'rock', at: i, last: s };
    s = n;
    if (s.r === g.goal[0] && s.c === g.goal[1]) return { end: 'goal', at: i, last: s };
  }
  return { end: prog.length ? 'stop' : 'empty', at: -1, last: s };
}
// G2, G3 : les virages d'un programme
function turnsOf(mode, prog) {
  if (mode === 'rel') return prog.filter((op) => op !== 'F').length;
  return prog.filter((op, i) => i > 0 && op !== prog[i - 1]).length;
}
// G4, propre au test : le plus court programme (le moins d'instructions, puis le moins de
// virages), par recherche du moindre coût sur les états (case, direction ou dernière flèche)
function shortest(g) {
  const ops = g.mode === 'rel' ? ['F', 'TL', 'TR'] : ['U', 'R', 'D', 'L'];
  const key = (s) => `${s.r},${s.c},${s.dir}`;
  const first = { r: g.start[0], c: g.start[1], dir: g.mode === 'rel' ? g.dir : 4 };
  const cost = { [key(first)]: 0 };
  const open = [first];
  let bestCost = Infinity;
  while (open.length) {
    open.sort((a, b) => cost[key(a)] - cost[key(b)]);
    const s = open.shift();
    for (const op of ops) {
      const n = move(s, op);
      if (!inside(g, n.r, n.c) || at(g.rocks, n.r, n.c)) continue;
      const turn = g.mode === 'rel' ? op !== 'F' : s.dir !== 4 && s.dir !== n.dir;
      const c = cost[key(s)] + 1000 + (turn ? 1 : 0);
      if (n.r === g.goal[0] && n.c === g.goal[1]) bestCost = Math.min(bestCost, c);
      else if (cost[key(n)] === undefined || c < cost[key(n)]) {
        cost[key(n)] = c;
        open.push(n);
      }
    }
  }
  return bestCost === Infinity ? null : { len: Math.floor(bestCost / 1000), turns: bestCost % 1000 };
}
// un générateur à graine (mulberry32) : rejouable par TEST_SEED
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const SEED = Number(process.env.TEST_SEED) || 20261122;

const all = (sel) => [...d.querySelectorAll(sel)];
const one = (sel) => d.querySelector(sel);
const sol = () => ev('gameSolution') || [];
const hintBtn = () => one('#modal-body .hint-btn');
const won = () => t.waitFor(() => !!one('.win-box'), 2500);
const lives = () => all('#lives-bar .life.on').length;
// le dernier texte dit (un seul `speak` par phrase : la spec compare à toSpoken du tout)
const lastSaid = () => t.spoken[t.spoken.length - 1];
const saidLast = (text) => lastSaid() === t.toSpoken(text);
// joue une liste de sélecteurs, d'un clic chacun, sans attendre
function play(steps) {
  for (const s of steps) {
    const el = one(s);
    if (!el) return false;
    el.click();
  }
  return true;
}

// ouvre « coding » au palier p sur une grille choisie par le test (même fonction que le jeu)
function openCoding(p, grid) {
  t.startGame('coding', p);
  ev('forgetSpokenHint()'); // la consigne de la grille du test est dite, même si l'ami est le même
  ev('codingShow')({ cfg: T1[p], grid, best: ev('codingBest')(grid), tries: 1, fallback: false });
}
// la grille lue dans la page (contrat DOM de la spec)
function gridOnScreen() {
  const el = one('#cd-grid');
  const cells = (cls) => all(`.cd-cell.${cls}`).map((x) => [Number(x.dataset.r), Number(x.dataset.c)]);
  return {
    size: Number(el.dataset.size),
    mode: el.dataset.mode,
    dir: Number(el.dataset.dir),
    start: cells('start')[0],
    goal: cells('goal')[0],
    rocks: cells('rock'),
  };
}
const feather = () => {
  const f = one('#cd-feather');
  return { r: Number(f.dataset.r), c: Number(f.dataset.c), dir: Number(f.dataset.dir) };
};
const op = (o) => one(`#cd-pal .cd-op[data-op="${o}"]`);
const steps = () => all('#cd-prog .cd-step').map((x) => x.dataset.op);
const tapOps = (ops) => ops.forEach((o) => op(o).click());
// le trajet est fini quand la palette redevient active, ou que la mission est gagnée
const idle = () => t.waitFor(() => !!one('.win-box') || (!!one('#cd-go') && !one('#cd-go').disabled), 2500);
const solutionOf = (prog) => prog.map((o) => `#cd-pal .cd-op[data-op="${o}"]`).concat('#cd-go');

/* ================= « La phrase rigolote » ================= */
// T3 : `sentenceRound(dd)`
const T3 = {
  1: { n: 3, pic: true },
  2: { n: 4, pic: true },
  3: { n: 5, pic: false },
  4: { n: 6, pic: false },
  5: { n: 7, pic: false },
};
const tile = (i) => one(`.st-tile[data-i="${i}"]`);
// les mots posés dans la ligne, dans l'ordre des cases
const lineWords = () => all('#st-line .st-slot .st-tile').map((x) => x.textContent);
const reserveWords = () => all('#st-reserve .st-tile').map((x) => x.textContent);
// ouvre « sentence » au palier p sur une phrase choisie par le test (même fonction que le jeu)
function openSentence(p, entry) {
  t.startGame('sentence', p);
  ev('sentenceShow')(entry);
}

module.exports = {
  ...t,
  T1,
  T2,
  T3,
  FRIENDS,
  fallbackGrid,
  run,
  turnsOf,
  shortest,
  seeded,
  SEED,
  all,
  one,
  sol,
  hintBtn,
  won,
  lives,
  lastSaid,
  saidLast,
  play,
  openCoding,
  gridOnScreen,
  feather,
  op,
  steps,
  tapOps,
  idle,
  solutionOf,
  tile,
  lineWords,
  reserveWords,
  openSentence,
  json,
};
