/* ---------- Données ---------- */
const ITEMS = {
  coquillage:{emoji:'🐚', name:'Coquillage', price:2},
  perle:{emoji:'🦪', name:'Perle', price:3},
  ruban:{emoji:'🎀', name:'Ruban', price:2},
  fleur:{emoji:'🌸', name:'Fleur', price:2},
  etoile:{emoji:'⭐', name:'Étoile', price:4},
  gemme:{emoji:'💎', name:'Gemme', price:5},
  boussole:{emoji:'🧭', name:'Boussole', price:4},
  crochet:{emoji:'🪝', name:'Grappin', price:3},
  // Forêt enchantée
  champignon:{emoji:'🍄', name:'Champignon', price:3, world:'foret'},
  gland:{emoji:'🌰', name:'Gland', price:2, world:'foret'},
  plume:{emoji:'🪶', name:'Plume', price:4, world:'foret'},
  miel:{emoji:'🍯', name:'Pot de miel', price:5, world:'foret'},
  trefle:{emoji:'🍀', name:'Trèfle porte-bonheur', price:6, world:'foret'},
  croc:{emoji:'🦴', name:'Vieil os', price:3, world:'foret'},
  silex:{emoji:'🪨', name:'Silex', price:4, world:'foret'},
  // Montagne des Nuages
  nuage:{emoji:'☁️', name:'Nuage de coton', price:4, world:'montagne'},
  cristal:{emoji:'🔮', name:'Cristal', price:7, world:'montagne'},
  eclair:{emoji:'⚡', name:'Éclair', price:6, world:'montagne'},
  flocon:{emoji:'❄️', name:'Flocon', price:5, world:'montagne'},
  boulon:{emoji:'🔩', name:'Boulon', price:4, world:'montagne'},
  // Château des Étoiles
  poussiere:{emoji:'💫', name:"Poussière d'étoile", price:8, world:'chateau'},
  cle:{emoji:'🗝️', name:'Clé dorée', price:9, world:'chateau'},
  bougie:{emoji:'🕯️', name:'Bougie magique', price:7, world:'chateau'},
  parchemin:{emoji:'📜', name:'Parchemin', price:8, world:'chateau'},
  bouclier:{emoji:'🛡️', name:'Petit bouclier', price:9, world:'chateau'},
  // Jungle mystérieuse (5e île : un très grand trésor à collectionner)
  liane:{emoji:'🌿', name:'Liane', price:3, world:'jungle'},
  masque:{emoji:'🎭', name:'Masque tribal', price:6, world:'jungle'},
  banane:{emoji:'🍌', name:'Régime de bananes', price:4, world:'jungle'},
  fleurtropicale:{emoji:'🌺', name:'Fleur tropicale', price:5, world:'jungle'},
  noixcoco:{emoji:'🥥', name:'Noix de coco', price:5, world:'jungle'},
  ananas:{emoji:'🍍', name:'Ananas doré', price:6, world:'jungle'},
  scarabee:{emoji:'🪲', name:'Scarabée doré', price:7, world:'jungle'},
  tambour:{emoji:'🥁', name:'Tambour sacré', price:8, world:'jungle'},
};
const CRAFTED = {
  collier:{emoji:'📿', name:'Collier magique', price:10,
    recipe:{coquillage:2, ruban:1}},
  bouquet:{emoji:'💐', name:'Bouquet enchanté', price:8,
    recipe:{perle:2, fleur:1}},
  couronne:{emoji:'👑', name:'Couronne étoilée', price:14,
    recipe:{etoile:2, gemme:1}},
  cartetresor:{emoji:'🗺️', name:'Carte au trésor', price:12,
    recipe:{boussole:1, crochet:1, coquillage:1}},
  baguette:{emoji:'🪄', name:'Baguette magique', price:12,
    recipe:{gemme:1, ruban:1, etoile:1}},
  tresor:{emoji:'🏆', name:'Trésor du lagon', price:40, tier:2,
    recipe:{collier:1, couronne:1, bouquet:1}},
  // Forêt enchantée
  chapeau:{emoji:'🎩', name:'Chapeau de sorcière', price:11, world:'foret',
    recipe:{champignon:2, plume:1}},
  potion:{emoji:'🧪', name:'Potion magique', price:13, world:'foret',
    recipe:{champignon:1, miel:1, trefle:1}},
  nid:{emoji:'🪺', name:'Nid douillet', price:9, world:'foret',
    recipe:{gland:3, plume:1}},
  lancepierre:{emoji:'🏹', name:'Arc des bois', price:12, world:'foret',
    recipe:{silex:1, croc:1, plume:1}},
  grimoire:{emoji:'📖', name:'Grimoire des bois', price:45, tier:2, world:'foret',
    recipe:{potion:1, chapeau:1, nid:1}},
  // Montagne des Nuages
  carillon:{emoji:'🎐', name:'Carillon du ciel', price:16, world:'montagne',
    recipe:{nuage:2, cristal:1}},
  tempete:{emoji:'🌩️', name:'Petite tempête', price:18, world:'montagne',
    recipe:{eclair:2, flocon:1}},
  robot:{emoji:'🤖', name:'Robot des cimes', price:22, world:'montagne',
    recipe:{boulon:2, eclair:1, cristal:1}},
  filante:{emoji:'🌠', name:'Étoile filante', price:55, tier:2, world:'montagne',
    recipe:{carillon:1, tempete:1, cristal:2}},
  // Château des Étoiles
  lanterne:{emoji:'🏮', name:'Lanterne enchantée', price:20, world:'chateau',
    recipe:{bougie:2, poussiere:1}},
  sceptre:{emoji:'🔱', name:'Sceptre royal', price:24, world:'chateau',
    recipe:{cle:1, parchemin:1, poussiere:1}},
  epee:{emoji:'⚔️', name:'Épée du courage', price:26, world:'chateau',
    recipe:{bouclier:1, cle:1, poussiere:2}},
  royaume:{emoji:'🏰', name:'Royaume des étoiles', price:70, tier:2, world:'chateau',
    recipe:{lanterne:1, sceptre:1, parchemin:2}},
  // Jungle mystérieuse
  totem:{emoji:'🗿', name:'Totem mystérieux', price:14, world:'jungle',
    recipe:{masque:1, scarabee:1}},
  couronnefleurs:{emoji:'🌼', name:'Couronne de fleurs', price:11, world:'jungle',
    recipe:{fleurtropicale:2, liane:1}},
  festin:{emoji:'🍲', name:'Festin tropical', price:13, world:'jungle',
    recipe:{banane:1, noixcoco:1, ananas:1}},
  rythme:{emoji:'🎶', name:'Rythme de la jungle', price:15, world:'jungle',
    recipe:{tambour:1, scarabee:1}},
  templecache:{emoji:'🛕', name:'Temple caché', price:65, tier:2, world:'jungle',
    recipe:{totem:1, couronnefleurs:1, festin:1}},
};
const ALL_ITEMS = Object.assign({}, ITEMS, CRAFTED);

