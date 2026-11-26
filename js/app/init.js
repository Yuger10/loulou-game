/* ---------- Init ---------- */
import { maybeRest, restActive, restRecallYesterday } from '../features/rest/index.js';
import { avatarText, companionSVG, currentCompanion } from '../entities/companion/index.js';
import { load, save, state } from '../entities/game-state/index.js';
import { loadProfiles } from '../entities/player/index.js';
import { currentSeason, FETES } from '../entities/season/index.js';
import { WORLD_ORDER, worldUnlocked } from '../entities/world/index.js';
import { initBackup, requestPersistentStorage } from '../features/backup/index.js';
import { markSeen, renderBadge, setSacTab } from '../features/bag/index.js';
import { renderTeamHeads, teamOnSessionStart } from '../features/companion-team/index.js';
import { maybeSkyOpening, renderIslandCard, renderLagon, renderLevelPill } from '../features/island/index.js';
import { renderMap } from '../features/map/index.js';
import { updateMusic } from '../features/music/index.js';
import { startPlayTimeTracker } from '../features/parents/index.js';
import { announceUpdate } from '../features/update/index.js';
import { renderRaceTrack, renderTurnBar } from '../features/party/index.js';
import { closeWelcome, openWelcome, renderProfile, renderSoundBtn } from '../features/profile/index.js';
import { ensureQuests, openQuestsModal } from '../features/quests/index.js';
import { initSeasons, maybeSeasonGift } from '../features/seasons/index.js';
import { renderSquishyBadge, squishySessionHello } from '../features/squishies/index.js';
import { openStoryJournal } from '../features/story/index.js';
import { renderCoins } from '../features/wallet/index.js';
import {
  newVoiceScene,
  playSound,
  requestCloseModal,
  setHandler,
  showToast,
  speak,
  switchView,
} from '../shared/ui/index.js';

loadProfiles();
load();
// marque comme déjà vus les objets déjà possédés (anciennes sauvegardes)
Object.keys(state.inventory || {}).forEach((k) => {
  if (state.inventory[k] > 0) markSeen(k);
});
renderCoins();
renderSoundBtn();
renderBadge();
renderProfile();
renderTeamHeads();
renderSquishyBadge();
ensureQuests();
// à la première ouverture, les îles déjà accessibles sont considérées comme connues
if (!state.visited || !state.visited.length) {
  state.visited = WORLD_ORDER.filter(worldUnlocked);
  save();
}
renderTurnBar();
renderRaceTrack();
renderLagon();
renderMap();
renderIslandCard();
renderLevelPill();
switchView('carte');

/* Écran titre : sert aussi à débloquer le son et la voix (geste utilisateur requis sur iOS) */
function showSplash() {
  const sp = /** @type {HTMLElement} */ (document.getElementById('splash'));
  newVoiceScene();
  const season = currentSeason();
  /** @type {HTMLElement} */ (document.getElementById('splash-hello')).textContent = season
    ? `${FETES[season].greet(state.name)} ${FETES[season].emoji}`
    : state.name
      ? `Coucou ${state.name} ${avatarText(state.avatar)} !`
      : "En route pour l'aventure ?";
  // joueur connu : son compagnon l'accueille ; sinon la troupe des personnages
  const bud = document.getElementById('splash-buddy');
  const cast = sp.querySelector('.cast');
  if (bud && state.name) {
    bud.innerHTML = companionSVG(currentCompanion(), 'cheer');
    bud.hidden = false;
    if (cast) cast.hidden = true;
  } else if (bud) {
    bud.hidden = true;
    if (cast) cast.hidden = false;
  }
  sp.classList.remove('hiding');
  sp.classList.add('show');
}
function hideSplash() {
  requestPersistentStorage();
  const sp = /** @type {HTMLElement} */ (document.getElementById('splash'));
  playSound('win');
  const note = document.getElementById('splash-note');
  if (note) note.hidden = true;
  sp.classList.add('hiding');
  setTimeout(() => {
    sp.classList.remove('show', 'hiding');
    updateMusic();
    // la pause revient toujours (même après un rechargement) ; le lendemain, le compagnon se souvient
    maybeRest();
    if (state.name && !restActive()) restRecallYesterday();
  }, 450);
  if (!state.name) openWelcome();
  else {
    const season = currentSeason();
    speak(
      season
        ? `${FETES[season].greet(state.name)} L'aventure t'attend.`
        : `Coucou ${state.name} ! L'aventure t'attend.`,
    );
    switchView('carte');
    // une fois par saison : un cadeau (chapeau pour l'avatar + pièces) ;
    // sinon l'équipe des compagnons : son ouverture (niveau 10) ou une rencontre
    // le Ciel des Rêves (v55) : son ouverture, pour une partie qui a déjà son niveau
    setTimeout(() => {
      if (!maybeSeasonGift() && !maybeSkyOpening()) teamOnSessionStart();
    }, 700);
    // v53 : des boîtes surprises attendent dans la chambre à squishies (une fois)
    setTimeout(squishySessionHello, 2600);
  }
}
// navigation secondaire
setHandler(document.getElementById('btn-back-map'), 'click', () => {
  playSound('tap');
  switchView('carte');
});
document.querySelectorAll('[data-sactab]').forEach((b) => {
  setHandler(b, 'click', () => {
    playSound('tap');
    setSacTab(/** @type {string} */ (b.dataset.sactab));
  });
});
setHandler(document.getElementById('quests-btn'), 'click', () => {
  playSound('tap');
  openQuestsModal();
});
setHandler(document.getElementById('story-btn'), 'click', () => {
  playSound('tap');
  openStoryJournal();
});

