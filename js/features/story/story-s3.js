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
};

export { STORY_S3 };
