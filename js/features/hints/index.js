/* Slice « hints » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
/** @typedef {import('./hints.js').Explain} Explain */
/** @typedef {import('./hints.js').ExplainFx} ExplainFx */
/** @typedef {import('./hints.js').HintFx} HintFx */
/**
 * @template Q
 * @typedef {import('./hints.js').HintProvider<Q>} HintProvider
 */
export {
  explainClear,
  explainFor,
  explainShow,
  hasExplain,
  hintLevel,
  hintNudge,
  hintOrderStep,
  hintPolicy,
  hintShowFirst,
  hintSyllablesFirst,
  hintSyllablesHTML,
  registerExplain,
  registerHints,
  setHintCountable,
  setHintPolicy,
  setHintQuestion,
  strategyLine,
} from './hints.js';
