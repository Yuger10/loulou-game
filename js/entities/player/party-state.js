/* ---------- Mode chacun son tour ---------- */
import { setCompanionPlayerSource } from '../companion/index.js';
import { currentProfile, onProfileDelete, profiles } from './profiles.js';

/**
 * Une partie « chacun son tour » : `players` = ids des joueurs, dans l'ordre ;
 * `scores` par id de joueur.
 * @typedef {{
 *   active: boolean,
 *   mode: string | null,
 *   players: string[],
 *   turn: number,
 *   scores: Record<string, number>,
 *   lastWinner: string | null,
 * }} Party
 */
/**
 * Une course : `pos` = la case de chaque joueur (par id), `goal` = cases à parcourir.
 * @typedef {{
 *   active: boolean,
 *   players: string[],
 *   pos: Record<string, number>,
 *   turn: number,
 *   goal: number,
 *   winner: string | null,
 *   rounds: number,
 * }} Race
 */
/** @type {Party} */
let party = { active: false, mode: null, players: [], turn: 0, scores: {}, lastWinner: null };

function partyPlayers() {
  return party.players.map((id) => profiles.list.find((p) => p.id === id)).filter(Boolean);
}

function partyCurrent() {
  return profiles.list.find((p) => p.id === party.players[party.turn]);
}

// Le joueur dont c'est le tour (solo, chacun son tour, ou course) et son
// âge, utilisés pour adapter le TYPE de défi proposé (pas que sa difficulté).
function currentPlayer() {
  if (race.active) {
    const r = raceCurrent();
    if (r) return r;
  }
  return (party.active && partyCurrent()) || currentProfile();
}

// le compagnon affiché est celui du joueur dont c'est le tour
setCompanionPlayerSource(() => currentPlayer() || currentProfile());

function currentPlayerAge() {
  const p = currentPlayer();
  return (p && Number(p.age)) || null;
}

const RACE_STEPS = 6; // cases à parcourir pour gagner

// démarrer ou arrêter une partie à plusieurs : seul ce fichier réaffecte `party` et `race`
/** @param {Party} p */
function setParty(p) {
  party = p;
}
/** @param {Race} r */
function setRace(r) {
  race = r;
}

/** @type {Race} */
let race = { active: false, players: [], pos: {}, turn: 0, goal: RACE_STEPS, winner: null, rounds: 0 };

function raceCurrent() {
  return profiles.list.find((p) => p.id === race.players[race.turn]);
}

// un joueur supprimé quitte la partie en cours
onProfileDelete((id) => {
  party.players = party.players.filter((pid) => pid !== id);
});

export { currentPlayerAge, party, partyCurrent, partyPlayers, race, RACE_STEPS, raceCurrent, setParty, setRace };
