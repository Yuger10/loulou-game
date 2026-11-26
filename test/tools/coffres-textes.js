// Les phrases de la banque B1 de « Le trésor raconté » (track monde-coffres),
// mot pour mot comme dans la spec : chaque ligne donne un problème, son énoncé
// attendu (null : non relu) et sa phrase réponse. Lu par test/problems.test.js.
// B1 : la revue de chaque gabarit avec le nombre 1 (table de la spec, mot pour mot)
const ONES = [
  [
    { type: 'reunion', a: 1, b: 1 },
    'Grignote a une pièce dans un coffre. Elle a une pièce dans un autre coffre. Combien de pièces a Grignote en tout ?',
    'Grignote a 2 pièces en tout.',
  ],
  [
    { type: 'ajout', a: 1, b: 1 },
    'Grignote a une pièce. Kadi lui en donne une. Combien de pièces a Grignote maintenant ?',
    'Grignote a 2 pièces maintenant.',
  ],
  [
    { type: 'retrait', a: 2, b: 1 },
    'Grignote a 2 pièces. Elle en perd une dans le sable. Combien de pièces reste-t-il à Grignote ?',
    'Il reste une pièce à Grignote.',
  ],
  [
    { type: 'partie', t: 4, a: 1 },
    'Grignote et Kadi ont 4 pièces en tout. Grignote en a une. Combien de pièces a Kadi ?',
    'Kadi a 3 pièces.',
  ],
  [{ type: 'partie', t: 4, a: 3 }, null, 'Kadi a une pièce.'],
  [
    { type: 'ajoutInconnu', a: 1, t: 5 },
    'Grignote a une pièce. Kadi lui en donne. Maintenant, Grignote en a 5. Combien Kadi lui en a donné ?',
    'Kadi lui a donné 4 pièces.',
  ],
  [{ type: 'ajoutInconnu', a: 4, t: 5 }, null, 'Kadi lui a donné une pièce.'],
  [
    { type: 'compPlus', a: 1, b: 1 },
    'Grignote a une pièce. Kadi en a une de plus que Grignote. Combien de pièces a Kadi ?',
    'Kadi a 2 pièces.',
  ],
  [
    { type: 'compEcart', a: 1, b: 2 },
    'Grignote a une pièce. Kadi en a 2. Combien Kadi en a de plus que Grignote ?',
    'Kadi en a une de plus que Grignote.',
  ],
  [
    { type: 'compMoinsPlus', t: 10, b: 1 },
    'Kadi a 10 pièces. Kadi en a une de plus que Grignote. Combien de pièces a Grignote ?',
    'Grignote a 9 pièces.',
  ],
  [{ type: 'compMoinsPlus', t: 10, b: 9 }, null, 'Grignote a une pièce.'],
  [
    { type: 'deuxEtapes', variant: 'A', a: 1, b: 1, c: 1 },
    'Grignote a une pièce. Kadi lui en donne une. Puis Grignote en perd une. Combien de pièces reste-t-il à Grignote ?',
    'Il reste une pièce à Grignote.',
  ],
  [
    { type: 'deuxEtapes', variant: 'B', a: 1, b: 1, c: 1 },
    'Grignote a une pièce. Kadi en a une. Grignote et Kadi en donnent une à Zap. Combien de pièces leur reste-t-il ?',
    'Il leur reste une pièce.',
  ],
  [
    { type: 'possible', a: 2, b: 1 },
    'Grignote a 2 pièces. Elle veut en donner une à Kadi. Est-ce possible ?',
    "Oui, c'est possible : Grignote a assez de pièces.",
  ],
  [{ type: 'possible', a: 2, b: 3 }, null, "Non, ce n'est pas possible : Grignote n'a pas assez de pièces."],
  [
    { type: 'ajout', a: 1, b: 1, p: 'pincou', q: 'zap', obj: 'coquillage' },
    'Pinçou a un coquillage. Zap lui en donne un. Combien de coquillages a Pinçou maintenant ?',
    'Pinçou a 2 coquillages maintenant.',
  ],
  [
    { type: 'compPlus', a: 1, b: 1, p: 'pincou', q: 'kadi', obj: 'coquillage' },
    'Pinçou a un coquillage. Kadi en a un de plus que Pinçou. Combien de coquillages a Kadi ?',
    'Kadi a 2 coquillages.',
  ],
  [
    { type: 'retrait', a: 12, b: 5, p: 'kadi', q: 'zap', obj: 'cle' },
    'Kadi a 12 clés. Il en perd 5 dans le sable. Combien de clés reste-t-il à Kadi ?',
    'Il reste 7 clés à Kadi.',
  ],
];

module.exports = { ONES };
