/* ---------- Le grand final de la saison 3 (Île du Grand Concert) ----------
   Juste après l'énigme du Grand Concert : le dernier morceau complète la
   carte de Zap, sa croix mène sous la grande scène, et le trésor de
   l'expédition est un xylophone tout en or, que l'enfant peut jouer librement.
   Même modèle que le final de la saison 2 (finale.js) : un seul drapeau,
   `state.season3Done`, posé et enregistré dès l'ouverture (fermer la fenêtre
   en route ne fait rien perdre). Le xylophone d'or est gagné si et seulement
   si ce drapeau est vrai : il se retrouve dans le journal 📖 et auprès de
   Stella. Le journal permet de revoir le final, sans l'écran du trésor. Une
   musique de fête l'accompagne. */
import { companionSVG } from '../../entities/companion/index.js';
import { save, state } from '../../entities/game-state/index.js';
import { emit } from '../../shared/lib/index.js';
import {
  closeModal,
  confetti,
  onModalClose,
  openModal,
  playSound,
  setHandler,
  speak,
  vibrate,
} from '../../shared/ui/index.js';
import { openGoldenXylophone, xyloHTML } from '../xylophone/index.js';
import { ZAP_MAP_PIECES, zapMapSVG } from './zap-map.js';

/** @typedef {{ replay?: boolean }} Season3FinaleOptions replay : revoir le final, sans le trésor */
/**
 * Le final en cours : la scène affichée, le trésor à donner, la fin.
 * @typedef {{ i: number, rewards: boolean, replay: boolean, end: () => void }} Finale3Play
 */

const FINALE3_TITLES = ['La carte est complète !', 'Le trésor de Zap', 'Le grand concert'];
const FINALE3_LINES = [
  'Le dernier morceau se pose à sa place… La carte de Zap est complète ! Sa croix rouge montre le trésor, juste sous la grande scène.',
  '« On creuse ? » dit Zap. Sous les planches, il y a un vieux coffre. Dedans… un xylophone tout en or !',
  "« C'est le trésor de l'expédition, dit Zap. Il est pour toi. Ce soir, c'est toi qui ouvres le grand concert ! »",
];
// le xylophone d'or, montré sans noms : on ne le joue pas ici
const finale3Xylo = () => xyloHTML({ lames: [0, 1, 2, 3, 4, 5, 6, 7], gold: true, names: false });

// une sauvegarde importée peut porter autre chose qu'un booléen : toute lecture passe par ici
/** @returns {boolean} le grand final de la saison 3 a été joué : le xylophone d'or est gagné */
function season3Done() {
  return !!state.season3Done;
}

// le trésor, une seule fois : vrai s'il vient d'être donné
function giveSeason3Rewards() {
  if (season3Done()) return false;
  state.season3Done = true;
  save();
  emit('season3:done');
  return true;
}

let finale3Active = false;
// fermer la fenêtre (✕ ou fin du final) : la musique de l'île revient
onModalClose(() => {
  if (finale3Active) {
    finale3Active = false;
    emit('music:theme', null);
  }
});

/**
 * @param {(() => void) | null} [onDone] appelée à la fin du final
 * @param {Season3FinaleOptions} [opts]
 * @returns {void}
 */
function openSeason3Finale(onDone, opts) {
  const replay = !!(opts && opts.replay);
  // donné dès le début : fermer la fenêtre en route ne le fait pas perdre
  const rewards = !replay && giveSeason3Rewards();
  finale3Active = true;
  emit('music:theme', 'concert-fete');
  finale3Scene({
    i: 0,
    rewards,
    replay,
    end: () => {
      closeModal();
      if (onDone) onDone();
    },
  });
}

/** @param {number} i la scène @returns {string} son image */
function finale3Art(i) {
  // la carte y est complète, quel que soit le nombre de chapitres résolus (comme Grisou
  // tout coloré dans le final de la saison 2) ; le journal, lui, montre le vrai compte
  if (i === 0)
    return `<div class="story-zapmap happy finale3-map">${zapMapSVG(ZAP_MAP_PIECES, { fresh: 'concert' })}</div>`;
  if (i === 1) return `<div class="finale3-xylo" aria-hidden="true">${finale3Xylo()}</div>`;
  return `<span class="finale-buddy">${companionSVG('zap', 'cheer')}</span>`;
}

/**
 * Une scène du final.
 * @param {Finale3Play} f
 * @returns {void}
 */
