/* ---------- Espace parents (Phase 2) ----------
   Réservé aux adultes (une multiplication à résoudre), il montre pour chaque
   enfant :
   - le temps de jeu par jour (7 derniers jours) ;
   - les progrès par compétence : pour chaque mini-jeu, les missions réussies,
     les erreurs, le palier atteint, et un état simple (à l'aise / en cours /
     difficile / pas encore assez joué) ;
   - le réglage de la pause douce (après X minutes de jeu dans la journée) ;
   - les réglages adultes : sauvegarde, réglages du joueur, remise à zéro ;
   - la version du jeu et le bouton « Chercher une mise à jour » (v66, js/features/update).

   Données, dans la partie de chaque enfant (exportées par la sauvegarde) :
     state.skills[jeu]  = { wins, fails, errors, last, recent:[{t, e, ok}…10], hints }
                          (hints : indices demandés au compagnon, v52)
     state.playTime[jour] = secondes de jeu ACTIF ce jour-là (60 jours gardés)
     state.pauseExtra   = { date, min }  minutes ajoutées par un adulte aujourd'hui
   Réglage dans le profil : profile.pauseMin (0 = pas de pause). */
import { avatarHTML } from '../../entities/companion/index.js';
import { GAME_LIST, gameTypesForAge } from '../../entities/difficulty/index.js';
import { readSave, resetState, save, state } from '../../entities/game-state/index.js';
import {
  currentProfile,
  deleteProfile,
  profiles,
  profileSaveKey,
  refreshAll,
  saveProfiles,
} from '../../entities/player/index.js';
import { setCurrentWorld } from '../../entities/world/index.js';
import { currentSeason, FETES, seasonPreview } from '../../entities/season/index.js';
import { emit, on, random, storageRemove, storageWrite } from '../../shared/lib/index.js';
import {
  askConfirm,
  bindSpeakButtons,
  closeModal,
  openModal,
  playSound,
  setHandler,
  showToast,
  speak,
} from '../../shared/ui/index.js';
import { SKILL_STATUS, skillStatus, todayKey } from '../adaptive/index.js';
import { openBackup } from '../backup/index.js';
import { openPlayers, openPlayerSettings } from '../players/index.js';
import { renderSoundBtn } from '../profile/index.js';
import { bindQuit, gameHeader } from '../screen/index.js';
import { setSeasonPreview } from '../seasons/index.js';
import { bindUpdateCard, updateCardHTML } from '../update/index.js';
import './storage-alert.js'; // message et carte quand l'enregistrement échoue

/** @typedef {import('../../entities/game-state/index.js').GameState} GameState */
/** @typedef {Partial<GameState>} PlayerState la partie d'un joueur : l'état courant, ou une partie lue dans le stockage */

const SKILL_GROUPS = [
  { id: 'lire', emoji: '📖', name: 'Lecture et langage', games: ['reading', 'determinants'] },
  { id: 'nombres', emoji: '🔢', name: 'Nombres', games: ['count', 'puzzle', 'compare', 'packs'] },
  { id: 'calcul', emoji: '➕', name: 'Calcul', games: ['math', 'calc', 'money', 'share', 'ladybugs'] },
  { id: 'mesures', emoji: '🕐', name: 'Temps et mesures', games: ['clock', 'calendar', 'volume', 'recipe'] },
  {
    id: 'formes',
    emoji: '🔷',
    name: 'Formes et espace',
    games: ['shapes', 'jigsaw', 'nesting', 'cubes', 'shelf', 'mirror'],
  },
  { id: 'sciences', emoji: '🪐', name: 'Sciences', games: ['planets', 'lifecycle', 'potions'] },
  {
    id: 'logique',
    emoji: '🧠',
    name: 'Mémoire et logique',
    games: ['memory', 'simon', 'diff', 'sequence', 'rangement', 'rhythm', 'pitch'],
  },
];
// activités suivies qui ne sont pas des mini-jeux du choix des jeux
// (les boîtes de rangement de la chambre à squishies, v53 : un tri)
/** @type {Record<string, string>} */
const SKILL_EXTRA_NAMES = { rangement: '📦 Boîtes de rangement' };
const PAUSE_CHOICES = [0, 15, 20, 30, 45, 60];

