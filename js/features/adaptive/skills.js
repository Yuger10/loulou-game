/* ---------- Les progrès de chaque mini-jeu (v54 : sortis de l'espace parents) ----------
   Ce qui se passe en jeu est enregistré ici (réussites, erreurs, niveau), et
   lu par l'espace parents, le niveau adaptatif et les compagnons.
     state.skills[jeu]  = { wins, fails, errors, last, recent:[{t, e, ok}…10], hints }
                          (hints : indices demandés au compagnon, v52) */
import { save, state } from '../../entities/game-state/index.js';
import { party } from '../../entities/player/index.js';
import { adaptAfterMission } from './adaptive.js';
import { gameDiff } from './game-diff.js';
import { skillStatus } from './skill-status.js';
import { inBonusChallenge, lastGame } from './session.js';

/** @param {Date} [dArg] le jour, par défaut aujourd'hui */
function todayKey(dArg) {
  const d = dArg || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---- enregistrer ce qui se passe en jeu ---- */
let missionErrors = 0;

function resetMissionErrors() {
  missionErrors = 0;
}

/**
 * @typedef {{ key: string, lvl: number | undefined, up: boolean }} MissionProgress
 */
/** @type {MissionProgress | null} */
let missionProgress = null; // progrès de la dernière mission, pour l'écran de victoire

function noteAnswerError() {
  missionErrors++;
}

/** @param {boolean} ok */
function recordMission(ok) {
  const key = lastGame;
  // à plusieurs (chacun son tour, course), une erreur passe la main au
  // suivant : la mission n'est ni gagnée ni ratée, on ne compte rien.
  missionProgress = null;
  if (!key || party.active) {
    missionErrors = 0;
    return null;
  }
  if (!state.skills) state.skills = {};
  const s =
    state.skills[key] || (state.skills[key] = { wins: 0, fails: 0, errors: 0, last: null, recent: [], hints: 0 });
  const t = gameDiff(); // niveau joué (île, âge et niveau du jeu)
  const e = missionErrors;
  const before = skillStatus(s, key);
  if (ok) s.wins++;
  else s.fails++;
  s.errors += e;
  s.last = todayKey();
  // défi bonus de Zap (v52) : joué un cran au-dessus, il ne fait ni monter ni
  // descendre le niveau du jeu, ni changer son état « à l'aise / à travailler »
  if (inBonusChallenge()) {
    missionErrors = 0;
    save();
    return null;
  }
  s.recent.push({ t, e, ok: !!ok });
  if (s.recent.length > 10) s.recent = s.recent.slice(-10);
  missionErrors = 0;
  // Phase 3 : le niveau du jeu monte ou redescend (js/features/adaptive/adaptive.js)
  const step = adaptAfterMission(key, s, t, !!ok, e);
  // le compagnon félicitera si le jeu a progressé : niveau gagné, ou plus « à travailler »
  if (ok && ((step && step.type === 'up') || (before === 'difficile' && skillStatus(s, key) !== 'difficile'))) {
    missionProgress = { key, lvl: s.lvl, up: !!(step && step.type === 'up') };
  }
  save();
  return step;
}

export { missionProgress, noteAnswerError, recordMission, resetMissionErrors, todayKey };
