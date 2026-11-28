/* ---------- « Trace avec ton doigt » : les points d'un trait et le juge du tracé ----------
   La géométrie du jeu, sans écran : les points du modèle d'un trait
   (trace-glyphs.js), et le juge d'un geste. Le juge ne demande pas un trait
   parfait : il regarde le départ, le sens et le chemin, avec un rayon de
   tolérance R par palier (`traceRound`, js/entities/difficulty/difficulty-s3.js). */

/** @typedef {import('./trace-glyphs.js').TraceRules} TraceRules */
/** @typedef {import('./trace-glyphs.js').TracePoint} TracePoint */
/** @typedef {import('./trace-glyphs.js').TraceArc} TraceArc */
/** @typedef {import('./trace-glyphs.js').TraceStroke} TraceStroke */
/** @typedef {{ ok: boolean, reason?: 'dot' | 'short' | 'start' | 'wander' | 'cover', cover: number, wander: number }} JudgeResult */

const TRACE_STEP = 3; // écart maximal entre deux points d'un modèle ou d'un geste
const TRACE_WAY = 8; // écart entre deux points de passage du modèle
const TRACE_ARC_STEP = 10; // pas d'un arc, en degrés

/**
 * @param {TracePoint} a
 * @param {TracePoint} b
 */
function traceDist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
/** @param {TracePoint[]} pts la longueur d'une ligne brisée */
function traceLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += traceDist(pts[i - 1], pts[i]);
  return len;
}
/**
 * La même ligne, avec un point tous les `step` au plus (début et fin compris).
 * @param {TracePoint[]} pts
 * @param {number} step
 * @returns {TracePoint[]}
 */
function traceResample(pts, step) {
  const total = traceLength(pts);
  if (pts.length < 2 || total === 0) return pts.slice(0, 1);
  const n = Math.ceil(total / step);
  /** @type {TracePoint[]} */
  const out = [pts[0]];
  let seg = 1, // le segment en cours va de pts[seg - 1] à pts[seg]
    before = 0; // longueur parcourue avant ce segment
  for (let k = 1; k < n; k++) {
    const at = (total * k) / n;
    let segLen = traceDist(pts[seg - 1], pts[seg]);
    while (seg < pts.length - 1 && before + segLen < at) {
      before += segLen;
      seg++;
      segLen = traceDist(pts[seg - 1], pts[seg]);
    }
    const t = segLen ? Math.min(1, (at - before) / segLen) : 0;
    const a = pts[seg - 1],
      b = pts[seg];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** @param {TraceArc} arc les points d'un arc, de a0 à a1 compris */
function traceArcPoints(arc) {
  const steps = Math.max(1, Math.ceil(Math.abs(arc.a1 - arc.a0) / TRACE_ARC_STEP));
  /** @type {TracePoint[]} */
  const out = [];
  for (let k = 0; k <= steps; k++) {
    const a = ((arc.a0 + ((arc.a1 - arc.a0) * k) / steps) * Math.PI) / 180;
    out.push([arc.cx + arc.rx * Math.cos(a), arc.cy + arc.ry * Math.sin(a)]);
  }
  return out;
}

/**
 * Les points du modèle d'un trait : ses morceaux bout à bout, un point tous
 * les 3 unités au plus. Le premier point est le départ du trait.
 * @param {TraceStroke} stroke
 * @returns {Array<[number, number]>}
 */
function traceStrokePoints(stroke) {
  if (stroke.kind === 'dot') return [stroke.at];
  const raw = stroke.parts.flatMap((part) => (part.k === 'P' ? part.pts : traceArcPoints(part)));
  return traceResample(raw, TRACE_STEP);
}

/**
 * La distance d'un point à une ligne brisée.
 * @param {TracePoint} p
 * @param {TracePoint[]} line
 */
function traceDistToLine(p, line) {
  let best = traceDist(p, line[0]);
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      b = line[i];
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
    best = Math.min(best, traceDist(p, [a[0] + dx * t, a[1] + dy * t]));
  }
  return best;
}

/**
 * La part des points de passage du modèle que le geste a touchés. Dans
 * l'ordre (`order`), un curseur avance le long du geste : chaque point de
 * passage cherche le premier point du geste, à partir du curseur, à moins de
 * R. Ce parcours glouton accepte les traits qui repassent sur eux-mêmes (a, d).
 * @param {TracePoint[]} ways les points de passage du modèle
 * @param {TracePoint[]} child le geste rééchantillonné
 * @param {TraceRules} rules
 */
function traceCover(ways, child, rules) {
  const R = rules.R,
    order = rules.order;
  let hit = 0,
    j = 0;
  for (const way of ways) {
    let found = -1;
    for (let i = order ? j : 0; i < child.length && found < 0; i++) if (traceDist(child[i], way) < R) found = i;
    if (found < 0) continue;
    hit++;
    j = found;
  }
  return hit / ways.length;
}

/**
 * Juge un trait de l'enfant. Les raisons se testent dans cet ordre : `dot`
 * (le point est touché trop loin), `short` (un simple toucher, ignoré),
 * `start` (pas parti du point vert), `wander` (hors du chemin, ou un
 * gribouillis bien trop long), `cover` (chemin pas suivi jusqu'au bout, ou à
 * l'envers).
 * @param {TraceStroke} stroke le trait du modèle
 * @param {Array<[number, number]>} points le geste, en unités du carré
 * @param {TraceRules} rules les règles du palier
 * @returns {JudgeResult}
 */
function traceJudge(stroke, points, rules) {
  const R = rules.R;
  if (stroke.kind === 'dot') {
    const ok = points.length > 0 && points.every((p) => traceDist(p, stroke.at) < R);
    return ok ? { ok, cover: 1, wander: 0 } : { ok, reason: 'dot', cover: 0, wander: 1 };
  }
  const model = traceStrokePoints(stroke);
  const modelLen = traceLength(model),
    len = traceLength(points);
  if (points.length < 3 || len < 0.25 * modelLen) return { ok: false, reason: 'short', cover: 0, wander: 0 };
  if (rules.start && traceDist(points[0], model[0]) >= 1.5 * R) {
    return { ok: false, reason: 'start', cover: 0, wander: 0 };
  }
  // un geste rapide laisse des trous : on le rééchantillonne avant de mesurer
  const child = traceResample(points, TRACE_STEP);
  const wander = child.filter((p) => traceDistToLine(p, model) > R).length / child.length;
  // un gribouillis qui remplit le carré passe près de tout le modèle, mais il est bien trop long
  if (wander > rules.wander || len > 2.5 * modelLen) return { ok: false, reason: 'wander', cover: 0, wander };
  const cover = traceCover(traceResample(model, TRACE_WAY), child, rules);
  if (cover < rules.cover) return { ok: false, reason: 'cover', cover, wander };
  return { ok: true, cover, wander };
}

/**
 * Un point de l'écran ramené dans le carré de 0 à 100.
 * @param {{ clientX: number, clientY: number }} e
 * @param {{ left: number, top: number, width: number, height: number }} rect le rectangle du carré à l'écran
 * @returns {[number, number]}
 */
function traceClientToPad(e, rect) {
  return [((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100];
}

export { traceClientToPad, traceJudge, traceLength, traceStrokePoints };
