/* ---------- « Le chemin de la plume » : les indices du compagnon (table H1 de la spec) ----------
   Niveau 1 : la méthode (suivre le chemin du doigt, ou se mettre à la place
   de la plume). Niveau 2 : le début du chemin seulement, jamais tout le
   chemin. Aucun choix n'est écarté. */
import { codingRun } from './coding-grid.js';

/** @typedef {import('./coding-grid.js').CodingGrid} CodingGrid */
/** @typedef {import('./coding-grid.js').CodingBest} CodingBest */
/** @typedef {{ grid: CodingGrid, best: CodingBest | null }} CodingHintQ la question d'indice : la grille et son plus court programme */
/** @typedef {import('../../hints/index.js').HintProvider<CodingHintQ>} CodingHintProvider */

const CODING_HINT_REL =
  'La plume avance dans le sens de sa pointe. Pour changer de direction, elle tourne sur place, à gauche ou à droite. Mets-toi à sa place !';
const CODING_HINT_START = 'Je te montre le début du chemin. Combien de cases ? Ensuite, à toi de trouver la suite !';
const CODING_HINT_TURN = " Regarde où pointe la plume : faut-il tourner avant d'avancer ?";

/**
 * Les cases du premier segment du plus court programme : la première suite
 * d'avancées dans la même direction. Un chemin d'un seul segment (palier 1)
 * ne montre que sa première case : sinon ce serait tout le chemin.
 * @param {CodingHintQ} q
 * @returns {string[]} des sélecteurs de cases
 */
function codingFirstCells(q) {
  const prog = q.best ? q.best.prog : [];
  const isTurn = (/** @type {string} */ op) => op === 'TL' || op === 'TR';
  const from = prog.findIndex((op) => !isTurn(op));
  if (from < 0) return [];
  let to = from;
  while (to + 1 < prog.length && prog[to + 1] === prog[from]) to++;
  const whole = to === prog.length - 1;
  const path = codingRun(q.grid, prog.slice(0, whole ? from + 1 : to + 1)).path;
  return path.slice(1 + from).map((s) => `.cd-cell[data-r="${s.r}"][data-c="${s.c}"]`);
}

/**
 * Les deux niveaux d'indice.
 * @type {CodingHintProvider}
 */
const codingHints = (q) => {
  const abs = q.grid.mode === 'abs';
  const first = abs
    ? `Suis le chemin avec ton doigt, case par case, de la plume jusqu'à ${q.grid.friend.name}. Une flèche, c'est une case.`
    : CODING_HINT_REL;
  const turnFirst = !abs && !!q.best && q.best.prog[0] !== 'F';
  return [
    { say: first, fx: { glow: '#cd-grid' } },
    { say: CODING_HINT_START + (turnFirst ? CODING_HINT_TURN : ''), fx: { glow: codingFirstCells(q).join(', ') } },
  ];
};

export { codingHints };
