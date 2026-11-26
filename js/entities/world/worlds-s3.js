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
  dumplings: {
    name: "L'Île des Squishy Dumplings",
    emoji: '🥟',
    level: 78,
    diff: 6,
    saison: 3,
    short: 'Dumplings',
    subtitle: 'La cuisine à vapeur',
    // son mini-jeu, à tout âge : ranger par paniers de dix (le souhait de la joueuse)
    game: 'tens',
    map: { x: 50, y: 74 },
    shape: 'dumplings',
    icon: '🥟',
    sand: '#FFF6E6',
    land: '#A8D5A2',
    intro: "Bienvenue sur l'Île des Squishy Dumplings, où ça sent bon la vapeur 🥟",
    sceneEmpty: 'Ta cuisine attend ses décorations toutes chaudes !',
  },
  coffres: {
    name: "L'Île des Coffres",
    emoji: '🗝️',
    level: 86,
    diff: 6,
    saison: 3,
    short: 'Coffres',
    subtitle: "L'île aux mille serrures",
    // son mini-jeu, à tout âge : les problèmes racontés (le parent demande « plus de maths »)
    game: 'problems',
    map: { x: 82, y: 70 },
    shape: 'coffres',
    icon: '🗝️',
    sand: '#F6E3B4',
    land: '#C8955A',
    intro: "Bienvenue sur l'Île des Coffres, où chaque coffre garde un secret 🗝️",
    sceneEmpty: 'Ton île attend ses décorations pleines de secrets !',
  },
};

export { WORLDS_S3 };
