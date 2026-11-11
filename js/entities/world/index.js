/* Slice « world » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  ARCHIPELAGO_ORDER, ARCHIPELAGOS, archipelagoOf, archipelagoUnlocked, currentWorld, nextLockedWorld,
  setCurrentWorld, WORLD_ORDER, worldGame, WORLDS, worldsOf, worldUnlocked
} from './worlds.js';
export { availableChars, availableCrafted, availableItems } from './availability.js';
