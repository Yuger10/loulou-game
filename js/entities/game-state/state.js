/* ---------- État de la partie du joueur courant : sauvegarde, migrations, niveau ---------- */
import { cleanName, reportUnreadable, storageWrite } from '../../shared/lib/index.js';
import { setAudioPrefsSource } from '../../shared/ui/index.js';
import { SQUISHY_ISLAND_SERIES } from '../squishy/index.js';

const MISSIONS_PER_LEVEL = 5;

const SAVE_KEY = 'lagon-magique-save';

/* ---------- État ---------- */
const SAVE_VERSION = 11;

/* Les types de la partie : ils décrivent DEFAULT_STATE, champ par champ.
   Les tables (inventaire, amitiés…) sont indexées par un id d'objet, de
   personnage, d'île ou de jour (AAAA-MM-JJ). */

/**
 * Une quête du jour (js/features/quests) : `target` null = n'importe lequel.
 * @typedef {{ type: string, target: string | null, goal: number, n: number, label: string }} Quest
 */
/** @typedef {{ date: string, list: Quest[], claimed: boolean }} DailyQuests */
/**
 * Le suivi d'un mini-jeu (js/features/adaptive) : `lvl`, `atLvl` et `support`
 * n'apparaissent qu'une fois le niveau du jeu adapté ; `hints` manque dans des
 * parties réelles (v66.2, holdout) : il se lit `s.hints || 0`.
 * @typedef {{
 *   wins: number,
 *   fails: number,
 *   errors: number,
 *   last: string | null,
 *   recent: Array<{ t: number, e: number, ok: boolean }>,
 *   hints?: number,
 *   lvl?: number,
 *   atLvl?: Array<{ ok: boolean, e: number }>,
 *   support?: boolean,
 * }} SkillRecord
 */
/** @typedef {{ date: string, min: number }} PauseExtra */
/** Ce que porte l'avatar (js/features/wardrobe) : un id d'habit par emplacement, ou null.
 * @typedef {{ tete: string | null, visage: string | null, tenue: string | null, cape: string | null }} Look */
/** La pause d'un jour (js/features/rest) : `at` est l'heure HH:MM.
 * @typedef {{ at: string | null, activity: string | null, skipped: boolean, attempts: number }} RestDay */
/** Les compteurs du jour de l'équipe : `zap` par île, `tom` une fois.
 * @typedef {{ date: string, zap: Record<string, boolean>, tom: boolean }} TeamDay */
/** @typedef {{ open: boolean, met: string[], mates: string[], day: TeamDay | null }} TeamState */
/**
 * La collection de squishies (détail des champs dans squishyFreshState).
 * @typedef {{
 *   owned: Record<string, number>,
 *   boxes: Array<string | null>,
 *   shelf: Array<string | null>,
 *   dry: number,
 *   done: Record<string, boolean>,
 *   fromStory: Record<string, boolean>,
 *   day: { date: string, bought: number, sorted: number } | null,
 *   sorted: number,
 *   hello: boolean,
 *   treasures: string[],
 * }} SquishyState
 */
/**
 * La partie d'un joueur, telle que sauvegardée (exactement les clés de DEFAULT_STATE).
 * @typedef {{
 *   v: number,
 *   coins: number,
 *   inventory: Record<string, number>,
 *   missions: number,
 *   sound: boolean,
 *   voice: boolean,
 *   newItems: number,
 *   decos: string[],
 *   name: string,
 *   avatar: string,
 *   seen: Record<string, boolean>,
 *   quests: DailyQuests | null,
 *   albumReward: boolean,
 *   visited: string[],
 *   gameCounts: Record<string, number>,
 *   storySolved: Record<string, boolean>,
 *   skills: Record<string, SkillRecord>,
 *   playTime: Record<string, number>,
 *   pauseExtra: PauseExtra | null,
 *   wardrobe: string[],
 *   look: Look,
 *   seasonGifts: Record<string, boolean>,
 *   music: boolean,
 *   soundVolume: number,
 *   restLog: Record<string, RestDay>,
 *   restRecall: string | null,
 *   storyMissions: Record<string, number>,
 *   storyEpisodes: Record<string, number>,
 *   friends: Record<string, number>,
 *   friendRewards: Record<string, boolean>,
 *   team: TeamState,
 *   charsHelped: Record<string, boolean>,
 *   squishies: SquishyState,
 *   skyIntroSeen: boolean,
 *   expeditionIntroSeen: boolean,
 *   season2Done: boolean,
 *   season3Done: boolean,
 *   decoPos: Record<string, { x: number, y: number }>,
 *   helped: { date: string, ids: Record<string, number> } | null,
 *   tipDragDeco: boolean,
 * }} GameState
 */
