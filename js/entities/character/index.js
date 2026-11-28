/* Slice « character » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { CHARACTERS, charsOf, charsOfForPlayer } from './characters.js';
export { charFace } from './characters-art.js';
export { CHARACTER_TICKLES } from './characters-s3.js';
/** @typedef {import('./characters-s3.js').CharacterTickle} CharacterTickle */
