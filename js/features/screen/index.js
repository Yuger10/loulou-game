/* Slice « screen » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { bindQuit, forgetSpokenHint, gameHeader, rememberSpokenHint, speakWrongHint } from './screen.js';