const CHARACTERS = {
  sirene:{
    emoji:'🧜‍♀️', name:'Marina', title:'la sirène',
    loot:['coquillage','perle'],
    texts:[
      "Aide-moi à retrouver un trésor du lagon, tu veux bien ?",
      "Les vagues ont caché mes perles… tu m'aides à les retrouver ?",
      "Coucou ! Un petit jeu avant d'aller nager ?",
    ]},
  licorne:{
    emoji:'🦄', name:'Étincelle', title:'la licorne',
    loot:['etoile','gemme'],
    texts:[
      "J'ai besoin de toi pour un petit défi magique !",
      "Ma corne brille quand tu réussis un défi. On essaie ?",
      "Les étoiles sont tombées dans le lagon ! Tu m'aides ?",
    ]},
  danseuse:{
    emoji:'💃', name:'Luna', title:'la danseuse',
    loot:['ruban','fleur'],
    texts:[
      "Viens jouer avec moi avant la grande ronde !",
      "J'ai perdu mes rubans en dansant… un petit jeu pour m'aider ?",
      "Un, deux, trois… on joue ensemble ?",
    ]},
  pirate:{
    emoji:'🏴‍☠️', name:'Tiago', title:'le pirate',
    loot:['boussole','crochet'],
    texts:[
      "Mille sabords ! Tu m'aides à retrouver mon trésor ?",
      "Un vrai pirate résout les énigmes. Tu en es capable ?",
      "Ma boussole est cassée… tu m'aides à retrouver le nord ?",
    ]},
  // --- Forêt enchantée ---
  fee:{
    emoji:'🧚‍♀️', name:'Sylvie', title:'la fée', world:'foret',
    loot:['champignon','trefle'],
    texts:[
      "Bienvenue dans la forêt ! Tu m'aides à cueillir des champignons ?",
      "Ma poudre magique s'est envolée… un petit défi pour la retrouver ?",
      "Chut… la forêt a un secret pour toi !",
    ]},
  biche:{
    emoji:'🦌', name:'Maïa', title:'la biche', world:'foret',
    loot:['gland','miel'],
    texts:[
      "J'ai faim ! Tu m'aides à trouver des glands ?",
      "Les abeilles m'ont donné du miel, mais il faut le mériter !",
      "On joue avant que la nuit tombe sur la forêt ?",
    ]},
  hibou:{
    emoji:'🦉', name:'Hector', title:'le hibou', world:'foret',
    loot:['plume','trefle'],
    texts:[
      "Hou hou ! Un petit test pour voir si tu es maligne ?",
      "J'ai perdu mes plus belles plumes cette nuit…",
      "Les hiboux adorent les devinettes. À toi de jouer !",
    ]},
  loup:{
    emoji:'🐺', name:'Balto', title:'le loup', world:'foret',
    loot:['croc','silex'],
    texts:[
      "Hooouuu ! Qui veut relever mon défi ?",
      "J'ai caché mon os quelque part… tu me aides à le retrouver ?",
      "Les loups sont malins. Et toi, tu l'es aussi ?",
    ]},
  // --- Montagne des Nuages ---
  dragonciel:{
    emoji:'🐉', name:'Zéphyr', title:'le dragon', world:'montagne',
    loot:['nuage','cristal'],
    texts:[
      "Monte sur mon dos ! Mais d'abord, un défi tout là-haut ☁️",
      "J'ai souffl\u00e9 trop fort et mes nuages se sont envolés…",
      "Ici, les défis sont plus durs. Tu es prête ?",
    ]},
  aigle:{
    emoji:'🦅', name:'Ariane', title:"l'aigle", world:'montagne',
    loot:['eclair','flocon'],
    texts:[
      "Je vole plus vite que l'éclair ⚡ Et toi, tu réfléchis vite ?",
      "Du haut du ciel, je vois tout. Voyons si tu vois bien aussi !",
      "Un défi entre les nuages, ça te dit ?",
    ]},
  magicienne:{
    emoji:'🧙‍♀️', name:'Céleste', title:'la magicienne', world:'montagne',
    loot:['cristal','flocon'],
    texts:[
      "Mon cristal montre ton avenir… tu vas réussir ce défi !",
      "Un sortilège a mélangé mes flocons. Tu m'aides ?",
      "Concentre-toi bien, celui-là est un peu plus difficile.",
    ]},
  robotmontagne:{
    emoji:'🤖', name:'Bolt', title:'le robot', world:'montagne',
    loot:['boulon','eclair'],
    texts:[
      "BIP BIP ! Défi logique en cours de chargement…",
      "Mes circuits sont emmêlés. Tu peux les remettre en ordre ?",
      "Calcul en cours… à toi de jouer, humain !",
    ]},
  // --- Château des Étoiles ---
  princesse:{
    emoji:'👸', name:'Aurore', title:'la princesse', world:'chateau',
    loot:['poussiere','cle'],
    texts:[
      "Bienvenue au château ! Le dernier défi du royaume t'attend 👑",
      "J'ai perdu la clé de la tour aux étoiles… tu m'aides ?",
      "Seules les plus malignes arrivent jusqu'ici. Bravo !",
    ]},
  sorciere:{
    emoji:'🧙‍♀️', name:'Morgane', title:'la sorcière', world:'chateau',
    loot:['bougie','parchemin'],
    texts:[
      "Mes parchemins sont tout mélangés. Un vrai casse-tête !",
      "Allume ta cervelle comme une bougie 🕯️ et résous ça !",
      "Attention, mes défis sont les plus corsés du royaume.",
    ]},
  chevalier:{
    emoji:'🤴', name:'Prince Tao', title:'le chevalier', world:'chateau',
    loot:['bouclier','cle'],
    texts:[
      "En garde ! Enfin… en garde ton cerveau, c'est une énigme 😄",
      "Le dragon garde la tour. Résous ce défi et on y va !",
      "Un vrai chevalier n'abandonne jamais. À toi !",
    ]},
  pegase:{
    emoji:'🦄', name:'Comète', title:'le pégase', world:'chateau',
    loot:['poussiere','parchemin'],
    texts:[
      "Accroche-toi, on file vers les étoiles ✨",
      "Ma poussière d'étoile s'envole quand tu réussis un défi !",
      "En selle pour le plus grand galop du royaume ?",
    ]},
  // --- Jungle mystérieuse ---
  exploratrice:{
    emoji:'🧗‍♀️', name:'Maya', title:"l'exploratrice", world:'jungle',
    loot:['masque','scarabee'],
    texts:[
      "Suis-moi dans la jungle, l'aventure commence !",
      "J'ai égaré ma carte au trésor… un petit défi pour la retrouver ?",
      "Chut, écoute les bruits de la jungle… prête pour un jeu ?",
    ]},
  singe:{
    emoji:'🐒', name:'Kiko', title:'le singe', world:'jungle',
    loot:['banane','noixcoco'],
    texts:[
      "Ouh ouh ! Attrape-moi si tu es assez maligne !",
      "J'ai caché des bananes partout… tu m'aides à les retrouver ?",
      "Un petit jeu avant de sauter de liane en liane ?",
    ]},
  perroquet:{
    emoji:'🦜', name:'Iris', title:'la perruche', world:'jungle',
    loot:['fleurtropicale','ananas'],
    texts:[
      "Coco ! Répète après moi : tu es la meilleure !",
      "Mes plus belles plumes se sont envolées dans le vent…",
      "Les perroquets adorent les défis colorés. À toi de jouer !",
    ]},
  jaguar:{
    emoji:'🐆', name:'Jago', title:'le jaguar', world:'jungle',
    loot:['liane','tambour'],
    texts:[
      "Je suis rapide comme l'éclair… et toi ?",
      "Un vrai félin ne recule jamais devant un défi !",
      "Chhht… approche doucement, et relève mon défi.",
    ]},
};

