/* ---------- Les îles (mondes), île courante, îles débloquées ---------- */
import { level } from '../game-state/index.js';

// Les îles, dans l'ordre du voyage. `diff` = difficulté des mini-jeux (1 à 6) ;
// `saison` = son archipel (voir ARCHIPELAGOS).
const WORLDS = {
  lagon:{ name:'Le Lagon', emoji:'🌊', level:1, diff:1, saison:1, short:'Lagon',
    subtitle:'Les coraux tranquilles',
    // position sur la carte (%) et allure de l'île
    map:{x:16, y:82}, shape:'lagon', icon:'🌴', sand:'#FFE2A8', land:'#7FD7C4',
    intro:"Touche un personnage pour l'aider ✨",
    sceneEmpty:"Ton lagon est encore vide… gagne des pièces pour le décorer !" },
  foret:{ name:'La Forêt', emoji:'🌲', level:3, diff:2, saison:1, short:'Forêt',
    subtitle:'Les bois enchantés',
    map:{x:42, y:82}, shape:'foret', icon:'🌲', sand:'#E8D9A0', land:'#6FBF73',
    intro:"La forêt enchantée t'attend 🌿",
    sceneEmpty:"Ta forêt est encore vide… gagne des pièces pour la décorer !" },
  montagne:{ name:'La Montagne', emoji:'⛰️', level:6, diff:3, saison:1, short:'Montagne',
    subtitle:'Au-dessus des nuages',
    map:{x:68, y:82}, shape:'montagne', icon:'🏔️', sand:'#DCE6EF', land:'#9FC6E8',
    intro:"Tout là-haut, les défis sont plus durs ☁️",
    sceneEmpty:"Ta montagne est toute nue… gagne des pièces pour la décorer !" },
  chateau:{ name:'Le Château', emoji:'🏰', level:10, diff:4, saison:1, short:'Château',
    subtitle:'Le royaume des étoiles',
    map:{x:84, y:50}, shape:'chateau', icon:'🏰', sand:'#E9D8F5', land:'#B79BE0',
    intro:"Le château des étoiles, le plus grand défi 👑",
    sceneEmpty:"Ton château attend ses décorations !" },
  jungle:{ name:'La Jungle', emoji:'🌴', level:14, diff:5, saison:1, short:'Jungle',
    subtitle:'Le trésor caché',
    map:{x:58, y:50}, shape:'jungle', icon:'🌴', sand:'#D7E8A0', land:'#2F8F5B',
    intro:"Bienvenue dans la jungle mystérieuse, le plus grand trésor t'attend 🌴",
    sceneEmpty:"Ta jungle est encore vide… gagne des pièces pour la décorer !" },
  cite:{ name:'La Cité du Temps', emoji:'🕰️', level:18, diff:5, saison:1, short:'Cité',
    subtitle:'Les heures enchantées',
    map:{x:32, y:50}, shape:'cite', icon:'🕰️', sand:'#F0E6D2', land:'#8C7355',
    intro:"Bienvenue dans la Cité du Temps, où chaque heure compte 🕰️",
    sceneEmpty:"Ta cité attend ses décorations horlogères !" },
  volcan:{ name:'Le Volcan', emoji:'🌋', level:22, diff:6, saison:1, short:'Volcan',
    subtitle:'Les défis des génies',
    map:{x:30, y:18}, shape:'volcan', icon:'🌋', sand:'#4A2A1E', land:'#8B2E1F',
    intro:"Le Volcan des Génies, le plus grand défi de calcul mental 🌋",
    sceneEmpty:"Ton volcan attend ses décorations brûlantes !" },
  squishy:{ name:'Le Pays Squishy', emoji:'🍡', level:26, diff:6, saison:1, short:'Squishy',
    subtitle:'Le monde tout doux',
    game:'shapes',   // son mini-jeu, toujours proposé sur cette île
    map:{x:70, y:18}, shape:'squishy', icon:'🍡', sand:'#FFE3F1', land:'#F4A9CE',
    intro:"Bienvenue au Pays Squishy, où tout est doux et moelleux 🍡",
    sceneEmpty:"Ton Pays Squishy attend ses décorations toutes douces !" },
  // ---- Saison 2 : le Ciel des Rêves (v55) ----
  boites:{ name:'Le Monde des Boîtes', emoji:'📦', level:32, diff:6, saison:2, short:'Boîtes',
    subtitle:'La Fabrique de boîtes',
    // son mini-jeu, selon l'âge : les gigognes avant 7 ans, les cubes ensuite
    game:(age)=> (age && age < 7) ? 'nesting' : 'cubes',
    map:{x:30, y:62}, shape:'boites', icon:'📦', sand:'#F3E2C4', land:'#D9AE7A',
    intro:"Bienvenue à la Fabrique de boîtes, où les rêves attendent d'être libérés 📦",
    sceneEmpty:"Ta Fabrique attend ses décorations en carton !" },
};

