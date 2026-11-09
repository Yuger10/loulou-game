/* ---------- Mode chacun son tour ---------- */
let party = { active:false, mode:null, players:[], turn:0, scores:{}, lastWinner:null };

function partyPlayers(){ return party.players.map(id=>profiles.list.find(p=>p.id===id)).filter(Boolean); }

function partyCurrent(){ return profiles.list.find(p=>p.id===party.players[party.turn]); }

// Le joueur dont c'est le tour (solo, chacun son tour, ou course) et son
// âge, utilisés pour adapter le TYPE de défi proposé (pas que sa difficulté).
function currentPlayer(){
  if(typeof race!=='undefined' && race.active && typeof raceCurrent==='function'){
    const r = raceCurrent();
    if(r) return r;
  }
  return (party.active && partyCurrent()) || (typeof currentProfile==='function' && currentProfile());
}

function currentPlayerAge(){
  const p = currentPlayer();
  return p && Number(p.age) || null;
}