/* ---- temps de jeu actif ---- */
let lastInteraction = Date.now();
['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
  window.addEventListener(
    ev,
    () => {
      lastInteraction = Date.now();
    },
    { passive: true },
  ),
);
/** @param {number} seconds */
function tickPlayTime(seconds) {
  if (!state.playTime) state.playTime = {};
  const k = todayKey();
  state.playTime[k] = (state.playTime[k] || 0) + seconds;
  // on ne garde que les 60 derniers jours
  const keys = Object.keys(state.playTime).sort();
  while (keys.length > 60) delete state.playTime[/** @type {string} */ (keys.shift())]; // plus de 60 clés : shift en rend une
  save();
}
/** @param {PlayerState} [stArg] */
function playMinutesToday(stArg) {
  const st = stArg || state;
  return Math.floor(((st.playTime || {})[todayKey()] || 0) / 60);
}
function startPlayTimeTracker() {
  setInterval(() => {
    const visible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
    const splash = document.getElementById('splash');
    const onSplash = splash && splash.classList.contains('show');
    if (visible && !onSplash && Date.now() - lastInteraction < 90000) tickPlayTime(15);
  }, 15000);
}

/* ---- pause douce ---- */
function pauseLimit() {
  const p = currentProfile();
  return (p && Number(p.pauseMin)) || 0;
}
// La pause s'applique aussi à plusieurs (track pause-verrou) : la partie
// s'arrête à la fin de la mission en cours (js/features/rest), sauf adulte.
function pauseExtraToday() {
  return state.pauseExtra && state.pauseExtra.date === todayKey() ? state.pauseExtra.min : 0;
}
// minutes de jeu restantes avant la pause (Infinity s'il n'y a pas de pause)
function pauseMinutesLeft() {
  const limit = pauseLimit();
  if (!limit) return Infinity;
  return limit + pauseExtraToday() - playMinutesToday();
}
function pauseDue() {
  const limit = pauseLimit();
  if (!limit) return false;
  const extra = state.pauseExtra && state.pauseExtra.date === todayKey() ? state.pauseExtra.min : 0;
  return playMinutesToday() >= limit + extra;
}
/* ---- accès réservé aux adultes ---- */
let parentUnlockedUntil = 0;
// La question de calcul porte `data-voix="muet"` : la voix ne la dit jamais,
// elle ouvrirait la porte à une enfant de 6 ans.
/**
 * @param {number} a
 * @param {number} b
 */
function parentGateHTML(a, b) {
  return `
    ${gameHeader('🔒 Pour les adultes', 'Répondez à cette question pour continuer')}
    <div class="gate-box">
      <label for="gate-in" class="gate-q" data-voix="muet">Combien font ${a} × ${b} ?</label>
      <input id="gate-in" class="name-input-modal gate-in" type="number" inputmode="numeric" autocomplete="off" aria-describedby="gate-err">
      <p class="gate-err" id="gate-err" aria-live="polite"></p>
    </div>
    <button class="btn-primary" id="gate-ok">Valider</button>
    <button class="btn-ghost" id="gate-cancel">Retour</button>
  `;
}
// onWrong : appelée à chaque mauvaise réponse (tentatives notées pendant la pause)
/**
 * @param {() => void} onOk
 * @param {() => void} [onCancel]
 * @param {() => void} [onWrong]
 */
