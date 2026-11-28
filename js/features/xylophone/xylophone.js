/* ---------- Le xylophone (Île du Grand Concert, saison 3) ----------
   Huit lames, du do grave au do aigu (gamme de do majeur) : l'instrument que
   partagent « Do, ré, mi », « La mélodie », le grand final et le xylophone
   d'or. Trois repères pour chaque note, jamais la couleur seule : le nom
   écrit sur la lame, sa longueur (la plus grave est la plus longue, à gauche)
   et sa couleur (celles des tubes sonores des classes).
   La table des notes vit ici, pas dans la palette des bruitages
   (js/shared/ui/sound.js), qui est pentatonique exprès : sans fa ni si.
   La portée (`staffSVG`) : des têtes de note pleines, sans hampe ni clé de
   sol (les jeux n'ont pas de rythme écrit, et le caractère de la clé manque
   dans beaucoup de polices). Tout ce que lisent les tests est en attribut ou
   en style en ligne : jsdom ne calcule pas les feuilles de style. */
import { playNote } from '../../shared/ui/index.js';

/** @typedef {{ n: number, name: string, hz: number, color: string, edge: string }} XyloNote une lame */
/** @typedef {{ lames: number[], gold?: boolean, names?: boolean, id?: string }} XyloOptions */
/** @typedef {{ lines: 3 | 5, colors: boolean, id?: string, cls?: string }} StaffOptions */

// tempérament égal, la4 = 440 Hz (même formule que « Grave ou aigu ? »), arrondi au centième
/** @type {XyloNote[]} */
const XYLO_NOTES = [
  { n: 0, name: 'do', hz: 261.63, color: '#F0544F', edge: '#A8322E' },
  { n: 1, name: 'ré', hz: 293.66, color: '#FF9A3C', edge: '#C2661A' },
  { n: 2, name: 'mi', hz: 329.63, color: '#FFD93D', edge: '#B8901A' },
  { n: 3, name: 'fa', hz: 349.23, color: '#5CC96B', edge: '#2F9551' },
  { n: 4, name: 'sol', hz: 392.0, color: '#3FC1C9', edge: '#1F8A91' },
  { n: 5, name: 'la', hz: 440.0, color: '#4A7BEA', edge: '#2A4FA8' },
  { n: 6, name: 'si', hz: 493.88, color: '#A66FE0', edge: '#6E3FB0' },
  { n: 7, name: 'do', hz: 523.25, color: '#F0544F', edge: '#A8322E' },
];
const XYLO_INK = '#2B2F6B'; // une note sans couleur, et les lignes de la portée
const XYLO_LIT_MS = 200;

// la plus grave fait 170 px, la plus aiguë 110 px
const xyloHeight = (/** @type {number} */ n) => Math.round((170 - (n * 60) / 7) * 100) / 100;

/**
 * Une lame : sa hauteur et sa couleur en style en ligne. Dorée, elle garde un
 * petit rond de la couleur de sa note au-dessus du nom.
 * @param {XyloNote} x
 * @param {XyloOptions} opts
 * @returns {string}
 */
function xyloBar(x, opts) {
  const look = opts.gold ? '' : `;background:${x.color};border-color:${x.edge}`;
  const dot = opts.gold ? `<i class="xylo-dot" style="background:${x.color}"></i>` : '';
  const name = opts.names === false ? '' : `<b class="xylo-name">${x.name}</b>`;
  return `<button class="xylo-lame" data-n="${x.n}" aria-label="Lame ${x.name}" style="height:${xyloHeight(x.n)}px${look}">${dot}${name}</button>`;
}

/**
 * Un xylophone : les lames demandées, toujours du grave (à gauche) à l'aigu.
 * @param {XyloOptions} opts
 * @returns {string}
 */
function xyloHTML(opts) {
  const bars = opts.lames
    .slice()
    .sort((a, b) => a - b)
    .map((n) => xyloBar(XYLO_NOTES[n], opts))
    .join('');
  return `<div class="xylo${opts.gold ? ' xylo-gold' : ''}"${opts.id ? ` id="${opts.id}"` : ''}>${bars}</div>`;
}

/**
 * Joue la note d'une lame ; la lame donnée s'allume un instant, même le son coupé.
 * @param {number} n
 * @param {Element | null} [el]
 * @returns {void}
 */
function playXylo(n, el) {
  playNote(XYLO_NOTES[n].hz, 0.5, 0.2);
  if (!el) return;
  el.classList.add('lit');
  setTimeout(() => el.classList.remove('lit'), XYLO_LIT_MS);
}

/**
 * Une portée et ses notes, de gauche à droite. Une note `n` est à
 * `cy = 104 - 8 n` : le do grave sous la portée, sur son petit trait.
 * @param {number[]} notes
 * @param {StaffOptions} opts
 * @returns {string}
 */
function staffSVG(notes, opts) {
  const W = 24 + 28 * notes.length;
  const stroke = `stroke="${XYLO_INK}" stroke-width="2" stroke-linecap="round"`;
  const lines = [88, 72, 56, 40, 24]
    .slice(0, opts.lines)
    .map((y) => `<line class="staff-line" x1="4" y1="${y}" x2="${W - 4}" y2="${y}" ${stroke}/>`)
    .join('');
  const heads = notes
    .map((n, k) => {
      const x = 20 + 28 * k,
        cy = 104 - 8 * n;
      const ledger =
        n === 0 ? `<line class="ledger-line" x1="${x - 12}" y1="104" x2="${x + 12}" y2="104" ${stroke}/>` : '';
      const fill = opts.colors ? XYLO_NOTES[n].color : XYLO_INK;
      return `${ledger}<ellipse class="note-head" data-n="${n}" cx="${x}" cy="${cy}" rx="8.5" ry="6.5" fill="${fill}" stroke="${XYLO_INK}" stroke-width="1.5" transform="rotate(-20 ${x} ${cy})"/>`;
    })
    .join('');
  return `<svg class="staff${opts.cls ? ` ${opts.cls}` : ''}"${opts.id ? ` id="${opts.id}"` : ''} viewBox="0 0 ${W} 120" aria-hidden="true">${lines}${heads}</svg>`;
}

export { playXylo, staffSVG, XYLO_NOTES, xyloHTML };
