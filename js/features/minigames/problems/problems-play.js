/* ---------- « Le trésor raconté » : ce que fait l'enfant, étape par étape ----------
   Un problème avance de moment en moment : comprendre, dessiner (toucher les
   objets, poser les étiquettes ou écrire l'égalité), choisir l'opération,
   calculer, répondre. Chaque clic change l'état tout de suite, sans attendre
   une animation ni la voix. Une erreur à une étape notée relance un AUTRE
   problème (anti-devinette) : le jeu ne se finit jamais par élimination. */
import { party } from '../../../entities/player/index.js';
import { setHandler, speak } from '../../../shared/ui/index.js';
import { setHintQuestion } from '../../hints/index.js';
import { flashModal, loseLife, stepOk, winSoon } from '../../minigame-engine/index.js';
import { pbAll, pbAutoDraw, pbBlockSel, pbEl, pbEqPut, pbEqSign, pbFill, pbShow, pbWriteEq } from './problems-auto.js';
import { PB_COUNT, PB_STEP_SAY } from './problems-bank.js';
import { pbIsConcrete } from './problems-schema.js';

/** @typedef {import('./problems-schema.js').PbView} PbView */
/**
 * Un problème en train d'être joué : sa vue, l'étape de calcul en cours (`e`),
 * le moment, l'étiquette choisie, les nombres posés dans l'égalité, les objets
 * déplacés. `dead` : une erreur attend sa relance, plus rien ne répond.
 * `helped` : le compagnon dessine (problème jumeau). `retry` : la relance.
 * @typedef {PbView & { e: number, moment: string, pick: string, eq: number[], moved: number, placed: number,
 *   dead: boolean, helped: boolean, retry: () => void, drawn: (e: number) => void }} PbRun
 */

// l'étape allumée en haut de la fenêtre, pour chaque moment
/** @type {Record<string, string>} */
const PB_LIGHT = { operation: 'calculer', possible: 'repondre' };
/** @param {string} step allume une des 4 étapes */
function pbLight(step) {
  pbAll('.pb-steps .pb-step').forEach((el) => el.classList.toggle('on', el.dataset.step === step));
}
/**
 * Entre dans un moment : ce qu'il faut est montré, l'étape s'allume, les
 * indices repartent de zéro avec une nouvelle question (table H0).
 * @param {PbRun} run
 * @param {string} moment
 */
function pbEnter(run, moment) {
  const B = pbBlockSel(run, run.e);
  run.moment = moment;
  if (moment === 'dessiner') pbShow(B);
  if (moment === 'operation') pbShow(`${B} .pb-signs, ${B} .pb-bars`);
  if (moment === 'calculer') pbShow(`${B} .pb-nums`);
  if (moment === 'repondre') pbShow(`#${run.box} .pb-reply`);
  if (moment === 'possible') pbShow(`#${run.box} .pb-bars, #${run.box} .pb-yesnos`);
  pbLight(PB_LIGHT[moment] || moment);
  const choices = { calculer: `${B} .pb-num`, operation: `${B} .pb-sign` }[moment];
  const q = { moment, x: run.x, s: run.stages[run.e] || null, rep: run.row.rep, box: run.box, block: B };
  setHintQuestion('problems', q, choices ? { choices } : {});
}

/**
 * Une erreur notée : un essai en moins, puis un autre problème. À plusieurs,
 * le moteur passe la main et le problème reste en place.
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbWrong(run, el) {
  const failed = loseLife(el, { onRetry: run.retry, disable: false });
  run.dead = failed || !party.active;
}
/**
 * L'étape `e` commence : l'enfant dessine, ou le compagnon le fait pour lui (jumeau).
 * @param {PbRun} run
 * @param {number} e
 */
