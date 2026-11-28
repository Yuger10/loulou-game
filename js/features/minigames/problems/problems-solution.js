/* ---------- « Le trésor raconté » : la solution (table G1 de la spec) ----------
   Ce qu'il faut toucher pour réussir, dans l'ordre : des sélecteurs qui
   commencent tous par l'id de leur conteneur ou de leur bloc, donc qui ne
   désignent jamais un élément d'un autre problème ou d'une autre étape.
   Lue par les tests (test/games.test.js), jamais montrée à l'enfant. */
import { solSel } from '../../minigame-engine/index.js';
import { pbIsConcrete } from './problems-schema.js';

/** @typedef {import('./problems-schema.js').PbView} PbView */
/** @typedef {import('./problems-draw.js').PbStage} PbStage */

/**
 * Dessiner une étape soi-même : les objets, l'égalité, ou les trois étiquettes.
 * @param {PbView} v
 * @param {PbStage} s
 * @param {string} B le bloc de l'étape
 * @returns {string[]}
 */
function pbDrawSteps(v, s, B) {
  if (pbIsConcrete(v)) {
    if (s.op === '+') return Array.from({ length: s.r }, (_, i) => solSel(`#${v.box} .pb-scene .pb-token`, 'i', i));
    return [...Array.from({ length: s.n2 }, (_, i) => solSel(`${B} .pb-chest .pb-token`, 'i', i)), `${B} .pb-done`];
  }
  if (v.row.rep === 'egalite')
    return [...s.order.map((k) => solSel(`${B} .pb-eq-num`, 'k', k)), solSel(`${B} .pb-sign`, 'v', s.op)];
  return ['n1', 'n2', 'q'].flatMap((l, i) => [
    solSel(`${B} .pb-label`, 'l', l),
    solSel(`${B} .pb-slot`, 's', s.slots[i]),
  ]);
}
/**
 * La solution du problème de l'enfant.
 * @param {PbView} v
 * @param {number} exSteps le nombre de flèches de l'exemple à toucher d'abord (0 : aucun exemple)
 * @param {boolean} own l'enfant comprend et dessine lui-même (modes n ≥ 1)
 * @returns {string[]}
 */
function pbSolution(v, exSteps, own) {
  const C = `#${v.box}`;
  const before = [
    ...Array.from({ length: exSteps }, (_, k) => solSel('#pb-ex .pb-next', 'step', `ex${k + 1}`)),
    ...(own ? [solSel(`${C} .pb-next`, 'step', 'comprendre')] : []),
  ];
  if (v.x.type === 'possible') return [...before, solSel(`${C} .pb-yesno`, 'v', v.x.b <= v.x.a ? 'oui' : 'non')];
  const signed = v.row.rep === 'barres' || v.row.rep === 'concret-barre';
  const steps = v.stages.flatMap((s, e) => {
    const B = `${C}-e${e + 1}`;
    return [
      ...(own ? pbDrawSteps(v, s, B) : []),
      ...(signed ? [solSel(`${B} .pb-sign`, 'v', s.op)] : []),
      solSel(`${B} .pb-num`, 'v', s.r),
    ];
  });
  return [...before, ...steps, `${C} .pb-answer`];
}

export { pbSolution };
