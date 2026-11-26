/* ---------- Joueurs : profils et leur stockage ---------- */
import { cleanName, random, storageRemove, storageWrite } from '../../shared/lib/index.js';
import { playSound, showToast, speak } from '../../shared/ui/index.js';
import { avatarText, defaultCompanionFor } from '../companion/index.js';
import { gradeToDiff } from '../difficulty/index.js';
import { freshState, load, replaceState, save, setSaveSlot, state } from '../game-state/index.js';
import { currentWorld, setCurrentWorld, worldUnlocked } from '../world/index.js';
import { fixAvatar } from './avatars.js';

const PROFILES_KEY = 'lagon-magique-profiles';

const LEGACY_SAVE_KEY = 'lagon-magique-save';

/**
 * La fiche d'un joueur. Les champs facultatifs manquent aux fiches anciennes ou
 * migrées : `age` (null = non précisé), `gender` ('f', 'm' ou '' neutre),
 * `companion` (id), `pauseMin` (durée de pause choisie par un adulte),
 * `birthday` ('MM-JJ' ou ''), `look` (copie de state.look, pour dessiner l'avatar),
 * `grade` (la classe choisie par un adulte : 'GS', 'CP', 'CE1', 'CE2', ou '' =
 * « selon l'âge » ; toujours l'une de ces valeurs après loadProfiles).
 * @typedef {{
 *   id: string,
 *   name: string,
 *   avatar: string,
 *   age?: number | null,
 *   gender?: string,
 *   companion?: string,
 *   pauseMin?: number,
 *   birthday?: string,
 *   grade?: string,
 *   look?: import('../game-state/index.js').Look | null,
 * }} Profile
 */
/**
 * Les joueurs : `current` = id du joueur courant, `familyPause` = la dernière
 * durée de pause choisie par un adulte (pour les nouveaux joueurs).
 * @typedef {{ list: Profile[], current: string | null, familyPause?: number }} Profiles
 */
/** @type {Profiles} */
let profiles = { list: [], current: null };

/** @param {string} id */
function profileSaveKey(id) {
  return LEGACY_SAVE_KEY + ':' + id;
}

function currentSaveKey() {
  return profiles.current ? profileSaveKey(profiles.current) : LEGACY_SAVE_KEY;
}

function newId() {
  return 'p' + Date.now().toString(36) + Math.floor(random() * 1000);
}

function saveProfiles() {
  storageWrite(PROFILES_KEY, JSON.stringify(profiles));
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) profiles = JSON.parse(raw);
  } catch {
    // profils illisibles ou stockage bloqué : on repart d'une liste vide, réparée juste après
  }
  if (!profiles || !Array.isArray(profiles.list)) profiles = { list: [], current: null };
  profiles.list.forEach((p) => {
    p.name = cleanName(p.name); // porte d'entrée : profils enregistrés ou importés
    p.avatar = fixAvatar(p.avatar);
    // la classe : liste blanche (profil ancien, importé ou abîmé : « selon l'âge »)
    p.grade = typeof p.grade === 'string' && gradeToDiff(p.grade) ? p.grade : '';
  });

  // migration : une ancienne partie unique devient le premier joueur
  if (!profiles.list.length) {
    /** @type {{ name?: string, avatar?: string } | null} une ancienne partie (JSON lu tel quel) */
    let legacy = null;
    try {
      legacy = JSON.parse(localStorage.getItem(LEGACY_SAVE_KEY) || 'null');
    } catch {
      // ancienne partie illisible : rien à migrer
    }
    const id = newId();
    profiles.list = [{ id, name: (legacy && legacy.name) || '', avatar: (legacy && fixAvatar(legacy.avatar)) || '👧' }];
    profiles.current = id;
    if (legacy) {
      storageWrite(profileSaveKey(id), JSON.stringify(legacy));
    }
    saveProfiles();
  }
  if (!profiles.current || !profiles.list.some((p) => p.id === profiles.current)) {
    profiles.current = profiles.list[0].id;
    saveProfiles();
  }
}

function currentProfile() {
  return profiles.list.find((p) => p.id === profiles.current) || profiles.list[0];
}