function pbStartStage(run, e) {
  Object.assign(run, { e, pick: '', eq: [], moved: 0, placed: 0 });
  if (run.helped) {
    pbAutoDraw(run, e);
    run.drawn(e);
    pbEnter(run, pbAfterDraw(run));
    return;
  }
  if (run.x.type === 'possible') {
    pbEnter(run, 'possible');
    speak(PB_STEP_SAY.possible);
    return;
  }
  pbEnter(run, 'dessiner');
  speak(PB_STEP_SAY.dessiner);
}
/** @param {PbRun} run le moment qui suit le dessin : l'opération s'il y a un schéma, sinon le calcul */
function pbAfterDraw(run) {
  if (run.x.type === 'possible') return 'possible';
  return run.row.rep === 'barres' || run.row.rep === 'concret-barre' ? 'operation' : 'calculer';
}
/** @param {PbRun} run l'enfant a fini de dessiner */
function pbDrawDone(run) {
  const next = pbAfterDraw(run);
  pbEnter(run, next);
  // palier 2 : les objets du coffre se rangent en barres, le schéma apparaît rempli
  if (run.row.rep === 'concret-barre') speak(PB_STEP_SAY.barres);
  else if (next === 'calculer') speak(PB_STEP_SAY.calculer);
}

/* ---- dessiner : les objets (concret, concret-barre) ---- */
/**
 * Un objet touché : il vole dans le coffre (réunion, ajout) ou en sort
 * (retrait, partie), et la voix compte.
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbOnToken(run, el) {
  if (run.moment !== 'dessiner' || !pbIsConcrete(run)) return;
  const B = pbBlockSel(run, run.e);
  const s = run.stages[run.e];
  const inChest = !!el.closest('.pb-chest');
  const home = pbEl(`${B} ${inChest ? '.pb-out' : '.pb-chest'}`);
  // on ajoute : un objet du coffre y reste ; on enlève : un objet sorti peut y retourner
  if (!home || (s.op === '+' && inChest)) return;
  home.appendChild(el);
  const back = s.op === '-' && !inChest;
  run.moved += back ? -1 : 1;
  if (!back) speak(PB_COUNT[run.moved - 1] || String(run.moved));
  if (s.op === '+' && run.moved === s.r) pbDrawDone(run);
}
/**
 * « C'est fait » : le bon nombre d'objets est sorti du coffre, ou c'est une erreur.
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbOnDone(run, el) {
  if (run.moment !== 'dessiner') return;
  if (run.moved !== run.stages[run.e].n2) pbWrong(run, el);
  else pbDrawDone(run);
}

/* ---- dessiner : les étiquettes (barres) ---- */
/**
 * @param {PbRun} run
 * @param {HTMLElement} el l'étiquette choisie, à poser ensuite dans une case
 */
