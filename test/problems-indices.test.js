// L'Île des Coffres : les indices de « Le trésor raconté » (critère 18 de la
// spec) : la table H0 (quelle ligne à quel moment) et les textes de H1, deux
// niveaux par moment, jamais le résultat, aucune réponse écartée.
// Harnais : test/tools/coffres.js.
const t = require('./tools/coffres.js');
const { ev, json, check, section, one } = t;

const lv = () => ev('hintsFor("problems", hint.q)');
const H1 = {
  exemple: [
    "Regarde bien ce que je fais : j'écoute, je dessine, je calcule, je réponds.",
    "Touche la flèche pour voir l'étape suivante.",
  ],
  comprendre: [
    "Écoute bien l'histoire. Tu peux la réécouter avec le haut-parleur.",
    "Cherche la question : c'est la dernière phrase de l'histoire. Que veut-on savoir ?",
  ],
  ajouter: ["Fais comme l'histoire : chaque objet va dans le coffre quand l'histoire le dit."],
  sortir: ["L'histoire dit combien il en part. Sors-les du coffre, un par un."],
  partiesTout: [
    "La grande barre, c'est le tout. Les petites barres, ce sont les parties.",
    "Le tout, c'est quand on met tout ensemble. Est-ce qu'on le connaît, ou est-ce qu'on le cherche ?",
  ],
  comparaison: [
    "Une barre pour chacun. La plus longue, c'est celui qui en a le plus.",
    "Le bout en pointillés, c'est ce que l'un a de plus que l'autre. Est-ce qu'on le connaît ?",
  ],
  operation: [
    "On cherche le tout ? On ajoute. On cherche une partie ou l'écart ? On enlève.",
    "Regarde où est le point d'interrogation sur ton dessin.",
  ],
  egalite: ["Dans ta tête, dessine l'histoire : on cherche le tout, ou une partie ?", "Voici le dessin de l'histoire."],
  plus: ['Pour ajouter, pars du plus grand nombre.'],
  moins: ["Pour enlever, tu peux compter ce qu'il manque pour aller du petit au grand."],
  possible: ['Peut-on donner plus que ce qu’on a ?'.replace('’', "'")],
  repondre: [
    "Touche le point d'interrogation pour répondre à la question.",
    'Ton calcul a trouvé le nombre. Mets-le à la place du point d’interrogation.'.replace('’', "'"),
  ],
};
// les deux phrases du moment, et les effets attendus
function moment(name, says, ...effects) {
  const [fx, choices] = effects;
  const h = lv();
  check(`H0 et H1, ${name}`, () => [
    h.length === 2,
    json(h.map((x) => x.say)) === json(says),
    !fx || json(h.map((x) => x.fx.glow || null)) === json(fx),
    h.every((x) => !x.fx.dim && !x.fx.strike),
    (ev('hint.choices') || null) === (choices || null),
  ]);
}

