/* Les paliers des mini-jeux de la saison 3 « La Grande Expédition », sur le
   modèle de difficulty-s2.js : un tableau par palier lu par tierValue (voir
   l'en-tête de difficulty.js). Les essais et l'absence de minuteur restent
   dans difficulty.js (LIVES_TABLE, GENEROUS_KINDS, NO_TIMER_KINDS). */
import { tierValue } from './difficulty.js';

/* ---------------------------------------------------------------------
   TRACE AVEC TON DOIGT (Île des Crayons, saison 3) : le geste d'écriture
   (cycle 2 : les capitales et les chiffres, puis l'écriture cursive au CP).
     palier 1   1 glyphe : capitales bâton et chiffres simples, tolérance
                large, ni sens ni départ imposés, démonstration au début
     palier 2   2 glyphes : lettres attachées et chiffres ; on part du point
                vert et on suit le sens des flèches
     palier 3   2 glyphes : les lettres rondes (c, o, a, d) et 6, 8, 9
     palier 4   3 lettres attachées, révision, tolérance plus fine
     palier 5   3 glyphes, sans les flèches
   `R` : rayon de tolérance (unités du carré de 0 à 100) ; `cover` : part du
   modèle à couvrir ; `order` : dans le sens du modèle ; `start` : départ près
   du point vert ; `wander` : part du geste tolérée hors du chemin.
   Une enfant de 6 ans joue les paliers 1 et 2 (plafond par l'âge).
   Pas de minuteur.
   --------------------------------------------------------------------- */
/** @typedef {{ glyphs: number, set: string, R: number, cover: number, order: boolean, start: boolean, wander: number, arrows: boolean, demo: boolean }} TraceRules */
/** @type {Record<number, TraceRules>} */
const TRACE_TIERS = {
  1: { glyphs: 1, set: 'p1', R: 16, cover: 0.75, order: false, start: false, wander: 0.35, arrows: true, demo: true },
  2: { glyphs: 2, set: 'p2', R: 14, cover: 0.85, order: true, start: true, wander: 0.3, arrows: true, demo: false },
  3: { glyphs: 2, set: 'p3', R: 12, cover: 0.85, order: true, start: true, wander: 0.25, arrows: true, demo: false },
  4: { glyphs: 3, set: 'p4', R: 11, cover: 0.9, order: true, start: true, wander: 0.25, arrows: true, demo: false },
  5: { glyphs: 3, set: 'p5', R: 10, cover: 0.9, order: true, start: true, wander: 0.2, arrows: false, demo: false },
};
/**
 * @param {number} dd le palier de difficulté
 * @returns {TraceRules}
 */
function traceRound(dd) {
  return tierValue(TRACE_TIERS, dd);
}

export { traceRound };
