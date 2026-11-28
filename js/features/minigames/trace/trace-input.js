/* ---------- « Trace avec ton doigt » : le doigt sur le carré ----------
   La saisie du jeu (js/features/minigames/trace/trace.js) : Pointer Events,
   avec une capture protégée (le doigt peut sortir du carré) ; sans Pointer
   Events (Safari avant 13), la souris et les événements tactiles. Le geste se
   dessine sous le doigt (`.tr-ink`) ; au lever du doigt, ses points partent
   au jeu, en unités du carré. */
import { setHandler } from '../../../shared/ui/index.js';
import { tracePointsAttr } from './trace-draw.js';
import { traceClientToPad } from './trace-judge.js';

/** @typedef {import('./trace-glyphs.js').TracePoint} TracePoint */
/**
 * Ce que le jeu branche sur le carré : `onDown` au doigt posé (false : le
 * carré ne répond pas), `onStroke` au doigt levé, avec les points du geste.
 * @typedef {{ onDown: () => boolean, onStroke: (points: TracePoint[]) => void }} TraceFingerHooks
 */
/** @typedef {{ down: (p: TracePoint) => void, move: (p: TracePoint) => void, up: (p: TracePoint | null) => void, cancel: () => void }} TraceFinger */

/* Les événements du doigt : Pointer Events, sinon la souris (le repli ajoute
   aussi les événements tactiles, voir traceBindTouch). Lu par le pilote de test. */
const TRACE_EVENTS =
  typeof window !== 'undefined' && typeof window.PointerEvent === 'function'
    ? ['pointerdown', 'pointermove', 'pointerup']
    : ['mousedown', 'mousemove', 'mouseup'];

/** @param {Element} pad efface l'encre du carré */
function traceClearInk(pad) {
  const ink = pad.querySelector('.tr-ink');
  if (ink) ink.setAttribute('points', '');
}

/**
 * Le geste en cours : ses points s'ajoutent tant que le doigt est posé.
 * @param {Element} pad
 * @param {TraceFingerHooks} hooks
 * @returns {TraceFinger}
 */
function traceFinger(pad, hooks) {
  /** @type {TracePoint[] | null} */
  let ink = null; // null : doigt levé
  return {
    down(p) {
      ink = hooks.onDown() ? [p] : null;
    },
    move(p) {
      if (!ink) return;
      ink.push(p);
      const line = pad.querySelector('.tr-ink');
      if (line) line.setAttribute('points', tracePointsAttr(ink));
    },
    // `p` : le dernier point, s'il est connu
    up(p) {
      const points = ink;
      if (!points) return;
      ink = null;
      if (p) points.push(p);
      hooks.onStroke(points);
    },
    // geste interrompu par le système : on efface, rien n'est jugé
    cancel() {
      ink = null;
      traceClearInk(pad);
    },
  };
}

/**
 * Branche le doigt sur le carré.
 * @param {HTMLElement} pad
 * @param {TraceFingerHooks} hooks
 */
function traceBindPad(pad, hooks) {
  const finger = traceFinger(pad, hooks);
  /** @param {Event} e un événement de souris ou de pointeur */
  const point = (e) => traceClientToPad(/** @type {MouseEvent} */ (e), pad.getBoundingClientRect());
  const [evDown, evMove, evUp] = TRACE_EVENTS;
  setHandler(pad, evDown, (e) => {
    const id = /** @type {PointerEvent} */ (e).pointerId;
    try {
      if (typeof pad.setPointerCapture === 'function' && id !== undefined) pad.setPointerCapture(id);
    } catch {
      // capture refusée : le tracé continue tant que le doigt reste sur le carré
    }
    finger.down(point(e));
  });
  setHandler(pad, evMove, (e) => finger.move(point(e)));
  setHandler(pad, evUp, (e) => finger.up(point(e)));
  setHandler(pad, 'pointercancel', () => finger.cancel());
  if (evDown !== 'pointerdown') traceBindTouch(pad, finger);
}

/**
 * Repli tactile. addEventListener direct : il faut `{ passive: false }` pour
 * que preventDefault empêche la page de défiler sous le doigt ; le carré est
 * neuf à chaque dessin, donc aucun doublon.
 * @param {HTMLElement} pad
 * @param {TraceFinger} finger
 */
function traceBindTouch(pad, finger) {
  /** @param {TouchEvent} e le point du premier doigt, s'il y en a un */
  const point = (e) => {
    const t = e.touches[0] || e.changedTouches[0];
    return t ? traceClientToPad(t, pad.getBoundingClientRect()) : null;
  };
  /**
   * @param {string} type
   * @param {(p: TracePoint | null) => void} fn
   */
  const listen = (type, fn) =>
    pad.addEventListener(
      type,
      (e) => {
        e.preventDefault();
        fn(point(/** @type {TouchEvent} */ (e)));
      },
      { passive: false },
    );
  listen('touchstart', (p) => p && finger.down(p));
  listen('touchmove', (p) => p && finger.move(p));
  listen('touchend', (p) => finger.up(p));
  listen('touchcancel', () => finger.cancel());
}

export { TRACE_EVENTS, traceBindPad, traceClearInk };
