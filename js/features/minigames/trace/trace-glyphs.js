/* ---------- « Trace avec ton doigt » : les modèles à tracer ----------
   Les glyphes du jeu (js/features/minigames/trace/trace.js) et les ensembles
   de chaque palier. Tout se mesure dans un carré de 0 à 100, y vers le bas.
   Un trait est une suite de morceaux mis bout à bout :
     P : une ligne brisée ;
     A : un arc d'ellipse de l'angle a0 à l'angle a1 (degrés) ; un angle qui
         croît tourne dans le sens des aiguilles d'une montre à l'écran ;
     dot : un point à toucher (le point du i).
   Les points d'un trait et le juge du tracé : trace-judge.js. */
import { traceRound } from '../../../entities/difficulty/index.js';
import { shuffle } from '../../../shared/lib/index.js';

/** @typedef {import('../../../entities/difficulty/index.js').TraceRules} TraceRules */
/** @typedef {[number, number]} TracePoint */
/** @typedef {{ k: 'P', pts: Array<[number, number]> }} TracePolyline   P(x1 y1, x2 y2, …) */
/** @typedef {{ k: 'A', cx: number, cy: number, rx: number, ry: number, a0: number, a1: number }} TraceArc   A(cx, cy, rx, ry, a0, a1) */
/** @typedef {TracePolyline | TraceArc} TracePart */
/** @typedef {{ kind: 'path', closed: boolean, parts: TracePart[] } | { kind: 'dot', at: [number, number] }} TraceStroke   D(x, y) devient { kind: 'dot', at: [x, y] } */
/** @typedef {{ id: string, kind: 'chiffre' | 'capitale' | 'attachée', say: string, word?: string, emoji?: string, strokes: TraceStroke[] }} TraceGlyph */
/** @typedef {{ rules: TraceRules, glyphs: string[] }} TraceBuild   traceBuildRound(p) : les règles du palier et les ids tirés */

/**
 * @param {...[number, number]} pts
 * @returns {TracePolyline}
 */
const trP = (...pts) => ({ k: 'P', pts });
/**
 * @param {...number} v cx, cy, rx, ry, a0, a1
 * @returns {TraceArc}
 */
const trA = (...v) => ({ k: 'A', cx: v[0], cy: v[1], rx: v[2], ry: v[3], a0: v[4], a1: v[5] });
/**
 * Un trait ouvert (tous, sauf le 0 et le 8).
 * @param {...TracePart} parts
 * @returns {TraceStroke}
 */
const trPath = (...parts) => ({ kind: 'path', closed: false, parts });

