/* Slice « shared-lib » (couche shared) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { pickRandom, shuffle } from './random.js';
export { emit, on } from './events.js';
