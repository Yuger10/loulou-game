/* Slice « player » (couche entities) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { AVATARS } from './avatars.js';
export {
  ac, addProfile, currentProfile, deleteProfile, LEGACY_SAVE_KEY, loadProfiles, onProfileRefresh,
  playerGender, profiles, PROFILES_KEY, profileSaveKey, refreshAll, saveProfiles, switchProfile,
  syncProfileFromState
} from './profiles.js';
export {
  currentPlayerAge, party, partyCurrent, partyPlayers, race, RACE_STEPS, raceCurrent, setParty,
  setRace
} from './party-state.js';
