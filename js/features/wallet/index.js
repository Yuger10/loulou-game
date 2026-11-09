/* Slice « wallet » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { addCoins, addCoinsInFlight, renderCoins } from './wallet.js';
