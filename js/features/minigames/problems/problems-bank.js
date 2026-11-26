/* ---------- « Le trésor raconté » : la banque d'énoncés (table B1 de la spec) ----------
   Les personnages et les objets des histoires sont ici, en local : le jeu ne
   dépend d'aucune entité de l'Île des Coffres. Un problème = un type, ses
   nombres, deux personnages, un objet. Chaque phrase de l'énoncé est dite et
   a sa vignette (table V1) : qui elle montre, et combien d'objets.
   Règle du nombre 1 : « une pièce », « un coquillage », « lui en donne une » ;
   à partir de 2, le nombre s'écrit en chiffres. */

/** @typedef {{ name: string, gender: 'f' | 'm', emoji: string }} PbPerson */
/** @type {Record<string, PbPerson>} */
const PB_PEOPLE = {
  clemence: { name: 'Clémence', gender: 'f', emoji: '🗝️' },
  kadi: { name: 'Kadi', gender: 'm', emoji: '🔒' },
  grignote: { name: 'Grignote', gender: 'f', emoji: '🐭' },
  pincou: { name: 'Pinçou', gender: 'm', emoji: '🦀' },
  zap: { name: 'Zap', gender: 'm', emoji: '🦸‍♂️' },
};
/** @typedef {{ emoji: string, one: string, many: string, gender: 'f' | 'm' }} PbObject */
/** @type {Record<string, PbObject>} */
const PB_OBJECTS = {
  piece: { emoji: '🪙', one: 'pièce', many: 'pièces', gender: 'f' },
  cle: { emoji: '🔑', one: 'clé', many: 'clés', gender: 'f' },
  gemme: { emoji: '💎', one: 'gemme', many: 'gemmes', gender: 'f' },
  coquillage: { emoji: '🐚', one: 'coquillage', many: 'coquillages', gender: 'm' },
  bague: { emoji: '💍', one: 'bague', many: 'bagues', gender: 'f' },
};

/**
 * Un problème tiré : `a`, `b`, `c`, `t` suivent la table A1 (0 : sans objet ;
 * pour compEcart, `b` est le grand nombre). `r` : le résultat (0 pour
 * « possible », qui se juge par b ≤ a) ; `r1` : le résultat de l'étape 1.
 * @typedef {{ type: string, variant: string, a: number, b: number, c: number, t: number,
 *   r: number, r1: number, p: string, q: string, obj: string }} PbProblem
 */
/** @typedef {{ text: string, who: string[], n: number, q: boolean }} PbLine une phrase et sa vignette (n : 0 sans nombre) */
/** @typedef {{ lines: PbLine[], answer: string }} PbStory */

/**
 * « une pièce », « 3 pièces » : le nombre et le nom de l'objet.
 * @param {number} n
 * @param {PbObject} o
 */
function pbQty(n, o) {
  return n === 1 ? `${pbOne(o)} ${o.one}` : `${n} ${o.many}`;
}
/** @param {PbObject} o « une » ou « un » */
function pbOne(o) {
  return o.gender === 'f' ? 'une' : 'un';
}
/**
 * Le nombre sans le nom : « lui en donne une », « en a 5 ».
 * @param {number} n
 * @param {PbObject} o
 */
function pbEn(n, o) {
  return n === 1 ? pbOne(o) : String(n);
}

/**
 * Ce dont les gabarits ont besoin : les noms, les accords, les nombres déjà écrits.
 * @param {PbProblem} x
 */
function pbWords(x) {
  const o = PB_OBJECTS[x.obj];
  const P = PB_PEOPLE[x.p];
  return {
    P: P.name,
    Q: PB_PEOPLE[x.q].name,
    Il: P.gender === 'f' ? 'Elle' : 'Il',
    il: P.gender === 'f' ? 'elle' : 'il',
    objs: o.many,
    /** @param {number} n */
    N: (n) => pbQty(n, o),
    /** @param {number} n */
    E: (n) => pbEn(n, o),
  };
}
/** @typedef {ReturnType<typeof pbWords>} PbWords */
/** @typedef {[string, string, number?]} PbRow une phrase, qui elle montre ('p', 'q', 'pq', 'pqz'), son nombre */
/** @typedef {(x: PbProblem, w: PbWords) => { rows: PbRow[], answer: string }} PbTemplate */