/**
 * Une sauvegarde lue du stockage, avant migration : n'importe quelle version,
 * donc des champs connus peut-être absents et peut-être d'autres clés.
 * @typedef {Partial<GameState> & Record<string, unknown>} SavedGame
 */

/** @type {GameState} */
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
  gameCounts: {}, // nombre de fois jouées, par type de mini-jeu (pour forcer la variété)
  storySolved: {}, // énigmes d'histoire déjà résolues, par île (js/features/story/story.js)
  skills: {}, // réussites et erreurs par mini-jeu (espace parents)
  playTime: {}, // secondes de jeu actif, par jour (espace parents)
  pauseExtra: null, // minutes ajoutées aujourd'hui par un adulte { date, min }
  wardrobe: [], // objets de la garde-robe achetés (js/features/wardrobe/wardrobe.js)
  look: { tete: null, visage: null, tenue: null, cape: null }, // ce que porte l'avatar
  seasonGifts: {}, // cadeaux de saison reçus, ex. { 'noel-2026': true } (js/features/seasons/seasons.js)
  music: false, // musique d'ambiance (js/features/music/music.js), coupée par défaut
  soundVolume: 80, // volume général des sons et de la musique, 0 à 100 (js/shared/ui/sound.js)
  restLog: {}, // pauses par jour : { at, activity, skipped, attempts } (js/features/rest)
  restRecall: null, // dernier jour où le compagnon a rappelé l'activité de la veille
  storyMissions: {}, // missions réussies par île, pour les épisodes (js/features/story/episodes.js)
  storyEpisodes: {}, // épisodes déjà vus, par île
  friends: {}, // points d'amitié par personnage (cadeaux, js/features/gifts/gifts.js)
  friendRewards: {}, // surprise de « meilleur ami » déjà donnée, par personnage
  team: { open: false, met: [], mates: [], day: null }, // l'équipe des compagnons (js/features/companion-team, v52)
  charsHelped: {}, // personnages déjà aidés au moins une fois (Sam le guide, v52)
  squishies: squishyFreshState(), // la collection de squishies (js/features/squishies, v53)
  skyIntroSeen: false, // l'ouverture du Ciel des Rêves (saison 2, v55) déjà montrée
  expeditionIntroSeen: false, // l'ouverture de La Grande Expédition (saison 3) déjà montrée
  season2Done: false, // le grand final de la saison 2 (Royaume Arc-en-ciel) déjà joué
  season3Done: false, // le grand final de la saison 3 (Grand Concert) déjà joué : le xylophone d'or est gagné
  // l'île vivante (js/features/island) : ces champs étaient posés sans être ici, et
  // load() ne garde que les champs de DEFAULT_STATE : ils se perdaient au redémarrage
  decoPos: {}, // place des décorations que l'enfant a fait glisser : { clé: { x, y } }
  helped: null, // personnages déjà aidés aujourd'hui (bulle ❤️) : { date, ids }
  tipDragDeco: false, // l'astuce « fais glisser tes décorations » déjà vue
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
     hello      la chambre a déjà été annoncée (première ouverture)
     treasures  les squishies uniques (case « Trésors »), jamais dans les boîtes :
                ✨ Grisou arc-en-ciel, donné par le grand final de la saison 2 */
