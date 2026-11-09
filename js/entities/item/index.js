/* Slice « item » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  addItem, ALBUM_REWARD, ALL_ITEMS, countItem, CRAFTED, DECOS, decosOf, ITEMS, removeItem
} from './items.js';
