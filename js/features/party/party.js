/* ---------- Mode chacun son tour : passer la main, scores ---------- */
import { avatarHTML, avatarText } from '../../entities/companion/index.js';
import { party, partyCurrent, race, setParty, switchProfile } from '../../entities/player/index.js';
import { onWrongFeedback, playSound, showToast, speak, vibrate } from '../../shared/ui/index.js';
import { raceAdvance, stopRace } from './race.js';
import { onTurnStop, renderTurnBar } from './turn-bar.js';

/** @typedef {import('../../entities/player/index.js').Profile} Profile */

/** @param {string[]} ids les joueurs, dans l'ordre */
function startParty(ids) {
  if (ids.length < 2) return false;
  setParty({ active: true, mode: 'turns', players: ids.slice(), turn: 0, scores: {}, lastWinner: null });
  ids.forEach((id) => (party.scores[id] = 0));
  switchProfile(ids[0], true);
  renderTurnBar();
  playSound('win');
  // le premier joueur vient d'être choisi dans la liste : il existe
  const p = /** @type {Profile} */ (partyCurrent());
  speak(`Mode chacun son tour ! ${p.name || 'Joueur 1'} commence.`);
  showToast(`🎲 ${avatarText(p.avatar)} ${p.name || 'Joueur 1'} commence !`, '');
  return true;
}
function stopParty() {
  if (race.active) {
    stopRace();
    return;
  }
  party.active = false;
  party.mode = null;
  renderTurnBar();
  showToast('👤 Mode solo', '');
  speak('Retour au mode solo.');
}

// passe la main au joueur suivant (erreur dans un mini-jeu, ou fin de manche)
/** @param {string} [reason] 'wrong' après une erreur */
function passTurn(reason) {
  if (!party.active) return;
  party.turn = (party.turn + 1) % party.players.length;
  if (race.active) {
    race.turn = party.turn;
    race.rounds++;
  }
  // un joueur supprimé quitte la partie (party-state.js) : celui du tour existe
  const p = /** @type {Profile} */ (partyCurrent());
  switchProfile(p.id, true);
  renderTurnBar();
  showTurnOverlay(p, reason);
}

/** @type {ReturnType<typeof setTimeout> | undefined} */
let turnOverlayTimer; // l'annonce « À toi de jouer » disparaît 1,6 s après
/**
 * @param {Profile} p
 * @param {string} [reason]
 */
function showTurnOverlay(p, reason) {
  const el = document.getElementById('turn-overlay');
  if (!el) return;
  el.innerHTML = `
    <div class="turn-card">
      <span class="turn-av">${avatarHTML(p.avatar, p.look)}</span>
      <h2>${reason === 'wrong' ? 'Oups ! On change' : 'Au tour de'}</h2>
      <p class="turn-name">${p.name || 'Joueur'}</p>
      <p class="turn-sub">${reason === 'wrong' ? "Ce n'est pas grave, à toi de jouer !" : 'À toi !'}</p>
    </div>`;
  el.classList.add('show');
  playSound('tap');
  vibrate(60);
  speak(`${reason === 'wrong' ? "Ce n'est pas grave ! " : ''}À toi de jouer ${p.name || ''} !`);
  clearTimeout(turnOverlayTimer);
  turnOverlayTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

// appelé quand un mini-jeu est réussi
function partyScore() {
  if (!party.active) return;
  const p = partyCurrent();
  if (!p) return;
  party.scores[p.id] = (party.scores[p.id] || 0) + 1;
  party.lastWinner = p.id;
  renderTurnBar();
}

// en course : le joueur avance d'une case, puis la main passe au suivant
function partyAfterWin() {
  if (!party.active) return false;
  if (party.mode === 'race') {
    const finished = raceAdvance();
    if (finished) return true; // course gagnée : pas de passage de main
  }
  return false;
}

// mode chacun son tour : une erreur passe la main au joueur suivant
onWrongFeedback(() => {
  if (party.active) setTimeout(() => passTurn('wrong'), 420);
});

// le bouton ✖️ de la barre des tours arrête la partie
onTurnStop(stopParty);

export { partyAfterWin, partyScore, passTurn, startParty, stopParty };
