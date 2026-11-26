/* ---------- Les îles (mondes) : leurs données, leur ordre, leur mini-jeu ----------
   Archipels, île courante et îles débloquées : availability.js. */
import { WORLDS_S3 } from './worlds-s3.js';

// Les îles, dans l'ordre du voyage. `diff` = difficulté des mini-jeux (1 à 6) ;
// `saison` = son archipel (voir ARCHIPELAGOS).
/**
 * Une île. `game` : son mini-jeu, un nom ou une fonction de l'âge du joueur.
 * @typedef {{
 *   name: string,
 *   emoji: string,
 *   level: number,
 *   diff: number,
 *   saison: number,
 *   short: string,
 *   subtitle: string,
 *   map: { x: number, y: number },
 *   shape: string,
 *   icon: string,
 *   sand: string,
 *   land: string,
 *   intro: string,
 *   sceneEmpty: string,
 *   game?: string | ((age: number) => string),
 * }} World
 */
/** @type {Record<string, World>} */
const WORLDS = {
  lagon: {
    name: 'Le Lagon',
    emoji: '🌊',
    level: 1,
    diff: 1,
    saison: 1,
    short: 'Lagon',
    subtitle: 'Les coraux tranquilles',
    // position sur la carte (%) et allure de l'île
    map: { x: 16, y: 82 },
    shape: 'lagon',
    icon: '🌴',
    sand: '#FFE2A8',
    land: '#7FD7C4',
    intro: "Touche un personnage pour l'aider ✨",
    sceneEmpty: 'Ton lagon est encore vide… gagne des pièces pour le décorer !',
  },
  foret: {
    name: 'La Forêt',
    emoji: '🌲',
    level: 3,
    diff: 2,
    saison: 1,
    short: 'Forêt',
    subtitle: 'Les bois enchantés',
    map: { x: 42, y: 82 },
    shape: 'foret',
    icon: '🌲',
    sand: '#E8D9A0',
    land: '#6FBF73',
    intro: "La forêt enchantée t'attend 🌿",
    sceneEmpty: 'Ta forêt est encore vide… gagne des pièces pour la décorer !',
  },
  montagne: {
    name: 'La Montagne',
    emoji: '⛰️',
    level: 6,
    diff: 3,
    saison: 1,
    short: 'Montagne',
    subtitle: 'Au-dessus des nuages',
    map: { x: 68, y: 82 },
    shape: 'montagne',
    icon: '🏔️',
    sand: '#DCE6EF',
    land: '#9FC6E8',
    intro: 'Tout là-haut, les défis sont plus durs ☁️',
    sceneEmpty: 'Ta montagne est toute nue… gagne des pièces pour la décorer !',
  },
  chateau: {
    name: 'Le Château',
    emoji: '🏰',
    level: 10,
    diff: 4,
    saison: 1,
    short: 'Château',
    subtitle: 'Le royaume des étoiles',
    map: { x: 84, y: 50 },
    shape: 'chateau',
    icon: '🏰',
    sand: '#E9D8F5',
    land: '#B79BE0',
    intro: 'Le château des étoiles, le plus grand défi 👑',
    sceneEmpty: 'Ton château attend ses décorations !',
  },
  jungle: {
    name: 'La Jungle',
    emoji: '🌴',
    level: 14,
    diff: 5,
    saison: 1,
    short: 'Jungle',
    subtitle: 'Le trésor caché',
    map: { x: 58, y: 50 },
    shape: 'jungle',
    icon: '🌴',
    sand: '#D7E8A0',
    land: '#2F8F5B',
    intro: "Bienvenue dans la jungle mystérieuse, le plus grand trésor t'attend 🌴",
    sceneEmpty: 'Ta jungle est encore vide… gagne des pièces pour la décorer !',
  },
  cite: {
    name: 'La Cité du Temps',
    emoji: '🕰️',
    level: 18,
    diff: 5,
    saison: 1,
    short: 'Cité',
    subtitle: 'Les heures enchantées',
    map: { x: 32, y: 50 },
    shape: 'cite',
    icon: '🕰️',
    sand: '#F0E6D2',
    land: '#8C7355',
    intro: 'Bienvenue dans la Cité du Temps, où chaque heure compte 🕰️',
    sceneEmpty: 'Ta cité attend ses décorations horlogères !',
  },
  volcan: {
    name: 'Le Volcan',
    emoji: '🌋',
    level: 22,
    diff: 6,
    saison: 1,
    short: 'Volcan',
    subtitle: 'Les défis des génies',
    map: { x: 30, y: 18 },
    shape: 'volcan',
    icon: '🌋',
    sand: '#4A2A1E',
    land: '#8B2E1F',
    intro: 'Le Volcan des Génies, le plus grand défi de calcul mental 🌋',
    sceneEmpty: 'Ton volcan attend ses décorations brûlantes !',
  },
  squishy: {
    name: 'Le Pays Squishy',
    emoji: '🍡',
    level: 26,
    diff: 6,
    saison: 1,
    short: 'Squishy',
    subtitle: 'Le monde tout doux',
    game: 'shapes', // son mini-jeu, toujours proposé sur cette île
    map: { x: 70, y: 18 },
    shape: 'squishy',
    icon: '🍡',
    sand: '#FFE3F1',
    land: '#F4A9CE',
    intro: 'Bienvenue au Pays Squishy, où tout est doux et moelleux 🍡',
    sceneEmpty: 'Ton Pays Squishy attend ses décorations toutes douces !',
  },
  // ---- Saison 2 : le Ciel des Rêves (v55) ----
  boites: {
    name: 'Le Monde des Boîtes',
    emoji: '📦',
    level: 32,
    diff: 6,
    saison: 2,
    short: 'Boîtes',
    subtitle: 'La Fabrique de boîtes',
    // son mini-jeu, selon l'âge : les gigognes avant 7 ans, les cubes ensuite
    game: (age) => (age && age < 7 ? 'nesting' : 'cubes'),
    map: { x: 18, y: 72 },
    shape: 'boites',
    icon: '📦',
    sand: '#F3E2C4',
    land: '#D9AE7A',
    intro: "Bienvenue à la Fabrique de boîtes, où les rêves attendent d'être libérés 📦",
    sceneEmpty: 'Ta Fabrique attend ses décorations en carton !',
  },
  // idée de la joueuse : « un monde de jouets qui ressemblent à des squishies »
  jouets: {
    name: 'Le Coffre aux Jouets Doux',
    emoji: '🧸',
    level: 38,
    diff: 6,
    saison: 2,
    short: 'Jouets',
    subtitle: 'Le grand coffre à jouets',
    // son mini-jeu, selon l'âge : les paquets avant 7 ans, l'étagère ensuite
    game: (age) => (age && age < 7 ? 'packs' : 'shelf'),
    map: { x: 50, y: 74 },
    shape: 'jouets',
    icon: '🧸',
    sand: '#FFF1E0',
    land: '#F7C6D9',
    intro: 'Bienvenue dans le Coffre aux Jouets Doux, où les jouets se sont endormis 🧸',
    sceneEmpty: 'Ton Coffre attend ses décorations toutes douces !',
  },
  bonbons: {
    name: 'Le Royaume des Bonbons',
    emoji: '🍭',
    level: 44,
    diff: 6,
    saison: 2,
    short: 'Bonbons',
    subtitle: 'Le village en pâtisserie',
    // son mini-jeu, selon l'âge : la recette avant 7 ans, le gâteau partagé ensuite
    game: (age) => (age && age < 7 ? 'recipe' : 'share'),
    map: { x: 82, y: 70 },
    shape: 'bonbons',
    icon: '🍭',
    sand: '#FFF3E0',
    land: '#F2A7BC',
    intro: "Bienvenue au Royaume des Bonbons, où le grand four s'est éteint 🍭",
    sceneEmpty: 'Ton Royaume attend ses décorations sucrées !',
  },
  musique: {
    name: "L'Île de la Musique",
    emoji: '🎵',
    level: 50,
    diff: 6,
    saison: 2,
    short: 'Musique',
    subtitle: "L'île en forme de piano",
    // son mini-jeu, selon l'âge : le rythme avant 7 ans, grave ou aigu ensuite
    game: (age) => (age && age < 7 ? 'rhythm' : 'pitch'),
    map: { x: 82, y: 26 },
    shape: 'musique',
    icon: '🎵',
    sand: '#FFF3C4',
    land: '#7FD1D6',
    intro: "Bienvenue sur l'Île de la Musique… où plus personne ne chante 🎵",
    sceneEmpty: 'Ton île attend ses décorations en musique !',
  },
  // l'avant-dernière île du Ciel
  jardin: {
    name: 'Le Jardin des Fées',
    emoji: '🌸',
    level: 56,
    diff: 6,
    saison: 2,
    short: 'Jardin',
    subtitle: "Le jardin vu à hauteur d'insecte",
    // son mini-jeu, selon l'âge : les coccinelles avant 7 ans, le cycle de vie ensuite
    game: (age) => (age && age < 7 ? 'ladybugs' : 'lifecycle'),
    map: { x: 50, y: 22 },
    shape: 'jardin',
    icon: '🌸',
    sand: '#FFE9D6',
    land: '#A8DDA0',
    intro: 'Bienvenue au Jardin des Fées, où plus rien ne pousse depuis longtemps 🌸',
    sceneEmpty: 'Ton jardin attend ses décorations fleuries !',
  },
  // idée de la joueuse : « le monde des licornes » ; le grand final de la saison 2
  licornes: {
    name: 'Le Royaume Arc-en-ciel',
    emoji: '🦄',
    level: 62,
    diff: 6,
    saison: 2,
    short: 'Licornes',
    subtitle: 'Le royaume des licornes',
    // son mini-jeu, selon l'âge : les potions avant 7 ans, le miroir ensuite
    game: (age) => (age && age < 7 ? 'potions' : 'mirror'),
    map: { x: 18, y: 26 },
    shape: 'licornes',
    icon: '🦄',
    sand: '#FFF0FA',
    land: '#C9B8F2',
    intro: 'Bienvenue au Royaume Arc-en-ciel… où les couleurs ont disparu 🦄',
    sceneEmpty: 'Ton Royaume attend ses décorations irisées !',
  },
  // la saison 3 « La Grande Expédition » : worlds-s3.js
  ...WORLDS_S3,
};

// toutes les îles, dans l'ordre du voyage : la saison 1, la saison 2, puis la saison 3
const WORLD_ORDER = Object.keys(WORLDS);

// « son » mini-jeu, toujours proposé sur l'île : un nom, ou une fonction de
// l'âge du joueur (le Monde des Boîtes)
/**
 * @param {string} id
 * @param {number | null} [age] absent ou null : âge inconnu
 * @returns {string | null}
 */
function worldGame(id, age) {
  const g = WORLDS[id] && WORLDS[id].game;
  return typeof g === 'function' ? g(Number(age) || 0) : g || null;
}

export { WORLD_ORDER, worldGame, WORLDS };
