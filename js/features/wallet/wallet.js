/* ---------- Porte-monnaie : pièces du joueur et leur affichage ---------- */
import { save, state } from '../../entities/game-state/index.js';
import { onProfileRefresh } from '../../entities/player/index.js';

/** @param {number} n */
function addCoins(n) {
  state.coins += n;
  save();
  renderCoins();
  const pill = /** @type {HTMLElement} */ (document.getElementById('coin-pill'));
  pill.classList.remove('bump');
  void pill.offsetWidth;
  pill.classList.add('bump');
}

// pièces comptées mais encore en vol (voir gains.js) : l'affichage les attend
var coinsInFlight = 0;
/** @param {number} n */
function addCoinsInFlight(n) {
  coinsInFlight += n;
}

function renderCoins() {
  /** @type {HTMLElement} */ (document.getElementById('coin-count')).textContent = String(
    state.coins - (coinsInFlight || 0),
  );
}

// changement de joueur : ses pièces
onProfileRefresh(renderCoins);

export { addCoins, addCoinsInFlight, renderCoins };
