/* Les chapitres de la saison 3 « La Grande Expédition » : chaque île rend un
   morceau de la carte de Zap. story.js les étale à la fin de STORY. */

/** @type {Record<string, import('./story.js').StoryChapter>} */
const STORY_S3 = {
  crayons: {
    guide: 'gribouille',
    title: 'Le premier morceau de la carte',
    intro: [
      "Bienvenue sur l'Île des Crayons ✏️ Ici, tout ce qu'on dessine prend vie !",
      "Le vent a posé un morceau de la carte de Zap sur mon cahier… mais le dessin s'est tout effacé.",
      'Résous mes devinettes : chaque bonne réponse redessine un bout de la carte !',
    ],
    riddles: [
      {
        q: "Je suis long et pointu, j'écris et je dessine, et on me taille quand je suis usé. Qui suis-je ?",
        tip: 'Sa mine laisse un trait gris sur la feuille.',
        opts: [{ e: '✏️', ok: true }, { e: '🥄' }, { e: '🔑' }],
      },
      {
        q: 'Je suis plate et droite, avec des petits traits et des nombres, et je sers à mesurer. Qui suis-je ?',
        tip: "On la pose le long d'un crayon pour savoir combien il mesure.",
        opts: [{ e: '📏', ok: true }, { e: '📖' }, { e: '🍴' }],
      },
      {
        q: "J'ai des poils tout doux au bout d'un manche, et je me trempe dans la peinture. Qui suis-je ?",
        tip: "On s'en sert pour peindre, pas pour se coiffer.",
        opts: [{ e: '🖌️', ok: true }, { e: '🪥' }, { e: '🧹' }],
      },
    ],
    success: 'Bravo ! Le dessin réapparaît : voici le premier morceau de la carte de Zap 🗺️',
    reward: 16,
  },
  dumplings: {
    guide: 'bao',
    title: 'Le deuxième morceau de la carte',
    intro: [
      'Bienvenue dans ma cuisine à vapeur 🥟 Je suis Bao, le chef des Squishy Dumplings !',
      "Ce matin, j'ai mis un vieux papier au fond d'un panier. C'était le deuxième morceau de la carte de Zap ! Mais j'ai empilé tous mes paniers, et je ne sais plus où il est.",
      'Résous mes devinettes de cuisine : chaque bonne réponse soulève un couvercle !',
    ],
    riddles: [
      {
        q: 'Je suis tout mou et tout blanc, je cuis dans la vapeur, et dedans il y a une bonne farce. Qui suis-je ?',
        tip: 'Je ressemble à un petit chausson, et on me mange avec des baguettes.',
        opts: [{ e: '🥟', ok: true }, { e: '🍕' }, { e: '🍩' }],
      },
      {
        q: "Je siffle quand l'eau est chaude, et je verse le thé par mon bec. Qui suis-je ?",
        tip: "J'ai une anse, un couvercle et un bec.",
        opts: [{ e: '🫖', ok: true }, { e: '🥄' }, { e: '🍳' }],
      },
      {
        q: 'Je suis une grande plante verte, toute droite, et on fait des paniers avec moi. Qui suis-je ?',
        tip: 'Ma tige a des nœuds, comme des petits anneaux.',
        opts: [{ e: '🎋', ok: true }, { e: '🌻' }, { e: '🌵' }],
      },
    ],
    success: 'Bravo ! Sous le dernier couvercle, le deuxième morceau de la carte est là, tout chaud et tout sec 🗺️',
    reward: 16,
  },
  coffres: {
    guide: 'clemence',
    title: 'Le troisième morceau de la carte',
    intro: [
      "Bienvenue sur l'Île des Coffres 🗝️ Ici, chaque coffre garde un secret, et chaque secret a sa clé.",
      'Zap a vu le troisième morceau de sa carte au fond du grand coffre. Mais le coffre est fermé, et sa serrure pose une devinette !',
      'Trouve la bonne réponse, et la serrure fera clic !',
    ],
    riddles: [
      {
        q: "Je suis petite, je suis en métal, et je tourne dans la serrure pour l'ouvrir. Qui suis-je ?",
        tip: 'Sans moi, la porte reste fermée. On me range sur un trousseau.',
        opts: [{ e: '🔑', ok: true }, { e: '🔨' }, { e: '🥄' }],
      },
      {
        q: "Je ferme les coffres et les vélos. Pour m'ouvrir, il faut une clé ou un code. Qui suis-je ?",
        tip: "On m'accroche, et clic ! je reste fermé.",
        opts: [{ e: '🔒', ok: true }, { e: '🔔' }, { e: '🎈' }],
      },
      {
        q: "Je montre le chemin d'un trésor. Une croix dit où creuser. Qui suis-je ?",
        tip: 'Les pirates me déplient pour trouver leur trésor.',
        opts: [{ e: '🗺️', ok: true }, { e: '📖' }, { e: '🖼️' }],
      },
    ],
    success:
      "Bravo ! La serrure fait clic, le grand coffre s'ouvre… et voici le troisième morceau de la carte de Zap 🗺️",
    reward: 16,
  },
  chatouilles: {
    guide: 'plumette',
    title: 'Le quatrième morceau de la carte',
    intro: [
      'Hi hi ! Bienvenue au Monde des Chatouilles 🪶 Ici, tout le monde rit pour un rien.',
      "Le quatrième morceau de la carte de Zap s'est envolé dans mon arbre à plumes. Il est caché tout en haut, sous les plumes qui chatouillent !",
      "Ici, on chatouille seulement ceux qui en ont envie, et quand quelqu'un dit stop, on s'arrête. Résous mes devinettes, et l'arbre te donnera le morceau !",
    ],
    riddles: [
      {
        q: 'Je suis toute légère, je vole au vent, et je chatouille le bout du nez. Qui suis-je ?',
        tip: 'Les oiseaux en ont plein sur le dos.',
        opts: [{ e: '🪶', ok: true }, { e: '🪨' }, { e: '🔨' }],
      },
      {
        q: "On me met aux pieds, une à droite, une à gauche, et parfois j'ai des pois. Qui suis-je ?",
        tip: 'On me met avant les chaussures.',
        opts: [{ e: '🧦', ok: true }, { e: '🧤' }, { e: '🎩' }],
      },
    ],
    success: "Bravo ! L'arbre à plumes rit si fort qu'il laisse tomber le quatrième morceau de la carte de Zap ! 🗺️",
    reward: 16,
  },
  // le dernier chapitre : son énigme résolue ouvre le grand final (finale3.js) ;
  // 20 pièces, comme le final de la saison 2
  concert: {
    guide: 'stella',
    title: 'Le dernier morceau de la carte',
    intro: [
      "Bienvenue sur la grande scène ! 🎼 Ce soir, tous les amis de l'expédition viennent jouer au Grand Concert.",
      "Zap m'a dit que le dernier morceau de sa carte au trésor est caché ici, quelque part dans la musique.",
      "Résous mes devinettes : à chaque bonne réponse, un instrument s'accorde, et le morceau de carte se rapproche !",
    ],
    riddles: [
      {
        q: "J'ai six cordes, on me gratte avec les doigts, et je fais gling gling. Qui suis-je ?",
        tip: 'On la tient contre son ventre, et on chante avec elle.',
        opts: [{ e: '🎸', ok: true }, { e: '🎷' }, { e: '🥁' }],
      },
      {
        q: 'Je suis tout petit, on me tient devant la bouche, et je rends ta voix très forte. Qui suis-je ?',
        tip: 'Les chanteurs me tiennent dans la main, sur la scène.',
        opts: [{ e: '🎤', ok: true }, { e: '🎧' }, { e: '📯' }],
      },
      {
        q: "On me met sur les oreilles, et j'écoute la musique tout bas, rien que pour moi. Qui suis-je ?",
        tip: "J'ai deux petits coussins tout doux, un pour chaque oreille.",
        opts: [{ e: '🎧', ok: true }, { e: '🎤' }, { e: '🔔' }],
      },
    ],
    success:
      'Bravo ! Tous les instruments sont prêts… et regarde : le dernier morceau de la carte de Zap était caché dans le pupitre 🗺️',
    reward: 20,
  },
};

export { STORY_S3 };
