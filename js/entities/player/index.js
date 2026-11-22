/* Slice « player » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
// ses types aussi : les autres slices les lisent ici, par import('…/player/index.js')
/** @typedef {import('./profiles.js').Profile} Profile */
export { AVATARS, fixAvatar } from './avatars.js';
export {
  ac,
  addProfile,
  currentProfile,
  deleteProfile,
  LEGACY_SAVE_KEY,
  loadProfiles,
  onProfileRefresh,
  playerGender,
  profiles,
  PROFILES_KEY,
  profileSaveKey,
  refreshAll,
  saveProfiles,
  switchProfile,
  syncProfileFromState,
} from './profiles.js';
export {
  currentPlayerAge,
  party,
  partyCurrent,
  partyPlayers,
  race,
  RACE_STEPS,
  raceCurrent,
  setParty,
  setRace,
} from './party-state.js';
