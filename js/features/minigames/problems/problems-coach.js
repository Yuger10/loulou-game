/* ---------- « Le trésor raconté » : ce que dit le compagnon (table N1 de la spec) ----------
   Dans l'exemple résolu, le compagnon fait tout et dit pourquoi, pas à pas ;
   dans le problème jumeau, il comprend et dessine, l'enfant calcule. Les
   nombres d'un calcul se disent en chiffres (« 1 plus 4 ») ; un nombre
   d'objets suit la règle du nombre 1 (« en perd une »). */
import { PB_OBJECTS, pbEn, pbWords } from './problems-bank.js';
import { pbStages } from './problems-draw.js';

/** @typedef {import('./problems-bank.js').PbProblem} PbProblem */
/** @typedef {import('./problems-bank.js').PbStory} PbStory */
/** @typedef {import('./problems-bank.js').PbWords} PbWords */
/** @typedef {import('./problems-draw.js').PbStage} PbStage */
/** @typedef {import('../../../entities/difficulty/index.js').ProblemsRep} ProblemsRep */
/**
 * Les textes d'un problème : `draw` et `calc` ont une entrée par étape de
 * calcul (pour « possible » : le dessin, puis le jugement).
 * @typedef {{ listen: string, draw: string[], calc: string[], answer: string }} PbCoach
 */

const PB_COACH_END = 'À toi, maintenant !';
const PB_COACH_TWIN = "J'ai dessiné l'histoire. À toi de calculer !";
const PB_COACH_HEARD = "J'ai écouté avec toi. À toi de dessiner !";
const PB_COACH_BARS =
  "Une barre pour chacun. La plus longue, c'est celui qui en a le plus. Le bout en pointillés, c'est ce qu'il a en plus.";

/**
 * Dessiner avec les objets : les mettre dans le coffre, ou en sortir.
 * @param {PbProblem} x
 * @param {PbWords} w
 */
function pbCoachTokens(x, w) {
  const o = PB_OBJECTS[x.obj];
  if (x.type === 'reunion' || x.type === 'ajout')
    return `Je mets les ${w.objs} dans le coffre, ${o.gender === 'f' ? 'une par une' : 'un par un'}.`;
  const out = x.type === 'retrait' ? x.b : x.a;
  const take = out === 1 ? "je l'enlève du coffre." : 'je les enlève du coffre.';
  if (x.type === 'retrait') return `${w.P} en perd ${w.E(out)} : ${take}`;
  return `${w.P} en a ${w.E(out)} : ${take} ${x.r === 1 ? "L'autre est" : 'Les autres sont'} à ${w.Q}.`;
}
/**
 * Dessiner une étape, selon la représentation.
 * @param {PbProblem} x
 * @param {PbStage} s
 * @param {ProblemsRep} rep
 */
function pbCoachDraw(x, s, rep) {
  if (rep === 'egalite') return "J'écris le calcul.";
  if (rep !== 'barres') return pbCoachTokens(x, pbWords(x));
  if (s.kind === 'cmp') return PB_COACH_BARS;
  const what = s.slots[2] === 'tout' ? 'le tout' : 'une partie';
  return `Le tout va sur la grande barre. Les parties vont sur les petites barres. Ici, on cherche ${what} : je mets le point d'interrogation dessus.`;
}

/** @type {Record<string, (x: PbProblem, w: PbWords) => string>} pourquoi on ajoute ou on enlève */
const PB_COACH_WHY = {
  reunion: () => "On cherche le tout, alors j'ajoute",
  ajout: () => "On cherche le tout, alors j'ajoute",
  retrait: (_x, w) => `${w.P} en perd, alors j'enlève`,
  partie: () => "On cherche une partie, alors j'enlève",
  ajoutInconnu: () => "On cherche une partie, alors j'enlève",
  compPlus: () => "On cherche celui qui en a le plus, alors j'ajoute",
  compEcart: () => "On cherche l'écart, alors j'enlève",
  compMoinsPlus: (_x, w) =>
    `Attention : « de plus » parle de ${w.Q}. On cherche celui qui en a le moins, alors j'enlève`,
};
/** @param {PbStage} s « 5 moins 2, ça fait 3 » : le grand nombre d'abord pour enlever */
function pbCoachSum(s) {
  const [x, y] = s.order.map((k) => (k === 1 ? s.n1 : s.n2));
  return `${x} ${s.op === '+' ? 'plus' : 'moins'} ${y}, ça fait ${s.r}.`;
}
/**
 * Les deux calculs d'un problème à deux étapes, et le dessin de la seconde.
 * @param {PbProblem} x
 * @param {PbStage[]} st
 * @param {PbWords} w
 */
function pbCoachTwoSteps(x, st, w) {
  const c = pbEn(x.c, PB_OBJECTS[x.obj]);
  const first =
    x.variant === 'A' ? `D'abord, ${w.Q} lui en donne : j'ajoute.` : "D'abord, je mets ensemble ce qu'ils ont :";
  const then =
    x.variant === 'A' ? `Puis ${w.P} en perd ${c} : j'enlève.` : `Puis ils en donnent ${c} à Zap : j'enlève.`;
  return {
    calc: [`${first} ${pbCoachSum(st[0])}`, `${then} ${pbCoachSum(st[1])}`],
    draw2: `Maintenant, le tout, c'est ${x.r1}. Une partie s'en va : je cherche l'autre partie.`,
  };
}

/**
 * Tout ce que le compagnon dit pour ce problème.
 * @param {PbProblem} x
 * @param {PbStory} story
 * @param {ProblemsRep} rep
 * @returns {PbCoach}
 */
function pbCoach(x, story, rep) {
  const w = pbWords(x);
  const st = pbStages(x);
  const base = {
    listen: `J'écoute l'histoire. La question, c'est : ${story.lines[story.lines.length - 1].text}`,
    answer: `Je réponds à la question : ${story.answer}`,
  };
  if (x.type === 'possible')
    return {
      ...base,
      draw: [`Je dessine ce que ${w.P} a, et ce qu'${w.il} veut donner.`],
      calc: [
        `La barre « donner » ${x.b > x.a ? 'dépasse' : 'ne dépasse pas'} : ${w.P} ${x.b > x.a ? "n'a pas" : 'a'} assez.`,
      ],
    };
  if (x.type === 'deuxEtapes') {
    const two = pbCoachTwoSteps(x, st, w);
    return { ...base, draw: [pbCoachDraw(x, st[0], rep), two.draw2], calc: two.calc };
  }
  return {
    ...base,
    draw: [pbCoachDraw(x, st[0], rep)],
    calc: [`${PB_COACH_WHY[x.type](x, w)} : ${pbCoachSum(st[0])}`],
  };
}

export { PB_COACH_END, PB_COACH_HEARD, PB_COACH_TWIN, pbCoach };
