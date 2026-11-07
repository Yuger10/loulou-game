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
    showToast(`${avatarText(p.avatar)} ${p.name || 'Joueur'}`);
  }
}

function addProfile(name, avatar, age, gender, companion){
  const id = newId();
  profiles.list.push({ id, name: name||'', avatar: avatar||'👧', age: age||null, gender: gender||'',
    companion: companion || (typeof defaultCompanionFor==='function' ? defaultCompanionFor(gender||'') : null) });
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

/* ---------- Accords féminin / masculin / neutre ---------- */
// 'f' = féminin, 'm' = masculin, '' = neutre (formulations sans accord)
function playerGender(){
  const p = (typeof currentProfile==='function' && currentProfile()) || null;
  return (p && p.gender) || '';
}
// ac('fort') -> 'fort' / 'forte' ; ac('champion','championne')
function ac(masc, fem){
  const g = playerGender();
  if(g==='f') return fem || (masc + 'e');
  return masc;
}

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
  if(typeof race!=='undefined' && race.active){ stopRace(); return; }
  party.active = false; party.mode = null;
  renderTurnBar();
  showToast('👤 Mode solo');
  speak('Retour au mode solo.');
}

// passe la main au joueur suivant (erreur dans un mini-jeu, ou fin de manche)
function passTurn(reason){
  if(!party.active) return;
  party.turn = (party.turn + 1) % party.players.length;
  if(typeof race!=='undefined' && race.active){ race.turn = party.turn; race.rounds++; }
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
      <span class="turn-av">${avatarHTML(p.avatar)}</span>
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
      <b>${avatarHTML(p.avatar)}</b> ${p.name || 'Joueur '+(i+1)}
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
  if(party.mode==='race' && typeof raceAdvance==='function'){
    const finished = raceAdvance();
    if(finished) return true;      // course gagnée : pas de passage de main
  }
  return false;
}
