/* ---------- État de la partie du joueur courant : sauvegarde, migrations, niveau ---------- */
const MISSIONS_PER_LEVEL = 5;

const SAVE_KEY = 'lagon-magique-save';

/* ---------- État ---------- */
const SAVE_VERSION = 3;

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
  storySolved: {},     // énigmes d'histoire déjà résolues, par île (js/story.js)
  skills: {},         // réussites et erreurs par mini-jeu (espace parents)
  playTime: {},       // secondes de jeu actif, par jour (espace parents)
  pauseExtra: null,   // minutes ajoutées aujourd'hui par un adulte { date, min }
  wardrobe: [],       // objets de la garde-robe achetés (js/wardrobe.js)
  look: { tete:null, visage:null, tenue:null, cape:null },   // ce que porte l'avatar
  seasonGifts: {},    // cadeaux de saison reçus, ex. { 'noel-2026': true } (js/seasons.js)
  music: false,       // musique d'ambiance (js/music.js), coupée par défaut
  storyMissions: {},  // missions réussies par île, pour les épisodes (js/episodes.js)
  storyEpisodes: {},  // épisodes déjà vus, par île
  friends: {},        // points d'amitié par personnage (cadeaux, js/gifts.js)
  friendRewards: {},  // surprise de « meilleur ami » déjà donnée, par personnage
};

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
  storyMissions: {},
  storyEpisodes: {},
  friends: {},
  friendRewards: {},
};

function save(){
  try{
    localStorage.setItem(typeof currentSaveKey==='function' ? currentSaveKey() : SAVE_KEY, JSON.stringify(state));
    if(typeof syncProfileFromState==='function') syncProfileFromState();
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
  saved.v = SAVE_VERSION;
  return saved;
}

function load(){
  try{
    const key = typeof currentSaveKey==='function' ? currentSaveKey() : SAVE_KEY;
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
    if(typeof fixAvatar==='function') state.avatar = fixAvatar(state.avatar);
    save();
  }catch(e){
    console.warn('Sauvegarde illisible, on repart à zéro', e);
  }
}

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
