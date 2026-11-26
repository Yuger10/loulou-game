/* Slice « game-state » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
// ses types aussi : les autres slices les lisent ici, par import('…/game-state/index.js')
/** @typedef {import('./state.js').GameState} GameState */
/** @typedef {import('./state.js').Look} Look */
/** @typedef {import('./state.js').StarRecord} StarRecord */
export {
  freshState,
  gameCount,
  hello,
  level,
  levelOf,
  levelProgress,
  load,
  missionsForLevel,
  MISSIONS_PER_LEVEL,
  missionsUntil,
  readSave,
  replaceState,
  resetState,
  save,
  setSaveSlot,
  squishyFreshState,
  state,
  trackGamePlayed,
} from './state.js';
