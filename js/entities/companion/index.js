/* Slice « companion » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
// ses types aussi : les autres slices les lisent ici, par import('…/companion/index.js')
/** @typedef {import('./companions.js').Companion} Companion */
export {
  avatarHTML,
  avatarText,
  bindCompanionSelector,
  buddyReact,
  buddySlot,
  COMPANION_ORDER,
  companionOf,
  COMPANIONS,
  companionSelector,
  companionsFor,
  companionSVG,
  companionUnlocked,
  currentCompanion,
  defaultCompanionFor,
  isArtAvatar,
  setCompanionDressing,
  setCompanionPlayerSource,
} from './companions.js';
