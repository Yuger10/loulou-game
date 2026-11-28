/* ---------- « Trace avec ton doigt » : le dessin de l'écran ----------
   Le HTML du jeu (js/features/minigames/trace/trace.js) : la consigne,
   l'en-tête, la bande des glyphes et le grand carré à tracer. Aucun état ici :
   tout se dessine à partir de la mission passée en paramètre. */
import { TRACE_GLYPHS } from './trace-glyphs.js';
import { traceLength, traceStrokePoints } from './trace-judge.js';

/** @typedef {import('./trace-glyphs.js').TraceGlyph} TraceGlyph */
/** @typedef {import('./trace-glyphs.js').TracePoint} TracePoint */
/** @typedef {import('./trace-glyphs.js').TraceRules} TraceRules */
/** @typedef {{ rules: TraceRules, glyphs: string[], g: number, s: number, done: boolean }} TraceView ce que le dessin lit de la mission */

// la couleur du crayon, glyphe par glyphe
const TRACE_COLORS = ['#E8344E', '#3C8FC0', '#2F9551', '#7B5CC0', '#E07A1F'];
const TRACE_ARROW_EVERY = 22; // un chevron tous les 22 unités du trait

/** @param {number} v un nombre du carré, au dixième */
const traceNum = (v) => String(Math.round(v * 10) / 10);
/** @param {TracePoint[]} pts l'attribut `points` d'une ligne brisée */
const tracePointsAttr = (pts) => pts.map((p) => `${traceNum(p[0])},${traceNum(p[1])}`).join(' ');

/**
 * La consigne d'un glyphe, faite de morceaux fixes (voix préenregistrée).
 * @param {TraceGlyph} glyph
 * @param {boolean} arrows false au palier sans flèches
 */
function traceSay(glyph, arrows) {
  const what =
    glyph.kind === 'chiffre'
      ? `Trace le chiffre ${glyph.say}.`
      : glyph.kind === 'capitale'
        ? `Trace la lettre ${glyph.say}, comme dans ${glyph.word}.`
        : `Trace la lettre ${glyph.say} en attaché, comme dans ${glyph.word}.`;
  return `${what} Pars du point vert ${arrows ? 'et suis les flèches !' : 'et suis le chemin gris !'}`;
}

// L'en-tête : le glyphe en grand, puis son mot et son emoji, ou autant de
// petits points que le chiffre (rien pour le 0).
/** @param {TraceGlyph} glyph */
function traceHeadHTML(glyph) {
  const more =
    glyph.kind === 'chiffre'
      ? `<span class="tr-count" aria-hidden="true">${'<i></i>'.repeat(Number(glyph.id))}</span>`
      : `<span class="tr-word">${glyph.word} ${glyph.emoji}</span>`;
  return `<span class="tr-big">${glyph.id}</span>${more}`;
}

// Un glyphe de la bande : petit dessin du modèle. Chaque trait porte ses
// points (`data-pts`) : c'est un élément de la solution, joué en traçant.
/**
 * @param {TraceGlyph} glyph
 * @param {number} g son rang dans la mission
 */
function traceMiniHTML(glyph, g) {
  const strokes = glyph.strokes
    .map((stroke, s) => {
      const pts = traceStrokePoints(stroke);
      const data = `class="tr-ms" data-g="${g}" data-s="${s}" data-pad="tr-pad" data-pts="${JSON.stringify(pts.map((p) => [Number(traceNum(p[0])), Number(traceNum(p[1]))]))}"`;
      return stroke.kind === 'dot'
        ? `<circle ${data} cx="${traceNum(pts[0][0])}" cy="${traceNum(pts[0][1])}" r="5"/>`
        : `<polyline ${data} points="${tracePointsAttr(pts)}"/>`;
    })
    .join('');
  return `<span class="tr-mini${g === 0 ? ' current' : ''}" data-g="${g}" style="--tr-color:${TRACE_COLORS[g % TRACE_COLORS.length]}"><svg viewBox="0 0 100 100" aria-hidden="true">${strokes}</svg></span>`;
}

