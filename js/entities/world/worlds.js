/* ---------- Les îles (mondes), île courante, îles débloquées ---------- */
// Les îles, dans l'ordre du voyage. `diff` = difficulté des mini-jeux (1 à 4).
const WORLDS = {
  lagon:{ name:'Le Lagon', emoji:'🌊', level:1, diff:1, short:'Lagon',
    subtitle:'Les coraux tranquilles',
    // position sur la carte (%) et allure de l'île
    map:{x:16, y:82}, shape:'lagon', icon:'🌴', sand:'#FFE2A8', land:'#7FD7C4',
    intro:"Touche un personnage pour l'aider ✨",
    sceneEmpty:"Ton lagon est encore vide… gagne des pièces pour le décorer !" },
  foret:{ name:'La Forêt', emoji:'🌲', level:3, diff:2, short:'Forêt',
    subtitle:'Les bois enchantés',
    map:{x:42, y:82}, shape:'foret', icon:'🌲', sand:'#E8D9A0', land:'#6FBF73',
    intro:"La forêt enchantée t'attend 🌿",
    sceneEmpty:"Ta forêt est encore vide… gagne des pièces pour la décorer !" },
  montagne:{ name:'La Montagne', emoji:'⛰️', level:6, diff:3, short:'Montagne',
    subtitle:'Au-dessus des nuages',
    map:{x:68, y:82}, shape:'montagne', icon:'🏔️', sand:'#DCE6EF', land:'#9FC6E8',
    intro:"Tout là-haut, les défis sont plus durs ☁️",
    sceneEmpty:"Ta montagne est toute nue… gagne des pièces pour la décorer !" },
  chateau:{ name:'Le Château', emoji:'🏰', level:10, diff:4, short:'Château',
    subtitle:'Le royaume des étoiles',
    map:{x:84, y:50}, shape:'chateau', icon:'🏰', sand:'#E9D8F5', land:'#B79BE0',
    intro:"Le château des étoiles, le plus grand défi 👑",
    sceneEmpty:"Ton château attend ses décorations !" },
  jungle:{ name:'La Jungle', emoji:'🌴', level:14, diff:5, short:'Jungle',
    subtitle:'Le trésor caché',
    map:{x:58, y:50}, shape:'jungle', icon:'🌴', sand:'#D7E8A0', land:'#2F8F5B',
    intro:"Bienvenue dans la jungle mystérieuse, le plus grand trésor t'attend 🌴",
    sceneEmpty:"Ta jungle est encore vide… gagne des pièces pour la décorer !" },
  cite:{ name:'La Cité du Temps', emoji:'🕰️', level:18, diff:5, short:'Cité',
    subtitle:'Les heures enchantées',
    map:{x:32, y:50}, shape:'cite', icon:'🕰️', sand:'#F0E6D2', land:'#8C7355',
    intro:"Bienvenue dans la Cité du Temps, où chaque heure compte 🕰️",
    sceneEmpty:"Ta cité attend ses décorations horlogères !" },
  volcan:{ name:'Le Volcan', emoji:'🌋', level:22, diff:6, short:'Volcan',
    subtitle:'Les défis des génies',
    map:{x:30, y:18}, shape:'volcan', icon:'🌋', sand:'#4A2A1E', land:'#8B2E1F',
    intro:"Le Volcan des Génies, le plus grand défi de calcul mental 🌋",
    sceneEmpty:"Ton volcan attend ses décorations brûlantes !" },
  squishy:{ name:'Le Pays Squishy', emoji:'🍡', level:26, diff:6, short:'Squishy',
    subtitle:'Le monde tout doux',
    game:'shapes',   // son mini-jeu, toujours proposé sur cette île
    map:{x:70, y:18}, shape:'squishy', icon:'🍡', sand:'#FFE3F1', land:'#F4A9CE',
    intro:"Bienvenue au Pays Squishy, où tout est doux et moelleux 🍡",
    sceneEmpty:"Ton Pays Squishy attend ses décorations toutes douces !" },
};

const WORLD_ORDER = Object.keys(WORLDS);

/* ---------- Carte des îles ---------- */
let currentWorld = 'lagon';

function worldUnlocked(id){ return level() >= WORLDS[id].level; }

// prochaine île à débloquer, et progression vers celle-ci
function nextLockedWorld(){
  return WORLD_ORDER.find(id=>!worldUnlocked(id));
}