function finale3Scene(f) {
  const last = f.i === FINALE3_LINES.length - 1;
  openModal(`
    <div class="finale finale3" id="finale3" data-step="${f.i}">
      ${finale3Art(f.i)}
      <h2>${FINALE3_TITLES[f.i]}</h2>
      <div class="speech">${FINALE3_LINES[f.i]}</div>
    </div>
    <button class="btn-primary" id="finale3-next">${!last ? 'Suite ➡️' : f.rewards ? 'Mon trésor 🎁' : 'La Grande Expédition ✅'}</button>
  `);
  speak(FINALE3_LINES[f.i]);
  if (f.i === 0) {
    playSound('win');
    confetti();
    vibrate([80, 60, 80, 60, 200]);
  }
  setHandler(document.getElementById('finale3-next'), 'click', () => {
    playSound('tap');
    f.i++;
    if (f.i < FINALE3_LINES.length) finale3Scene(f);
    else if (f.rewards) finale3Treasure(f);
    else finale3Complete(f);
  });
}

/**
 * Le trésor : le xylophone d'or, à jouer tout de suite ou plus tard.
 * @param {Finale3Play} f
 * @returns {void}
 */
function finale3Treasure(f) {
  const say =
    "Le xylophone d'or est à toi ! Touche ses lames pour jouer ce que tu veux. Tu le retrouves dans Mon histoire, et auprès de Stella sur la grande scène.";
  openModal(`
    <div class="reward-box finale-gift">
      <div class="finale3-treasure" aria-hidden="true">${finale3Xylo()}</div>
      <h2>Le xylophone d'or est à toi ! ✨</h2>
      <div class="speech">${say}</div>
    </div>
    <button class="btn-primary" id="finale3-play">🎼 Jouer maintenant</button>
    <button class="btn-ghost" id="finale3-later">Plus tard</button>
  `);
  speak(say);
  confetti();
  setHandler(document.getElementById('finale3-play'), 'click', () => {
    playSound('good');
    // la musique de fête continue : c'est le final qui la rend, à sa fermeture
    openGoldenXylophone({ theme: false, onDone: () => finale3Complete(f) });
  });
  setHandler(document.getElementById('finale3-later'), 'click', () => {
    playSound('tap');
    finale3Complete(f);
  });
}

/**
 * La saison est terminée.
 * @param {Finale3Play} f
 * @returns {void}
 */
function finale3Complete(f) {
  const say = f.replay
    ? 'La Grande Expédition est terminée : le trésor de Zap est à toi !'
    : 'Bravo ! Tu as trouvé le trésor de Zap. La saison 3, la Grande Expédition, est terminée !';
  openModal(`
    <div class="reward-box finale-done">
      <span class="big-emoji">🎼</span>
      <h2>La Grande Expédition ✅</h2>
      <div class="speech">${say}</div>
    </div>
    <button class="btn-primary" id="finale3-end">Continuer ✨</button>
  `);
  speak(say);
  setHandler(document.getElementById('finale3-end'), 'click', () => {
    playSound('tap');
    f.end();
  });
}

/* ---- Dans le journal « 📖 Mon histoire », section de la saison 3 ---- */
/** @returns {string} les deux boutons d'après le final : le revoir, jouer du xylophone d'or */
function season3JournalHTML() {
  if (!season3Done()) return '';
  return `<button type="button" class="story-chap story-prologue" data-finale="3">
      <span class="story-chap-n">🗺️</span><span class="story-chap-ico">🎼</span><span class="story-chap-title">Revoir le grand final</span></button>
    <button type="button" class="story-chap story-prologue" data-xylo>
      <span class="story-chap-n">🎼</span><span class="story-chap-ico">✨</span><span class="story-chap-title">🎼 Mon xylophone d'or</span></button>`;
}
/**
 * Branche ces deux boutons ; chacun revient au journal à la fin.
 * @param {() => void} back rouvre le journal
 * @returns {void}
 */
function season3JournalBind(back) {
  setHandler(document.querySelector('[data-finale="3"]'), 'click', () => {
    playSound('tap');
    openSeason3Finale(back, { replay: true });
  });
  setHandler(document.querySelector('[data-xylo]'), 'click', () => {
    playSound('tap');
    openGoldenXylophone({ onDone: back });
  });
}

export { openSeason3Finale, season3Done, season3JournalBind, season3JournalHTML };
