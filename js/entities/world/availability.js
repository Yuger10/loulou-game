/* ---------- Ce qui est ouvert : archipels, île courante, îles débloquées, quêtes du jour ----------
   Tout ce qui dépend du niveau du joueur ; les données des îles sont dans worlds.js. */
import { CHARACTERS } from '../character/index.js';
import { level } from '../game-state/index.js';
import { CRAFTED, ITEMS } from '../item/index.js';
import { WORLD_ORDER, WORLDS } from './worlds.js';

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
/**
 * Un archipel (une saison) ; `level` est calculé par refreshArchipelagos(), d'après
 * ses îles : `null` tant qu'il n'a aucune île (il reste alors caché partout).
 * @typedef {{ name: string, short: string, emoji: string, vehicle: string, sky: boolean, level: number | null }} Archipelago
 */
// écrit sans `level` (posé par refreshArchipelagos) : d'où la conversion en deux temps
const ARCHIPELAGOS = /** @type {Record<number, Archipelago>} */ (
  /** @type {Record<number, Omit<Archipelago, 'level'>>} */ ({
    1: { name: 'Le Lagon Magique', short: 'Le Lagon', emoji: '🌊', vehicle: '⛵', sky: false },
    2: { name: 'Le Ciel des Rêves', short: 'Le Ciel', emoji: '☁️', vehicle: '🎈', sky: true },
  })
);
const ARCHIPELAGO_ORDER = [1, 2];
/* Un archipel s'ouvre avec sa première île : un seul chiffre à tenir à jour.
   Recalcule sur place l'ordre des îles et le niveau de chaque archipel ; sans
   île, pas de niveau (`Math.min()` vaudrait Infinity, qui s'afficherait).
   Appelée au chargement ; les tests la rappellent après avoir posé une île. */
/** @returns {void} */
function refreshArchipelagos() {
  WORLD_ORDER.splice(0, WORLD_ORDER.length, ...Object.keys(WORLDS));
  ARCHIPELAGO_ORDER.forEach((s) => {
    const levels = worldsOf(s).map((id) => WORLDS[id].level);
    ARCHIPELAGOS[s].level = levels.length ? Math.min(...levels) : null;
  });
}
// les archipels qui ont au moins une île : les seuls que les vues montrent
/** @returns {number[]} */
function shownArchipelagos() {
  return ARCHIPELAGO_ORDER.filter((s) => worldsOf(s).length > 0);
}
// les îles d'un archipel, dans l'ordre de son voyage (sa carte, sa route)
/** @param {number} saison */
function worldsOf(saison) {
  return WORLD_ORDER.filter((id) => (WORLDS[id].saison || 1) === saison);
}
/** @param {string} id */
function archipelagoOf(id) {
  return (WORLDS[id] && WORLDS[id].saison) || 1;
}
refreshArchipelagos();

/* ---------- Carte des îles ---------- */
let currentWorld = 'lagon';
// Changer d'île courante : seul ce fichier écrit `currentWorld` (un module ne
// peut pas réaffecter la variable d'un autre, v54).
/** @param {string} id */
function setCurrentWorld(id) {
  currentWorld = id;
}

/** @param {string} id */
function worldUnlocked(id) {
  return level() >= WORLDS[id].level;
}
/** @param {number} saison */
function archipelagoUnlocked(saison) {
  // un archipel sans île n'est jamais ouvert
  const l = ARCHIPELAGOS[saison].level;
  return worldsOf(saison).length > 0 && l !== null && level() >= l;
}

// prochaine île à débloquer (de l'archipel donné, sinon de la saison 1)
/** @param {number} [saison] */
function nextLockedWorld(saison) {
  return worldsOf(saison || 1).find((id) => !worldUnlocked(id));
}

// le niveau de la dernière île ouverte (toutes saisons) : le départ de la
// barre de progression vers la prochaine île
function lastOpenedLevel() {
  return Math.max(1, ...WORLD_ORDER.map((id) => WORLDS[id].level).filter((l) => l <= level()));
}

// objets et personnages accessibles selon les mondes débloqués
function availableItems() {
  return Object.keys(ITEMS).filter((k) => {
    const w = ITEMS[k].world || 'lagon';
    return level() >= WORLDS[w].level;
  });
}

function availableChars() {
  return Object.keys(CHARACTERS).filter((k) => {
    const w = CHARACTERS[k].world || 'lagon';
    return level() >= WORLDS[w].level;
  });
}

function availableCrafted() {
  return Object.keys(CRAFTED).filter((k) => {
    const w = CRAFTED[k].world || 'lagon';
    return level() >= WORLDS[w].level;
  });
}

export {
  ARCHIPELAGO_ORDER,
  ARCHIPELAGOS,
  archipelagoOf,
  archipelagoUnlocked,
  availableChars,
  availableCrafted,
  availableItems,
  currentWorld,
  lastOpenedLevel,
  nextLockedWorld,
  refreshArchipelagos,
  setCurrentWorld,
  shownArchipelagos,
  worldsOf,
  worldUnlocked,
};
