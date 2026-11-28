/* ---------- Les idées sans écran du bilan de la semaine ----------
   La table de bilan.js, dans son fichier : des textes pour les parents, à
   relire et à compléter sans toucher au calcul de la carte. */
// Une idée sans écran par jeu suivi (les clés de GAME_LIST et de SKILL_GROUPS).
// Un nouveau mini-jeu ajoute la sienne (conductor/checklist-mini-jeu.md) : sans
// elle, test/bilan.test.js échoue. Textes constants, sans <, >, & ni " : ils
// s'insèrent tels quels dans la carte. `name` : pour une activité absente de
// GAME_LIST (les boîtes de rangement de la chambre à squishies).
/** @type {Record<string, { tip: string, name?: string }>} */
const BILAN_TIPS = {
  memory: {
    tip: 'Posez 5 objets de la maison sur la table, laissez votre enfant les regarder, cachez-en un sous un torchon : lequel a disparu ?',
  },
  count: {
    tip: 'En mettant la table, comptez ensemble les couverts en touchant chacun une seule fois, puis demandez : « Combien en tout ? »',
  },
  diff: {
    tip: "Posez 4 cuillères et 1 fourchette, puis demandez lequel n'est pas de la même famille, et pourquoi.",
  },
  puzzle: {
    tip: 'Écrivez 5 nombres sur des bouts de papier, mélangez-les et rangez-les ensemble du plus petit au plus grand.',
  },
  sequence: {
    tip: 'Faites une suite avec des couverts (fourchette, cuillère, fourchette, cuillère) et demandez ce qui vient après.',
  },
  simon: {
    tip: "Montrez 3 objets de couleurs différentes dans un ordre, cachez-les, et demandez de refaire l'ordre ; ajoutez-en un quand c'est réussi.",
  },
  math: {
    tip: "À table, avec de vrais objets : « Tu as 3 pâtes, j'en ajoute 2, combien en as-tu ? » Puis la même question sans regarder.",
  },
  reading: {
    tip: 'Lisez ensemble un mot court sur un paquet ou une étiquette, en montrant chaque syllabe du doigt.',
  },
  determinants: {
    tip: 'Montrez un objet de la cuisine et jouez à « un ou une ? » : une cuillère, un verre, une assiette.',
  },
  volume: {
    tip: "Prenez deux verres de formes différentes : lequel contient le plus ? Vérifiez en transvasant l'eau.",
  },
  compare: { tip: 'Lancez deux dés ou tirez deux cartes : chacun dit quel nombre est le plus grand.' },
  money: {
    tip: 'Jouez à la marchande avec de vraies pièces : « Ça coûte 5 euros, quelles pièces donnes-tu ? »',
  },
  clock: {
    tip: 'Regardez ensemble une horloge à aiguilles plusieurs fois dans la journée : « La petite aiguille est sur le 7, il est 7 heures. »',
  },
  calendar: {
    tip: "Au dîner : « Quel jour sommes-nous ? Et demain ? » ; à la fenêtre : « Quelle saison, d'après les arbres ? »",
  },
  calc: {
    tip: 'En voiture ou à table, posez un calcul court à voix haute (« 5 plus 5 ? ») et laissez le temps de répondre, sans presser.',
  },
  shapes: {
    tip: "Cherchez dans la cuisine un objet rond, un carré, un triangle, puis comptez ensemble les coins d'une boîte.",
  },
  planets: {
    tip: "Avec une lampe et une orange : la lampe est le Soleil ; tournez l'orange pour montrer le jour et la nuit.",
  },
  jigsaw: { tip: 'Découpez une image de magazine en 4 morceaux et reconstituez-la ensemble.' },
  nesting: { tip: 'Rangez 3 ou 4 bols du plus petit au plus grand, puis emboîtez-les.' },
  cubes: {
    tip: "Empilez quelques morceaux de sucre ou des briques, puis demandez combien il y en a, même ceux qu'on ne voit pas.",
  },
  packs: { tip: 'Faites des tas de 2 pâtes et comptez tas par tas : « 2, 4, 6. »' },
  shelf: {
    tip: 'Posez des petits objets dans une boîte à œufs et décrivez leur place : « en haut, à gauche ».',
  },
  share: { tip: 'En coupant une crêpe ou une pomme, demandez : « Est-ce que chacun a la même part ? »' },
  recipe: {
    tip: 'Faites une vraie recette ensemble : votre enfant verse et mesure avec le verre doseur, les cuillères ou la balance.',
  },
  rhythm: { tip: 'Tapez dans les mains un rythme court (long, court, court) et demandez de le refaire.' },
  pitch: {
    tip: "Tapez doucement sur des verres plus ou moins remplis d'eau : lequel fait le son le plus aigu ?",
  },
  lifecycle: {
    tip: 'Faites germer une lentille ou un haricot dans du coton mouillé et regardez-le pousser chaque jour.',
  },
  ladybugs: { tip: 'Avec des pâtes : « Fais le double de 3 », puis « Partage 8 en deux tas pareils. »' },
  potions: {
    tip: 'Mélangez deux couleurs de peinture ou de pâte à modeler : « Jaune et bleu, ça donne quoi ? »',
  },
  mirror: {
    tip: "Posez un ruban sur la table ; placez 3 objets d'un côté et demandez de les placer en miroir de l'autre côté.",
  },
  trace: {
    tip: 'Sur une ardoise ou dans la farine, tracez ensemble une lettre en partant du point choisi et en suivant son chemin.',
  },
  length: {
    tip: 'Avec deux crayons, demandez lequel est le plus long, puis vérifiez en alignant leurs pointes.',
  },
  tens: {
    tip: 'Rassemblez des petits objets par paquets de dix, puis comptez les paquets et ceux qui restent.',
  },
  order: {
    tip: 'Alignez quelques jouets du plus petit au plus grand, puis demandez où placer le suivant.',
  },
  problems: {
    tip: 'Racontez une petite histoire avec des objets : « Il y en a 3, puis 2 arrivent. Combien maintenant ? »',
  },
  code: {
    tip: 'Inventez un code avec deux formes ou couleurs et laissez votre enfant retrouver le message caché.',
  },
  coding: {
    tip: 'Choisissez un jouet à rejoindre et donnez ensemble des directions simples : avance, tourne, avance.',
  },
  sentence: {
    tip: 'Piochez trois mots dans un livre et inventez ensemble une phrase drôle avec ces mots.',
  },
  rangement: {
    name: '📦 Boîtes de rangement',
    tip: "Triez ensemble le linge ou les jouets selon une règle choisie par votre enfant : la couleur, la taille ou l'usage.",
  },
};

export { BILAN_TIPS };
