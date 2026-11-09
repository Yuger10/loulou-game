/* ---------- Personnages des îles ---------- */
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

function charsOf(world){
  return Object.entries(CHARACTERS).filter(([,c])=>(c.world||'lagon')===world);
}

// Comme les compagnons (js/entities/companion/companions.js), les personnages d'une île sont
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
