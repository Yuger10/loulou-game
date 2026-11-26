/* Slice « difficulty » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  CALC_MULT_TABLES,
  calcBounds,
  calendarUsesWeekdayOrder,
  calendarWeekdayCount,
  clockGranularity,
  clockOptions,
  compareCloseChance,
  compareEqualChance,
  compareRange,
  countRange,
  determinantsExtraDistractor,
  determinantsImageShown,
  determinantsPluralChance,
  diffMirrorChance,
  diffTotal,
  livesFor,
  mathBounds,
  memoryPairs,
  moneyDenoms,
  moneyPileSize,
  planetsTier,
  puzzleCount,
  puzzleStartMax,
  puzzleVariants,
  readingOptions,
  readingWordOnly,
  sequencePatternLength,
  shapesRound,
  simonLength,
  solidOptions,
  timerFor,
  volumeAskLessChance,
  volumeContainerCount,
  volumeUsesCapacityCompare,
} from './difficulty.js';
export {
  cubesRound,
  jigsawRound,
  ladybugsRound,
  lifecycleRound,
  mirrorRound,
  nestingRound,
  packsRound,
  pitchRound,
  potionsRound,
  recipeRound,
  rhythmRound,
  shareRound,
  shelfRound,
} from './difficulty-s2.js';
export { lengthRound, orderRound, problemsRound, tensRound, traceRound } from './difficulty-s3.js';
/** @typedef {import('./difficulty-s3.js').LengthRules} LengthRules */
/** @typedef {import('./difficulty-s3.js').OrderRound} OrderRound */
/** @typedef {import('./difficulty-s3.js').ProblemsRep} ProblemsRep */
/** @typedef {import('./difficulty-s3.js').ProblemsRound} ProblemsRound */
/** @typedef {import('./difficulty-s3.js').TensRound} TensRound */
/** @typedef {import('./difficulty-s3.js').TraceRules} TraceRules */
export { GAME_LIST, gameTypesForAge } from './game-types.js';
export { ageLabel, ageToDiff } from './age.js';
