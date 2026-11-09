/* Slice « party » (couche features) : son API publique. Les autres slices
   n'importent que ce fichier (vérifié par test/slices.test.js). */
export { partyAfterWin, partyScore, passTurn, renderTurnBar, startParty, stopParty } from './party.js';
export { renderRaceTrack, startRace } from './race.js';
