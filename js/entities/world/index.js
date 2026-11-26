/* Slice « world » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { WORLD_ORDER, worldGame, WORLDS } from './worlds.js';
export {
  ARCHIPELAGO_ORDER,
  ARCHIPELAGOS,
  archipelagoOf,
  archipelagoUnlocked,
  availableChars,
  availableCrafted,
  availableItems,
  currentWorld,
  lastOpenedLevel,
  nextLockedWorld,
  setCurrentWorld,
  worldsOf,
  worldUnlocked,
} from './availability.js';