// Les îles, dans l'ordre du voyage. `diff` = difficulté des mini-jeux (1 à 4).
const WORLDS = {
  lagon:{ name:'Le Lagon', emoji:'🌊', level:1, diff:1, short:'Lagon',
    subtitle:'Les coraux tranquilles',
    // position sur la carte (%) et allure de l'île
    map:{x:18, y:72}, shape:'lagon', icon:'🌴', sand:'#FFE2A8', land:'#7FD7C4',
    intro:"Touche un personnage pour l'aider ✨",
    sceneEmpty:"Ton lagon est encore vide… gagne des pièces pour le décorer !" },
  foret:{ name:'La Forêt', emoji:'🌲', level:3, diff:2, short:'Forêt',
    subtitle:'Les bois enchantés',
    map:{x:36, y:30}, shape:'foret', icon:'🌲', sand:'#E8D9A0', land:'#6FBF73',
    intro:"La forêt enchantée t'attend 🌿",
    sceneEmpty:"Ta forêt est encore vide… gagne des pièces pour la décorer !" },
  montagne:{ name:'La Montagne', emoji:'⛰️', level:6, diff:3, short:'Montagne',
    subtitle:'Au-dessus des nuages',
    map:{x:54, y:76}, shape:'montagne', icon:'🏔️', sand:'#DCE6EF', land:'#9FC6E8',
    intro:"Tout là-haut, les défis sont plus durs ☁️",
    sceneEmpty:"Ta montagne est toute nue… gagne des pièces pour la décorer !" },
  chateau:{ name:'Le Château', emoji:'🏰', level:10, diff:4, short:'Château',
    subtitle:'Le royaume des étoiles',
    map:{x:76, y:26}, shape:'chateau', icon:'🏰', sand:'#E9D8F5', land:'#B79BE0',
    intro:"Le château des étoiles, le plus grand défi 👑",
    sceneEmpty:"Ton château attend ses décorations !" },
  jungle:{ name:'La Jungle', emoji:'🌴', level:14, diff:5, short:'Jungle',
    subtitle:'Le trésor caché',
    map:{x:84, y:66}, shape:'jungle', icon:'🌴', sand:'#D7E8A0', land:'#2F8F5B',
    intro:"Bienvenue dans la jungle mystérieuse, le plus grand trésor t'attend 🌴",
    sceneEmpty:"Ta jungle est encore vide… gagne des pièces pour la décorer !" },
};
const WORLD_ORDER = Object.keys(WORLDS);
function charsOf(world){
  return Object.entries(CHARACTERS).filter(([,c])=>(c.world||'lagon')===world);
}
function decosOf(world){
  return Object.entries(DECOS).filter(([,d])=>(d.world||'lagon')===world);
}
const GAME_TYPES = ['memory','count','diff','puzzle','sequence','simon','math','reading','determinants','volume','compare','money'];

