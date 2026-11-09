/* ---------- Porte-monnaie : pièces du joueur et leur affichage ---------- */
import { save, state } from '../../entities/game-state/index.js';
import { onProfileRefresh } from '../../entities/player/index.js';

function addCoins(n){
  state.coins += n; save(); renderCoins();
  const pill = document.getElementById('coin-pill');
  pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
}

// pièces comptées mais encore en vol (voir gains.js) : l'affichage les attend
var coinsInFlight = 0;
function addCoinsInFlight(n){ coinsInFlight += n; }

function renderCoins(){ document.getElementById('coin-count').textContent = state.coins - (coinsInFlight || 0); }

// changement de joueur : ses pièces
onProfileRefresh(renderCoins);

export { addCoins, addCoinsInFlight, renderCoins };
