/* Les personnages de l'Île du Grand Concert (saison 3, île 5). Un fichier
   frère de characters-s3.js, qui les étale dans CHARACTERS_S3 : avec eux, il
   dépasserait la limite de 300 lignes du contrôle de qualité.
   Stella est la guide du chapitre ; Dorémi parle des notes (« Do, ré, mi »),
   Xylo de la mélodie, Trompi de la fête (leurs répliques seulement : aucun
   personnage n'est lié à un jeu dans le code). */

/** @type {Record<string, import('./characters.js').Character>} */
const CHARACTERS_CONCERT = {
  stella: {
    emoji: '👩‍🎤',
    name: 'Stella',
    title: 'la cheffe de la grande scène',
    world: 'concert',
    gender: 'f',
    loot: ['billetconcert', 'programme'],
    texts: [
      "Bienvenue sur ma grande scène ! Ce soir, c'est le Grand Concert, et tu as la meilleure place !",
      "Un concert, ça se prépare : on accorde, on répète, on écoute. Tu m'aides ?",
      'Chaque mission réussie allume une lumière de la scène. Encore une ?',
    ],
  },
  doremi: {
    emoji: '🐦',
    name: 'Dorémi',
    title: 'la petite fauvette qui chante la gamme',
    world: 'concert',
    gender: 'f',
    loot: ['etoilescene', 'billetconcert'],
    texts: [
      'Do, ré, mi, fa, sol, la, si, do ! Tu chantes avec moi ?',
      'Chaque note a sa lame sur le xylophone, et sa couleur. Le do est tout rouge !',
      'Sur la portée, plus la note est haute, plus elle chante aigu. Tu veux essayer ?',
    ],
  },
  xylo: {
    emoji: '🐻',
    name: 'Xylo',
    title: "l'ourson au xylophone",
    world: 'concert',
    gender: 'm',
    loot: ['lunettesstar', 'programme'],
    texts: [
      'Ding, dong, ding ! Écoute ma mélodie, puis rejoue-la avec moi !',
      'Les grandes lames font des notes graves, les petites des notes aiguës.',
      "Une mélodie, c'est comme un petit chemin : ça monte, ça descend, ça saute !",
    ],
  },
  trompi: {
    emoji: '🐘',
    name: 'Trompi',
    title: 'le petit éléphant trompettiste',
    world: 'concert',
    gender: 'm',
    loot: ['ampoule', 'lunettesstar'],
    texts: [
      "Pouêêt ! Pardon, je m'entraîne pour le concert !",
      "J'installe les lumières et les chaises. Tu viens voir la grande scène ?",
      "Tous les amis de l'expédition arrivent ce soir. Ça va être la plus belle fête !",
    ],
  },
};

export { CHARACTERS_CONCERT };
