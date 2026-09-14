/* ---------- Données ---------- */
const ITEMS = {
  coquillage:{emoji:'🐚', name:'Coquillage', price:2},
  perle:{emoji:'🦪', name:'Perle', price:3},
  ruban:{emoji:'🎀', name:'Ruban', price:2},
  fleur:{emoji:'🌸', name:'Fleur', price:2},
  etoile:{emoji:'⭐', name:'Étoile', price:4},
  gemme:{emoji:'💎', name:'Gemme', price:5},
};
const CRAFTED = {
  collier:{emoji:'📿', name:'Collier magique', price:10,
    recipe:{coquillage:2, ruban:1}},
  bouquet:{emoji:'💐', name:'Bouquet enchanté', price:8,
    recipe:{perle:2, fleur:1}},
  couronne:{emoji:'👑', name:'Couronne étoilée', price:14,
    recipe:{etoile:2, gemme:1}},
  baguette:{emoji:'🪄', name:'Baguette magique', price:12,
    recipe:{gemme:1, ruban:1, etoile:1}},
  tresor:{emoji:'🏆', name:'Trésor du lagon', price:40, tier:2,
    recipe:{collier:1, couronne:1, bouquet:1}},
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
};
const GAME_TYPES = ['memory','count','diff','puzzle','sequence','simon'];

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
};
const MISSIONS_PER_LEVEL = 5;
const SAVE_KEY = 'lagon-magique-save';

const AVATARS = ['👧','👩‍🦰','👧‍🦱','👧‍🦲','🧚‍♀️','👸','🧜‍♀️','🦸‍♀️','🐱','🦄'];

