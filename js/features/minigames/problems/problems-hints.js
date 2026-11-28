/* ---------- « Le trésor raconté » : les indices (tables H0 et H1 de la spec) ----------
   Un seul moment est actif à la fois, et chaque moment a sa ligne : d'abord
   la méthode, puis le début du raisonnement. Jamais le résultat, jamais une
   réponse écartée (pas de `dim`). */
import { PB_OBJECTS, pbEn, pbQty, pbWords } from './problems-bank.js';
import { pbBarsHTML } from './problems-schema.js';

/** @typedef {import('./problems-bank.js').PbProblem} PbProblem */
/** @typedef {import('./problems-draw.js').PbStage} PbStage */
/** @typedef {import('../../hints/index.js').HintFx} HintFx */
/** @typedef {{ say: string, fx: HintFx }} PbHint */
/**
 * La question d'indice : le moment, le problème, l'étape en cours (aucune pour
 * « possible »), la représentation, le conteneur et le bloc de l'étape.
 * @typedef {{ moment: string, x: PbProblem, s: PbStage | null, rep: string, box: string, block: string }} ProblemsHintQ
 */
/** @typedef {import('../../hints/index.js').HintProvider<ProblemsHintQ>} ProblemsHintProvider */

/** @type {Record<string, (q: ProblemsHintQ) => PbHint[]>} les moments qui ne dépendent pas de l'étape */
const PB_HINTS = {
  exemple: () => [
    { say: "Regarde bien ce que je fais : j'écoute, je dessine, je calcule, je réponds.", fx: {} },
    { say: "Touche la flèche pour voir l'étape suivante.", fx: { glow: '#pb-ex .pb-next' } },
  ],
  comprendre: (q) => [
    { say: "Écoute bien l'histoire. Tu peux la réécouter avec le haut-parleur.", fx: { glow: '.btn-speak' } },
    {
      say: "Cherche la question : c'est la dernière phrase de l'histoire. Que veut-on savoir ?",
      fx: { glow: `#${q.box} .pb-vignette[data-q]` },
    },
  ],
  possible: (q) => {
    const o = PB_OBJECTS[q.x.obj];
    return [
      { say: "Peut-on donner plus que ce qu'on a ?", fx: { glow: `#${q.box} .pb-bars` } },
      {
        say: `${pbWords(q.x).P} a ${pbQty(q.x.a, o)}, et veut en donner ${pbEn(q.x.b, o)}. Lequel est le plus grand ?`,
        fx: {},
      },
    ];
  },
  repondre: (q) => [
    { say: "Touche le point d'interrogation pour répondre à la question.", fx: { glow: `#${q.box} .pb-answer` } },
    {
      say: "Ton calcul a trouvé le nombre. Mets-le à la place du point d'interrogation.",
      fx: { glow: `#${q.box} .pb-answer` },
    },
  ],
};

/**
 * Dessiner avec les objets : les mettre dans le coffre, ou en sortir.
 * @param {ProblemsHintQ} q
 * @param {PbStage} s
 * @returns {PbHint[]}
 */
function pbHintsTokens(q, s) {
  const w = pbWords(q.x);
  if (s.op === '+')
    return [
      {
        say: "Fais comme l'histoire : chaque objet va dans le coffre quand l'histoire le dit.",
        fx: { glow: `#${q.box} .pb-scene` },
      },
      { say: `${w.P} a ${w.N(q.x.a)} : commence par les siens.`, fx: { glow: `#${q.box} .pb-vignette[data-k="0"]` } },
    ];
  const told = q.x.type === 'retrait' ? `${w.P} en perd ${w.E(q.x.b)}.` : `${w.P} en a ${w.E(q.x.a)}.`;
  return [
    { say: "L'histoire dit combien il en part. Sors-les du coffre, un par un.", fx: { glow: `${q.block} .pb-chest` } },
    { say: `Écoute encore : ${told} Compte en les sortant.`, fx: { glow: `${q.block} .pb-chest` } },
  ];
}
/**
 * Dessiner : selon la représentation, et selon le schéma (parties-tout ou comparaison).
 * @param {ProblemsHintQ} q
 * @param {PbStage} s
 * @returns {PbHint[]}
 */
function pbHintsDraw(q, s) {
  if (q.rep === 'egalite')
    return [
      { say: "Dans ta tête, dessine l'histoire : on cherche le tout, ou une partie ?", fx: {} },
      {
        say: "Voici le dessin de l'histoire.",
        // le schéma rempli, en petit : des barres à regarder, pas des boutons
        fx: { html: `<div class="pb-mini">${pbBarsHTML(s, q.x, true).replace(/button/g, 'span')}</div>` },
      },
    ];
  if (q.rep !== 'barres') return pbHintsTokens(q, s);
  const bars = `${q.block} .pb-bars`;
  if (s.kind === 'cmp')
    return [
      { say: "Une barre pour chacun. La plus longue, c'est celui qui en a le plus.", fx: { glow: bars } },
      {
        say: "Le bout en pointillés, c'est ce que l'un a de plus que l'autre. Est-ce qu'on le connaît ?",
        fx: { glow: `${q.block} .pb-slot[data-s="ecart"]` },
      },
    ];
  return [
    { say: "La grande barre, c'est le tout. Les petites barres, ce sont les parties.", fx: { glow: bars } },
    {
      say: "Le tout, c'est quand on met tout ensemble. Est-ce qu'on le connaît, ou est-ce qu'on le cherche ?",
      fx: { glow: `${q.block} .pb-slot[data-s="tout"]` },
    },
  ];
}
/**
 * Calculer : partir du plus grand pour ajouter, compter ce qu'il manque pour enlever.
 * @param {PbStage} s
 * @returns {PbHint[]}
 */
function pbHintsCalc(s) {
  const big = Math.max(s.n1, s.n2);
  const small = Math.min(s.n1, s.n2);
  if (s.op === '+')
    return [
      { say: 'Pour ajouter, pars du plus grand nombre.', fx: {} },
      { say: `Pars de ${big}, et avance encore de ${small}.`, fx: {} },
    ];
  return [
    { say: "Pour enlever, tu peux compter ce qu'il manque pour aller du petit au grand.", fx: {} },
    { say: `Pars de ${small}, et compte combien il faut avancer pour arriver à ${big}.`, fx: {} },
  ];
}

/**
 * Les deux niveaux d'indice du moment en cours (table H0).
 * @type {ProblemsHintProvider}
 */
const pbHints = (q) => {
  if (PB_HINTS[q.moment]) return PB_HINTS[q.moment](q);
  if (!q.s) return PB_HINTS.comprendre(q);
  if (q.moment === 'dessiner') return pbHintsDraw(q, q.s);
  if (q.moment === 'calculer') return pbHintsCalc(q.s);
  return [
    { say: "On cherche le tout ? On ajoute. On cherche une partie ou l'écart ? On enlève.", fx: {} },
    {
      say: "Regarde où est le point d'interrogation sur ton dessin.",
      fx: { glow: `${q.block} .pb-slot[data-s="${q.s.slots[2]}"]` },
    },
  ];
};

export { pbHints };
