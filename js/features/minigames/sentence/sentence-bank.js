/* ---------- « La phrase rigolote » : la banque de phrases (table T4 de la spec) ----------
   Rangée par nombre d'étiquettes (3 à 7). La majuscule du premier mot et le
   point du dernier restent sur leurs étiquettes : presque toujours, un seul
   ordre est possible. `ok` liste l'autre ordre correct, s'il y en a un
   (règle R1b : une phrase correcte en français n'est jamais refusée, même
   drôle ; une phrase qui aurait plus de 2 ordres corrects est remplacée).
   Règle R2 : les mots de 3 étiquettes n'ont que les lettres simples du début
   de CP (a e é i o u y l r m s t p n f d v). `pic` : l'image, tailles 3 et 4.
   Une phrase ajoutée se relit par R1b, et `toSpoken` ne doit rien y élider. */

/** @typedef {{ t: string, pic: string, ok: string[] }} SentenceEntry */

/**
 * @param {string} t la phrase
 * @param {string} [pic] son image en emojis
 * @param {string} [other] l'autre ordre accepté
 * @returns {SentenceEntry}
 */
function sentenceEntry(t, pic = '', other = '') {
  return { t, pic, ok: other ? [other] : [] };
}

/** @type {Record<number, SentenceEntry[]>} */
const SENTENCES = {
  3: [
    sentenceEntry('Le rat rit.', '🐀😆'),
    sentenceEntry('Le lama rit.', '🦙😆'),
    sentenceEntry('La tortue rit.', '🐢😆'),
    sentenceEntry('Papi rit fort.', '👴😆'),
    sentenceEntry('Le pirate rit.', '🏴‍☠️😆'),
    sentenceEntry('Le rat lit.', '🐀📖'),
    sentenceEntry('Lulu a ri.', '🦦😆'),
    sentenceEntry('Le lama lit.', '🦙📖'),
  ],
  4: [
    sentenceEntry('Le chat chatouille Papi.', '🐱🪶👴'),
    sentenceEntry('La vache fait coucou.', '🐄👋'),
    sentenceEntry('Le cochon danse bien.', '🐷💃'),
    sentenceEntry('Le robot rit fort.', '🤖😆'),
    sentenceEntry('La souris chatouille Papi.', '🐭🪶👴'),
    sentenceEntry('Le poisson a froid.', '🐠🥶'),
    sentenceEntry('Le lapin fait dodo.', '🐰😴'),
    sentenceEntry('Le loup a peur.', '🐺😱'),
  ],
  5: [
    sentenceEntry('Le chat chatouille le loup.'),
    sentenceEntry('La vache mange la lune.'),
    sentenceEntry('Un ours mange une fusée.'),
    sentenceEntry('Le cochon fait du ski.'),
    sentenceEntry('La poule chatouille le lion.'),
    sentenceEntry('Le singe danse sur Papi.'),
    sentenceEntry('Le lapin porte un chapeau.'),
    sentenceEntry('Mamie a un nez rouge.'),
  ],
  6: [
    sentenceEntry('Le petit chat chatouille le loup.', '', 'Le chat chatouille le petit loup.'),
    sentenceEntry('La vache rose mange la lune.'),
    sentenceEntry('Le crocodile a mis un tutu.'),
    sentenceEntry('Papi chatouille le ventre du lion.'),
    sentenceEntry('Le poisson rouge fait du vélo.'),
    sentenceEntry('Un ours danse avec une fusée.'),
    sentenceEntry('Le roi a une barbe bleue.'),
    sentenceEntry('La grande girafe chatouille les nuages.'),
  ],
  7: [
    sentenceEntry('Le petit lapin chatouille le grand ours.', '', 'Le grand lapin chatouille le petit ours.'),
    sentenceEntry('Papi fait du ski sur la lune.'),
    sentenceEntry('La vache mange le gâteau du roi.'),
    sentenceEntry('Un poisson rouge chante dans le bain.'),
    sentenceEntry('Le lion porte une petite chaussette rose.'),
    sentenceEntry('Mamie chatouille le nez du gros dragon.', '', 'Mamie chatouille le gros nez du dragon.'),
    sentenceEntry('La tortue gagne la course des lapins.', '', 'La course gagne la tortue des lapins.'),
    sentenceEntry('Le gros chien chatouille la souris grise.'),
  ],
};

/**
 * R1 : la phrase construite (les étiquettes jointes par une espace) est-elle
 * `t` ou l'un des ordres de `ok` ? La ponctuation et les majuscules comptent.
 * @param {SentenceEntry} entry
 * @param {string} built
 * @returns {boolean}
 */
function sentenceAccepts(entry, built) {
  return built === entry.t || entry.ok.includes(built);
}

export { sentenceAccepts, SENTENCES };
