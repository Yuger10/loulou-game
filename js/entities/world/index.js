/* Slice « world » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  currentWorld, nextLockedWorld, setCurrentWorld, WORLD_ORDER, WORLDS, worldUnlocked
} from './worlds.js';
export { availableChars, availableCrafted, availableItems } from './availability.js';