/* Quels types de défis proposer selon l'âge (programme de l'école
   maternelle, cycle 1, 3-6 ans — repères eduscol.education.fr) :
   - Petite section (3-4 ans) : tout juste le dénombrement (1 à 3), la
     reconnaissance visuelle (mémoire, intrus), pas encore de lecture ni
     de logique de suite.
   - Moyenne section (4-5 ans) : dénombrer jusqu'à 10, comparer des
     grandeurs (le plus grand/le plus petit), débuter les suites simples.
   - Grande section / 6 ans (début CP) : principe alphabétique et débuts
     de lecture, décomposer les nombres, suites de nombres, premiers
     calculs — tout l'éventail du jeu est alors ouvert.
   Un joueur sans âge renseigné garde l'accès à tous les jeux (comme avant). */
const AGE_GAME_TYPES = [
  { max:4, types:['memory','count','diff'] },
  { max:5, types:['memory','count','diff','volume','sequence','simon'] },
  // 6 ans et plus (ou âge non précisé) : tous les jeux, comme aujourd'hui.
];
function gameTypesForAge(age){
  const a = Number(age);
  if(!a) return GAME_TYPES;
  const tier = AGE_GAME_TYPES.find(r=>a<=r.max);
  return tier ? tier.types : GAME_TYPES;
}

