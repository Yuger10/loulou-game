/* ---------- « Le trésor raconté » : les gestes du compagnon ----------
   Dans l'exemple résolu et dans le problème jumeau, le compagnon fait une
   partie du travail : il met les objets dans le coffre, pose les étiquettes,
   écrit l'égalité, allume le signe et le résultat. Chaque geste change la
   page tout de suite (l'animation n'est que du CSS) : un clic pendant un
   geste n'attend rien. Les mêmes petites fonctions servent quand l'enfant
   pose lui-même une étiquette ou écrit l'égalité. */
import { pbIsConcrete } from './problems-schema.js';

/** @typedef {import('./problems-schema.js').PbView} PbView */
/** @typedef {import('./problems-draw.js').PbStage} PbStage */

/** @param {string} sel @returns {HTMLElement | null} */
function pbEl(sel) {
  return document.querySelector(sel);
}
/** @param {string} sel @returns {HTMLElement[]} */
function pbAll(sel) {
  return [...document.querySelectorAll(sel)].map((el) => /** @type {HTMLElement} */ (el));
}
/** @param {string} sel montre ce qui attendait caché */
function pbShow(sel) {
  pbAll(sel).forEach((el) => el.removeAttribute('hidden'));
}
/** @param {string} sel */
function pbHide(sel) {
  pbAll(sel).forEach((el) => el.setAttribute('hidden', ''));
}
/**
 * Le bloc d'une étape de calcul.
 * @param {PbView} v
 * @param {number} e
 */
function pbBlockSel(v, e) {
  return `#${v.box}-e${e + 1}`;
}

/**
 * Une étiquette se fixe dans une case ; la barre prend la longueur de son nombre
 * (deux parties posées à l'envers échangent ainsi leurs longueurs).
 * @param {HTMLElement} slot
 * @param {PbStage} s
 * @param {string} l `n1`, `n2` ou `q`
 */
function pbFill(slot, s, l) {
  const value = { n1: s.n1, n2: s.n2, q: s.r }[l] || s.r;
  slot.textContent = l === 'q' ? '?' : String(value);
  slot.dataset.l = l;
  slot.classList.add('filled');
  slot.style.width = `${Math.round((value / Math.max(s.n1, s.n2, s.r)) * 100)}%`;
}
/**
 * L'égalité sous le schéma (palier 4) : « 40 − 15 = ? », puis le résultat.
 * @param {PbView} v
 * @param {number} e
 * @param {boolean} done le résultat est trouvé
 */
function pbWriteEq(v, e, done) {
  const s = v.stages[e];
  const el = pbEl(`${pbBlockSel(v, e)} .pb-eq-text`);
  if (!el) return;
  const [x, y] = s.order.map((k) => (k === 1 ? s.n1 : s.n2));
  el.textContent = `${x} ${s.op === '+' ? '+' : '−'} ${y} = ${done ? s.r : '?'}`;
}
/**
 * Un nombre de l'étape va dans la première case vide de l'égalité (palier 5).
 * @param {string} B le bloc de l'étape
 * @param {PbStage} s
 * @param {number} k 1 ou 2
 */
function pbEqPut(B, s, k) {
  const free = pbAll(`${B} .pb-eq-case`).find((c) => !c.textContent);
  if (free) free.textContent = String(k === 1 ? s.n1 : s.n2);
  pbAll(`${B} .pb-eq-num[data-k="${k}"]`).forEach((el) => el.classList.add('used'));
}
/**
 * Le signe de l'égalité est écrit.
 * @param {string} B
 * @param {PbStage} s
 */
function pbEqSign(B, s) {
  const op = pbEl(`${B} .pb-eq-op`);
  if (op) op.textContent = s.op === '+' ? '+' : '−';
}

/**
 * Les objets vont dans le coffre (réunion, ajout) ou en sortent (retrait, partie).
 * @param {PbView} v
 * @param {string} B
 * @param {PbStage} s
 */
function pbAutoTokens(v, B, s) {
  const chest = pbEl(`${B} .pb-chest`);
  const out = pbEl(`${B} .pb-out`);
  if (!chest || !out) return;
  if (s.op === '+') pbAll(`#${v.box} .pb-scene .pb-token`).forEach((el) => chest.appendChild(el));
  else
    pbAll(`${B} .pb-chest .pb-token`)
      .slice(0, s.n2)
      .forEach((el) => out.appendChild(el));
  pbShow(`${B} .pb-bars`); // palier 2 : les objets rangés en barres
}
/**
 * Le compagnon dessine l'étape `e` : tout est posé d'un coup.
 * @param {PbView} v
 * @param {number} e
 */
function pbAutoDraw(v, e) {
  if (v.x.type === 'possible') {
    pbShow(`#${v.box} .pb-bars`);
    return;
  }
  const B = pbBlockSel(v, e);
  const s = v.stages[e];
  pbShow(B);
  if (pbIsConcrete(v)) {
    pbAutoTokens(v, B, s);
    return;
  }
  if (v.row.rep === 'egalite') {
    s.order.forEach((k) => pbEqPut(B, s, k));
    pbEqSign(B, s);
    pbAll(`${B} .pb-sign[data-v="${s.op}"]`).forEach((el) => el.classList.add('on'));
    return;
  }
  ['n1', 'n2', 'q'].forEach((l, i) => {
    const slot = pbEl(`${B} .pb-slot[data-s="${s.slots[i]}"]`);
    if (slot) pbFill(slot, s, l);
  });
  pbHide(`${B} .pb-labels`);
}
/**
 * Dans l'exemple : le compagnon choisit le signe et trouve le résultat.
 * @param {PbView} v
 * @param {number} e
 */
function pbAutoCalc(v, e) {
  const B = pbBlockSel(v, e);
  const s = v.stages[e];
  pbShow(`${B} .pb-signs`);
  pbShow(`${B} .pb-nums`);
  pbAll(`${B} .pb-sign[data-v="${s.op}"], ${B} .pb-num[data-v="${s.r}"]`).forEach((el) => el.classList.add('on'));
  pbWriteEq(v, e, true);
  const res = pbEl(`${B} .pb-eq-res`);
  if (res) res.textContent = String(s.r);
}
/**
 * La réponse est écrite : le nombre à la place du « ? », et la phrase réponse.
 * @param {PbView} v
 */
function pbAutoAnswer(v) {
  pbShow(`#${v.box} .pb-reply`);
  const answer = pbEl(`#${v.box} .pb-answer`);
  if (answer) {
    answer.textContent = String(v.x.r);
    answer.classList.add('on');
  }
  const sentence = pbEl(`#${v.box} .pb-sentence`);
  if (sentence) sentence.textContent = v.story.answer;
}
/** @param {PbView} v « est-ce possible ? » : le compagnon montre le bon pouce */
function pbAutoJudge(v) {
  pbShow(`#${v.box} .pb-yesnos`);
  pbAll(`#${v.box} .pb-yesno[data-v="${v.x.b <= v.x.a ? 'oui' : 'non'}"]`).forEach((el) => el.classList.add('on'));
}

export {
  pbAll,
  pbAutoAnswer,
  pbAutoCalc,
  pbAutoDraw,
  pbAutoJudge,
  pbBlockSel,
  pbEl,
  pbEqPut,
  pbEqSign,
  pbFill,
  pbHide,
  pbShow,
  pbWriteEq,
};
