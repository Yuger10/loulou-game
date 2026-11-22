/* ---------- La barre des tours (mode chacun son tour et course) ----------
   Dessinée par party.js et race.js. Elle est dans son propre fichier pour
   qu'aucun des deux n'importe l'autre (import/no-cycle) ; son bouton ✖️
   arrête la partie par un point d'accroche, branché par party.js. */
import { avatarHTML } from '../../entities/companion/index.js';
import { party, partyPlayers, race } from '../../entities/player/index.js';
import { playSound, setHandler } from '../../shared/ui/index.js';

let turnStop = () => {};
function onTurnStop(fn) {
  turnStop = fn;
}

function renderTurnBar() {
  const bar = document.getElementById('turn-bar');
  if (!bar) return;
  if (!party.active) {
    bar.hidden = true;
    bar.innerHTML = '';
    return;
  }
  bar.hidden = false;
  const isRace = party.mode === 'race';
  bar.innerHTML =
    partyPlayers()
      .map(
        (p, i) => `
    <span class="turn-chip ${i === party.turn ? 'on' : ''}">
      <b>${avatarHTML(p.avatar, p.look)}</b> ${p.name || 'Joueur ' + (i + 1)}
      <i>${isRace ? (race.pos[p.id] || 0) + '/' + race.goal + ' ⛵' : (party.scores[p.id] || 0) + ' 🏅'}</i>
    </span>`,
      )
      .join('') + `<button class="turn-stop" id="turn-stop">✖️</button>`;
  const st = document.getElementById('turn-stop');
  if (st)
    setHandler(st, 'click', () => {
      playSound('tap');
      turnStop();
    });
}

export { onTurnStop, renderTurnBar };
