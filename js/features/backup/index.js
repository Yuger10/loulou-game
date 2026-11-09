/* Slice « backup » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { backupDue, initBackup, openBackup, requestPersistentStorage } from './backup.js';