// garde la fiche du joueur (nom/avatar) synchro avec son état de jeu
function syncProfileFromState() {
  const p = currentProfile();
  if (!p) return;
  p.name = state.name;
  p.avatar = state.avatar;
  p.look = state.look ? Object.assign({}, state.look) : null; // pour dessiner son avatar habillé partout
  saveProfiles();
}

// la partie de chaque joueur est sauvegardée sous sa propre clé
setSaveSlot({
  key: currentSaveKey,
  afterSave: syncProfileFromState,
  afterLoad: (st) => {
    st.avatar = fixAvatar(st.avatar);
  },
});

/**
 * @param {string} id
 * @param {boolean} [silent]
 */
function switchProfile(id, silent) {
  if (id === profiles.current) return;
  save(); // sauvegarde le joueur courant
  profiles.current = id;
  saveProfiles();
  load(); // charge le nouveau
  setCurrentWorld(worldUnlocked(currentWorld) ? currentWorld : 'lagon');
  refreshAll();
  if (!silent) {
    playSound('good');
    const p = currentProfile();
    speak(`À toi de jouer ${p.name || ''} !`);
    showToast(`${avatarText(p.avatar)} ${p.name || 'Joueur'}`);
  }
}

/**
 * @param {string} name
 * @param {string} avatar
 * @param {{ age?: number | null, gender?: string, companion?: string | null }} [details]
 */
function addProfile(name, avatar, { age, gender, companion } = {}) {
  const id = newId();
  // la pause du nouveau joueur : le réglage familial (la dernière durée choisie par un adulte)
  profiles.list.push({
    id,
    name: cleanName(name),
    avatar: avatar || '👧',
    age: age || null,
    gender: gender || '',
    companion: companion || defaultCompanionFor(gender || ''),
    pauseMin: Number(profiles.familyPause) || 0,
    grade: '', // « selon l'âge » : la classe se choisit dans l'espace parents
  });
  profiles.current = id;
  saveProfiles();
  replaceState(freshState({ name: name || '', avatar: avatar || '👧', visited: ['lagon'] }));
  save();
  setCurrentWorld('lagon');
  refreshAll();
  return id;
}

// à la suppression d'un joueur (party-state.js le retire de la partie en cours) ;
// un point d'accroche plutôt qu'un import, pour éviter un cycle profiles ↔ party-state
/** @type {((id: string) => void)[]} */
const profileDeleteHooks = [];
/** @param {(id: string) => void} fn */
function onProfileDelete(fn) {
  profileDeleteHooks.push(fn);
}

/** @param {string} id */
function deleteProfile(id) {
  if (profiles.list.length <= 1) return false;
  profiles.list = profiles.list.filter((p) => p.id !== id);
  storageRemove(profileSaveKey(id));
  profileDeleteHooks.forEach((fn) => fn(id)); // party-state.js le retire de la partie en cours
  if (profiles.current === id) {
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
/** @type {(() => void)[]} */
const profileRefreshHooks = [];
/** @param {() => void} fn */
function onProfileRefresh(fn) {
  profileRefreshHooks.push(fn);
}
function refreshAll() {
  profileRefreshHooks.forEach((fn) => fn());
}

/* ---------- Accords féminin / masculin / neutre ---------- */
// 'f' = féminin, 'm' = masculin, '' = neutre (formulations sans accord)
function playerGender() {
  const p = currentProfile() || null;
  return (p && p.gender) || '';
}

// ac('fort') -> 'fort' / 'forte' ; ac('champion','championne')
/**
 * @param {string} masc
 * @param {string} [fem]
 */
function ac(masc, fem) {
  const g = playerGender();
  if (g === 'f') return fem || masc + 'e';
  return masc;
}

export {
  ac,
  addProfile,
  currentProfile,
  deleteProfile,
  LEGACY_SAVE_KEY,
  loadProfiles,
  onProfileDelete,
  onProfileRefresh,
  playerGender,
  profiles,
  PROFILES_KEY,
  profileSaveKey,
  refreshAll,
  saveProfiles,
  switchProfile,
  syncProfileFromState,
};
