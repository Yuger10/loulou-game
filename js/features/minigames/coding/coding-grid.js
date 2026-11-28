/* ---------- « Le chemin de la plume » : les grilles (règles G0 à G7 de la spec) ----------
   Tout est pur, sans page : la forme d'une grille, le trajet d'un programme
   (`codingRun`), le plus court programme (`codingBest`) et la fabrique
   (`codingBuildRound`). Lignes de 0 (en haut) à size - 1, colonnes de 0 (à
   gauche). Directions : 0 haut, 1 droite, 2 bas, 3 gauche.
   Mode `abs` : U, R, D, L tournent la plume puis avancent d'une case.
   Mode `rel` : F avance, TL et TR tournent d'un quart de tour sur place. */
import { codingRound } from '../../../entities/difficulty/index.js';
import { random } from '../../../shared/lib/index.js';

/** @typedef {import('../../../entities/difficulty/index.js').CodingRound} CodingRound */
/** @typedef {[number, number]} CodingCell une case : ligne, colonne */
/** @typedef {{ e: string, name: string }} CodingFriend l'ami à chatouiller */
/**
 * G0 : une grille.
 * @typedef {{ size: number, mode: 'abs' | 'rel', start: CodingCell, dir: number, goal: CodingCell,
 *   rocks: CodingCell[], friend: CodingFriend }} CodingGrid
 */
/** @typedef {{ r: number, c: number, dir: number }} CodingState où est la plume, et vers où elle pointe */
/** @typedef {{ len: number, turns: number, prog: string[] }} CodingBest */
/** @typedef {{ path: CodingState[], end: 'goal' | 'rock' | 'edge' | 'stop' | 'empty', at: number }} CodingRunResult */
/** @typedef {{ cfg: CodingRound, grid: CodingGrid, best: CodingBest | null, tries: number, fallback: boolean }} CodingBuild */

const CODING_MAX_TRIES = 500;
// Pic n'est jamais la cible : il n'aime pas toujours les chatouilles
/** @type {CodingFriend[]} */
const CODING_FRIENDS = [
  { e: '🦚', name: 'Plumette' },
  { e: '🐧', name: 'Guili' },
  { e: '🦦', name: 'Lulu' },
];
// T2 : les grilles de secours, si 500 essais n'ont rien donné (jamais vu sur 2 000 grilles par palier)
/** @type {Record<number, Pick<CodingGrid, 'start' | 'dir' | 'goal' | 'rocks'>>} */
const CODING_FALLBACK = {
  1: { start: [3, 0], dir: 1, goal: [3, 3], rocks: [] },
  2: { start: [3, 0], dir: 0, goal: [1, 2], rocks: [[3, 1]] },
  3: {
    start: [4, 0],
    dir: 1,
    goal: [0, 4],
    rocks: [
      [4, 2],
      [2, 4],
    ],
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
  },
};
const CODING_STEPS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];
/** @type {Record<string, number>} la direction de chaque flèche absolue */
const CODING_ABS = { U: 0, R: 1, D: 2, L: 3 };
const CODING_OPS = { abs: ['U', 'R', 'D', 'L'], rel: ['F', 'TL', 'TR'] };

/**
 * L'état après une instruction, sans regarder les obstacles (G2, G3).
 * @param {CodingState} s
 * @param {string} op
 * @returns {CodingState}
 */
function codingMove(s, op) {
  if (op === 'TL') return { r: s.r, c: s.c, dir: (s.dir + 3) % 4 };
  if (op === 'TR') return { r: s.r, c: s.c, dir: (s.dir + 1) % 4 };
  const dir = op === 'F' ? s.dir : CODING_ABS[op];
  return { r: s.r + CODING_STEPS[dir][0], c: s.c + CODING_STEPS[dir][1], dir };
}
/**
 * Ce qu'il y a sur une case : le bord, un cactus, l'ami, ou rien.
 * @param {Omit<CodingGrid, 'friend'>} grid
 * @param {CodingState} s
 * @returns {'edge' | 'rock' | 'goal' | ''}
 */
function codingAt(grid, s) {
  if (s.r < 0 || s.c < 0 || s.r >= grid.size || s.c >= grid.size) return 'edge';
  if (grid.rocks.some(([r, c]) => r === s.r && c === s.c)) return 'rock';
  return grid.goal[0] === s.r && grid.goal[1] === s.c ? 'goal' : '';
}

/**
 * G7 : joue un programme. `path` : le départ, puis un état par instruction
 * jouée sans heurt ; `at` : l'instruction qui arrive chez l'ami ou qui heurte.
 * @param {Omit<CodingGrid, 'friend'>} grid
 * @param {string[]} prog
 * @returns {CodingRunResult}
 */
function codingRun(grid, prog) {
  /** @type {CodingState[]} */
  const path = [{ r: grid.start[0], c: grid.start[1], dir: grid.dir }];
  for (let i = 0; i < prog.length; i++) {
    const next = codingMove(path[path.length - 1], prog[i]);
    const what = codingAt(grid, next);
    if (what === 'edge' || what === 'rock') return { path, end: what, at: i };
    path.push(next);
    if (what === 'goal') return { path, end: 'goal', at: i };
  }
  return { path, end: prog.length ? 'stop' : 'empty', at: -1 };
}

/**
 * Un état de la recherche : la plume, le coût (1000 par instruction, 1 par
 * virage) et le programme qui y mène. En mode `abs`, `dir` 4 = aucune flèche encore.
 * @typedef {{ s: CodingState, cost: number, prog: string[] }} CodingNode
 */
