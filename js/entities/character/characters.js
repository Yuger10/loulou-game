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
  // ---- Saison 2, le Monde des Boîtes : la Fabrique de boîtes (v55) ----
  capucine:{
    emoji:'🦫', name:'Capucine', title:'la directrice de la Fabrique', world:'boites',
    gender:'f',
    loot:['carton','etiquette'],
    texts:[
      "Bienvenue à la Fabrique ! Ici, on range les rêves avec soin. Tu nous aides ?",
      "Une boîte bien pliée, c'est une boîte qui protège. On joue ?",
      "Chaque mission réussie libère un petit rêve. Allez, au travail !",
    ]},
  kiki:{
    emoji:'🐱', name:'Kiki', title:'le chat-dans-la-boîte', world:'boites',
    gender:'m',
    loot:['ficelle','papierbulle'],
    texts:[
      "Miaou ! Toutes les boîtes sont à moi… surtout les petites !",
      "Je me range dans la plus petite boîte, puis dans la plus grande. Tu sais faire pareil ?",
      "Chut… je fais la sieste dans un carton. Un petit jeu d'abord ?",
    ]},
  boulon:{
    emoji:'🤖', name:'Boulon', title:'le robot en carton', world:'boites',
    gender:'m',
    loot:['trombone','carton'],
    texts:[
      "BIP ! Combien de cubes dans ma pile ? Je les compte même quand ils sont cachés !",
      "Je suis tout en carton, mais mon cerveau est très solide. On réfléchit ensemble ?",
      "Cubes empilés, cubes rangés : c'est mon jeu préféré. BIP BIP !",
    ]},
  lola:{
    emoji:'🛴', name:'Lola', title:'la livreuse', world:'boites',
    gender:'f',
    loot:['etiquette','ficelle'],
    texts:[
      "Zoum ! Je livre les boîtes surprises dans tout le ciel. Tu m'aides ?",
      "J'ai un colis pour toi… mais d'abord, un petit défi !",
      "Mes boîtes ont toutes une étiquette. Sans elle, je me perdrais dans les nuages !",
    ]},
  // ---- Saison 2, le Coffre aux Jouets Doux (idée de la joueuse) ----
  nougat:{
    emoji:'🧸', name:'Nougat', title:'l\'ourson en guimauve', world:'jouets',
    gender:'m',
    loot:['boutonours','rubanpeluche'],
    texts:[
      "Bienvenue dans mon coffre ! Les jouets dorment… on va les réveiller ensemble ?",
      "Je suis tout moelleux, comme une guimauve. Un câlin, puis un petit jeu ?",
      "Chaque jouet réveillé fait un grand sourire. Allez, au travail !",
    ]},
  cocotte:{
    emoji:'🐰', name:'Cocotte', title:'la lapine mochi', world:'jouets',
    gender:'f',
    loot:['minimochi','rubanpeluche'],
    texts:[
      "Une ligne pour chaque couleur, une colonne pour chaque forme : c'est mon étagère magique !",
      "Je range, je range… et chaque jouet trouve sa case. Tu m'aides ?",
      "Boing ! Je suis toute ronde et toute douce. On joue ?",
    ]},
  gloups:{
    emoji:'🐙', name:'Gloups', title:'le poulpe tout mou', world:'jouets',
    gender:'m',
    loot:['ressort','boutonours'],
    texts:[
      "J'ai huit bras, alors je fais des paquets de jouets ! Deux par deux, cinq par cinq…",
      "Compter les paquets, c'est plus rapide que compter un par un. Tu essaies ?",
      "Gloups gloups ! Je suis tout mou, mais je compte très bien.",
    ]},
  rainette:{
    emoji:'🐸', name:'Rainette', title:'la grenouille squishy', world:'jouets',
    gender:'f',
    loot:['grelot','minimochi'],
    texts:[
      "Hop ! Hop ! J'ai caché des jouets partout dans le coffre. Tu les trouves ?",
      "Quand on m'appuie dessus, je fais « couic » ! Encore un jeu ?",
      "Je saute de case en case sur l'étagère. Suis-moi !",
    ]},
  // ---- Saison 2, le Royaume des Bonbons (proposition retenue par la joueuse) ----
  praline:{
    emoji:'👑', name:'Praline', title:'la reine pâtissière', world:'bonbons',
    gender:'f',
    loot:['sucreglace','cerise'],
    texts:[
      "Bienvenue dans mon royaume ! Sans le grand four, plus de gâteaux… Tu nous aides ?",
      "Une reine pâtissière mesure tout avec soin : une pincée de trop, et c'est raté !",
      "Chaque mission réussie réchauffe un peu le four. Allez, en cuisine !",
    ]},
  chouquette:{
    emoji:'🧁', name:'Chouquette', title:'la petite pâtissière', world:'bonbons',
    gender:'f',
    loot:['cuillere','sucreglace'],
    texts:[
      "J'ai fait un gâteau pour mes amis. Il faut le partager en parts égales !",
      "Une moitié, un quart, un tiers… Je t'apprends à couper les gâteaux ?",
      "Si les parts ne sont pas pareilles, quelqu'un sera triste. On fait attention ?",
    ]},
  cacao:{
    emoji:'🍫', name:'Cacao', title:'le chocolatier', world:'bonbons',
    gender:'m',
    loot:['pepite','cuillere'],
    texts:[
      "Ma recette secrète ? Le bon nombre de cuillères, et le bon trait sur le verre doseur !",
      "Trois cuillères de cacao, pas une de plus. Tu comptes avec moi ?",
      "Mmm, ça sent le chocolat chaud ! Un petit défi d'abord ?",
    ]},
  berlingot:{
    emoji:'🍭', name:'Berlingot', title:'le marchand de bonbons', world:'bonbons',
    gender:'m',
    loot:['reglisse','cerise'],
    texts:[
      "Bonbons, sucettes, réglisse ! Approchez, approchez !",
      "J'échange mes bonbons contre des sourires. Tu en as un pour moi ?",
      "Mes sucettes sont rangées par couleurs. Tu veux jouer ?",
    ]},
  // ---- Saison 2, l'Île de la Musique (proposition retenue par la joueuse) ----
  viola:{
    emoji:'🎻', name:'Viola', title:'la violoniste, cheffe d\'orchestre', world:'musique',
    gender:'f',
    loot:['baguettechef','partition'],
    texts:[
      "Bienvenue sur mon île ! L'orchestre ne joue plus depuis que Grisou est passé… Tu nous aides ?",
      "Un orchestre, c'est écouter les autres avant de jouer. On essaie ensemble ?",
      "Chaque mission réussie, c'est une note qui revient. Allez, en musique !",
    ]},
  boumbo:{
    emoji:'🥁', name:'Boumbo', title:'le petit tambour', world:'musique',
    gender:'m',
    loot:['grelotdore','partition'],
    texts:[
      "Boum, boum, bouuum ! Tu peux refaire mon rythme ?",
      "Un coup court, un coup long, et chut… un silence. Le rythme, c'est magique !",
      "Je tape, tu tapes ! On fait la musique à deux ?",
    ]},
  flutine:{
    emoji:'🪈', name:'Flûtine', title:'la flûte enchantée', world:'musique',
    gender:'f',
    loot:['anche','clesol'],
    texts:[
      "Ma note la plus aiguë chante comme un oiseau, la plus grave ronronne comme un ours !",
      "Grave ou aigu ? Écoute bien, et tu sauras toujours !",
      "Tuu-tuu ! Tu veux ranger mes notes, de la plus grave à la plus aiguë ?",
    ]},
  piccolo:{
    emoji:'🦜', name:'Piccolo', title:'le perroquet chanteur', world:'musique',
    gender:'m',
    loot:['clesol','grelotdore'],
    texts:[
      "Piccolo répète tout ! Piccolo répète tout !",
      "Cuicui-bravo ! Tu chantes juste, toi !",
      "J'ai entendu une jolie mélodie… elle montait, elle montait ! Tu joues ?",
    ]},
  // ---- Saison 2, le Jardin des Fées (proposition retenue par la joueuse) ----
  petale:{
    emoji:'🧚', name:'Pétale', title:'la fée jardinière', world:'jardin',
    gender:'f',
    loot:['graine','rosee'],
    texts:[
      "Bienvenue dans mon jardin ! Depuis que Grisou est passé, plus rien ne pousse… Tu m'aides ?",
      "Une graine, un peu d'eau, du soleil… et beaucoup de patience !",
      "Chaque mission réussie fait éclore une fleur. Allez, au jardin !",
    ]},
  pois:{
    emoji:'🐞', name:'Pois', title:'la coccinelle', world:'jardin',
    gender:'f',
    loot:['petalerose','graine'],
    texts:[
      "J'ai autant de points sur chaque aile. Tu veux les compter ?",
      "Trois points d'un côté, trois points de l'autre : ça fait le double !",
      "Je me pose sur ta main ? Ça porte bonheur, il paraît !",
    ]},
  azur:{
    emoji:'🦋', name:'Azur', title:'le papillon', world:'jardin',
    gender:'m',
    loot:['pollen','petalerose'],
    texts:[
      "Avant d'être un papillon, j'étais une petite chenille ! Tu connais mon histoire ?",
      "Œuf, chenille, chrysalide, papillon : dans l'ordre, c'est magique !",
      "Je vole de fleur en fleur. On joue ensemble ?",
    ]},
  miella:{
    emoji:'🐝', name:'Miella', title:'l\'abeille', world:'jardin',
    gender:'f',
    loot:['pollen','rosee'],
    texts:[
      "Bzz ! Je butine les fleurs et je fais du miel pour tout le jardin !",
      "Sans les abeilles, les fleurs ne deviendraient pas des fruits. Bzz bzz !",
      "Tu veux goûter mon miel ? D'abord, un petit défi !",
    ]},
  // ---- Saison 2, le Royaume Arc-en-ciel (idée de la joueuse : « le monde des licornes ») ----
  // la Reine est le guide du chapitre : elle ne propose pas de mini-jeu (noGames)
  reine:{
    emoji:'👑', name:'La Reine', title:'Arc-en-ciel', world:'licornes',
    gender:'f', noGames:true,
    loot:['crinarc','nuagedoux'],
    texts:[
      "Bienvenue dans mon royaume, petit voyageur des nuages. Mes couleurs ont disparu…",
      "Les licornes ont besoin de toi. Va les aider, et les couleurs reviendront une à une.",
      "Merci d'être venu jusqu'ici. Un rêve partagé ne se perd jamais.",
    ]},
  // Étincelle, rentrée chez elle : un personnage distinct d'Étincelle du Lagon (id licorne)
  etincelle:{
    emoji:'🦄', name:'Étincelle', title:'la licorne du Lagon, rentrée chez elle', world:'licornes',
    gender:'f',
    loot:['cornescintillante','crinarc'],
    texts:[
      "Tu m'as aidée au Lagon, tu te souviens ? Maintenant, c'est mon royaume qui a besoin de toi !",
      "Ici, c'est chez moi : les arcs-en-ciel poussent comme des fleurs… enfin, d'habitude.",
      "Ma corne brille quand tu réussis. On joue ?",
    ]},
  biscotte:{
    emoji:'🐴', name:'Biscotte', title:'le bébé licorne', world:'licornes',
    gender:'m',
    loot:['nuagedoux','ferastral'],
    texts:[
      "Oups ! Mon arc-en-ciel est tout tordu… Il lui manque des couleurs !",
      "Je suis encore petit, mais je m'entraîne tous les jours. Tu m'aides ?",
      "Hiii ! On fait la course jusqu'au nuage ?",
    ]},
  felix:{
    emoji:'🧪', name:'Félix', title:'le licorne alchimiste', world:'licornes',
    gender:'m',
    loot:['fiolecouleur','cornescintillante'],
    texts:[
      "Rouge et jaune, ça fait… orange ! Mes potions de couleurs sont magiques !",
      "Une goutte de bleu, une goutte de jaune, et hop : du vert !",
      "Sans les couleurs, mes potions sont toutes grises. Tu m'aides à les retrouver ?",
    ]},
  mira:{
    emoji:'🪞', name:'Mira', title:'la licorne coiffeuse des Écuries étoilées', world:'licornes',
    gender:'f',
    loot:['miroirargent','fiolecouleur'],
    texts:[
      "Mon miroir magique montre tout à l'envers… enfin, de l'autre côté !",
      "Une mèche à gauche, une mèche à droite : c'est symétrique, c'est joli !",
      "Viens, on coiffe les crinières devant le miroir ?",
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

export { CHARACTERS, charsOf, charsOfForPlayer };
