/* Les îles de la saison 3 « La Grande Expédition » : la carte de Zap, île après
   île. worlds.js les étale à la fin de WORLDS (même modèle que les autres
   fichiers `-s3` : worlds.js resterait sinon trop long avec cinq îles de plus). */

/** @type {Record<string, import('./worlds.js').World>} */
const WORLDS_S3 = {
  crayons: {
    name: "L'Île des Crayons",
    emoji: '✏️',
    level: 70,
    diff: 6,
    saison: 3,
    short: 'Crayons',
    subtitle: "L'île où tout se dessine",
    // son mini-jeu, selon l'âge : tracer avant 7 ans, mesurer ensuite
    game: (age) => (age && age < 7 ? 'trace' : 'length'),
    map: { x: 18, y: 78 },
    shape: 'crayons',
    icon: '✏️',
    sand: '#FFF6DC',
    land: '#F7C948',
    intro: "Bienvenue sur l'Île des Crayons, où tout se dessine ✏️",
    sceneEmpty: 'Ton île attend ses décorations en couleurs !',
  },
};

export { WORLDS_S3 };
