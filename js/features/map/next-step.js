/* ---------- Sous la carte : la prochaine étape (île ou monde) ---------- */
import { missionsForLevel, missionsUntil, state } from '../../entities/game-state/index.js';
import {
  ARCHIPELAGOS,
  archipelagoOf,
  archipelagoUnlocked,
  lastOpenedLevel,
  nextLockedWorld,
  WORLD_ORDER,
  WORLDS,
  worldUnlocked,
} from '../../entities/world/index.js';
import { bindSpeakButtons } from '../../shared/ui/index.js';

/** @param {number} saison l'archipel affiché */
function renderMapNext(saison) {
  const info = document.getElementById('map-next');
  if (!info) return;
  // la prochaine étape : une île de cette carte, sinon la prochaine île du
  // voyage (un autre monde, verrouillé ou déjà ouvert), sinon rien
  const nxt = nextLockedWorld(saison) || WORLD_ORDER.find((id) => !worldUnlocked(id));
  if (!nxt) {
    info.innerHTML = `🏆 Tu as ouvert toutes les îles ! D'autres arriveront bientôt.`;
  } else if (!archipelagoUnlocked(archipelagoOf(nxt))) {
    const a = ARCHIPELAGOS[archipelagoOf(nxt)];
    info.innerHTML = nextStepHTML(a.emoji, 'Prochain monde', a);
  } else {
    info.innerHTML = nextStepHTML('🗺️', 'Prochaine île', WORLDS[nxt]);
  }
  info.hidden = false;
  bindSpeakButtons();
}

/* La prochaine étape sous la carte : son nom, son niveau, les missions qui
   restent, et une barre qui part de la dernière île ouverte (elle se remplit
   à chaque île, au lieu de compter depuis le tout début). */
/** @param {string} icon @param {string} label @param {{ name: string, level: number | null }} step son nom, le niveau qui l'ouvre */
function nextStepHTML(icon, label, step) {
  // un archipel annoncé ici a une île, donc un niveau (null : archipel vide, jamais annoncé)
  const name = step.name,
    lvl = step.level || 1;
  const from = missionsForLevel(lastOpenedLevel()),
    to = missionsForLevel(lvl);
  const pct = Math.max(0, Math.min(100, Math.round(((state.missions - from) / Math.max(1, to - from)) * 100)));
  const left = missionsUntil(lvl);
  const rest = `encore ${left} mission${left > 1 ? 's' : ''}`;
  const say = `${label} : ${name}, au niveau ${lvl}. ${rest[0].toUpperCase() + rest.slice(1)}.`.replace(/"/g, '&quot;');
  return `${icon} ${label} : <strong>${name}</strong> au niveau ${lvl} · ${rest}
        <button type="button" class="btn-speak map-next-speak" data-say="${say}" aria-label="Écouter">🔈</button>
        <div class="quest-bar" role="progressbar" aria-label="Vers ${name.replace(/"/g, '&quot;')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>`;
}

export { renderMapNext };
