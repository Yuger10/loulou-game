/* Slice « shared-lib » (couche shared) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { pickRandom, random, shuffle } from './random.js';
export { emit, on } from './events.js';
export { APP_LABEL, APP_PATCH, APP_VERSION, versionBuild } from './version.js';
export { cleanName } from './text.js';
export { storageRemove, storageErrors, storageWrite } from './storage.js';