function pbOnLabel(run, el) {
  if (run.moment !== 'dessiner') return;
  run.pick = el.dataset.l || '';
  pbAll(`${pbBlockSel(run, run.e)} .pb-label`).forEach((l) => l.classList.toggle('picked', l === el));
}
/**
 * L'étiquette choisie est posée dans une case : la bonne s'y fixe (les deux
 * parties d'un parties-tout sont interchangeables), une mauvaise est une erreur.
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbOnSlot(run, el) {
  if (run.moment !== 'dessiner' || run.row.rep !== 'barres' || !run.pick || el.dataset.l) return;
  const s = run.stages[run.e];
  const want = s.slots[['n1', 'n2', 'q'].indexOf(run.pick)];
  const slot = el.dataset.s || '';
  if (slot !== want && !(want.startsWith('partie') && slot.startsWith('partie'))) {
    pbWrong(run, el);
    return;
  }
  pbFill(el, s, run.pick);
  pbAll(`${pbBlockSel(run, run.e)} .pb-label[data-l="${run.pick}"]`).forEach((l) => l.setAttribute('hidden', ''));
  run.pick = '';
  run.placed++;
  if (run.placed === 3) pbDrawDone(run);
}

/* ---- l'égalité (palier 5) et le signe ---- */
/**
 * Un nombre de l'étape remplit la première case vide ; rien si les deux sont pleines.
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbOnEqNum(run, el) {
  const k = Number(el.dataset.k);
  if (run.moment !== 'dessiner' || run.eq.length >= 2 || run.eq.includes(k)) return;
  run.eq.push(k);
  pbEqPut(pbBlockSel(run, run.e), run.stages[run.e], k);
}
/**
 * Le signe : il juge l'égalité quand ses deux cases sont pleines (palier 5),
 * ou il choisit l'opération sous le schéma rempli.
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbOnSign(run, el) {
  const s = run.stages[run.e];
  const equality = run.row.rep === 'egalite';
  if (equality ? run.moment !== 'dessiner' || run.eq.length < 2 : run.moment !== 'operation') return;
  // pour enlever, le grand nombre d'abord ; pour ajouter, les deux ordres sont justes
  const ordered = !equality || s.op === '+' || run.eq[0] === s.order[0];
  if (el.dataset.v !== s.op || !ordered) {
    pbWrong(run, el);
    return;
  }
  stepOk(el);
  el.classList.add('on');
  if (equality) pbEqSign(pbBlockSel(run, run.e), s);
  pbWriteEq(run, run.e, false);
  pbEnter(run, 'calculer');
  speak(PB_STEP_SAY.calculer);
}

/* ---- calculer, répondre ---- */
/**
 * Un nombre proposé : le bon mène à l'étape suivante (ou à la réponse).
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbOnNum(run, el) {
  if (run.moment !== 'calculer') return;
  const s = run.stages[run.e];
  if (Number(el.dataset.v) !== s.r) {
    pbWrong(run, el);
    return;
  }
  stepOk(el);
  el.classList.add('on');
  pbWriteEq(run, run.e, true);
  const res = pbEl(`${pbBlockSel(run, run.e)} .pb-eq-res`);
  if (res) res.textContent = String(s.r);
  if (run.e + 1 < run.stages.length) {
    pbStartStage(run, run.e + 1);
    return;
  }
  pbEnter(run, 'repondre');
  speak(PB_STEP_SAY.repondre);
}
/**
 * La mission est gagnée : la phrase réponse est écrite et dite.
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbWin(run, el) {
  run.moment = 'won';
  pbShow(`#${run.box} .pb-reply`);
  const sentence = pbEl(`#${run.box} .pb-sentence`);
  if (sentence) sentence.textContent = run.story.answer;
  speak(run.story.answer);
  // l'étincelle se pose à côté : le bouton touché garde son seul nombre
  stepOk(el.parentElement);
  flashModal('ok');
  winSoon();
}
/**
 * Le « ? » touché devient le nombre trouvé.
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbOnAnswer(run, el) {
  if (run.moment !== 'repondre') return;
  el.textContent = String(run.x.r);
  el.classList.add('on');
  pbWin(run, el);
}
/**
 * « Est-ce possible ? » : 👍 ou 👎.
 * @param {PbRun} run
 * @param {HTMLElement} el
 */
function pbOnYesNo(run, el) {
  if (run.moment !== 'possible') return;
  if (el.dataset.v !== (run.x.b <= run.x.a ? 'oui' : 'non')) pbWrong(run, el);
  else pbWin(run, el);
}
/**
 * 👉 : l'histoire est écoutée, on passe à la suite.
 * @param {PbRun} run
 */
function pbOnNext(run) {
  if (run.moment !== 'comprendre') return;
  pbAll(`#${run.box} .pb-next`).forEach((el) => el.setAttribute('hidden', ''));
  pbStartStage(run, 0);
}

/**
 * Branche tout ce que l'enfant peut toucher dans son problème.
 * @param {PbRun} run
 */
function pbBindRun(run) {
  /** @type {Array<[string, (run: PbRun, el: HTMLElement) => void]>} */
  const handlers = [
    ['.pb-next[data-step="comprendre"]', pbOnNext],
    ['.pb-token', pbOnToken],
    ['.pb-done', pbOnDone],
    ['.pb-label', pbOnLabel],
    ['.pb-slot', pbOnSlot],
    ['.pb-eq-num', pbOnEqNum],
    ['.pb-sign', pbOnSign],
    ['.pb-num', pbOnNum],
    ['.pb-answer', pbOnAnswer],
    ['.pb-yesno', pbOnYesNo],
  ];
  handlers.forEach(([sel, fn]) =>
    pbAll(`#${run.box} ${sel}`).forEach((el) =>
      setHandler(el, 'click', () => {
        if (!run.dead) fn(run, el);
      }),
    ),
  );
}

export { pbBindRun, pbEnter, pbLight, pbStartStage };
