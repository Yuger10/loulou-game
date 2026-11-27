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
};

export { STORY_S3 };
