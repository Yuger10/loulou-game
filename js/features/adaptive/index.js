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
export { missionProgress, noteAnswerError, recordMission, resetMissionErrors, todayKey } from './skills.js';
export { SKILL_STATUS, skillStatus } from './skill-status.js';
export { gameDiff, gameDiffIsland } from './game-diff.js';
export { needsPractice, pickPracticeGame, progressCheer } from './adaptive.js';
