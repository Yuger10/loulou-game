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
  // Cité du Temps (6e île)
  sablier:{emoji:'⏳', name:'Sablier doré', price:7, world:'cite'},
  pendule:{emoji:'🕰️', name:'Petite pendule', price:6, world:'cite'},
  rouage:{emoji:'⚙️', name:'Rouage brillant', price:5, world:'cite'},
  calendrier:{emoji:'📆', name:'Vieux calendrier', price:6, world:'cite'},
  cadransolaire:{emoji:'🧭', name:'Cadran solaire', price:7, world:'cite'},
  cloche:{emoji:'🔔', name:'Cloche du beffroi', price:8, world:'cite'},
  plumehibou:{emoji:'🪶', name:'Plume de chouette', price:5, world:'cite'},
  // Volcan des Génies (7e île)
  pierrelave:{emoji:'🌋', name:'Pierre de lave', price:8, world:'volcan'},
  cristalfeu:{emoji:'🔥', name:'Cristal de feu', price:9, world:'volcan'},
  gemmeardente:{emoji:'🔶', name:'Gemme ardente', price:7, world:'volcan'},
  parcheminsavant:{emoji:'📜', name:'Parchemin savant', price:10, world:'volcan'},
  fiole:{emoji:'⚗️', name:'Fiole bouillonnante', price:6, world:'volcan'},
  meteorite:{emoji:'☄️', name:'Météorite', price:11, world:'volcan'},
  // Jungle mystérieuse (5e île : un très grand trésor à collectionner)
  liane:{emoji:'🌿', name:'Liane', price:3, world:'jungle'},
  masque:{emoji:'🎭', name:'Masque tribal', price:6, world:'jungle'},
  banane:{emoji:'🍌', name:'Régime de bananes', price:4, world:'jungle'},
  fleurtropicale:{emoji:'🌺', name:'Fleur tropicale', price:5, world:'jungle'},
  noixcoco:{emoji:'🥥', name:'Noix de coco', price:5, world:'jungle'},
  ananas:{emoji:'🍍', name:'Ananas doré', price:6, world:'jungle'},
  scarabee:{emoji:'🪲', name:'Scarabée doré', price:7, world:'jungle'},
  tambour:{emoji:'🥁', name:'Tambour sacré', price:8, world:'jungle'},
  // Pays Squishy (8e île) : tout est doux, rond et moelleux
  mochi:{emoji:'🍡', name:'Mochi moelleux', price:9, world:'squishy'},
  donutrose:{emoji:'🍩', name:'Donut rose', price:8, world:'squishy'},
  cupcake:{emoji:'🧁', name:'Cupcake nuage', price:10, world:'squishy'},
  bonbonsq:{emoji:'🍬', name:'Bonbon squishy', price:7, world:'squishy'},
  sucette:{emoji:'🍭', name:'Sucette arc-en-ciel', price:9, world:'squishy'},
  peluche:{emoji:'🧸', name:'Peluche toute douce', price:11, world:'squishy'},
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
  // Cité du Temps
  horlogemagique:{emoji:'🕰️', name:'Horloge magique', price:16, world:'cite',
    recipe:{pendule:1, rouage:2}},
  sablierderare:{emoji:'⏳', name:'Sablier des rêves', price:14, world:'cite',
    recipe:{sablier:2, plumehibou:1}},
  carillontemps:{emoji:'🔔', name:'Carillon du temps', price:15, world:'cite',
    recipe:{cloche:1, rouage:1}},
  almanach:{emoji:'📖', name:'Almanach mystérieux', price:18, world:'cite',
    recipe:{calendrier:2, cadransolaire:1}},
  machinetemps:{emoji:'🌀', name:'Machine à remonter le temps', price:68, tier:2, world:'cite',
    recipe:{horlogemagique:1, sablierderare:1, carillontemps:1}},
  // Volcan des Génies
  lampegenie:{emoji:'🪔', name:'Lampe du génie', price:20, world:'volcan',
    recipe:{cristalfeu:1, gemmeardente:2}},
  potionsavante:{emoji:'🧪', name:'Potion du génie', price:18, world:'volcan',
    recipe:{fiole:2, pierrelave:1}},
  grimoirevolcan:{emoji:'📔', name:'Grimoire des flammes', price:22, world:'volcan',
    recipe:{parcheminsavant:1, meteorite:1}},
  bouclierlave:{emoji:'🛡️', name:'Bouclier de lave', price:24, world:'volcan',
    recipe:{pierrelave:2, cristalfeu:1}},
  couronnegenie:{emoji:'👑', name:'Couronne du génie', price:72, tier:2, world:'volcan',
    recipe:{lampegenie:1, potionsavante:1, grimoirevolcan:1}},
  // Pays Squishy
  boitesquishy:{emoji:'🎁', name:'Boîte à squishies', price:24, world:'squishy',
    recipe:{mochi:1, bonbonsq:2}},
  gateaumoelleux:{emoji:'🎂', name:'Gâteau moelleux', price:26, world:'squishy',
    recipe:{cupcake:1, donutrose:1}},
  pinata:{emoji:'🪅', name:'Piñata squishy', price:28, world:'squishy',
    recipe:{sucette:1, bonbonsq:1, peluche:1}},
  sacsquishy:{emoji:'🛍️', name:'Sac de squishies', price:27, world:'squishy',
    recipe:{peluche:1, mochi:1}},
  coeurcalin:{emoji:'💝', name:'Cœur des câlins', price:84, tier:2, world:'squishy',
    recipe:{boitesquishy:1, gateaumoelleux:1, pinata:1}},
};
const ALL_ITEMS = Object.assign({}, ITEMS, CRAFTED);

