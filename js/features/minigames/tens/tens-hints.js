/* ---------- « Les paniers de dix » : les indices (table T3 de la spec) ----------
   Niveau 1 : la méthode ; niveau 2 : le début du raisonnement, jamais le total.
   Les indices de « lire » décrivent les groupes DESSINÉS (33 peut être montré
   en 2 paniers et 13 tout seuls), jamais les chiffres du nombre. Seul le
   niveau 2 écarte une réponse, quand il y en a 4 : le piège le plus éloigné. */
import { tensBasketSVG, tensPileSVG } from './tens-draw.js';
import { tensDigits, tensQty } from './tens-build.js';

/** @typedef {import('./tens-build.js').TensQuestion} TensQuestion */
/** @typedef {import('../../hints/index.js').HintFx} HintFx */
/** @typedef {{ say: string, fx: HintFx }} TensHint */
/** @typedef {import('../../hints/index.js').HintProvider<TensQuestion>} TensHintProvider */

/**
 * La réponse à écarter : avec 4 choix seulement, le piège le plus éloigné de la
 * bonne réponse ; à distance égale, la plus grande valeur.
 * @param {TensQuestion} q
 * @returns {HintFx}
 */
function tensDim(q) {
  const wrong = q.options.filter((v) => v !== q.n);
  if (q.options.length < 4 || !wrong.length) return {};
  const far = Math.max(...wrong.map((v) => Math.abs(v - q.n)));
  const pick = Math.max(...wrong.filter((v) => Math.abs(v - q.n) === far));
  return { dim: `.tens-opt[data-v="${pick}"]` };
}
/** @param {number} known la bande « 30 + ? = ? » : ce qui est déjà compté, le reste à trouver */
function tensStrip(known) {
  return `<span class="hint-strip"><i>${known}</i><i>+ ?</i><i class="q">= ?</i></span>`;
}

/**
 * Ranger : selon ce qui est déjà rangé au moment où l'indice est demandé.
 * @param {TensQuestion} q
 * @returns {TensHint[]}
 */
function tensHintsBuild(q) {
  if (q.placed < q.n) {
    const first = {
      say: "Touche chaque dumpling : il saute dans le panier. Un panier, c'est dix places.",
      fx: { glow: '.tens-heap' },
    };
    return q.placed < 10
      ? [
          first,
          {
            say: "Regarde : il reste des places dans le panier. Remplis-le d'abord !",
            fx: { glow: `.tens-cell[data-c="${q.placed}"]` },
          },
        ]
      : [
          first,
          {
            say: "Le panier est plein : c'est dix. Touche ceux qui restent, ils vont à côté.",
            fx: { glow: '.tens-heap' },
          },
        ];
  }
  const counted = {
    say: "Un panier plein, c'est dix. Compte dix, puis continue avec ceux qui sont tout seuls.",
    fx: { glow: '.tens-basket' },
  };
  return q.n - 10 >= 2
    ? [
        counted,
        {
          say: 'Après dix, on dit onze, douze… Continue !',
          fx: { marks: [{ sel: '.tens-loose .tens-dumpling:first-child', text: '11' }] },
        },
      ]
    : [counted, { say: 'Compte avec ton doigt : dix pour le panier, puis le tout seul.', fx: { glow: '.tens-loose' } }];
}

/**
 * Lire, paliers 2 à 4 : les paniers dessinés, puis le reste.
 * @param {TensQuestion} q
 * @returns {TensHint[]}
 */
function tensHintsRead(q) {
  if (q.loose === 0)
    return [
      { say: 'Compte les paniers de dix en dix.', fx: { glow: '#tens-stage' } },
      {
        say: 'Compte de dix en dix avec moi : 10, 20… Continue !',
        fx: {
          marks: [
            { sel: '.tens-basket:nth-child(1)', text: '10' },
            { sel: '.tens-basket:nth-child(2)', text: '20' },
          ],
          ...tensDim(q),
        },
      },
    ];
  return [
    {
      say: 'Compte les paniers de dix en dix, puis ajoute les dumplings tout seuls.',
      fx: { glow: '#tens-stage' },
    },
    {
      say: `${tensQty(q.baskets, 'panier', 'paniers')}, ça fait ${10 * q.baskets}. Ajoute le reste !`,
      fx: { html: tensStrip(10 * q.baskets), ...tensDim(q) },
    },
  ];
}
/**
 * Lire, palier 5 : les piles de cent d'abord.
 * @param {TensQuestion} q
 * @returns {TensHint[]}
 */
