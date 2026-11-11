/* Slice « difficulty » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  CALC_MULT_TABLES, calcBounds, calendarUsesWeekdayOrder, calendarWeekdayCount, clockGranularity,
  clockOptions, compareCloseChance, compareEqualChance, compareRange, countRange,
  determinantsExtraDistractor, determinantsImageShown, determinantsPluralChance, diffMirrorChance,
  cubesRound, diffTotal, jigsawRound, livesFor, mathBounds, memoryPairs, moneyDenoms, moneyPileSize, planetsTier,
  nestingRound, packsRound, puzzleCount, recipeRound, shareRound, puzzleStartMax, puzzleVariants, readingOptions, readingWordOnly, sequencePatternLength,
  shapesRound, shelfRound, simonLength, solidOptions, timerFor, volumeAskLessChance, volumeContainerCount,
  volumeUsesCapacityCompare
} from './difficulty.js';
export { GAME_LIST, gameTypesForAge } from './game-types.js';
export { ageLabel, ageToDiff } from './age.js';