/* Vocabulaire niveau CP : mots simples, lus couramment en fin de CP,
   illustrés par un emoji, avec leur genre pour le jeu des déterminants. */
const WORDS_CP = [
  { word:'chat',     plural:'chats',     emoji:'🐱', gender:'m' },
  { word:'chien',    plural:'chiens',    emoji:'🐶', gender:'m' },
  { word:'loup',     plural:'loups',     emoji:'🐺', gender:'m' },
  { word:'lion',     plural:'lions',     emoji:'🦁', gender:'m' },
  { word:'ours',     plural:'ours',      emoji:'🐻', gender:'m' },
  { word:'cheval',   plural:'chevaux',   emoji:'🐴', gender:'m' },
  { word:'cochon',   plural:'cochons',   emoji:'🐷', gender:'m' },
  { word:'tigre',    plural:'tigres',    emoji:'🐯', gender:'m' },
  { word:'singe',    plural:'singes',    emoji:'🐵', gender:'m' },
  { word:'canard',   plural:'canards',   emoji:'🦆', gender:'m' },
  { word:'lapin',    plural:'lapins',    emoji:'🐰', gender:'m' },
  { word:'poisson',  plural:'poissons',  emoji:'🐠', gender:'m' },
  { word:'oiseau',   plural:'oiseaux',   emoji:'🐦', gender:'m' },
  { word:'soleil',   plural:'soleils',   emoji:'☀️', gender:'m' },
  { word:'nuage',    plural:'nuages',    emoji:'☁️', gender:'m' },
  { word:'arbre',    plural:'arbres',    emoji:'🌳', gender:'m' },
  { word:'bateau',   plural:'bateaux',   emoji:'⛵', gender:'m' },
  { word:'avion',    plural:'avions',    emoji:'✈️', gender:'m' },
  { word:'train',    plural:'trains',    emoji:'🚂', gender:'m' },
  { word:'ballon',   plural:'ballons',   emoji:'🎈', gender:'m' },
  { word:'robot',    plural:'robots',    emoji:'🤖', gender:'m' },
  { word:'cadeau',   plural:'cadeaux',   emoji:'🎁', gender:'m' },
  { word:'gâteau',   plural:'gâteaux',   emoji:'🎂', gender:'m' },
  { word:'souris',   plural:'souris',    emoji:'🐭', gender:'f' },
  { word:'vache',    plural:'vaches',    emoji:'🐄', gender:'f' },
  { word:'poule',    plural:'poules',    emoji:'🐔', gender:'f' },
  { word:'lune',     plural:'lunes',     emoji:'🌙', gender:'f' },
  { word:'étoile',   plural:'étoiles',   emoji:'⭐', gender:'f' },
  { word:'pluie',    plural:'pluies',    emoji:'🌧️', gender:'f' },
  { word:'fleur',    plural:'fleurs',    emoji:'🌸', gender:'f' },
  { word:'maison',   plural:'maisons',   emoji:'🏠', gender:'f' },
  { word:'voiture',  plural:'voitures',  emoji:'🚗', gender:'f' },
  { word:'fusée',    plural:'fusées',    emoji:'🚀', gender:'f' },
  { word:'pomme',    plural:'pommes',    emoji:'🍎', gender:'f' },
  { word:'fraise',   plural:'fraises',   emoji:'🍓', gender:'f' },
  { word:'banane',   plural:'bananes',   emoji:'🍌', gender:'f' },
  { word:'glace',    plural:'glaces',    emoji:'🍦', gender:'f' },
];