/** @returns {SquishyState} */
function squishyFreshState() {
  return {
    owned: {},
    boxes: [],
    shelf: Array(12).fill(null),
    dry: 0,
    done: {},
    fromStory: {},
    day: null,
    sorted: 0,
    hello: false,
    treasures: [],
  };
}

// copie profonde : sinon inventory/seen/decos seraient partagés avec DEFAULT_STATE
/**
 * @param {Partial<GameState>} [extra]
 * @returns {GameState}
 */
function freshState(extra) {
  return Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATE)), extra || {});
}

// la partie en cours, fabriquée depuis DEFAULT_STATE (une seule liste des champs :
// une copie à la main avait déjà oublié des champs, voir test/redemarrage.test.js)
/** @type {GameState} */
let state = freshState();

/* L'emplacement de sauvegarde : le joueur courant (entities/player, une couche
   au-dessus) y branche sa clé, et ce qu'il faut faire après chaque
   sauvegarde (recopier prénom et avatar dans sa fiche) et chaque chargement
   (corriger un ancien avatar). Sans joueur : l'ancienne clé unique. */
/** @typedef {{ key: () => string, afterSave: () => void, afterLoad: (state: GameState) => void }} SaveSlot */
/** @type {SaveSlot} */
const saveSlot = { key: () => SAVE_KEY, afterSave: () => {}, afterLoad: () => {} };
/** @param {Partial<SaveSlot>} slot */
function setSaveSlot(slot) {
  Object.assign(saveSlot, slot);
}

function save() {
  // un échec (mémoire pleine…) est signalé par storageWrite : message et espace parents
  if (storageWrite(saveSlot.key(), JSON.stringify(state))) saveSlot.afterSave();
}

// Migre une sauvegarde d'une ancienne version vers la structure courante
/**
 * @param {SavedGame} saved
 * @returns {SavedGame}
 */
function migrate(saved) {
  const v = saved.v || 0;
  if (v < 1) {
    // v0 (jeu v1→v3) : ni profil, ni album, ni quêtes
    saved.name = saved.name || '';
    saved.avatar = saved.avatar || '👧';
    saved.seen = saved.seen || {};
    saved.quests = saved.quests || null;
    saved.albumReward = saved.albumReward || false;
    saved.visited = saved.visited || [];
    saved.decos = saved.decos || [];
  }
  if (v < 2) {
    saved.gameCounts = saved.gameCounts || {};
  }
  if (v < 3) {
    saved.storySolved = saved.storySolved || {};
  }
  if (v < 4) {
    // v52 : l'équipe des compagnons (fermée : une partie déjà au niveau 10
    // verra l'écran d'ouverture au chargement) et le compteur d'indices
    saved.team = saved.team || { open: false, met: [], mates: [], day: null };
    saved.charsHelped = saved.charsHelped || {};
    Object.values(saved.skills || {}).forEach((sk) => {
      if (sk && sk.hints == null) sk.hints = 0;
    });
  }
  if (v < 5) {
    // v53 : la collection de squishies. Rattrapage : une boîte (de la série
    // de l'île) par énigme d'histoire déjà résolue, à ouvrir.
    const sq = saved.squishies || squishyFreshState();
    Object.keys(saved.storySolved || {})
      .filter((w) => /** @type {Record<string, boolean>} */ (saved.storySolved)[w])
      .forEach((w) => {
        if (sq.fromStory[w]) return;
        sq.fromStory[w] = true;
        sq.boxes.push(SQUISHY_ISLAND_SERIES[w] || null);
      });
    saved.squishies = sq;
  }
  if (v < 6) {
    // v55 : le Ciel des Rêves. Une partie qui a déjà son niveau d'ouverture le verra
    // s'ouvrir au prochain lancement (écran d'ouverture, prologue, chapitre).
    // Les îles visitées (state.visited) couvrent les deux archipels.
    saved.skyIntroSeen = false;
  }
  if (v < 7) {
    // v56 : les nouveaux sons : un volume général par joueur, 80 % par défaut
    if (typeof saved.soundVolume !== 'number') saved.soundVolume = 80;
  }
  if (v < 8) {
    // une pause qui tient : le journal des pauses (activité choisie, tentatives)
    if (!saved.restLog || typeof saved.restLog !== 'object') saved.restLog = {};
    if (saved.restRecall === undefined) saved.restRecall = null;
  }
  if (v < 9) {
    // le Royaume Arc-en-ciel : le grand final de la saison 2 (une fois), et la
    // case « Trésors » de la chambre à squishies
    saved.season2Done = false;
    if (saved.squishies && !Array.isArray(saved.squishies.treasures)) saved.squishies.treasures = [];
  }
  if (v < 10) {
    // la Grande Expédition (saison 3) : comme le Ciel, une partie qui a déjà son
    // niveau d'ouverture la verra s'ouvrir au prochain lancement (une seule fois)
    saved.expeditionIntroSeen = false;
  }
  if (v < 11) {
    // le Grand Concert : le grand final de la saison 3 (une fois) ; le xylophone d'or est
    // gagné si et seulement si ce drapeau est vrai
    saved.season3Done = false;
  }
  saved.v = SAVE_VERSION;
  return saved;
}