/** @type {Record<string, PbTemplate>} */
const PB_TEXTS = {
  reunion: (x, w) => ({
    rows: [
      [`${w.P} a ${w.N(x.a)} dans un coffre.`, 'p', x.a],
      [`${w.Il} a ${w.N(x.b)} dans un autre coffre.`, 'p', x.b],
      [`Combien de ${w.objs} a ${w.P} en tout ?`, 'p'],
    ],
    answer: `${w.P} a ${w.N(x.r)} en tout.`,
  }),
  ajout: (x, w) => ({
    rows: [
      [`${w.P} a ${w.N(x.a)}.`, 'p', x.a],
      [`${w.Q} lui en donne ${w.E(x.b)}.`, 'q', x.b],
      [`Combien de ${w.objs} a ${w.P} maintenant ?`, 'p'],
    ],
    answer: `${w.P} a ${w.N(x.r)} maintenant.`,
  }),
  retrait: (x, w) => ({
    rows: [
      [`${w.P} a ${w.N(x.a)}.`, 'p', x.a],
      [`${w.Il} en perd ${w.E(x.b)} dans le sable.`, 'p', x.b],
      [`Combien de ${w.objs} reste-t-il à ${w.P} ?`, 'p'],
    ],
    answer: `Il reste ${w.N(x.r)} à ${w.P}.`,
  }),
  partie: (x, w) => ({
    rows: [
      [`${w.P} et ${w.Q} ont ${w.N(x.t)} en tout.`, 'pq', x.t],
      [`${w.P} en a ${w.E(x.a)}.`, 'p', x.a],
      [`Combien de ${w.objs} a ${w.Q} ?`, 'q'],
    ],
    answer: `${w.Q} a ${w.N(x.r)}.`,
  }),
  ajoutInconnu: (x, w) => ({
    rows: [
      [`${w.P} a ${w.N(x.a)}.`, 'p', x.a],
      [`${w.Q} lui en donne.`, 'q', 0],
      [`Maintenant, ${w.P} en a ${w.E(x.t)}.`, 'p', x.t],
      [`Combien ${w.Q} lui en a donné ?`, 'q'],
    ],
    answer: `${w.Q} lui a donné ${w.N(x.r)}.`,
  }),
  compPlus: (x, w) => ({
    rows: [
      [`${w.P} a ${w.N(x.a)}.`, 'p', x.a],
      [`${w.Q} en a ${w.E(x.b)} de plus que ${w.P}.`, 'q', x.b],
      [`Combien de ${w.objs} a ${w.Q} ?`, 'q'],
    ],
    answer: `${w.Q} a ${w.N(x.r)}.`,
  }),
  compEcart: (x, w) => ({
    rows: [
      [`${w.P} a ${w.N(x.a)}.`, 'p', x.a],
      [`${w.Q} en a ${w.E(x.b)}.`, 'q', x.b],
      [`Combien ${w.Q} en a de plus que ${w.P} ?`, 'q'],
    ],
    answer: `${w.Q} en a ${w.E(x.r)} de plus que ${w.P}.`,
  }),
  compMoinsPlus: (x, w) => ({
    rows: [
      [`${w.Q} a ${w.N(x.t)}.`, 'q', x.t],
      [`${w.Q} en a ${w.E(x.b)} de plus que ${w.P}.`, 'q', x.b],
      [`Combien de ${w.objs} a ${w.P} ?`, 'p'],
    ],
    answer: `${w.P} a ${w.N(x.r)}.`,
  }),
  deuxEtapesA: (x, w) => ({
    rows: [
      [`${w.P} a ${w.N(x.a)}.`, 'p', x.a],
      [`${w.Q} lui en donne ${w.E(x.b)}.`, 'q', x.b],
      [`Puis ${w.P} en perd ${w.E(x.c)}.`, 'p', x.c],
      [`Combien de ${w.objs} reste-t-il à ${w.P} ?`, 'p'],
    ],
    answer: `Il reste ${w.N(x.r)} à ${w.P}.`,
  }),
  deuxEtapesB: (x, w) => ({
    rows: [
      [`${w.P} a ${w.N(x.a)}.`, 'p', x.a],
      [`${w.Q} en a ${w.E(x.b)}.`, 'q', x.b],
      [`${w.P} et ${w.Q} en donnent ${w.E(x.c)} à Zap.`, 'pqz', x.c],
      [`Combien de ${w.objs} leur reste-t-il ?`, 'pq'],
    ],
    answer: `Il leur reste ${w.N(x.r)}.`,
  }),
  possible: (x, w) => ({
    rows: [
      [`${w.P} a ${w.N(x.a)}.`, 'p', x.a],
      [`${w.Il} veut en donner ${w.E(x.b)} à ${w.Q}.`, 'pq', x.b],
      ['Est-ce possible ?', 'pq'],
    ],
    answer:
      x.b <= x.a
        ? `Oui, c'est possible : ${w.P} a assez de ${w.objs}.`
        : `Non, ce n'est pas possible : ${w.P} n'a pas assez de ${w.objs}.`,
  }),
};

/**
 * L'énoncé d'un problème, phrase par phrase, et sa phrase réponse.
 * @param {PbProblem} x
 * @returns {PbStory}
 */
function pbStory(x) {
  const made = PB_TEXTS[x.type + x.variant](x, pbWords(x));
  const ids = { p: [x.p], q: [x.q], pq: [x.p, x.q], pqz: [x.p, x.q, 'zap'] };
  const lines = made.rows.map(([text, who, n], i) => ({
    text,
    who: ids[/** @type {'p' | 'q' | 'pq' | 'pqz'} */ (who)],
    n: n || 0,
    q: i === made.rows.length - 1,
  }));
  return { lines, answer: made.answer };
}
/** @param {PbStory} story l'énoncé entier, comme le redit le bouton 🔈 */
function pbStatement(story) {
  return story.lines.map((l) => l.text).join(' ');
}

// Les phrases dites au début de chaque étape, quand l'enfant la fait
const PB_STEP_SAY = {
  dessiner: "Dessine l'histoire.",
  calculer: 'Calcule.',
  repondre: 'Réponds à la question.',
  barres: 'Regarde : les objets deviennent des barres.',
  possible: 'Est-ce possible ? Touche le pouce levé pour oui, le pouce baissé pour non.',
};
// « un », « deux »… : la voix compte les objets touchés (10 au plus en concret)
const PB_COUNT = ['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];

export { PB_COUNT, PB_OBJECTS, PB_PEOPLE, PB_STEP_SAY, pbEn, pbOne, pbQty, pbStatement, pbStory, pbWords };
