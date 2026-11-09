/* ---------- La fenêtre d'un jeu ou d'une activité : en-tête, consigne lue, retours parlés ----------
   Sortis du moteur des mini-jeux (v54) : l'histoire, les quêtes, la chambre à
   squishies, l'espace parents… les utilisent aussi, et ne doivent pas dépendre
   du moteur. */
import { buddySlot } from '../../entities/companion/index.js';
import { pickRandom } from '../../shared/lib/index.js';
import { bindSpeakButtons, speak } from '../../shared/ui/index.js';

// Une erreur : la proposition fautive est neutralisée et un essai est perdu.
// Petits encouragements parlés à chaque erreur : avant ce correctif,
// seul un son « faux » jouait — aucune voix pendant le jeu lui-même
// (juste au tout début, pour la consigne). Varié pour ne pas lasser.

const WRONG_HINTS = [
  'Pas tout à fait, regarde encore',
  'Essaie encore, tu vas trouver',
  'Presque ! Observe bien',
  'Non, regarde une nouvelle fois',
];

function speakWrongHint(){
  if(Math.random()<0.7) speak(pickRandom(WRONG_HINTS));
}

// En-tête d'une fenêtre de jeu : titre, consigne et bouton pour l'écouter.
// La fermeture est assurée par la croix de la fenêtre (#modal-close).
function gameHeader(title, hint, spoken){
  const say = (spoken || hint).replace(/"/g,'&quot;');
  return `
    <div class="game-head"><h2>${title}</h2></div>
    <p class="puzzle-hint has-buddy">
      <span class="hint-txt">${hint}</span>
      ${buddySlot('think')}
      <button class="btn-speak" data-say="${say}" aria-label="Écouter la consigne">🔈</button>
    </p>
  `;
}

// branche les boutons « écouter » et lit la consigne à voix haute
function bindQuit(){
  bindSpeakButtons();
  // lit la consigne une seule fois par mini-jeu (le mémo se re-rend à chaque clic)
  const hint = document.querySelector('.puzzle-hint [data-say]');
  if(hint && hint.dataset.say !== bindQuit._last){ bindQuit._last = hint.dataset.say; speak(hint.dataset.say); }
}

export { bindQuit, gameHeader, speakWrongHint };
