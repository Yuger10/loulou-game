/* Slice « game-state » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  freshState, gameCount, hello, level, levelOf, levelProgress, load, missionsForLevel, MISSIONS_PER_LEVEL,
  missionsUntil, replaceState, resetState, save, setSaveSlot, squishyFreshState, state, trackGamePlayed
} from './state.js';
