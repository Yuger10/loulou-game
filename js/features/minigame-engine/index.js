/* Slice « minigame-engine » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  clearActiveTimer, flashModal, livesBar, loseLife, onMissionWin, playGame, progressDots, registerGame,
  setMissionFact, setSolution, setupLives, solSel, startMinigame, startTimerIfNeeded, stepOk
} from './engine.js';
