/* Slice « hints » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
/** @typedef {import('./hints.js').HintFx} HintFx */
/**
 * @template Q
 * @typedef {import('./hints.js').HintProvider<Q>} HintProvider
 */
export {
  hintLevel,
  hintNudge,
  hintOrderStep,
  hintPolicy,
  hintShowFirst,
  hintSyllablesFirst,
  hintSyllablesHTML,
  registerHints,
  setHintCountable,
  setHintPolicy,
  setHintQuestion,
} from './hints.js';
