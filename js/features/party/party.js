/* ---------- Mode chacun son tour : passer la main, scores ---------- */

function startParty(ids){
  if(ids.length < 2) return false;
  party = { active:true, mode:'turns', players:ids.slice(), turn:0, scores:{}, lastWinner:null };
  ids.forEach(id=> party.scores[id] = 0);
  switchProfile(ids[0], true);
  renderTurnBar();
  playSound('win');
  const p = partyCurrent();
  speak(`Mode chacun son tour ! ${p.name || 'Joueur 1'} commence.`);
  showToast(`🎲 ${avatarText(p.avatar)} ${p.name || 'Joueur 1'} commence !`);
  return true;
}
function stopParty(){
  if(race.active){ stopRace(); return; }
  party.active = false; party.mode = null;
  renderTurnBar();
  showToast('👤 Mode solo');
  speak('Retour au mode solo.');
}

// passe la main au joueur suivant (erreur dans un mini-jeu, ou fin de manche)
function passTurn(reason){
  if(!party.active) return;
  party.turn = (party.turn + 1) % party.players.length;
  if(race.active){ race.turn = party.turn; race.rounds++; }
  const p = partyCurrent();
  switchProfile(p.id, true);
  renderTurnBar();
  showTurnOverlay(p, reason);
}

function showTurnOverlay(p, reason){
  const el = document.getElementById('turn-overlay');
  if(!el) return;
  el.innerHTML = `
    <div class="turn-card">
      <span class="turn-av">${avatarHTML(p.avatar, p.look)}</span>
      <h2>${reason==='wrong' ? 'Oups ! On change' : 'Au tour de'}</h2>
      <p class="turn-name">${p.name || 'Joueur'}</p>
      <p class="turn-sub">${reason==='wrong' ? 'Ce n\'est pas grave, à toi de jouer !' : 'À toi !'}</p>
    </div>`;
  el.classList.add('show');
  playSound('tap');
  vibrate(60);
  speak(`${reason==='wrong' ? "Ce n'est pas grave ! " : ''}À toi de jouer ${p.name || ''} !`);
  clearTimeout(showTurnOverlay._t);
  showTurnOverlay._t = setTimeout(()=> el.classList.remove('show'), 1600);
}

function renderTurnBar(){
  const bar = document.getElementById('turn-bar');
  if(!bar) return;
  if(!party.active){ bar.hidden = true; bar.innerHTML = ''; return; }
  bar.hidden = false;
  const isRace = party.mode==='race';
  bar.innerHTML = partyPlayers().map((p,i)=>`
    <span class="turn-chip ${i===party.turn?'on':''}">
      <b>${avatarHTML(p.avatar, p.look)}</b> ${p.name || 'Joueur '+(i+1)}
      <i>${isRace ? ((race.pos[p.id]||0)+'/'+race.goal+' ⛵') : ((party.scores[p.id]||0)+' 🏅')}</i>
    </span>`).join('')
    + `<button class="turn-stop" id="turn-stop">✖️</button>`;
  const st = document.getElementById('turn-stop');
  if(st) st.onclick = ()=>{ playSound('tap'); stopParty(); };
}

// appelé quand un mini-jeu est réussi
function partyScore(){
  if(!party.active) return;
  const p = partyCurrent();
  if(!p) return;
  party.scores[p.id] = (party.scores[p.id]||0) + 1;
  party.lastWinner = p.id;
  renderTurnBar();
}

// en course : le joueur avance d'une case, puis la main passe au suivant
function partyAfterWin(){
  if(!party.active) return false;
  if(party.mode==='race'){
    const finished = raceAdvance();
    if(finished) return true;      // course gagnée : pas de passage de main
  }
  return false;
}

// mode chacun son tour : une erreur passe la main au joueur suivant
onWrongFeedback(()=>{
  if(party.active) setTimeout(()=> passTurn('wrong'), 420);
});