// Les chevrons du trait courant : un tous les 22 unités, tournés dans le sens du tracé.
/**
 * @param {TracePoint[]} pts les points du modèle
 * @param {number} s le rang du trait
 */
function traceArrowsHTML(pts, s) {
  const len = traceLength(pts);
  /** @type {number[]} */
  const spots = [];
  for (let at = TRACE_ARROW_EVERY / 2; at < len - 4; at += TRACE_ARROW_EVERY) spots.push(at);
  if (!spots.length) spots.push(len / 2);
  let out = '',
    walked = 0,
    next = 0;
  for (let i = 1; i < pts.length && next < spots.length; i++) {
    walked += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (walked < spots[next]) continue;
    next++;
    const [x, y] = pts[i];
    const a = pts[i - 1],
      b = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const ux = (b[0] - a[0]) / d,
      uy = (b[1] - a[1]) / d;
    // la pointe en avant, deux ailes en arrière de part et d'autre
    const wing = (/** @type {number} */ side) =>
      `${traceNum(x - 2.5 * ux - 3 * side * uy)} ${traceNum(y - 2.5 * uy + 3 * side * ux)}`;
    out += `<path class="tr-arrow" data-s="${s}" d="M${wing(1)} L${traceNum(x + 2.5 * ux)} ${traceNum(y + 2.5 * uy)} L${wing(-1)}"/>`;
  }
  return out;
}

// Le grand carré : lignes d'écriture, modèle gris (traits réussis à la couleur
// du crayon), point vert et flèches du trait courant, encre sous le doigt.
/** @param {TraceView} game */
function tracePadHTML(game) {
  const glyph = TRACE_GLYPHS[game.glyphs[game.g]];
  const line = (/** @type {number} */ y, dash = false) =>
    `<line class="tr-line${dash ? ' dash' : ''}" x1="4" x2="96" y1="${y}" y2="${y}"/>`;
  // lettres attachées : hauteur des petites lettres et ligne de base, le haut en tirets
  const lines = glyph.kind === 'attachée' ? line(15, true) + line(52) + line(85) : line(15) + line(85);
  const models = glyph.strokes
    .map((stroke, s) => {
      const state = game.done || s < game.s ? ' done' : s === game.s ? ' current' : '';
      const pts = traceStrokePoints(stroke);
      return stroke.kind === 'dot'
        ? `<circle class="tr-model${state}" data-s="${s}" cx="${traceNum(pts[0][0])}" cy="${traceNum(pts[0][1])}" r="3"/>`
        : `<polyline class="tr-model${state}" data-s="${s}" points="${tracePointsAttr(pts)}"/>`;
    })
    .join('');
  let guide = '';
  if (!game.done) {
    const stroke = glyph.strokes[game.s],
      pts = traceStrokePoints(stroke),
      [x, y] = pts[0];
    if (game.rules.arrows && stroke.kind === 'path') guide += traceArrowsHTML(pts, game.s);
    guide += `<circle class="tr-start" data-s="${game.s}" cx="${traceNum(x)}" cy="${traceNum(y)}" r="5"/>`;
    if (glyph.strokes.length > 1)
      guide += `<text class="tr-num" data-s="${game.s}" x="${traceNum(x + 7)}" y="${traceNum(y - 7)}">${game.s + 1}</text>`;
  }
  return `<svg id="tr-pad" viewBox="0 0 100 100" data-g="${game.g}" data-s="${game.s}" style="--tr-color:${TRACE_COLORS[game.g % TRACE_COLORS.length]}" role="img" aria-label="Le carré où tracer ${glyph.kind === 'chiffre' ? 'le chiffre' : 'la lettre'} ${glyph.say}">
    ${lines}${models}${guide}<polyline class="tr-ink" points=""/>
  </svg>`;
}

export { traceHeadHTML, traceMiniHTML, tracePadHTML, traceNum, tracePointsAttr, traceSay };