function openParentGate(onOk, onCancel, onWrong) {
  if (Date.now() < parentUnlockedUntil) {
    onOk();
    return;
  }
  const a = 6 + Math.floor(random() * 4),
    b = 6 + Math.floor(random() * 4);
  openModal(parentGateHTML(a, b));
  // la voix dit seulement que c'est pour les adultes, jamais la question de calcul
  bindSpeakButtons();
  speak("C'est pour les adultes.");
  const input = /** @type {HTMLInputElement} */ (document.getElementById('gate-in'));
  const ok = () => {
    if (Number(input.value) === a * b) {
      parentUnlockedUntil = Date.now() + 5 * 60 * 1000;
      playSound('good');
      onOk();
    } else {
      playSound('wrong');
      /** @type {HTMLElement} */ (document.getElementById('gate-err')).textContent = "Ce n'est pas la bonne réponse.";
      input.value = '';
      input.focus();
      if (onWrong) onWrong();
    }
  };
  setHandler(document.getElementById('gate-ok'), 'click', ok);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ok();
  });
  setHandler(document.getElementById('gate-cancel'), 'click', () => {
    playSound('tap');
    if (onCancel) onCancel();
    else closeModal();
  });
  setTimeout(() => {
    try {
      input.focus();
    } catch {
      // le focus peut échouer si la fenêtre vient de se fermer : rien de grave
    }
  }, 50);
}

/* ---- l'espace parents ---- */
/**
 * @param {string} id
 * @returns {PlayerState}
 */
function profileState(id) {
  if (id === profiles.current) return state;
  // la partie d'un autre joueur passe par la même porte que pour jouer (elle peut
  // venir d'une sauvegarde importée) ; lue seulement, elle n'est pas réécrite
  try {
    const raw = localStorage.getItem(profileSaveKey(id));
    return raw ? readSave(raw) : {};
  } catch {
    return {};
  }
}
/** @param {number} min */
function minutesLabel(min) {
  if (min < 1) return "moins d'1 min";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}
/** @param {PlayerState} st */
function playTimeHTML(st) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  const mins = days.map((d) => Math.floor(((st.playTime || {})[todayKey(d)] || 0) / 60));
  const max = Math.max(10, ...mins);
  const played = mins.filter((m) => m > 0);
  const avg = played.length ? Math.round(played.reduce((a, b) => a + b, 0) / played.length) : 0;
  /**
   * @param {Date} d
   * @param {number} i
   */
  const dayName = (d, i) => (i === 6 ? 'Auj.' : d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''));
  return `<p class="pt-today">Aujourd'hui : <b>${minutesLabel(mins[6])}</b>${played.length ? ` · moyenne les jours joués : <b>${minutesLabel(avg)}</b>` : ''}</p>
    <div class="pt-bars" role="img" aria-label="Temps de jeu des 7 derniers jours : ${days.map((d, i) => `${dayName(d, i)} ${mins[i]} minutes`).join(', ')}">
      ${days.map((d, i) => `<div class="pt-col"><div class="pt-track"><span class="pt-val">${mins[i] ? mins[i] : ''}</span><i style="height:${Math.round((mins[i] / max) * 82)}%" class="${i === 6 ? 'today' : ''}"></i></div><span class="pt-day">${dayName(d, i)}</span></div>`).join('')}
    </div>`;
}
/**
 * @param {PlayerState} st
 * @param {number | null} [age]
 */
