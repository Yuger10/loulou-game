/* Slice « wardrobe » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  clearLookTry, currentLook, newlyUnlockedLookItems, ownsLookItem, renderLook, WARDROBE, wearLook
} from './wardrobe.js';