function tensHintsReadHundreds(q) {
  const first = {
    say: "Compte d'abord les piles de cent, puis les paniers de dix, puis ceux qui sont tout seuls.",
    fx: { glow: '#tens-stage' },
  };
  if (q.baskets > 0 || q.loose > 0)
    return [
      first,
      {
        say: `${tensQty(q.piles, 'pile', 'piles')}, ça fait ${100 * q.piles}. Ajoute le reste !`,
        fx: { html: tensStrip(100 * q.piles), ...tensDim(q) },
      },
    ];
  if (q.piles === 1) return [first, { say: "Une pile, c'est dix paniers de dix dumplings.", fx: tensDim(q) }];
  return [
    first,
    {
      say: 'Compte de cent en cent avec moi : 100, 200… Continue !',
      fx: {
        marks: [
          { sel: '.tens-pile:nth-child(1)', text: '100' },
          { sel: '.tens-pile:nth-child(2)', text: '200' },
        ],
        ...tensDim(q),
      },
    },
  ];
}

/**
 * Construire : ce que dit chaque chiffre, puis le premier groupe à poser.
 * @param {TensQuestion} q
 * @returns {TensHint[]}
 */
function tensHintsMake(q) {
  const { c, d, u } = tensDigits(q.n);
  const big = q.tier === 5;
  const first = {
    say: big
      ? 'Le premier chiffre dit combien de piles, le deuxième combien de paniers, le dernier combien de tout seuls.'
      : 'Le premier chiffre dit combien de paniers. Le dernier dit combien de dumplings tout seuls.',
    fx: { glow: '#tens-target' },
  };
  if ([c, d, u].filter(Boolean).length < 2) {
    const say = big
      ? 'Les deux derniers chiffres sont 0 : ni panier, ni tout seul. Combien de piles ?'
      : 'Le dernier chiffre est 0 : pas de dumpling tout seul. Combien de paniers ?';
    return [first, { say, fx: { glow: '#tens-target' } }];
  }
  const x = big ? c : d;
  const groups = big ? tensQty(x, 'pile', 'piles') : tensQty(x, 'panier', 'paniers');
  return [
    first,
    {
      say: `Dans ${q.n}, le premier chiffre est ${x}. Commence par mettre ${groups}.`,
      fx: { glow: big ? '#tens-add100' : '#tens-add10' },
    },
  ];
}

/**
 * Écrire : chaque morceau de l'écriture, puis le plus grand, dessiné.
 * @param {TensQuestion} q
 * @returns {TensHint[]}
 */
function tensHintsWrite(q) {
  const { c, d } = tensDigits(q.n);
  if (q.tier === 5)
    return [
      {
        say: 'Regarde chaque morceau : les centaines, les dizaines, puis les unités.',
        fx: { glow: '#tens-expr' },
      },
      {
        say: `${100 * c}, c'est ${tensQty(c, 'pile', 'piles')} de cent. Ajoute le reste !`,
        fx: { html: tensPileSVG().repeat(c), ...tensDim(q) },
      },
    ];
  return [
    {
      say: 'Regarde chaque morceau : le plus grand te donne les dizaines, le petit les unités.',
      fx: { glow: '#tens-expr' },
    },
    {
      say: `${10 * d}, c'est ${tensQty(d, 'panier', 'paniers')} de dix. Combien de tout seuls en plus ?`,
      fx: { html: tensBasketSVG().repeat(d), ...tensDim(q) },
    },
  ];
}

/**
 * Les deux niveaux d'indice de la question, lus au moment où l'indice est demandé.
 * @type {TensHintProvider}
 */
const tensHints = (q) => {
  if (q.mode === 'build') return tensHintsBuild(q);
  if (q.mode === 'make') return tensHintsMake(q);
  if (q.mode === 'write') return tensHintsWrite(q);
  return q.tier === 5 ? tensHintsReadHundreds(q) : tensHintsRead(q);
};

export { tensHints };
