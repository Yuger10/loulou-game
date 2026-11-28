/* ---------- « Le trésor raconté » : l'exemple résolu et le problème jumeau ----------
   Mode n = 0 (table E1) : le compagnon résout un exemple pas à pas, l'enfant
   touche seulement 👉 pour avancer ; puis vient un problème jumeau (même
   type, autres nombres, autre objet) où le compagnon comprend et dessine, et
   où l'enfant calcule et répond. Chaque 👉 joue le pas suivant tout de suite. */
import { setHandler, speak } from '../../../shared/ui/index.js';
import { setHintQuestion } from '../../hints/index.js';
import {
  pbAll,
  pbAutoAnswer,
  pbAutoCalc,
  pbAutoDraw,
  pbAutoJudge,
  pbEl,
  pbHide,
  pbLight,
  pbShow,
} from './problems-auto.js';
import { pbStatement, pbStory } from './problems-bank.js';
import { PB_COACH_END, PB_COACH_TWIN, pbCoach } from './problems-coach.js';
import { pbNote, pbStages } from './problems-draw.js';
import { pbStartStage } from './problems-play.js';

/** @typedef {import('../../../entities/difficulty/index.js').ProblemsRound} ProblemsRound */
/** @typedef {import('./problems-bank.js').PbProblem} PbProblem */
/** @typedef {import('./problems-coach.js').PbCoach} PbCoach */
/** @typedef {import('./problems-play.js').PbRun} PbRun */
/** @typedef {import('./problems-schema.js').PbView} PbView */
/** @typedef {{ say: string, light: string, act: () => void }} PbAct un pas de l'exemple : le texte, l'étape allumée, le geste */

/**
 * Un problème tel qu'il est montré dans son conteneur.
 * @param {string} box `pb-main`, `pb-ex` ou `pb-twin`
 * @param {PbProblem} x
 * @param {ProblemsRound} row
 * @returns {PbView}
 */
function pbView(box, x, row) {
  return { box, x, story: pbStory(x), stages: pbStages(x), row };
}
/** @param {PbProblem} x les flèches de l'exemple : 7 pas pour deux étapes, 5 sinon */
function pbExampleSteps(x) {
  return Array.from({ length: x.type === 'deuxEtapes' ? 7 : 5 }, (_, k) => `ex${k + 1}`);
}
/**
 * Le compagnon parle : sa phrase est dite et écrite dans sa bulle.
 * @param {string} text
 * @param {string} [before] dit avant, sans être écrit (l'énoncé)
 */
function pbCoachSay(text, before) {
  const bubble = pbEl('.pb-coach');
  if (bubble) {
    bubble.textContent = text;
    bubble.removeAttribute('hidden');
  }
  speak(before ? `${before} ${text}` : text);
}

/**
 * Les pas 2 à K de l'exemple (le pas 1, Comprendre, est dit à l'ouverture).
 * @param {PbView} ex
 * @param {PbCoach} coach
 * @returns {PbAct[]}
 */
function pbExampleActs(ex, coach) {
  const draw = (/** @type {number} */ e) => ({ say: coach.draw[e], light: 'dessiner', act: () => pbAutoDraw(ex, e) });
  const calc = (/** @type {number} */ e) => ({ say: coach.calc[e], light: 'calculer', act: () => pbAutoCalc(ex, e) });
  const end = [
    { say: coach.answer, light: 'repondre', act: () => pbAutoAnswer(ex) },
    { say: PB_COACH_END, light: 'repondre', act: () => {} },
  ];
  if (ex.x.type === 'possible')
    return [draw(0), { say: coach.calc[0], light: 'calculer', act: () => pbAutoJudge(ex) }, ...end];
  return [...ex.stages.flatMap((_s, e) => [draw(e), calc(e)]), ...end];
}
/**
 * L'exemple commence : le compagnon écoute l'histoire, puis chaque 👉 joue
 * le pas suivant ; la dernière cache l'exemple et montre le jumeau.
 * @param {PbView} ex
 * @param {PbRun} twin le problème jumeau, déjà dans la page, caché
 */
function pbExampleStart(ex, twin) {
  const coach = pbCoach(ex.x, ex.story, ex.row.rep);
  const acts = pbExampleActs(ex, coach);
  let step = 1;
  pbLight('comprendre');
  setHintQuestion('problems', { moment: 'exemple', x: ex.x, s: null, rep: ex.row.rep, box: ex.box, block: '' });
  pbCoachSay(coach.listen, pbStatement(ex.story));
  pbAll('#pb-ex .pb-next').forEach((btn, i) =>
    setHandler(btn, 'click', () => {
      if (i + 1 !== step) return;
      btn.setAttribute('hidden', '');
      if (step > acts.length) {
        pbHide('#pb-ex');
        pbShow('#pb-twin');
        pbTwinStart(twin);
        return;
      }
      const act = acts[step - 1];
      act.act();
      pbLight(act.light);
      pbCoachSay(act.say);
      step++;
      pbShow(`#pb-ex .pb-next[data-step="ex${step}"]`);
    }),
  );
}
/**
 * Le jumeau commence : le compagnon écoute et dessine (tout de suite), puis
 * l'enfant calcule. Le bouton 🔈 redit désormais l'énoncé du jumeau.
 * @param {PbRun} run
 */
function pbTwinStart(run) {
  const coach = pbCoach(run.x, run.story, run.row.rep);
  const statement = pbStatement(run.story);
  const btn = pbEl('.puzzle-hint .btn-speak');
  if (btn) btn.dataset.say = statement;
  pbNote(run.x);
  // deux étapes : le dessin 2 et son texte arrivent seuls après le bon calcul 1
  run.drawn = (e) => {
    if (e > 0) pbCoachSay(coach.draw[e]);
  };
  pbStartStage(run, 0);
  pbCoachSay(`${coach.listen} ${PB_COACH_TWIN}`, statement);
}

export { pbExampleStart, pbExampleSteps, pbTwinStart, pbView };
