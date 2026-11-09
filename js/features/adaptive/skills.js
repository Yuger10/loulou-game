/* ---------- Les progrès de chaque mini-jeu (v54 : sortis de l'espace parents) ----------
   Ce qui se passe en jeu est enregistré ici (réussites, erreurs, niveau), et
   lu par l'espace parents, le niveau adaptatif et les compagnons.
     state.skills[jeu]  = { wins, fails, errors, last, recent:[{t, e, ok}…10], hints }
                          (hints : indices demandés au compagnon, v52) */
import { save, state } from '../../entities/game-state/index.js';
import { party } from '../../entities/player/index.js';
import { adaptAfterMission } from './adaptive.js';
import { gameDiff } from './game-diff.js';
import { inBonusChallenge, lastGame } from './session.js';

const SKILL_STATUS = {
  aise:      { label:"À l'aise",                cls:'ok' },
  encours:   { label:'En cours',                 cls:'mid' },
  difficile: { label:'À travailler',             cls:'hard' },
  nouveau:   { label:'Pas assez joué',           cls:'new' },
  jamais:    { label:'Pas encore joué',          cls:'new' },
};

// Au mémo, retourner deux cartes différentes fait partie du jeu : on
// tolère donc plus d'« erreurs » avant de dire que c'est difficile.
const SKILL_ERR_TOLERANCE = { memory: 3 };

function todayKey(d){
  d = d || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ---- enregistrer ce qui se passe en jeu ---- */
let missionErrors = 0;

function resetMissionErrors(){ missionErrors = 0; }

let missionProgress = null;   // progrès de la dernière mission, pour l'écran de victoire

function noteAnswerError(){ missionErrors++; }

function recordMission(ok){
  const key = lastGame;
  // à plusieurs (chacun son tour, course), une erreur passe la main au
  // suivant : la mission n'est ni gagnée ni ratée, on ne compte rien.
  missionProgress = null;
  if(!key || (party.active)){ missionErrors = 0; return null; }
  if(!state.skills) state.skills = {};
  const s = state.skills[key] || (state.skills[key] = { wins:0, fails:0, errors:0, last:null, recent:[], hints:0 });
  const t = gameDiff();   // niveau joué (île, âge et niveau du jeu)
  const e = missionErrors;
  const before = skillStatus(s, key);
  if(ok) s.wins++; else s.fails++;
  s.errors += e;
  s.last = todayKey();
  // défi bonus de Zap (v52) : joué un cran au-dessus, il ne fait ni monter ni
  // descendre le niveau du jeu, ni changer son état « à l'aise / à travailler »
  if(inBonusChallenge()){ missionErrors = 0; save(); return null; }
  s.recent.push({ t, e, ok: !!ok });
  if(s.recent.length > 10) s.recent = s.recent.slice(-10);
  missionErrors = 0;
  // Phase 3 : le niveau du jeu monte ou redescend (js/features/adaptive/adaptive.js)
  const step = adaptAfterMission(key, s, t, !!ok, e);
  // le compagnon félicitera si le jeu a progressé : niveau gagné, ou plus « à travailler »
  if(ok && ((step && step.type==='up') || (before==='difficile' && skillStatus(s, key)!=='difficile'))){
    missionProgress = { key, lvl: s.lvl, up: !!(step && step.type==='up') };
  }
  save();
  return step;
}

function skillStatus(s, key){
  if(!s || !(s.wins + s.fails)) return 'jamais';
  const r = s.recent || [];
  const last = r.slice(-6);
  if(last.length < 2) return 'nouveau';
  const fails = last.filter(x=>!x.ok).length / last.length;
  const avgErr = last.reduce((a,x)=>a + x.e, 0) / last.length / (SKILL_ERR_TOLERANCE[key] || 1);
  if(fails >= 0.34 || avgErr >= 1.5) return 'difficile';
  if(last.length >= 3 && avgErr <= 0.5 && fails === 0) return 'aise';
  return 'encours';
}

export {
  missionProgress, noteAnswerError, recordMission, resetMissionErrors, SKILL_ERR_TOLERANCE,
  SKILL_STATUS, skillStatus, todayKey
};
