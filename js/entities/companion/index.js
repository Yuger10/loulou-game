/* Slice « companion » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export {
  avatarHTML, avatarText, bindCompanionSelector, buddyReact, buddySlot, COMPANION_ORDER, companionOf,
  COMPANIONS, companionSelector, companionsFor, companionSVG, currentCompanion, defaultCompanionFor,
  isArtAvatar, setCompanionDressing, setCompanionPlayerSource
} from './companions.js';
