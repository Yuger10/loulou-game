/* Slice « companion-team » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { maybeTeamOpening, renderTeamHeads, teamHeadsHTML, teamOnSessionStart } from './team.js';
export {
  pauseAnnouncer, renderSamGuide, teamCheerBy, teamOnGamePicker, teamWinExtras
} from './specialties.js';
