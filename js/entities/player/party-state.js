/* ---------- Mode chacun son tour ---------- */
import { setCompanionPlayerSource } from '../companion/index.js';
import { currentProfile, profiles } from './profiles.js';

let party = { active:false, mode:null, players:[], turn:0, scores:{}, lastWinner:null };

function partyPlayers(){ return party.players.map(id=>profiles.list.find(p=>p.id===id)).filter(Boolean); }

function partyCurrent(){ return profiles.list.find(p=>p.id===party.players[party.turn]); }

// Le joueur dont c'est le tour (solo, chacun son tour, ou course) et son
// âge, utilisés pour adapter le TYPE de défi proposé (pas que sa difficulté).
function currentPlayer(){
  if(race.active){
    const r = raceCurrent();
    if(r) return r;
  }
  return (party.active && partyCurrent()) || currentProfile();
}

// le compagnon affiché est celui du joueur dont c'est le tour
setCompanionPlayerSource(()=> currentPlayer() || currentProfile());

function currentPlayerAge(){
  const p = currentPlayer();
  return p && Number(p.age) || null;
}

const RACE_STEPS = 6;        // cases à parcourir pour gagner

// démarrer ou arrêter une partie à plusieurs : seul ce fichier réaffecte `party` et `race`
function setParty(p){ party = p; }
function setRace(r){ race = r; }

let race = { active:false, players:[], pos:{}, turn:0, goal:RACE_STEPS, winner:null, rounds:0 };

function raceCurrent(){ return profiles.list.find(p=>p.id===race.players[race.turn]); }

export {
  currentPlayerAge, party, partyCurrent, partyPlayers, race, RACE_STEPS, raceCurrent, setParty,
  setRace
};
