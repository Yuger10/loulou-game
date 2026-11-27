/* Slice « adaptive » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  beginBonusChallenge,
  bonusChallenge,
  bonusOnNewGame,
  endBonusChallenge,
  inBonusChallenge,
  lastGame,
  setLastGame,
} from './session.js';
export { todayKey } from './day.js';
export { missionProgress, noteAnswerError, recordMission, resetMissionErrors } from './skills.js';
export {
  beginStarMission,
  closeStarDoor,
  endStarMission,
  inStarMission,
  noteStarError,
  noteStarGood,
  noteStarOffered,
  openStarDoor,
  starActive,
  starAfterMission,
  starOf,
  starOfferDue,
  starTier,
} from './stars.js';
export { closeAllStarDoors, starsResetFor } from './star-doors.js';
export { SKILL_STATUS, skillStatus } from './skill-status.js';
export { gameDiff, gameDiffIsland, normalDiff } from './game-diff.js';
export { needsPractice, pickPracticeGame, progressCheer } from './adaptive.js';
