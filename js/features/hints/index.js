/* Slice « hints » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  hintLevel, hintNudge, hintOrderStep, hintPolicy, hintShowFirst, hintSyllablesFirst,
  hintSyllablesHTML, registerHints, setHintCountable, setHintPolicy, setHintQuestion
} from './hints.js';
