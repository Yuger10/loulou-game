/* ---------- État de la partie du joueur courant : sauvegarde, migrations, niveau ---------- */
import { setAudioPrefsSource } from '../../shared/ui/index.js';
import { SQUISHY_ISLAND_SERIES } from '../squishy/index.js';

const MISSIONS_PER_LEVEL = 5;

const SAVE_KEY = 'lagon-magique-save';

/* ---------- État ---------- */
const SAVE_VERSION = 7;

const DEFAULT_STATE = {
  v: SAVE_VERSION,
  coins: 5,
  inventory: {},
  missions: 0,
  sound: true,
  voice: true,
  newItems: 0,
  decos: [],
  name: '',
  avatar: '👧',
  seen: {},
  quests: null,
  albumReward: false,
  visited: [],
  gameCounts: {},     // nombre de fois jouées, par type de mini-jeu (pour forcer la variété)
  storySolved: {},     // énigmes d'histoire déjà résolues, par île (js/features/story/story.js)
  skills: {},         // réussites et erreurs par mini-jeu (espace parents)
  playTime: {},       // secondes de jeu actif, par jour (espace parents)
  pauseExtra: null,   // minutes ajoutées aujourd'hui par un adulte { date, min }
  wardrobe: [],       // objets de la garde-robe achetés (js/features/wardrobe/wardrobe.js)
  look: { tete:null, visage:null, tenue:null, cape:null },   // ce que porte l'avatar
  seasonGifts: {},    // cadeaux de saison reçus, ex. { 'noel-2026': true } (js/features/seasons/seasons.js)
  music: false,       // musique d'ambiance (js/features/music/music.js), coupée par défaut
  soundVolume: 80,    // volume général des sons et de la musique, 0 à 100 (js/shared/ui/sound.js)
  storyMissions: {},  // missions réussies par île, pour les épisodes (js/features/story/episodes.js)
  storyEpisodes: {},  // épisodes déjà vus, par île
  friends: {},        // points d'amitié par personnage (cadeaux, js/features/gifts/gifts.js)
  friendRewards: {},  // surprise de « meilleur ami » déjà donnée, par personnage
  team: { open:false, met:[], mates:[], day:null },   // l'équipe des compagnons (js/features/companion-team, v52)
  charsHelped: {},    // personnages déjà aidés au moins une fois (Sam le guide, v52)
  squishies: squishyFreshState(),   // la collection de squishies (js/features/squishies, v53)
  skyIntroSeen: false,  // l'ouverture du Ciel des Rêves (saison 2, v55) déjà montrée
};

/* La collection de squishies (v53) : état neuf.
     owned      squishies obtenus : { id: nombre d'exemplaires }
     boxes      boîtes surprises pas encore ouvertes : la série de chacune
                (id de SQUISHY_SERIES), ou null pour une boîte « mystère »
     shelf      les 12 emplacements de l'étagère (id ou null)
     dry        boîtes d'affilée sans nouveauté (filet de sécurité)
     done       séries complétées (bonus de pièces déjà donné)
     fromStory  îles dont l'énigme a déjà donné sa boîte
     day        { date, bought, sorted } : achats et rangements du jour
     sorted     boîtes de rangement remplies, en tout
     hello      la chambre a déjà été annoncée (première ouverture) */
function squishyFreshState(){
  return { owned:{}, boxes:[], shelf:Array(12).fill(null), dry:0, done:{}, fromStory:{}, day:null, sorted:0, hello:false };
}

// copie profonde : sinon inventory/seen/decos seraient partagés avec DEFAULT_STATE
function freshState(extra){
  return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), extra||{});
}

let state = {
  v: SAVE_VERSION,
  coins: 5,
  inventory: {},
  missions: 0,
  sound: true,
  voice: true,
  newItems: 0,
  decos: [],
  name: '',
  avatar: '👧',
  seen: {},           // objets déjà découverts (album)
  quests: null,       // quêtes du jour { date, list:[{type,target,goal,done,n}], claimed }
  albumReward: false, // récompense d'album complet déjà donnée
  visited: [],        // îles déjà découvertes (pour annoncer les nouvelles)
  gameCounts: {},     // nombre de fois jouées, par type de mini-jeu
  storySolved: {},    // énigmes d'histoire déjà résolues, par île
  skills: {},
  playTime: {},
  pauseExtra: null,
  wardrobe: [],
  look: { tete:null, visage:null, tenue:null, cape:null },
  seasonGifts: {},
  music: false,
  soundVolume: 80,
  storyMissions: {},
  storyEpisodes: {},
  friends: {},
  friendRewards: {},
  team: { open:false, met:[], mates:[], day:null },
  charsHelped: {},
  squishies: squishyFreshState(),
  skyIntroSeen: false,
};

/* L'emplacement de sauvegarde : le joueur courant (entities/player, une couche
   au-dessus) y branche sa clé, et ce qu'il faut faire après chaque
   sauvegarde (recopier prénom et avatar dans sa fiche) et chaque chargement
   (corriger un ancien avatar). Sans joueur : l'ancienne clé unique. */
