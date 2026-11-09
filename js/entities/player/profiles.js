/* ---------- Joueurs : profils et leur stockage ---------- */
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
  if(typeof fixAvatar==='function') profiles.list.forEach(p=>{ p.avatar = fixAvatar(p.avatar); });

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
  p.look = state.look ? Object.assign({}, state.look) : null;   // pour dessiner son avatar habillé partout
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