/**
 * Les suites d'un état : une par instruction qui ne heurte rien.
 * @param {Omit<CodingGrid, 'friend'>} grid
 * @param {CodingNode} cur
 * @returns {Array<CodingNode & { goal: boolean }>}
 */
function codingNext(grid, cur) {
  const rel = grid.mode === 'rel';
  return CODING_OPS[grid.mode].flatMap((op) => {
    const s = codingMove(cur.s, op);
    const what = codingAt(grid, s);
    if (what === 'edge' || what === 'rock') return [];
    const turn = rel ? op !== 'F' : cur.s.dir !== 4 && cur.s.dir !== s.dir;
    return [{ s, cost: cur.cost + 1000 + (turn ? 1 : 0), prog: [...cur.prog, op], goal: what === 'goal' }];
  });
}
/**
 * G4 : le plus court programme (le moins d'instructions, puis le moins de
 * virages), par recherche du moindre coût ; `null` si l'ami est inatteignable.
 * @param {Omit<CodingGrid, 'friend'>} grid
 * @returns {CodingBest | null}
 */
function codingBest(grid) {
  const key = (/** @type {CodingState} */ s) => `${s.r},${s.c},${s.dir}`;
  /** @type {CodingNode[]} */
  const open = [
    { s: { r: grid.start[0], c: grid.start[1], dir: grid.mode === 'rel' ? grid.dir : 4 }, cost: 0, prog: [] },
  ];
  /** @type {Record<string, number>} */
  const seen = { [key(open[0].s)]: 0 };
  /** @type {CodingNode | null} */
  let best = null;
  while (open.length) {
    open.sort((a, b) => a.cost - b.cost);
    const cur = /** @type {CodingNode} */ (open.shift());
    if (best && cur.cost >= best.cost) break;
    for (const node of codingNext(grid, cur)) {
      if (node.goal) best = !best || node.cost < best.cost ? node : best;
      else if (seen[key(node.s)] === undefined || node.cost < seen[key(node.s)]) {
        seen[key(node.s)] = node.cost;
        open.push(node);
      }
    }
  }
  return best && { len: best.prog.length, turns: best.cost % 1000, prog: best.prog };
}

/**
 * Un essai de grille : toutes les cases mélangées (Fisher-Yates, tiré par
 * `rng`) ; la 1ʳᵉ est la plume, la 2ᵉ l'ami, les suivantes les cactus.
 * @param {CodingRound} cfg
 * @param {() => number} rng
 * @returns {Omit<CodingGrid, 'friend'>}
 */
function codingDraw(cfg, rng) {
  /** @type {CodingCell[]} */
  const cells = [];
  for (let r = 0; r < cfg.size; r++) for (let c = 0; c < cfg.size; c++) cells.push([r, c]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  // T1 : flèches absolues, la plume pointe à droite ; palier 2, vers le haut ; ensuite au hasard
  const dir = cfg.mode === 'abs' ? 1 : cfg.startUp ? 0 : Math.floor(rng() * 4);
  return { size: cfg.size, mode: cfg.mode, start: cells[0], dir, goal: cells[1], rocks: cells.slice(2, 2 + cfg.rocks) };
}
/**
 * G5 : la grille est-elle gardée ? Son plus court programme est dans T1, et
 * un cactus au moins est dans le rectangle qui va de la plume à l'ami.
 * @param {CodingRound} cfg
 * @param {Omit<CodingGrid, 'friend'>} grid
 * @param {CodingBest | null} best
 */
function codingKeeps(cfg, grid, best) {
  if (!best || best.len < cfg.len[0] || best.len > cfg.len[1]) return false;
  if (best.turns < cfg.turns[0] || best.turns > cfg.turns[1]) return false;
  /** @type {(v: number, ends: number[]) => boolean} */
  const between = (v, ends) => v >= Math.min(...ends) && v <= Math.max(...ends);
  return (
    !cfg.rocks ||
    grid.rocks.some(([r, c]) => between(r, [grid.start[0], grid.goal[0]]) && between(c, [grid.start[1], grid.goal[1]]))
  );
}
/**
 * G5 : fabrique une grille du palier `dd`. Au plus 500 essais, sinon la
 * grille de secours (T2). L'ami est tiré après la grille.
 * @param {number} dd
 * @param {() => number} [rng] des valeurs dans [0, 1)
 * @returns {CodingBuild}
 */
function codingBuildRound(dd, rng = random) {
  const cfg = codingRound(dd);
  const tier = Math.max(1, Math.min(5, Number(dd) || 1));
  /** @type {Omit<CodingGrid, 'friend'>} */
  let grid = { size: cfg.size, mode: cfg.mode, ...CODING_FALLBACK[tier] };
  let tries = 0;
  let fallback = true;
  while (fallback && tries < CODING_MAX_TRIES) {
    tries++;
    const g = codingDraw(cfg, rng);
    if (codingKeeps(cfg, g, codingBest(g))) {
      grid = g;
      fallback = false;
    }
  }
  const full = { ...grid, friend: CODING_FRIENDS[Math.floor(rng() * CODING_FRIENDS.length)] };
  return { cfg, grid: full, best: codingBest(full), tries, fallback };
}

export { CODING_FRIENDS, CODING_OPS, codingBest, codingBuildRound, codingRun };