const saveSlot = { key: ()=> SAVE_KEY, afterSave: ()=>{}, afterLoad: ()=>{} };
function setSaveSlot(slot){ Object.assign(saveSlot, slot); }

function save(){
  try{
    localStorage.setItem(saveSlot.key(), JSON.stringify(state));
    saveSlot.afterSave();
  }catch(e){}
}

// Migre une sauvegarde d'une ancienne version vers la structure courante
function migrate(saved){
  const v = saved.v || 0;
  if(v < 1){
    // v0 (jeu v1→v3) : ni profil, ni album, ni quêtes
    saved.name = saved.name || '';
    saved.avatar = saved.avatar || '👧';
    saved.seen = saved.seen || {};
    saved.quests = saved.quests || null;
    saved.albumReward = saved.albumReward || false;
    saved.visited = saved.visited || [];
    saved.decos = saved.decos || [];
  }
  if(v < 2){
    saved.gameCounts = saved.gameCounts || {};
  }
  if(v < 3){
    saved.storySolved = saved.storySolved || {};
  }
  if(v < 4){
    // v52 : l'équipe des compagnons (fermée : une partie déjà au niveau 10
    // verra l'écran d'ouverture au chargement) et le compteur d'indices
    saved.team = saved.team || { open:false, met:[], mates:[], day:null };
    saved.charsHelped = saved.charsHelped || {};
    Object.values(saved.skills || {}).forEach(sk=>{ if(sk && sk.hints == null) sk.hints = 0; });
  }
  if(v < 5){
    // v53 : la collection de squishies. Rattrapage : une boîte (de la série
    // de l'île) par énigme d'histoire déjà résolue, à ouvrir.
    const sq = saved.squishies || squishyFreshState();
    Object.keys(saved.storySolved || {}).filter(w=> saved.storySolved[w]).forEach(w=>{
      if(sq.fromStory[w]) return;
      sq.fromStory[w] = true;
      sq.boxes.push(SQUISHY_ISLAND_SERIES[w] || null);
    });
    saved.squishies = sq;
  }
  if(v < 6){
    // v55 : le Ciel des Rêves. Une partie déjà au niveau 36 ou plus le verra
    // s'ouvrir au prochain lancement (écran d'ouverture, prologue, chapitre).
    // Les îles visitées (state.visited) couvrent les deux archipels.
    saved.skyIntroSeen = false;
  }
  if(v < 7){
    // v56 : les nouveaux sons : un volume général par joueur, 80 % par défaut
    if(typeof saved.soundVolume !== 'number') saved.soundVolume = 80;
  }
  saved.v = SAVE_VERSION;
  return saved;
}

function load(){
  try{
    const key = saveSlot.key();
    const raw = localStorage.getItem(key);
    if(!raw){ state = freshState(); return; }
    const saved = migrate(JSON.parse(raw));
    // ne garde que les clés connues : une sauvegarde ancienne ou corrompue ne casse pas le jeu
    // (une clé absente garde la valeur par défaut de freshState, qui est une
    // COPIE : sinon deux joueurs partageraient le même objet, ex. skills)
    const clean = {};
    Object.keys(DEFAULT_STATE).forEach(k=>{
      if((saved[k] !== undefined && saved[k] !== null) || k==='quests') clean[k] = saved[k];
    });
    state = freshState(clean);
    saveSlot.afterLoad(state);
    save();
  }catch(e){
    console.warn('Sauvegarde illisible, on repart à zéro', e);
  }
}

// Remplacer toute la partie (nouveau joueur) : seul ce fichier réaffecte `state`
function replaceState(next){ state = next; }

function resetState(){
  state = freshState({
    sound: state.sound, voice: state.voice,
    name: state.name, avatar: state.avatar,
  });
  save();
}

// Compteur de défis joués, par joueur (stocké dans sa sauvegarde) : permet
// de proposer en priorité les types de mini-jeux les moins essayés, pour
// que chaque joueur finisse par toutes les découvrir.
function gameCount(key){ return (state.gameCounts && state.gameCounts[key]) || 0; }

function trackGamePlayed(key){
  if(!state.gameCounts) state.gameCounts = {};
  state.gameCounts[key] = gameCount(key) + 1;
  save();
}

function level(){ return 1 + Math.floor(state.missions / MISSIONS_PER_LEVEL); }

function levelProgress(){ return (state.missions % MISSIONS_PER_LEVEL) / MISSIONS_PER_LEVEL; }

// le son et la voix (js/shared/ui) lisent les réglages du joueur courant
setAudioPrefsSource(()=> state);

/* ---------- Profil (prénom + avatar) ---------- */
function hello(){ return state.name ? state.name : ''; }

export {
  freshState, gameCount, hello, level, levelProgress, load, MISSIONS_PER_LEVEL, replaceState,
  resetState, save, setSaveSlot, squishyFreshState, state, trackGamePlayed
};