/* Les archipels (v55) : chaque île appartient à un archipel (`saison`), qui a
   sa carte, son fond et son véhicule. Les saisons se suivent : une saison
   s'ouvre avec sa première île, et l'écart entre deux îles grandit de 2
   niveaux à chaque saison (saison 1 : tous les 4 niveaux après le départ ;
   saison 2 : tous les 6 ; saison 3 : tous les 8). Le Lagon Magique est ouvert
   dès le départ (sa dernière île, le Pays Squishy, au niveau 26) ; le Ciel
   des Rêves au niveau 32. Tableau de référence : conductor/niveaux.md
   (test/niveaux.test.js vérifie qu'il dit la même chose que WORLDS).
   Les îles du Ciel gardent la difficulté la plus haute (palier 6, toujours
   plafonnée par l'âge et le niveau de chaque jeu).
   Ajouter une île à un archipel : une entrée dans WORLDS avec `saison` et
   son niveau ; le niveau de l'archipel en découle. */
const ARCHIPELAGOS = {
  1: { name:'Le Lagon Magique', short:'Le Lagon', emoji:'🌊', vehicle:'⛵', sky:false },
  2: { name:'Le Ciel des Rêves', short:'Le Ciel', emoji:'☁️', vehicle:'🎈', sky:true },
};
const ARCHIPELAGO_ORDER = [1, 2];

// toutes les îles, dans l'ordre du voyage : la saison 1, puis la saison 2
const WORLD_ORDER = Object.keys(WORLDS);
// un archipel s'ouvre avec sa première île : un seul chiffre à tenir à jour
ARCHIPELAGO_ORDER.forEach(s=>{
  ARCHIPELAGOS[s].level = Math.min(...WORLD_ORDER.filter(id=> (WORLDS[id].saison || 1) === s).map(id=> WORLDS[id].level));
});
// les îles d'un archipel, dans l'ordre de son voyage (sa carte, sa route)
function worldsOf(saison){ return WORLD_ORDER.filter(id=> (WORLDS[id].saison || 1) === saison); }
function archipelagoOf(id){ return (WORLDS[id] && WORLDS[id].saison) || 1; }

/* ---------- Carte des îles ---------- */
let currentWorld = 'lagon';
// Changer d'île courante : seul ce fichier écrit `currentWorld` (un module ne
// peut pas réaffecter la variable d'un autre, v54).
function setCurrentWorld(id){ currentWorld = id; }

function worldUnlocked(id){ return level() >= WORLDS[id].level; }
function archipelagoUnlocked(saison){ return level() >= ARCHIPELAGOS[saison].level; }

// prochaine île à débloquer (de l'archipel donné, sinon de la saison 1)
function nextLockedWorld(saison){
  return worldsOf(saison || 1).find(id=>!worldUnlocked(id));
}

// le niveau de la dernière île ouverte (toutes saisons) : le départ de la
// barre de progression vers la prochaine île
function lastOpenedLevel(){
  return Math.max(1, ...WORLD_ORDER.map(id=> WORLDS[id].level).filter(l=> l <= level()));
}

// « son » mini-jeu, toujours proposé sur l'île : un nom, ou une fonction de
// l'âge du joueur (le Monde des Boîtes)
function worldGame(id, age){
  const g = WORLDS[id] && WORLDS[id].game;
  return typeof g === 'function' ? g(Number(age) || 0) : (g || null);
}

export {
  ARCHIPELAGO_ORDER, ARCHIPELAGOS, archipelagoOf, archipelagoUnlocked, currentWorld, lastOpenedLevel, nextLockedWorld,
  setCurrentWorld, WORLD_ORDER, worldGame, WORLDS, worldsOf, worldUnlocked
};
