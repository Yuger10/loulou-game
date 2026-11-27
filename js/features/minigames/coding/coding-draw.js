/* ---------- « Le chemin de la plume » : le dessin (contrat DOM de la spec) ----------
   La grille (#cd-grid, ses cases .cd-cell), la plume (#cd-feather), la
   palette (#cd-pal, boutons .cd-op) et le programme (#cd-prog : une case
   .cd-slot par instruction possible, un bouton .cd-step par instruction posée). */
import { CODING_OPS } from './coding-grid.js';

/** @typedef {import('./coding-grid.js').CodingGrid} CodingGrid */
/** @typedef {import('./coding-grid.js').CodingBuild} CodingBuild */

/** @type {Record<string, { label: string, say: string }>} chaque instruction : son dessin et le mot dit */
const CODING_WORDS = {
  U: { label: '⬆️', say: 'en haut' },
  R: { label: '➡️', say: 'à droite' },
  D: { label: '⬇️', say: 'en bas' },
  L: { label: '⬅️', say: 'à gauche' },
  F: { label: '⬆️', say: 'avance' },
  TL: { label: '↰', say: 'tourne à gauche' },
  TR: { label: '↱', say: 'tourne à droite' },
};

// la plume, pointe vers le haut : la page la tourne (transform: rotate)
const CODING_FEATHER = `<svg viewBox="0 0 40 40" aria-hidden="true">
  <path d="M20 3 C29 10 30 22 22 30 L20 32 L18 30 C10 22 11 10 20 3 Z" fill="#FF8FB8" stroke="#C2457A" stroke-width="2" stroke-linejoin="round"/>
  <path d="M20 9 V38" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M20 16 L14 13 M20 22 L13 20 M20 16 L26 13 M20 22 L27 20" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

/**
 * Le contenu d'une case : l'ami, un cactus, ou rien.
 * @param {CodingGrid} grid
 * @param {number} r
 * @param {number} c
 */
function codingCellHTML(grid, r, c) {
  const is = (/** @type {number[]} */ cell) => cell[0] === r && cell[1] === c;
  const goal = is(grid.goal);
  const rock = grid.rocks.some(is);
  const cls = `${is(grid.start) ? ' start' : ''}${goal ? ' goal' : ''}${rock ? ' rock' : ''}`;
  const inside = goal ? `<span class="cd-friend">${grid.friend.e}</span>` : rock ? '🌵' : '';
  return `<span class="cd-cell${cls}" data-r="${r}" data-c="${c}">${inside}</span>`;
}
/** @param {CodingGrid} grid la grille et la plume posée sur sa case de départ */
function codingGridHTML(grid) {
  const n = grid.size;
  const cells = Array.from({ length: n * n }, (_, k) => codingCellHTML(grid, Math.floor(k / n), k % n)).join('');
  return `<div class="cd-wrap">
    <div class="cd-grid" id="cd-grid" data-size="${n}" data-mode="${grid.mode}" data-dir="${grid.dir}" style="--n:${n}">
      ${cells}
      <span class="cd-feather cd-instant" id="cd-feather">${CODING_FEATHER}</span>
    </div>
  </div>`;
}
/** @param {CodingGrid} grid la palette : les flèches du mode, chacune avec son mot */
function codingPaletteHTML(grid) {
  const ops = CODING_OPS[grid.mode]
    .map((op) => {
      const w = CODING_WORDS[op];
      return `<button class="cd-op" data-op="${op}" aria-label="${w.say}">${w.label}</button>`;
    })
    .join('');
  return `<div class="cd-pal" id="cd-pal">${ops}</div>`;
}
/**
 * Le programme : `slots` cases, les premières portent les instructions posées.
 * @param {string[]} prog
 * @param {number} slots
 */
function codingProgHTML(prog, slots) {
  return Array.from({ length: slots }, (_, i) => {
    const op = prog[i];
    if (!op) return '<span class="cd-slot"></span>';
    const w = CODING_WORDS[op];
    return `<span class="cd-slot"><button class="cd-step" data-i="${i}" data-op="${op}" aria-label="Enlever : ${w.say}">${w.label}</button></span>`;
  }).join('');
}
/** @param {CodingBuild} round tout l'écran sous l'en-tête */
function codingStageHTML(round) {
  return `${codingGridHTML(round.grid)}
    <div class="cd-prog" id="cd-prog" aria-label="Ton programme">${codingProgHTML([], round.cfg.slots)}</div>
    ${codingPaletteHTML(round.grid)}
    <button class="btn-primary cd-go" id="cd-go">▶️ Go</button>`;
}

export { CODING_WORDS, codingProgHTML, codingStageHTML };
