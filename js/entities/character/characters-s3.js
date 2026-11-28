/* Les personnages de la saison 3 « La Grande Expédition ». Chaque île y ajoute
   ses personnages ; characters.js (au plafond de 800 lignes) les étale à la
   fin de CHARACTERS. */

/** @type {Record<string, import('./characters.js').Character>} */
const CHARACTERS_S3 = {
  // ---- L'Île des Crayons (saison 3, île 1) : Gribouille est le guide ;
  // Gommette parle du tracé, Taillou de la mesure (leurs répliques seulement).
  gribouille: {
    emoji: '✏️',
    name: 'Gribouille',
    title: 'le crayon à papier',
    world: 'crayons',
    gender: 'm',
    loot: ['cahier', 'craie'],
    texts: [
      "Bienvenue sur mon île ! Ici, tout ce qu'on dessine prend vie. Tu dessines avec moi ?",
      "Un trait, puis un autre trait… et voilà une maison ! Dessiner, c'est facile quand on prend son temps.",
      "Chaque mission réussie, c'est un nouveau dessin sur mon cahier. Allez, au travail !",
    ],
  },
  gommette: {
    emoji: '🧽',
    name: 'Gommette',
    title: 'la gomme rose',
    world: 'crayons',
    gender: 'f',
    loot: ['gomme', 'cahier'],
    texts: [
      "Coucou ! Moi, je n'efface pas les erreurs : je t'aide à recommencer.",
      'Pose ton doigt sur le point vert, et suis les flèches. Pas grave si ça dépasse !',
      "Une lettre bien tracée, c'est une lettre qu'on peut lire. On s'entraîne ?",
    ],
  },
  taillou: {
    emoji: '🌀',
    name: 'Taillou',
    title: 'le taille-crayon',
    world: 'crayons',
    gender: 'm',
    loot: ['copeaux', 'craie'],
    texts: [
      'Tourne, tourne ! Je taille les crayons, et après ils sont plus courts.',
      'Lequel est le plus long ? Pour savoir, je regarde où il commence et où il finit.',
      'Avec ma règle, je mesure tout ! Tu veux essayer ?',
    ],
  },
  aquarelle: {
    emoji: '🖌️',
    name: 'Aquarelle',
    title: 'le pinceau magique',
    world: 'crayons',
    gender: 'f',
    loot: ['palette', 'gomme'],
    texts: [
      'Bonjour ! Je peins le ciel en bleu et les nuages en rose.',
      'Un peu de jaune, un peu de bleu… et ça fait du vert !',
      "J'ai peint une carte au trésor pour Zap. Tu crois qu'elle ressemble à la vraie ?",
    ],
  },
  // ---- L'Île des Squishy Dumplings (saison 3, île 2) : Bao est le guide ;
  // Bambou parle des paniers de dix, Sésame des commandes (leurs répliques seulement).
  bao: {
    emoji: '🥟',
    name: 'Bao',
    title: 'le chef dumpling',
    world: 'dumplings',
    gender: 'm',
    loot: ['pate', 'feuillechou'],
    texts: [
      'Bienvenue dans ma cuisine ! Ici, tout cuit à la vapeur, tout doucement.',
      "Un bon dumpling, c'est tout mou, tout chaud, et ça sourit !",
      "Tu m'aides en cuisine ? J'ai plein de commandes !",
    ],
  },
  bambou: {
    emoji: '🎋',
    name: 'Bambou',
    title: 'la pousse de bambou qui empile les paniers',
    world: 'dumplings',
    gender: 'f',
    loot: ['feuillechou', 'brocoli'],
    texts: [
      "Un panier, c'est dix places. Quand il est plein, hop, on en prend un autre !",
      'Je range les dumplings par dix. Comme ça, on compte bien plus vite !',
      'Tu viens empiler les paniers avec moi ?',
    ],
  },
  sesame: {
    emoji: '🛎️',
    name: 'Sésame',
    title: 'la petite serveuse dumpling',
    world: 'dumplings',
    gender: 'f',
    loot: ['tassethe', 'boiteemporter'],
    texts: [
      'Ding ding ! Une nouvelle commande ! Tu la retiens avec moi ?',
      "Je dis la commande tout bas, pour ne pas l'oublier.",
      'Un client attend son plateau. On le prépare ensemble ?',
    ],
  },
  theo: {
    emoji: '🫖',
    name: 'Théo',
    title: 'la théière qui fait la vapeur',
    world: 'dumplings',
    gender: 'm',
    loot: ['tassethe', 'pate'],
    texts: [
      'Fiou ! Je fais la vapeur pour toute la cuisine.',
      "Attention, c'est chaud ! On souffle un peu avant de croquer.",
      'Une petite tasse de thé, et on joue ?',
    ],
  },
  // ---- L'Île des Coffres (saison 3, île 3) : Clémence est la guide ;
  // Kadi parle des codes, Grignote des histoires à compter (leurs répliques seulement).
  clemence: {
    emoji: '🗝️',
    name: 'Clémence',
    title: 'la gardienne des clés',
    world: 'coffres',
    gender: 'f',
    loot: ['clecuivre', 'piecedor'],
    texts: [
      "Bienvenue sur l'Île des Coffres ! J'ai une clé pour chaque serrure… sauf pour le grand coffre.",
      "Un coffre ne s'ouvre pas en forçant. Il s'ouvre en réfléchissant !",
      "Chaque mission réussie, c'est une serrure qui fait clic. On continue ?",
    ],
  },
  kadi: {
    emoji: '🔒',
    name: 'Kadi',
    title: 'le petit cadenas à code',
    world: 'coffres',
    gender: 'm',
    loot: ['petitcadenas', 'clecuivre'],
    texts: [
      'Clic, clac ! Je suis un cadenas à code. Tu trouves mon code ?',
      'Mes indices ne mentent jamais. Écoute-les bien, un par un !',
      "Dans mon code, chaque symbole ne sert qu'une fois. Ça aide, non ?",
    ],
  },
  grignote: {
    emoji: '🐭',
    name: 'Grignote',
    title: 'la souris qui compte tout',
    world: 'coffres',
    gender: 'f',
    loot: ['boulier', 'piecedor'],
    texts: [
      "Je compte tout : les pièces, les clés, les coffres ! Tu m'aides ?",
      'Une histoire, un dessin, un calcul… et hop, le trésor est trouvé !',
      'Écoute bien mon histoire. La réponse se cache dedans !',
    ],
  },
  pincou: {
    emoji: '🦀',
    name: 'Pinçou',
    title: 'le crabe serrurier',
    world: 'coffres',
    gender: 'm',
    loot: ['tournevis', 'petitcadenas'],
    texts: [
      "Avec mes pinces, j'ouvre les serrures… enfin, j'essaie !",
      'Clic-clic ! On joue avant que je referme mes pinces ?',
      'Le sable est plein de trésors. On cherche ensemble ?',
    ],
  },
};

export { CHARACTERS_S3 };
