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
};

export { CHARACTERS_S3 };