const DECOS = {
  palmier:{emoji:'🌴', name:'Palmier', price:8},
  poisson:{emoji:'🐠', name:'Poisson clown', price:10},
  dauphin:{emoji:'🐬', name:'Dauphin', price:15},
  tortue:{emoji:'🐢', name:'Tortue', price:12},
  arcenciel:{emoji:'🌈', name:'Arc-en-ciel', price:20},
  chateau:{emoji:'🏰', name:'Château de sable', price:25},
  bateau:{emoji:'⛵', name:'Petit voilier', price:18},
  fee:{emoji:'🧚‍♀️', name:'Fée du lagon', price:35},
  sirene2:{emoji:'🐚', name:'Coquillage géant', price:30},
  lune:{emoji:'🌙', name:'Lune magique', price:40},
  requin:{emoji:'🦈', name:'Requin rigolo', price:28},
  bateaupirate:{emoji:'🏴‍☠️', name:'Bateau pirate', price:35},
  poulpe:{emoji:'🐙', name:'Poulpe', price:20},
  // Forêt enchantée
  sapin:{emoji:'🌲', name:'Grand sapin', price:8, world:'foret'},
  ecureuil:{emoji:'🐿️', name:'Écureuil', price:12, world:'foret'},
  renard:{emoji:'🦊', name:'Petit renard', price:16, world:'foret'},
  herisson:{emoji:'🦔', name:'Hérisson', price:14, world:'foret'},
  cabane:{emoji:'🏡', name:'Cabane dans les bois', price:26, world:'foret'},
  luciole:{emoji:'✨', name:'Lucioles', price:22, world:'foret'},
  papillonD:{emoji:'🦋', name:'Papillons', price:18, world:'foret'},
  dragon:{emoji:'🐲', name:'Bébé dragon', price:45, world:'foret'},
  dino:{emoji:'🦖', name:'Petit dino', price:32, world:'foret'},
  loupD:{emoji:'🐺', name:'Loup gris', price:20, world:'foret'},
  campement:{emoji:'⛺', name:'Campement', price:18, world:'foret'},
  // Montagne des Nuages
  nuageD:{emoji:'☁️', name:'Gros nuage', price:10, world:'montagne'},
  montgolfiere:{emoji:'🎈', name:'Montgolfière', price:18, world:'montagne'},
  cerfvolant:{emoji:'🪁', name:'Cerf-volant', price:16, world:'montagne'},
  colombe:{emoji:'🕊️', name:'Colombe', price:14, world:'montagne'},
  sommet:{emoji:'🏔️', name:'Sommet enneigé', price:24, world:'montagne'},
  fusee:{emoji:'🚀', name:'Petite fusée', price:38, world:'montagne'},
  satellite:{emoji:'🛸', name:'Soucoupe', price:34, world:'montagne'},
  telepherique:{emoji:'🚡', name:'Téléphérique', price:26, world:'montagne'},
  // Château des Étoiles
  chateauD:{emoji:'🏰', name:'Grand château', price:30, world:'chateau'},
  feudartifice:{emoji:'🎆', name:"Feu d'artifice", price:26, world:'chateau'},
  paon:{emoji:'🦚', name:'Paon royal', price:22, world:'chateau'},
  carrousel:{emoji:'🎠', name:'Carrousel', price:28, world:'chateau'},
  galaxie:{emoji:'🌌', name:'Ciel étoilé', price:40, world:'chateau'},
  couronneD:{emoji:'👑', name:'Couronne du royaume', price:60, world:'chateau'},
  dragonrouge:{emoji:'🐉', name:'Dragon gardien', price:55, world:'chateau'},
  chevalierD:{emoji:'🛡️', name:'Garde du château', price:24, world:'chateau'},
  catapulte:{emoji:'🏹', name:"Tour d'archers", price:30, world:'chateau'},
  // Jungle mystérieuse (le plus grand trésor à collectionner !)
  toucanD:{emoji:'🦜', name:'Toucan coloré', price:12, world:'jungle'},
  singeD:{emoji:'🐒', name:'Singe rigolo', price:14, world:'jungle'},
  jaguarD:{emoji:'🐆', name:'Jaguar discret', price:30, world:'jungle'},
  serpent:{emoji:'🐍', name:'Serpent curieux', price:16, world:'jungle'},
  grenouille:{emoji:'🐸', name:'Grenouille dorée', price:10, world:'jungle'},
  palmierD:{emoji:'🌴', name:'Palmier géant', price:9, world:'jungle'},
  cascade:{emoji:'🏞️', name:'Cascade cachée', price:24, world:'jungle'},
  pontsuspendu:{emoji:'🌉', name:'Pont suspendu', price:28, world:'jungle'},
  templeD:{emoji:'🛕', name:'Temple ancien', price:48, world:'jungle'},
  papillonJ:{emoji:'🦋', name:'Papillon géant', price:18, world:'jungle'},
  coffretresor:{emoji:'💰', name:'Coffre au trésor', price:50, world:'jungle'},
  totemD:{emoji:'🗿', name:'Statue totem', price:38, world:'jungle'},
};
const MISSIONS_PER_LEVEL = 5;
const ALBUM_REWARD = 100;
const SAVE_KEY = 'lagon-magique-save';

const AVATARS = [
  '👧','👦','🧒','👩‍🦰','👨‍🦰','👧‍🦱','👦‍🦱',
  '🦸‍♀️','🦸‍♂️','🧚‍♀️','🧙‍♂️','👸','🤴','🧜‍♀️','🧜‍♂️',
  '🏴‍☠️','🥷','🤖','🚀','🐉','🦖','🦁','🐱','🦄','⚽',
];

