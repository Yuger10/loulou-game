/* ---------- Joueurs (profils) & mode chacun son tour ---------- */

const PROFILES_KEY = 'lagon-magique-profiles';
const LEGACY_SAVE_KEY = 'lagon-magique-save';

let profiles = { list: [], current: null };

function profileSaveKey(id){ return LEGACY_SAVE_KEY + ':' + id; }
function currentSaveKey(){
  return profiles.current ? profileSaveKey(profiles.current) : LEGACY_SAVE_KEY;
}
function newId(){ return 'p' + Date.now().toString(36) + Math.floor(Math.random()*1000); }

function saveProfiles(){
  try{ localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); }catch(e){}
}
function loadProfiles(){
  try{
    const raw = localStorage.getItem(PROFILES_KEY);
    if(raw) profiles = JSON.parse(raw);
  }catch(e){}
  if(!profiles || !Array.isArray(profiles.list)) profiles = { list: [], current: null };

  // migration : une ancienne partie unique devient le premier joueur
  if(!profiles.list.length){
    let legacy = null;
    try{ legacy = JSON.parse(localStorage.getItem(LEGACY_SAVE_KEY) || 'null'); }catch(e){}
    const id = newId();
    profiles.list = [{ id, name: (legacy && legacy.name) || '', avatar: (legacy && legacy.avatar) || '👧' }];
    profiles.current = id;
    if(legacy){ try{ localStorage.setItem(profileSaveKey(id), JSON.stringify(legacy)); }catch(e){} }
    saveProfiles();
  }
  if(!profiles.current || !profiles.list.some(p=>p.id===profiles.current)){
    profiles.current = profiles.list[0].id;
    saveProfiles();
  }
}

function currentProfile(){ return profiles.list.find(p=>p.id===profiles.current) || profiles.list[0]; }

// garde la fiche du joueur (nom/avatar) synchro avec son état de jeu
function syncProfileFromState(){
  const p = currentProfile();
  if(!p) return;
  p.name = state.name; p.avatar = state.avatar;
  saveProfiles();
}

function switchProfile(id, silent){
  if(id === profiles.current) return;
  save();                       // sauvegarde le joueur courant
  profiles.current = id; saveProfiles();
  load();                       // charge le nouveau
  currentWorld = worldUnlocked(currentWorld) ? currentWorld : 'lagon';
  refreshAll();
  if(!silent){
    playSound('good');
    const p = currentProfile();
    speak(`À toi de jouer ${p.name || ''} !`);
    showToast(`${p.avatar} ${p.name || 'Joueur'}`);
  }
}

function addProfile(name, avatar){
  const id = newId();
  profiles.list.push({ id, name: name||'', avatar: avatar||'👧' });
  profiles.current = id; saveProfiles();
  state = freshState({ name: name||'', avatar: avatar||'👧', visited:['lagon'] });
  save();
  currentWorld = 'lagon';
  refreshAll();
  return id;
}

function deleteProfile(id){
  if(profiles.list.length <= 1) return false;
  profiles.list = profiles.list.filter(p=>p.id!==id);
  try{ localStorage.removeItem(profileSaveKey(id)); }catch(e){}
  party.players = party.players.filter(pid=>pid!==id);
  if(profiles.current === id){
    profiles.current = profiles.list[0].id;
    load();
    currentWorld = 'lagon';
  }
  saveProfiles();
  refreshAll();
  return true;
}

function refreshAll(){
  renderCoins(); renderSoundBtn(); renderBadge(); renderProfile();
  ensureQuests(); renderLagon();
}

/* ---------- Mode chacun son tour ---------- */
let party = { active:false, players:[], turn:0, scores:{}, lastWinner:null };

function partyPlayers(){ return party.players.map(id=>profiles.list.find(p=>p.id===id)).filter(Boolean); }
function partyCurrent(){ return profiles.list.find(p=>p.id===party.players[party.turn]); }

function startParty(ids){
  if(ids.length < 2) return false;
  party = { active:true, players:ids.slice(), turn:0, scores:{}, lastWinner:null };
  ids.forEach(id=> party.scores[id] = 0);
  switchProfile(ids[0], true);
  renderTurnBar();
  playSound('win');
  const p = partyCurrent();
  speak(`Mode chacun son tour ! ${p.name || 'Joueur 1'} commence.`);
  showToast(`🎲 ${p.avatar} ${p.name || 'Joueur 1'} commence !`);
  return true;
}
function stopParty(){
  party.active = false;
  renderTurnBar();
  showToast('👤 Mode solo');
  speak('Retour au mode solo.');
}

// passe la main au joueur suivant (erreur dans un mini-jeu, ou fin de manche)
function passTurn(reason){
  if(!party.active) return;
  party.turn = (party.turn + 1) % party.players.length;
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
      <span class="turn-av">${p.avatar}</span>
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
  bar.innerHTML = partyPlayers().map((p,i)=>`
    <span class="turn-chip ${i===party.turn?'on':''}">
      <b>${p.avatar}</b> ${p.name || 'Joueur '+(i+1)} <i>${party.scores[p.id]||0} 🏅</i>
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
