/* Slice « minigame-engine » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
/** @typedef {import('./engine.js').GameRenderer} GameRenderer */
/** @typedef {import('./engine.js').LoseLifeOptions} LoseLifeOptions */
/** @typedef {import('./engine.js').RoundHandlers} RoundHandlers */
export {
  clearActiveTimer,
  flashModal,
  livesBar,
  loseLife,
  playGame,
  progressDots,
  registerGame,
  REVIEW_SHOW_MS,
  setMissionFact,
  setRoundHandlers,
  setSolution,
  setupLives,
  solSel,
  startMinigame,
  startTimerIfNeeded,
  stepOk,
  WIN_DELAY_LONG,
  winSoon,
} from './engine.js';