function concret() {
  t.openPb(1, 2, { type: 'ajout', a: 3, b: 2 });
  const q0 = t.question();
  moment('ouverture (n = 2) : Comprendre', H1.comprendre, ['.btn-speak', '#pb-main .pb-vignette[data-q]']);
  t.hintBtn().click();
  one('#pb-main .pb-next').click();
  check('critère 18 : chaque moment pose une nouvelle question, les indices repartent du niveau 1', () => [
    t.question() !== q0,
    ev('hint.level') === 0,
    t.question().moment === 'dessiner',
  ]);
  moment(
    'Dessiner, concret, ajout : Concret, ajouter',
    [H1.ajouter[0], 'Grignote a 3 pièces : commence par les siens.'],
    ['#pb-main .pb-scene', '#pb-main .pb-vignette[data-k="0"]'],
  );
  t.play(t.sol().slice(1, 6));
  moment('Calculer, ➕', [H1.plus[0], 'Pars de 3, et avance encore de 2.'], null, '#pb-main-e1 .pb-num');
  one('#pb-main-e1 .pb-num[data-v="5"]').click();
  moment('Répondre', H1.repondre, ['#pb-main .pb-answer', '#pb-main .pb-answer']);
  ev('closeModal()');
}
function concretBarre() {
  t.openPb(2, 2, { type: 'retrait', a: 5, b: 2 });
  one('#pb-main .pb-next').click();
  moment('Dessiner, concret-barre, retrait : Concret, sortir', [
    H1.sortir[0],
    'Écoute encore : Grignote en perd 2. Compte en les sortant.',
  ]);
  t.play(t.sol().slice(1, 4));
  moment(
    'Opération (concret-barre, après le rangement)',
    H1.operation,
    [null, '#pb-main-e1 .pb-slot[data-s="partie2"]'],
    '#pb-main-e1 .pb-sign',
  );
  one('#pb-main-e1 .pb-sign[data-v="-"]').click();
  moment(
    'Calculer, ➖',
    [H1.moins[0], 'Pars de 2, et compte combien il faut avancer pour arriver à 5.'],
    null,
    '#pb-main-e1 .pb-num',
  );
  ev('closeModal()');
  t.openPb(2, 2, { type: 'partie', t: 5, a: 1 });
  one('#pb-main .pb-next').click();
  moment('Dessiner, partie, a = 1 : la règle du nombre 1', [
    H1.sortir[0],
    'Écoute encore : Grignote en a une. Compte en les sortant.',
  ]);
  ev('closeModal()');
}
function barres() {
  t.openPb(3, 2, t.sample('partie', 3));
  one('#pb-main .pb-next').click();
  moment('Dessiner, barres, partie : Parties-tout', H1.partiesTout, [
    '#pb-main-e1 .pb-bars',
    '#pb-main-e1 .pb-slot[data-s="tout"]',
  ]);
  ev('closeModal()');
  t.openPb(3, 2, t.sample('compEcart', 3));
  one('#pb-main .pb-next').click();
  moment('Dessiner, barres, compEcart : Comparaison', H1.comparaison, [
    '#pb-main-e1 .pb-bars',
    '#pb-main-e1 .pb-slot[data-s="ecart"]',
  ]);
  t.play(t.sol().slice(1, 7));
  moment('Opération (barres)', H1.operation, [null, '#pb-main-e1 .pb-slot[data-s="ecart"]'], '#pb-main-e1 .pb-sign');
  ev('closeModal()');
  t.openPb(4, 2, { type: 'deuxEtapes', variant: 'A', a: 20, b: 14, c: 9 });
  t.play(t.sol().slice(0, 9));
  moment('Dessiner, deuxEtapes, étape 2 : Parties-tout', H1.partiesTout, [
    '#pb-main-e2 .pb-bars',
    '#pb-main-e2 .pb-slot[data-s="tout"]',
  ]);
  ev('closeModal()');
}
function egaliteEtPossible() {
  t.openPb(5, 2, t.sample('partie', 5));
  one('#pb-main .pb-next').click();
  moment('Dessiner, egalite : Égalité', H1.egalite);
  check('H1, Égalité : l’indice 2 montre le schéma rempli, en petit', () => [
    lv()[1].fx.html.includes('pb-bars') && lv()[1].fx.html.includes('63'),
    !lv()[1].fx.html.includes('>45<'),
  ]);
  ev('closeModal()');
  t.openPb(4, 2, { type: 'possible', a: 25, b: 31 });
  one('#pb-main .pb-next').click();
  moment('possible, avant 👍 ou 👎', [
    H1.possible[0],
    'Grignote a 25 pièces, et veut en donner 31. Lequel est le plus grand ?',
  ]);
  ev('closeModal()');
}
async function exempleEtJumeau() {
  t.openPb(1, 0, { type: 'ajout', a: 1, b: 4, ex: { type: 'ajout', a: 3, b: 2 } });
  moment('n = 0, de l’ouverture au dernier 👉 : Exemple résolu', H1.exemple);
  t.play(t.sol().slice(0, 3));
  moment('n = 0, pendant l’exemple : toujours Exemple résolu', H1.exemple);
  t.play(t.sol().slice(3, 5));
  moment(
    'n = 0, jumeau : le premier moment de l’enfant (Calculer, ➕)',
    [H1.plus[0], 'Pars de 4, et avance encore de 1.'],
    null,
    '#pb-twin-e1 .pb-num',
  );
  t.hintBtn().click();
  t.hintBtn().click();
  const win = t.play(t.sol().slice(5)) && (await t.won());
  check('critère 18 : après les deux indices, le jeu reste gagnable, sans erreur notée', () => [
    win,
    ev('missionErrors') === 0,
  ]);
  ev('closeModal()');
}
// aucun indice ne dit le résultat, à aucun palier ni à aucun moment de la solution
function jamaisLeResultat() {
  const bad = [];
  for (const p of t.TIERS)
    for (const type of t.T1[p].types) {
      t.openPb(p, 2, t.sample(type, p));
      const r = t.resultOf(t.data());
      for (const sel of t.sol()) {
        const h = lv();
        if (h.length !== 2 || h[0].say === h[1].say || h.some((x) => x.say.length < 9))
          bad.push(`${p} ${type} : 2 indices`);
        if (h.some((x) => new RegExp(`(= |ça fait )${r}(?![0-9])`).test(x.say)))
          bad.push(`${p} ${type} : résultat dit`);
        one(sel).click();
      }
      ev('closeModal()');
    }
  check('critère 18 : à chaque moment de chaque type, 2 indices distincts, jamais « = résultat »', () => [
    bad.length === 0,
  ]);
  if (bad.length) console.log('   ' + bad.slice(0, 8).join('\n   '));
}

(async () => {
  await t.start();
  section('Le trésor raconté : indices (H0, H1)');
  concret();
  concretBarre();
  barres();
  egaliteEtPossible();
  await exempleEtJumeau();
  jamaisLeResultat();
  await t.finish("l'Île des Coffres (problems, les indices)");
})();
