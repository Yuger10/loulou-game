/* Slice « shared-lib » (couche shared) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { pickRandom, random, shuffle } from './random.js';
export { emit, on } from './events.js';
export { APP_LABEL, versionBuild } from './version.js';
export { cleanName } from './text.js';
export { reportUnreadable, storageErrors, storageRemove, storageWrite } from './storage.js';
/** @typedef {import('./storage.js').StorageError} StorageError */