// fermeture facile des fenêtres : croix, poignée, clic à côté, touche Échap
setHandler(document.getElementById('modal-close'), 'click', () => {
  playSound('tap');
  requestCloseModal();
});
setHandler(document.getElementById('modal-handle'), 'click', () => {
  playSound('tap');
  requestCloseModal();
});
// le fond de la fenêtre garde un écouteur direct : un `data-act` (setHandler) sur
// #overlay rendrait muet tout le contenu des fenêtres (écoute au doigt)
/** @type {HTMLElement} */ (document.getElementById('overlay')).addEventListener('click', (e) => {
  if (/** @type {HTMLElement} */ (e.target).id === 'overlay') requestCloseModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && /** @type {HTMLElement} */ (document.getElementById('overlay')).classList.contains('show'))
    requestCloseModal();
});

setHandler(document.getElementById('btn-splash-play'), 'click', hideSplash);
showSplash();
// la pastille en haut ouvre le panneau des joueurs (profils, solo / chacun son tour)
// toucher l'avatar et le prénom ouvre les Réglages (pas de 5e bouton dans la barre du bas)
setHandler(document.getElementById('avatar-pill'), 'click', () => {
  playSound('tap');
  switchView('reglages');
});
setHandler(document.getElementById('btn-start'), 'click', closeWelcome);
/** @type {HTMLElement} */ (document.getElementById('name-input')).addEventListener('keydown', (e) => {
  if (e.key === 'Enter') closeWelcome();
});
// le jeu vient de redémarrer après « Chercher une mise à jour » (espace parents, v66) :
// on le dit sur l'écran titre, où le message reste jusqu'à « Jouer »
const updateNote = announceUpdate();
if (updateNote) {
  const note = document.getElementById('splash-note');
  if (note && /** @type {HTMLElement} */ (document.getElementById('splash')).classList.contains('show')) {
    note.textContent = updateNote;
    note.hidden = false;
  } else setTimeout(() => showToast(updateNote), 1200);
}
// Installe le service worker ET recharge automatiquement dès qu'une
// nouvelle version est prête, pour que les nouveautés (nouveaux jeux,
// nouvelle île…) soient toujours visibles sans manipulation.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker
    .register('sw.js')
    .then((reg) => {
      // vérifie s'il y a une mise à jour à chaque lancement
      reg.update().catch(() => {});
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            // une nouvelle version vient de s'installer : on l'active tout de suite
            sw.postMessage('skipWaiting'); // oxlint-disable-line unicorn/require-post-message-target-origin -- service worker, pas une fenêtre
          }
        });
      });
    })
    .catch(() => {});
  let refreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshed) return;
    refreshed = true;
    location.reload();
  });
}
initBackup();
initSeasons();
startPlayTimeTracker();