/* ---- lire une partie enregistrée : la porte d'entrée unique ----
   Une partie peut venir d'une sauvegarde importée (entrée non fiable) : elle passe
   par ici pour jouer (load) comme pour l'espace parents (autre joueur). */
/** @param {unknown} v @returns {number} un compteur : nombre fini positif, sinon 0 */
const savedCount = (v) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : 0);
/**
 * Le suivi des mini-jeux, remis en forme : des nombres, des listes, du texte
 * (il s'affiche dans l'espace parents et nourrit le niveau adapté). Les
 * compteurs et `recent` existent toujours (sans eux, l'espace parents plante).
 * @param {unknown} raw
 * @returns {GameState['skills']}
 */
function cleanSkills(raw) {
  /** @type {GameState['skills']} */
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue;
    const s = /** @type {Record<string, unknown>} */ (v);
    /** @type {SkillRecord} */
    const r = {
      wins: savedCount(s.wins),
      fails: savedCount(s.fails),
      errors: savedCount(s.errors),
      last: typeof s.last === 'string' ? s.last : null,
      recent: (Array.isArray(s.recent) ? s.recent : [])
        .filter((x) => x && typeof x === 'object')
        .map((x) => ({ t: savedCount(x.t), e: savedCount(x.e), ok: x.ok === true })),
    };
    // un champ absent reste absent (une partie réelle est relue telle quelle, holdout)
    if ('hints' in s) r.hints = savedCount(s.hints);
    if (savedCount(s.lvl)) r.lvl = savedCount(s.lvl);
    if (Array.isArray(s.atLvl))
      r.atLvl = s.atLvl
        .filter((x) => x && typeof x === 'object')
        .map((x) => ({ ok: x.ok === true, e: savedCount(x.e) }));
    if (s.support === true) r.support = true;
    out[k] = r;
  }
  return out;
}
/**
 * Le journal des pauses, remis en forme : une heure HH:MM, un nom d'activité
 * (js/features/rest vérifie qu'elle existe), un nombre de tentatives.
 * @param {unknown} raw
 * @returns {GameState['restLog']}
 */
function cleanRestLog(raw) {
  /** @type {GameState['restLog']} */
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue;
    const d = /** @type {Record<string, unknown>} */ (v);
    out[k] = {
      at: typeof d.at === 'string' && /^\d{2}:\d{2}$/.test(d.at) ? d.at : null,
      activity: typeof d.activity === 'string' && /^[a-z-]+$/.test(d.activity) ? d.activity : null,
      skipped: d.skipped === true,
      attempts: savedCount(d.attempts),
    };
  }
  return out;
}
/**
 * Une partie enregistrée (texte JSON) devenue une partie jouable : migrée vers
 * la forme actuelle, réduite aux champs connus, prénom, avatar, suivi des jeux
 * et journal des pauses vérifiés. Lève une erreur si le JSON est illisible.
 * @param {string} raw
 * @returns {GameState}
 */
