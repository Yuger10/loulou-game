/* Slice « review-queue » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
// ses types aussi : les autres slices les lisent ici, par import('…/review/index.js')
/** @typedef {import('./review.js').ReviewState} ReviewState */
/** @typedef {import('./review.js').ReviewItem} ReviewItem */
/** @typedef {import('./review.js').ReviewParams} ReviewParams */
/** @typedef {import('./review.js').MathParams} MathParams */
/** @typedef {import('./review.js').CalcParams} CalcParams */
/** @typedef {import('./review.js').CompareParams} CompareParams */
/** @typedef {import('./review.js').ClockParams} ClockParams */
/** @typedef {import('./review.js').ReadingParams} ReadingParams */
export {
  addDays,
  addMiss,
  dayKey,
  pickDue,
  REVIEW_MAX,
  REVIEW_STEPS,
  reviewAnswer,
  reviewKey,
  sanitizeReview,
  validParams,
} from './review.js';