function skillsHTML(st, age) {
  const sk = st.skills || {};
  /** @param {string} k */
  const gameName = (k) => {
    const g = GAME_LIST.find((x) => x.key === k);
    return g ? `${g.emoji} ${g.name}` : SKILL_EXTRA_NAMES[k] || k;
  };
  // les jeux proposés à cet âge, plus ceux déjà joués (avant un changement d'âge)
  const allowed = new Set([...gameTypesForAge(age), ...Object.keys(sk)]);
  /** @type {{ aise: string[], difficile: string[] }} */
  const summary = { aise: [], difficile: [] };
  const groups = SKILL_GROUPS.map((gr) => {
    const rows = gr.games
      .filter((k) => allowed.has(k))
      .map((k) => {
        const s = sk[k],
          status = skillStatus(s, k),
          info = SKILL_STATUS[status];
        if (status === 'aise' || status === 'difficile') summary[status].push(gameName(k));
        const lastTier = s ? s.lvl || (s.recent.length ? s.recent[s.recent.length - 1].t : null) : null;
        // les indices (v52) sont montrés à côté des erreurs, sans jugement
        const hints =
          s && s.hints ? ` · ${s.hints} indice${s.hints > 1 ? 's' : ''} demandé${s.hints > 1 ? 's' : ''}` : '';
        const detail = s
          ? `${s.wins} réussie${s.wins > 1 ? 's' : ''}${s.fails ? ` · ${s.fails} ratée${s.fails > 1 ? 's' : ''}` : ''} · ${s.wins + s.fails ? (s.errors / (s.wins + s.fails)).toFixed(1).replace('.', ',') : '0'} erreur par mission${hints}${lastTier ? ` · niveau ${'⭐'.repeat(Math.min(lastTier, 6))}` : ''}${s.support ? " (redescendu d'un cran pour s'entraîner)" : ''}`
          : '';
        return `<li class="sk-row"><span class="sk-name">${gameName(k)}</span><span class="sk-pill ${info.cls}">${info.label}</span>${detail ? `<span class="sk-detail">${detail}</span>` : ''}</li>`;
      })
      .join('');
    return rows ? `<div class="sk-group"><h4>${gr.emoji} ${gr.name}</h4><ul>${rows}</ul></div>` : '';
  }).join('');
  const sum = `<div class="sk-summary">
      <p><span class="sk-pill ok">À l'aise</span> ${summary.aise.length ? summary.aise.join(', ') : '—'}</p>
      <p><span class="sk-pill hard">À travailler</span> ${summary.difficile.length ? summary.difficile.join(', ') : '—'}</p>
    </div>`;
  return sum + groups;
}
/** @param {string} [selectedId] */
function openParentSpace(selectedId) {
  const id = selectedId || profiles.current;
  const p = profiles.list.find((x) => x.id === id) || currentProfile();
  const st = profileState(p.id);
  openModal(`
    ${gameHeader('👪 Espace parents', 'Le temps de jeu et les progrès de chaque enfant')}
    <div class="ps-tabs" role="tablist">
      ${profiles.list.map((x) => `<button type="button" role="tab" class="ps-tab ${x.id === p.id ? 'on' : ''}" aria-selected="${x.id === p.id}" data-ps="${x.id}">${avatarHTML(x.avatar, x.look)} ${x.name || 'Sans nom'}</button>`).join('')}
    </div>
    <section class="bk-card"><h3>⏱️ Temps de jeu</h3>${playTimeHTML(st)}<p class="bk-help">Seul le temps où l'enfant joue vraiment est compté (pas le jeu laissé ouvert).</p></section>
    <section class="bk-card"><h3>😴 Pause douce</h3>
      <p>Après ce temps de jeu dans la journée, les mini-jeux se mettent en pause jusqu'au lendemain. L'île, le sac et l'album restent ouverts.</p>
      <div class="ps-chips" role="group" aria-label="Durée avant la pause">
        ${PAUSE_CHOICES.map((m) => `<button type="button" class="ps-chip ${(Number(p.pauseMin) || 0) === m ? 'on' : ''}" data-pause="${m}">${m ? m + ' min' : 'Pas de pause'}</button>`).join('')}
      </div>
    </section>
    ${emit('parents:cards', { st, p }).filter(Boolean).join('')}
    <section class="bk-card"><h3>📈 Progrès par compétence</h3>${skillsHTML(st, p.age)}
      <p class="bk-help">« À l'aise » : réussi sans erreur ou presque ces dernières fois. « À travailler » : souvent raté ou beaucoup d'erreurs.</p>
      <p class="bk-help">Les indices du compagnon (💡) sont comptés pour information : ils ne changent ni les récompenses ni le niveau du jeu.</p>
      <p class="bk-help">Chaque jeu a son propre niveau : il monte d'un cran après 2 réussites d'affilée presque sans erreur, redescend d'un cran après 2 missions ratées, et ne dépasse jamais celui de l'île ni l'âge de l'enfant. Les jeux à travailler reviennent plus souvent.</p></section>
    <section class="bk-card"><h3>🎉 Fêtes et saisons</h3>
      <p>Le jeu se décore tout seul : Halloween (20 oct. – 2 nov.), Noël (1er déc. – 6 janv.) et le jour de l'anniversaire de l'enfant (à régler dans ses réglages). Chaque fois, un petit cadeau : un chapeau pour son avatar et quelques pièces.</p>
      <p class="bk-help">Aperçu (sans cadeau, jusqu'à la fermeture du jeu) :</p>
      <div class="ps-chips" role="group" aria-label="Aperçu des saisons">
        ${Object.keys(FETES)
          .map(
            (k) =>
              `<button type="button" class="ps-chip ${seasonPreview() === k ? 'on' : ''}" data-season-preview="${k}">${FETES[k].emoji} ${FETES[k].name}</button>`,
          )
          .join('')}
        <button type="button" class="ps-chip ${!seasonPreview() ? 'on' : ''}" data-season-preview="">Selon la date</button>
      </div>
    </section>
    <section class="bk-card"><h3>⚙️ Réglages</h3>
      <div class="ps-chips" role="group" aria-label="Musique d'ambiance">
        <button type="button" class="ps-chip ${st.music ? 'on' : ''}" data-music="1">🎵 Musique d'ambiance</button>
        <button type="button" class="ps-chip ${st.music ? '' : 'on'}" data-music="0">Pas de musique</button>
      </div>
      <p class="bk-help">Une petite musique douce, différente sur chaque île, qui baisse quand la voix parle. L'enfant peut aussi la couper avec le bouton du son, en haut.</p>
      <div class="ps-volume">
        <label for="ps-volume">🔊 Volume des sons et de la musique</label>
        <input type="range" id="ps-volume" min="0" max="100" step="5" value="${psVolumeOf(st)}">
        <output id="ps-volume-v" for="ps-volume">${psVolumeOf(st)} %</output>
      </div>
      <div class="ps-actions">
        <button class="btn-small" id="ps-backup">💾 Sauvegarde</button>
        <button class="btn-small ghost" id="ps-player">✏️ Prénom, âge, avatar, compagnon</button>
      </div>
    </section>
    ${updateCardHTML()}
    <section class="bk-card ps-danger"><h3>⚠️ Zone sensible</h3>
      <p class="bk-help">Ces actions effacent une partie. Elles demandent une double confirmation.</p>
      <div class="ps-actions">
        <button class="btn-small danger" id="ps-reset">🔄 Recommencer la partie de ${p.name || 'ce joueur'}</button>
        ${profiles.list.length > 1 ? `<button class="btn-small danger" id="ps-delete">🗑️ Supprimer ${p.name || 'ce joueur'}</button>` : ''}
      </div>
    </section>
  `);
  bindQuit();
  bindUpdateCard();
  document.querySelectorAll('[data-ps]').forEach((b) =>
    setHandler(b, 'click', () => {
      playSound('tap');
      openParentSpace(b.dataset.ps);
    }),
  );
  document.querySelectorAll('[data-pause]').forEach((b) =>
    setHandler(b, 'click', () => {
      playSound('tap');
      p.pauseMin = Number(b.dataset.pause);
      profiles.familyPause = p.pauseMin; // les nouveaux joueurs recevront ce réglage
      saveProfiles();
      document.querySelectorAll('[data-pause]').forEach((x) => x.classList.toggle('on', x === b));
      showToast(p.pauseMin ? `😴 Pause après ${p.pauseMin} min` : 'Pas de pause', '');
    }),
  );
  document.querySelectorAll('[data-season-preview]').forEach((b) =>
    setHandler(b, 'click', () => {
      playSound('tap');
      setSeasonPreview(b.dataset.seasonPreview || null);
      document.querySelectorAll('[data-season-preview]').forEach((x) => x.classList.toggle('on', x === b));
      const s = currentSeason();
      showToast(s ? `${FETES[s].emoji} Aperçu : ${FETES[s].name}` : "Pas de fête aujourd'hui", '');
    }),
  );
  document.querySelectorAll('[data-music]').forEach((b) =>
    setHandler(b, 'click', () => {
      playSound('tap');
      const musicOn = b.dataset.music === '1';
      if (p.id === profiles.current) {
        state.music = musicOn;
        if (musicOn) {
          state.sound = true;
          state.voice = true;
        }
        save();
        renderSoundBtn();
      } else {
        st.music = musicOn;
        storageWrite(profileSaveKey(p.id), JSON.stringify(st));
      }
      document.querySelectorAll('[data-music]').forEach((x) => x.classList.toggle('on', x === b));
      showToast(musicOn ? "🎵 Musique d'ambiance" : 'Pas de musique', '');
    }),
  );
  const vol = /** @type {HTMLInputElement} */ (document.getElementById('ps-volume'));
  setHandler(vol, 'input', () => {
    const v = Number(vol.value);
    /** @type {HTMLElement} */ (document.getElementById('ps-volume-v')).textContent = v + ' %';
    if (p.id === profiles.current) {
      state.soundVolume = v;
      save();
      playSound('pop');
    } // une note pour entendre le nouveau volume
    else {
      st.soundVolume = v;
      storageWrite(profileSaveKey(p.id), JSON.stringify(st));
    }
  });
  setHandler(document.getElementById('ps-backup'), 'click', () => {
    playSound('tap');
    openBackup();
  });
  setHandler(document.getElementById('ps-player'), 'click', () => {
    playSound('tap');
    openPlayerSettings(p.id);
  });
  setHandler(document.getElementById('ps-reset'), 'click', async () => {
    playSound('tap');
    const ok = await askConfirm({
      text: `Tout recommencer à zéro pour ${p.name || 'ce joueur'} ? Pièces, objets, îles et niveau seront perdus.`,
      confirmLabel: '🔄 Recommencer',
      typeWord: 'RECOMMENCER',
    });
    if (!ok) return;
    if (p.id === profiles.current) {
      resetState();
      setCurrentWorld('lagon');
      refreshAll();
    } else {
      storageRemove(profileSaveKey(p.id));
    }
    playSound('win');
    speak(`Nouvelle aventure pour ${p.name || 'toi'} !`);
    showToast('🔄 Nouvelle aventure !', '');
    openParentSpace(p.id);
  });
  const del = document.getElementById('ps-delete');
  if (del)
    setHandler(del, 'click', async () => {
      playSound('tap');
      const word = (p.name || 'SUPPRIMER').trim();
      const ok = await askConfirm({
        text: `Supprimer ${p.name || 'ce joueur'} et toute sa partie ?`,
        confirmLabel: '🗑️ Supprimer',
        typeWord: word,
      });
      if (!ok) return;
      deleteProfile(p.id);
      playSound('tap');
      showToast('Joueur supprimé', '');
      openParentSpace();
    });
}
// volume d'un joueur (0 à 100), 80 % s'il n'a jamais été réglé
/** @param {PlayerState} st */
function psVolumeOf(st) {
  return typeof (st && st.soundVolume) === 'number' ? st.soundVolume : 80;
}

// annuler la question des parents : on revient d'où l'on vient
function openParents() {
  openParentGate(
    () => openParentSpace(),
    () => {
      const rg = document.getElementById('view-reglages');
      if (rg && rg.classList.contains('active')) closeModal();
      else openPlayers();
    },
  );
}

// l'espace parents s'ouvre aussi par événement ; la pause elle-même (le voile)
// est gérée par js/features/rest
on('nav:parents', openParents);

export { openParentGate, openParents, pauseDue, pauseMinutesLeft, startPlayTimeTracker };