const CHARACTERS = {
  sirene:{
    emoji:'🧜‍♀️', name:'Marina', title:'la sirène',
    gender:'f',
    loot:['coquillage','perle'],
    texts:[
      "Aide-moi à retrouver un trésor du lagon, tu veux bien ?",
      "Les vagues ont caché mes perles… tu m'aides à les retrouver ?",
      "Coucou ! Un petit jeu avant d'aller nager ?",
    ]},
  licorne:{
    emoji:'🦄', name:'Étincelle', title:'la licorne',
    gender:'f',
    loot:['etoile','gemme'],
    texts:[
      "J'ai besoin de toi pour un petit défi magique !",
      "Ma corne brille quand tu réussis un défi. On essaie ?",
      "Les étoiles sont tombées dans le lagon ! Tu m'aides ?",
    ]},
  danseuse:{
    emoji:'💃', name:'Luna', title:'la danseuse',
    gender:'f',
    loot:['ruban','fleur'],
    texts:[
      "Viens jouer avec moi avant la grande ronde !",
      "J'ai perdu mes rubans en dansant… un petit jeu pour m'aider ?",
      "Un, deux, trois… on joue ensemble ?",
    ]},
  pirate:{
    emoji:'🏴‍☠️', name:'Tiago', title:'le pirate',
    gender:'m',
    loot:['boussole','crochet'],
    texts:[
      "Mille sabords ! Tu m'aides à retrouver mon trésor ?",
      "Un vrai pirate résout les énigmes. Tu en es capable ?",
      "Ma boussole est cassée… tu m'aides à retrouver le nord ?",
    ]},
  // --- Forêt enchantée ---
  fee:{
    emoji:'🧚‍♀️', name:'Sylvie', title:'la fée', world:'foret',
    gender:'f',
    loot:['champignon','trefle'],
    texts:[
      "Bienvenue dans la forêt ! Tu m'aides à cueillir des champignons ?",
      "Ma poudre magique s'est envolée… un petit défi pour la retrouver ?",
      "Chut… la forêt a un secret pour toi !",
    ]},
  biche:{
    emoji:'🦌', name:'Maïa', title:'la biche', world:'foret',
    gender:'f',
    loot:['gland','miel'],
    texts:[
      "J'ai faim ! Tu m'aides à trouver des glands ?",
      "Les abeilles m'ont donné du miel, mais il faut le mériter !",
      "On joue avant que la nuit tombe sur la forêt ?",
    ]},
  hibou:{
    emoji:'🦉', name:'Hector', title:'le hibou', world:'foret',
    gender:'m',
    loot:['plume','trefle'],
    texts:[
      "Hou hou ! Un petit test pour voir si tu es maligne ?",
      "J'ai perdu mes plus belles plumes cette nuit…",
      "Les hiboux adorent les devinettes. À toi de jouer !",
    ]},
  loup:{
    emoji:'🐺', name:'Balto', title:'le loup', world:'foret',
    gender:'m',
    loot:['croc','silex'],
    texts:[
      "Hooouuu ! Qui veut relever mon défi ?",
      "J'ai caché mon os quelque part… tu me aides à le retrouver ?",
      "Les loups sont malins. Et toi, tu l'es aussi ?",
    ]},
  // --- Montagne des Nuages ---
  dragonciel:{
    emoji:'🐉', name:'Zéphyr', title:'le dragon', world:'montagne',
    gender:'m',
    loot:['nuage','cristal'],
    texts:[
      "Monte sur mon dos ! Mais d'abord, un défi tout là-haut ☁️",
      "J'ai souffl\u00e9 trop fort et mes nuages se sont envolés…",
      "Ici, les défis sont plus durs. Tu es prête ?",
    ]},
  aigle:{
    emoji:'🦅', name:'Ariane', title:"l'aigle", world:'montagne',
    gender:'f',
    loot:['eclair','flocon'],
    texts:[
      "Je vole plus vite que l'éclair ⚡ Et toi, tu réfléchis vite ?",
      "Du haut du ciel, je vois tout. Voyons si tu vois bien aussi !",
      "Un défi entre les nuages, ça te dit ?",
    ]},
  magicienne:{
    emoji:'🧙‍♀️', name:'Céleste', title:'la magicienne', world:'montagne',
    gender:'f',
    loot:['cristal','flocon'],
    texts:[
      "Mon cristal montre ton avenir… tu vas réussir ce défi !",
      "Un sortilège a mélangé mes flocons. Tu m'aides ?",
      "Concentre-toi bien, celui-là est un peu plus difficile.",
    ]},
  robotmontagne:{
    emoji:'🤖', name:'Bolt', title:'le robot', world:'montagne',
    gender:'m',
    loot:['boulon','eclair'],
    texts:[
      "BIP BIP ! Défi logique en cours de chargement…",
      "Mes circuits sont emmêlés. Tu peux les remettre en ordre ?",
      "Calcul en cours… à toi de jouer, humain !",
    ]},
  // --- Château des Étoiles ---
  princesse:{
    emoji:'👸', name:'Aurore', title:'la princesse', world:'chateau',
    gender:'f',
    loot:['poussiere','cle'],
    texts:[
      "Bienvenue au château ! Le dernier défi du royaume t'attend 👑",
      "J'ai perdu la clé de la tour aux étoiles… tu m'aides ?",
      "Seules les plus malignes arrivent jusqu'ici. Bravo !",
    ]},
  sorciere:{
    emoji:'🧙‍♀️', name:'Morgane', title:'la sorcière', world:'chateau',
    gender:'f',
    loot:['bougie','parchemin'],
    texts:[
      "Mes parchemins sont tout mélangés. Un vrai casse-tête !",
      "Allume ta cervelle comme une bougie 🕯️ et résous ça !",
      "Attention, mes défis sont les plus corsés du royaume.",
    ]},
  chevalier:{
    emoji:'🤴', name:'Prince Tao', title:'le chevalier', world:'chateau',
    gender:'m',
    loot:['bouclier','cle'],
    texts:[
      "En garde ! Enfin… en garde ton cerveau, c'est une énigme 😄",
      "Le dragon garde la tour. Résous ce défi et on y va !",
      "Un vrai chevalier n'abandonne jamais. À toi !",
    ]},
  pegase:{
    emoji:'🦄', name:'Comète', title:'le pégase', world:'chateau',
    gender:'m',
    loot:['poussiere','parchemin'],
    texts:[
      "Accroche-toi, on file vers les étoiles ✨",
      "Ma poussière d'étoile s'envole quand tu réussis un défi !",
      "En selle pour le plus grand galop du royaume ?",
    ]},
  // --- Jungle mystérieuse ---
  exploratrice:{
    emoji:'🧗‍♀️', name:'Maya', title:"l'exploratrice", world:'jungle',
    gender:'f',
    loot:['masque','scarabee'],
    texts:[
      "Suis-moi dans la jungle, l'aventure commence !",
      "J'ai égaré ma carte au trésor… un petit défi pour la retrouver ?",
      "Chut, écoute les bruits de la jungle… prête pour un jeu ?",
    ]},
  singe:{
    emoji:'🐒', name:'Kiko', title:'le singe', world:'jungle',
    gender:'m',
    loot:['banane','noixcoco'],
    texts:[
      "Ouh ouh ! Attrape-moi si tu es assez maligne !",
      "J'ai caché des bananes partout… tu m'aides à les retrouver ?",
      "Un petit jeu avant de sauter de liane en liane ?",
    ]},
  perroquet:{
    emoji:'🦜', name:'Iris', title:'la perruche', world:'jungle',
    gender:'f',
    loot:['fleurtropicale','ananas'],
    texts:[
      "Coco ! Répète après moi : tu es la meilleure !",
      "Mes plus belles plumes se sont envolées dans le vent…",
      "Les perroquets adorent les défis colorés. À toi de jouer !",
    ]},
  jaguar:{
    emoji:'🐆', name:'Jago', title:'le jaguar', world:'jungle',
    gender:'m',
    loot:['liane','tambour'],
    texts:[
      "Je suis rapide comme l'éclair… et toi ?",
      "Un vrai félin ne recule jamais devant un défi !",
      "Chhht… approche doucement, et relève mon défi.",
    ]},
  // --- Cité du Temps ---
  horloger:{
    emoji:'🧑‍🔧', name:'Horace', title:"l'horloger", world:'cite',
    gender:'m',
    loot:['rouage','pendule'],
    texts:[
      "Le temps presse ! Un petit défi avant que l'horloge sonne ?",
      "Mes rouages sont tout emmêlés… tu m'aides à les remettre en place ?",
      "Dans la Cité du Temps, chaque seconde compte. Prête ?",
    ]},
  gardienne:{
    emoji:'⏳', name:'Clio', title:'la gardienne du temps', world:'cite',
    gender:'f',
    loot:['sablier','cadransolaire'],
    texts:[
      "Je garde le temps qui passe… veux-tu apprendre à le lire avec moi ?",
      "Mon sablier s'est renversé ! Un défi pour le redresser ?",
      "Le temps ne s'arrête jamais, mais toi, tu peux toujours réessayer.",
    ]},
  robotcoucou:{
    emoji:'🤖', name:'Tic', title:'le robot-coucou', world:'cite',
    gender:'m',
    loot:['cloche','rouage'],
    texts:[
      "Coucou coucou ! Il est l'heure… de jouer !",
      "Mes aiguilles tournent dans le vide, aide-moi à les régler.",
      "Tic-tac, tic-tac… à toi de résoudre ce défi !",
    ]},
  chouette:{
    emoji:'🦉', name:'Nocta', title:'la chouette des nuits', world:'cite',
    gender:'f',
    loot:['plumehibou','calendrier'],
    texts:[
      "Hou hou… la nuit est le moment parfait pour un défi.",
      "Je veille sur les horloges endormies. Tu veilles sur tes réponses ?",
      "Un peu de sagesse et beaucoup de patience… tu es prête ?",
    ]},
  // --- Volcan des Génies ---
  genie:{
    emoji:'🧞‍♂️', name:'Nova', title:'le génie', world:'volcan',
    gender:'m',
    loot:['cristalfeu','gemmeardente'],
    texts:[
      "Trois défis, trois vœux ! Lequel veux-tu résoudre en premier ?",
      "Mes pouvoirs s'affaiblissent… un calcul bien fait me redonne des forces !",
      "Un génie n'a pas besoin de lampe pour briller. Montre-moi !",
    ]},
  savante:{
    emoji:'👩‍🔬', name:'Léa', title:'la savante', world:'volcan',
    gender:'f',
    loot:['parcheminsavant','fiole'],
    texts:[
      "La science n'a pas de limite… sauf si tu abandonnes. Allez !",
      "J'ai besoin d'un esprit vif pour cette expérience. Le tien fera l'affaire !",
      "Chaque calcul juste, c'est une découverte en plus.",
    ]},
  dragonlave:{
    emoji:'🐉', name:'Pyra', title:'la dragonne de lave', world:'volcan',
    gender:'f',
    loot:['pierrelave','meteorite'],
    texts:[
      "Grrr… seuls les plus courageux affrontent le volcan !",
      "Ma lave bouillonne quand tu réfléchis fort. On tente ?",
      "Un vrai génie garde son sang-froid, même au cœur du volcan.",
    ]},
  robotsavant:{
    emoji:'🤖', name:'Max', title:'le robot savant', world:'volcan',
    gender:'m',
    loot:['fiole','gemmeardente'],
    texts:[
      "Calcul en cours… processeur chauffé à blanc, comme le volcan !",
      "BIP ! Mes circuits adorent les défis de calcul mental.",
      "Active ton cerveau, comme moi j'active mes rotors.",
    ]},
  // ---- Pays Squishy : on trie les formes et les couleurs ----
  mochichat:{
    emoji:'🐱', name:'Mimi', title:'la chatte mochi', world:'squishy',
    gender:'f',
    loot:['mochi','peluche'],
    texts:[
      "Miaou ! Je suis toute ronde et toute douce. Tu m'aides à ranger les squishies ?",
      "Les ronds avec les ronds, les cœurs avec les cœurs : c'est mon jeu préféré !",
      "Squish ! Quand on m'appuie dessus, je reprends toujours ma forme.",
    ]},
  donut:{
    emoji:'🍩', name:'Pépito', title:'le donut', world:'squishy',
    gender:'m',
    loot:['donutrose','bonbonsq'],
    texts:[
      "Je suis un donut, alors je connais bien les ronds ! Et toi ?",
      "Mes vermicelles sont de toutes les couleurs. Tu les reconnais ?",
      "Trouve tous les squishies que je te demande, et je te donne un bonbon !",
    ]},
  avocat:{
    emoji:'🥑', name:'Avo', title:"l'avocat", world:'squishy',
    gender:'m',
    loot:['cupcake','sucette'],
    texts:[
      "Coucou ! Je suis vert dehors et vert clair dedans. Quelle couleur préfères-tu ?",
      "Un triangle a trois côtés, un carré en a quatre. On compte ensemble ?",
      "Les squishies se sont tous mélangés… Aide-moi à les trier !",
    ]},
  phoque:{
    emoji:'🦭', name:'Bulle', title:'la petite phoque', world:'squishy',
    gender:'f',
    loot:['bonbonsq','cupcake'],
    texts:[
      "Plouf ! Les étoiles et les cœurs sont tombés dans l'eau. Tu m'aides ?",
      "Les grands d'un côté, les petits de l'autre : c'est facile avec toi !",
      "Je suis toute grise et toute douce. Tu veux jouer avec moi ?",
    ]},
};

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
function charsOf(world){
  return Object.entries(CHARACTERS).filter(([,c])=>(c.world||'lagon')===world);
}
// Comme les compagnons (js/companions.js), les personnages d'une île sont
// présentés dans un ordre qui met en avant ceux du même genre que le
// joueur — sans jamais en retirer : chaque île garde ses 4 personnages
// et leur butin, seul l'ORDRE d'affichage change. Un joueur sans genre
// renseigné (ou « neutre ») garde l'ordre d'origine (inchangé).
function charsOfForPlayer(world, gender){
  const list = charsOf(world);
  if(gender!=='f' && gender!=='m') return list;
  const same = list.filter(([,c])=>c.gender===gender);
  const other = list.filter(([,c])=>c.gender!==gender);
  return [...same, ...other];
}
function decosOf(world){
  return Object.entries(DECOS).filter(([,d])=>(d.world||'lagon')===world);
}
const GAME_TYPES = ['memory','count','diff','puzzle','sequence','simon','math','reading','determinants','volume','compare','money','clock','calendar','calc','shapes','planets','jigsaw'];

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
  // « Quelle saison ? » (calendar) ne demande aucune lecture : accessible
  // dès la petite section, au même titre que la mémoire ou l'intrus.
  // « Formes et couleurs » (shapes) aussi : reconnaître et trier formes et
  // couleurs est au programme dès la petite section (cycle 1).
  // « Les planètes » : dès 5 ans seulement (le Soleil, la Lune, la Terre,
  // le jour et la nuit) ; plus tôt, ces notions sont trop abstraites.
  // « Assembler l'image » (jigsaw) : le puzzle 2×2 avec l'image en
  // transparence se fait dès la petite section.
  { max:4, types:['memory','count','diff','calendar','shapes','jigsaw'] },
  // à 5 ans (MS/GS) : + comparer des tailles, suites simples, couleurs,
  // et lire l'heure en heures pleines (« il est 3 heures »).
  { max:5, types:['memory','count','diff','volume','sequence','simon','clock','calendar','shapes','planets','jigsaw'] },
  // 6 ans et plus (ou âge non précisé) : tous les jeux, dont le calcul
  // mental abstrait (calc), réservé au CP confirmé et plus.
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
  // Cité du Temps
  horlogeD:{emoji:'🕰️', name:'Grande horloge', price:20, world:'cite'},
  pendulemurale:{emoji:'🕐', name:'Pendule murale', price:14, world:'cite'},
  tourhorloge:{emoji:'🗼', name:"Tour de l'horloge", price:40, world:'cite'},
  sablierD:{emoji:'⏳', name:'Sablier géant', price:18, world:'cite'},
  cadransolaireD:{emoji:'☀️', name:'Cadran solaire', price:22, world:'cite'},
  chouetteD:{emoji:'🦉', name:'Chouette veilleuse', price:16, world:'cite'},
  engrenageD:{emoji:'⚙️', name:'Engrenages dorés', price:24, world:'cite'},
  calendrierD:{emoji:'📆', name:'Calendrier magique', price:12, world:'cite'},
  portailtemporel:{emoji:'🌀', name:'Portail temporel', price:55, world:'cite'},
  // Volcan des Génies
  volcanD:{emoji:'🌋', name:'Volcan en éruption', price:45, world:'volcan'},
  lavecoulee:{emoji:'🔥', name:'Coulée de lave', price:20, world:'volcan'},
  cristalD:{emoji:'💎', name:'Cristaux brillants', price:16, world:'volcan'},
  genieD:{emoji:'🧞', name:'Statue du génie', price:38, world:'volcan'},
  dragonlaveD:{emoji:'🐉', name:'Dragon de lave', price:50, world:'volcan'},
  fumerolle:{emoji:'💨', name:'Fumerolles', price:10, world:'volcan'},
  meteoriteD:{emoji:'☄️', name:'Pluie de météorites', price:30, world:'volcan'},
  laboratoire:{emoji:'🧫', name:'Laboratoire secret', price:26, world:'volcan'},
  trophee:{emoji:'🏆', name:'Trophée du génie', price:42, world:'volcan'},
  // Pays Squishy
  glacegeante:{emoji:'🍦', name:'Glace géante', price:30, world:'squishy'},
  oursguimauve:{emoji:'🧸', name:'Ours en guimauve', price:35, world:'squishy'},
  flan:{emoji:'🍮', name:'Flan tremblotant', price:25, world:'squishy'},
  ballons:{emoji:'🎈', name:'Ballons pastel', price:20, world:'squishy'},
  gateauchateau:{emoji:'🍰', name:'Gâteau château', price:50, world:'squishy'},
};
const MISSIONS_PER_LEVEL = 5;
const ALBUM_REWARD = 100;
const SAVE_KEY = 'lagon-magique-save';

// « 👧‍🦱 » et « 👦‍🦱 » ne sont pas des emoji standard : beaucoup d'appareils
// les affichent en deux morceaux. On les remplace par leur équivalent standard.
const AVATAR_FIX = { '👧‍🦱':'👩‍🦱', '👦‍🦱':'👨‍🦱' };
function fixAvatar(av){ return AVATAR_FIX[av] || av; }
const AVATARS = [
  '👧','👦','🧒','👩‍🦰','👨‍🦰','👩‍🦱','👨‍🦱',
  'art:zap','art:perle','art:rose','art:lili','art:tom','art:leo','art:sam','🦸‍♀️','🦸‍♂️','🧚‍♀️','🧙‍♂️','👸','🤴','🧜‍♀️','🧜‍♂️',
  '🏴‍☠️','🥷','🤖','🚀','🐉','🦖','🦁','🐱','🦄','⚽',
];