/** @type {Record<string, TraceGlyph>} */
const TRACE_GLYPHS = {
  0: {
    id: '0',
    kind: 'chiffre',
    say: 'zéro',
    strokes: [{ kind: 'path', closed: true, parts: [trA(50, 50, 22, 35, 270, -90)] }],
  },
  1: { id: '1', kind: 'chiffre', say: 'un', strokes: [trPath(trP([36, 32], [56, 15], [56, 85]))] },
  2: {
    id: '2',
    kind: 'chiffre',
    say: 'deux',
    strokes: [trPath(trA(50, 35, 20, 20, 200, 380), trP([30, 85], [72, 85]))],
  },
  3: {
    id: '3',
    kind: 'chiffre',
    say: 'trois',
    strokes: [trPath(trA(50, 32, 18, 17, 210, 450), trA(50, 66, 20, 19, 270, 510))],
  },
  4: {
    id: '4',
    kind: 'chiffre',
    say: 'quatre',
    strokes: [trPath(trP([58, 15], [28, 62], [76, 62])), trPath(trP([60, 40], [60, 85]))],
  },
  5: {
    id: '5',
    kind: 'chiffre',
    say: 'cinq',
    strokes: [trPath(trP([36, 15], [34, 46]), trA(50, 64, 20, 20, 235, 495)), trPath(trP([36, 15], [68, 15]))],
  },
  6: {
    id: '6',
    kind: 'chiffre',
    say: 'six',
    strokes: [trPath(trA(50, 48, 22, 33, 300, 180), trA(50, 66, 20, 19, 180, -180))],
  },
  7: { id: '7', kind: 'chiffre', say: 'sept', strokes: [trPath(trP([28, 15], [72, 15], [42, 85]))] },
  8: {
    id: '8',
    kind: 'chiffre',
    say: 'huit',
    strokes: [
      {
        kind: 'path',
        closed: true,
        parts: [trA(50, 32, 16, 17, 330, 90), trA(50, 67, 20, 18, 270, 630), trA(50, 32, 16, 17, 90, -30)],
      },
    ],
  },
  9: {
    id: '9',
    kind: 'chiffre',
    say: 'neuf',
    strokes: [trPath(trA(50, 34, 19, 19, 0, -360), trP([69, 34], [66, 85]))],
  },
  L: {
    id: 'L',
    kind: 'capitale',
    say: 'L',
    word: 'lion',
    emoji: '🦁',
    strokes: [trPath(trP([35, 15], [35, 85], [70, 85]))],
  },
  T: {
    id: 'T',
    kind: 'capitale',
    say: 'T',
    word: 'tortue',
    emoji: '🐢',
    strokes: [trPath(trP([25, 15], [75, 15])), trPath(trP([50, 15], [50, 85]))],
  },
  E: {
    id: 'E',
    kind: 'capitale',
    say: 'E',
    word: 'étoile',
    emoji: '⭐',
    strokes: [trPath(trP([68, 15], [35, 15], [35, 85], [68, 85])), trPath(trP([35, 50], [62, 50]))],
  },
  H: {
    id: 'H',
    kind: 'capitale',
    say: 'H',
    word: 'hibou',
    emoji: '🦉',
    strokes: [trPath(trP([30, 15], [30, 85])), trPath(trP([70, 15], [70, 85])), trPath(trP([30, 50], [70, 50]))],
  },
  i: {
    id: 'i',
    kind: 'attachée',
    say: 'i',
    word: 'île',
    emoji: '🏝️',
    strokes: [trPath(trP([25, 85], [45, 52], [45, 78], [53, 86], [68, 80])), { kind: 'dot', at: [45, 36] }],
  },
  u: {
    id: 'u',
    kind: 'attachée',
    say: 'u',
    word: 'lune',
    emoji: '🌙',
    strokes: [trPath(trP([20, 85], [34, 52], [34, 78], [42, 86], [54, 80], [60, 52], [60, 78], [67, 86], [80, 80]))],
  },
  t: {
    id: 't',
    kind: 'attachée',
    say: 't',
    word: 'tomate',
    emoji: '🍅',
    strokes: [trPath(trP([25, 85], [45, 25], [45, 78], [53, 86], [68, 80])), trPath(trP([34, 50], [58, 50]))],
  },
  l: {
    id: 'l',
    kind: 'attachée',
    say: 'l',
    word: 'lapin',
    emoji: '🐰',
    strokes: [
      trPath(trP([20, 85], [44, 55], [54, 30], [52, 16], [44, 15], [40, 26], [41, 60], [43, 80], [52, 86], [68, 80])),
    ],
  },
  e: {
    id: 'e',
    kind: 'attachée',
    say: 'e',
    word: 'cheval',
    emoji: '🐴',
    strokes: [
      trPath(trP([20, 78], [44, 68], [56, 58], [52, 50], [42, 52], [36, 64], [38, 78], [48, 86], [62, 84], [74, 76])),
    ],
  },
  c: {
    id: 'c',
    kind: 'attachée',
    say: 'c',
    word: 'carotte',
    emoji: '🥕',
    strokes: [trPath(trP([62, 56], [52, 50], [40, 54], [34, 68], [38, 81], [50, 86], [64, 82], [76, 75]))],
  },
  o: {
    id: 'o',
    kind: 'attachée',
    say: 'o',
    word: 'moto',
    emoji: '🏍️',
    strokes: [trPath(trA(48, 68, 14, 17, 300, -60), trP([55, 53], [70, 52], [80, 55]))],
  },
  a: {
    id: 'a',
    kind: 'attachée',
    say: 'a',
    word: 'ananas',
    emoji: '🍍',
    strokes: [trPath(trA(46, 68, 14, 17, 330, -30), trP([60, 52], [60, 79], [67, 86], [80, 80]))],
  },
  d: {
    id: 'd',
    kind: 'attachée',
    say: 'd',
    word: 'dauphin',
    emoji: '🐬',
    strokes: [trPath(trA(46, 68, 14, 17, 330, -30), trP([60, 15], [60, 79], [67, 86], [80, 80]))],
  },
};

/** Les glyphes de chaque palier (ids de TRACE_GLYPHS).
 * @type {Record<string, string[]>} */
const TRACE_SETS = {
  p1: ['1', '4', '7', '0', 'L', 'T', 'E', 'H'],
  p2: ['i', 'u', 't', 'l', 'e', '2', '3', '5'],
  p3: ['c', 'o', 'a', 'd', '6', '8', '9'],
  p4: ['i', 'u', 't', 'l', 'e', 'c', 'o', 'a', 'd'],
  p5: ['i', 'u', 't', 'l', 'e', 'c', 'o', 'a', 'd', '2', '3', '5', '6', '8', '9'],
};

/**
 * Une mission : les règles du palier et ses glyphes, tous différents.
 * @param {number} dd le palier de difficulté
 * @returns {TraceBuild}
 */
function traceBuildRound(dd) {
  const rules = traceRound(dd);
  return { rules, glyphs: shuffle(TRACE_SETS[rules.set]).slice(0, rules.glyphs) };
}

export { TRACE_GLYPHS, traceBuildRound };
