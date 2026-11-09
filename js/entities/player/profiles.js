/* ---------- Joueurs : profils et leur stockage ---------- */
import { playSound, showToast, speak } from '../../shared/ui/index.js';
import { avatarText, defaultCompanionFor } from '../companion/index.js';
import { freshState, load, replaceState, save, setSaveSlot, state } from '../game-state/index.js';
import { currentWorld, setCurrentWorld, worldUnlocked } from '../world/index.js';
import { fixAvatar } from './avatars.js';
import { party } from './party-state.js';

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
  profiles.list.forEach(p=>{ p.avatar = fixAvatar(p.avatar); });

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

// la partie de chaque joueur est sauvegardée sous sa propre clé
setSaveSlot({ key: currentSaveKey, afterSave: syncProfileFromState, afterLoad: (st)=>{ st.avatar = fixAvatar(st.avatar); } });

function switchProfile(id, silent){
  if(id === profiles.current) return;
  save();                       // sauvegarde le joueur courant
  profiles.current = id; saveProfiles();
  load();                       // charge le nouveau
  setCurrentWorld(worldUnlocked(currentWorld) ? currentWorld : 'lagon');
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
    companion: companion || defaultCompanionFor(gender||'') });
  profiles.current = id; saveProfiles();
  replaceState(freshState({ name: name||'', avatar: avatar||'👧', visited:['lagon'] }));
  save();
  setCurrentWorld('lagon');
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
    setCurrentWorld('lagon');
  }
  saveProfiles();
  refreshAll();
  return true;
}

// Après un changement de joueur (ou une restauration), tout ce qui affiche
// ses données doit se redessiner. Les features concernées s'inscrivent avec
// onProfileRefresh : l'entité ne les connaît pas.
const profileRefreshHooks = [];
function onProfileRefresh(fn){ profileRefreshHooks.push(fn); }
function refreshAll(){ profileRefreshHooks.forEach(fn=> fn()); }

/* ---------- Accords féminin / masculin / neutre ---------- */
// 'f' = féminin, 'm' = masculin, '' = neutre (formulations sans accord)
function playerGender(){
  const p = currentProfile() || null;
  return (p && p.gender) || '';
}

// ac('fort') -> 'fort' / 'forte' ; ac('champion','championne')
function ac(masc, fem){
  const g = playerGender();
  if(g==='f') return fem || (masc + 'e');
  return masc;
}

export {
  ac, addProfile, currentProfile, deleteProfile, LEGACY_SAVE_KEY, loadProfiles, onProfileRefresh,
  playerGender, profiles, PROFILES_KEY, profileSaveKey, refreshAll, saveProfiles, switchProfile,
  syncProfileFromState
};