function readSave(raw) {
  const saved = migrate(JSON.parse(raw));
  // ne garde que les clés connues : une sauvegarde ancienne ou corrompue ne casse pas le jeu
  // (une clé absente garde la valeur par défaut de freshState, qui est une
  // COPIE : sinon deux joueurs partageraient le même objet, ex. skills)
  /** @type {Record<string, unknown>} */
  const clean = {};
  Object.keys(DEFAULT_STATE).forEach((k) => {
    if ((saved[k] !== undefined && saved[k] !== null) || k === 'quests') clean[k] = saved[k];
  });
  const st = freshState(/** @type {Partial<GameState>} */ (clean));
  st.name = cleanName(st.name); // porte d'entrée : partie enregistrée ou importée
  st.skills = cleanSkills(st.skills);
  st.restLog = cleanRestLog(st.restLog);
  saveSlot.afterLoad(st);
  return st;
}

function load() {
  try {
    const key = saveSlot.key();
    const raw = localStorage.getItem(key);
    if (!raw) {
      state = freshState();
      return;
    }
    state = readSave(raw);
    save();
  } catch (e) {
    reportUnreadable(saveSlot.key(), e); // la progression est perdue : un adulte doit le savoir
  }
}

// Remplacer toute la partie (nouveau joueur) : seul ce fichier réaffecte `state`
/** @param {GameState} next */
function replaceState(next) {
  state = next;
}

function resetState() {
  state = freshState({
    sound: state.sound,
    voice: state.voice,
    name: state.name,
    avatar: state.avatar,
  });
  save();
}

// Compteur de défis joués, par joueur (stocké dans sa sauvegarde) : permet
// de proposer en priorité les types de mini-jeux les moins essayés, pour
// que chaque joueur finisse par toutes les découvrir.
/** @param {string} key */
function gameCount(key) {
  return (state.gameCounts && state.gameCounts[key]) || 0;
}

/** @param {string} key */
function trackGamePlayed(key) {
  if (!state.gameCounts) state.gameCounts = {};
  state.gameCounts[key] = gameCount(key) + 1;
  save();
}

/* Les niveaux : un niveau vaut toujours MISSIONS_PER_LEVEL missions réussies
   (5), du premier au dernier. Le niveau d'ouverture de chaque île est dans
   WORLDS (js/entities/world) ; le tableau de référence est conductor/niveaux.md.
   Ces fonctions sont les seules à faire le calcul (niveau, missions qui
   restent), pour que la carte, l'île et les profils disent la même chose. */
/** @param {unknown} missions un nombre, ou ce qu'un vieux profil a gardé (converti par Number) */
function levelOf(missions) {
  return 1 + Math.floor((Number(missions) || 0) / MISSIONS_PER_LEVEL);
}
// missions réussies qu'il faut pour atteindre le niveau `lvl`
/** @param {number} lvl */
function missionsForLevel(lvl) {
  return (Math.max(1, lvl) - 1) * MISSIONS_PER_LEVEL;
}
// missions qu'il reste à réussir pour atteindre le niveau `lvl` (0 si atteint)
/** @param {number} lvl */
function missionsUntil(lvl) {
  return Math.max(0, missionsForLevel(lvl) - state.missions);
}

function level() {
  return levelOf(state.missions);
}

function levelProgress() {
  return (state.missions % MISSIONS_PER_LEVEL) / MISSIONS_PER_LEVEL;
}

// le son et la voix (js/shared/ui) lisent les réglages du joueur courant
setAudioPrefsSource(() => state);

/* ---------- Profil (prénom + avatar) ---------- */
function hello() {
  return state.name ? state.name : '';
}

export {
  freshState,
  gameCount,
  hello,
  level,
  levelOf,
  levelProgress,
  load,
  missionsForLevel,
  MISSIONS_PER_LEVEL,
  missionsUntil,
  readSave,
  replaceState,
  resetState,
  save,
  setSaveSlot,
  squishyFreshState,
  state,
  trackGamePlayed,
};
