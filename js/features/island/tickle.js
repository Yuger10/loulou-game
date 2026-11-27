/* ---------- Les chatouilles (Monde des Chatouilles, saison 3) ----------
   Le message de l'île : on chatouille seulement qui en a envie, et on
   s'arrête quand l'autre dit stop, sans leçon de morale.
   - Sur la scène, toucher un personnage n'est jamais une chatouille : c'est
     un « rire de bonjour » (il est content de te voir), puis son dialogue.
   - Les chatouilles passent par le bouton « 🪶 Des chatouilles ? » du
     dialogue : l'envie est tirée une fois par dialogue ; sans envie, le
     personnage dit non ; avec, il rit, puis dit stop au `max`-ième toucher.
   - Après un non ou un stop, il est « au repos » 60 s : ni rire de bonjour,
     ni bouton. Le consentement gagne sur l'envie de jouer.
   Rien n'est sauvegardé (spec D17) : le repos vit en mémoire seulement.
   Les fiches : CHARACTER_TICKLES (js/entities/character/characters-s3.js). */
import { CHARACTER_TICKLES } from '../../entities/character/index.js';
import { currentWorld, WORLDS } from '../../entities/world/index.js';
import { random } from '../../shared/lib/index.js';
import { bindSpeakButtons, giggle, setHandler, speak, speechBubble, vibrate } from '../../shared/ui/index.js';

const HELLO_LAUGH_DELAY = 600; // le dialogue s'ouvre après le rire de bonjour
const GIGGLE_MS = 900; // la durée de l'animation du rire
const TICKLE_REST_MS = 60000;

/** @type {Record<string, number>} jusqu'à quand chaque personnage est au repos (horloge de l'appareil) */
const tickleRestUntil = {};

/** @param {string} id le personnage a dit non ou stop il y a moins de 60 s */
function tickleResting(id) {
  return (tickleRestUntil[id] || 0) > Date.now();
}
/** @param {string} id sur une île qui rit, un personnage qui n'est pas au repos */
function tickleAwake(id) {
  const w = WORLDS[currentWorld];
  return !!w && !!w.giggly && !tickleResting(id);
}

/**
 * Le rire de bonjour : le visage pouffe 900 ms, le son joue, l'appareil vibre.
 * @param {Element | null} el le visage du personnage, jamais son bouton (la zone à toucher ne bouge pas)
 */
function helloLaugh(el) {
  giggle(el);
  vibrate(25);
  if (el) setTimeout(() => el.classList.remove('giggle-wiggle'), GIGGLE_MS);
}
/**
 * Toucher un personnage sur la scène : s'il est d'humeur, il rit pour dire
 * bonjour, et son dialogue attend la fin du rire (600 ms). Sinon, le dialogue
 * s'ouvre tout de suite, comme sur les autres îles.
 * @param {Element} el le bouton du personnage sur la scène
 * @param {() => void} open ouvre son dialogue
 */
function tickleHelloThen(el, open) {
  const btn = /** @type {HTMLElement} */ (el);
  if (!tickleAwake(btn.dataset.char || '')) {
    open();
    return;
  }
  if (btn.dataset.hello) return; // un second toucher pendant le rire n'ouvre pas deux dialogues
  btn.dataset.hello = '1';
  helloLaugh(btn.querySelector('.emoji'));
  setTimeout(() => {
    delete btn.dataset.hello;
    // la scène reste dans la page quand on change de vue : le dialogue ne s'ouvre
    // que si l'enfant est encore sur l'île, et sans remplacer une autre fenêtre
    const view = btn.closest('.view');
    const overlay = document.getElementById('overlay');
    const elsewhere = (view && !view.classList.contains('active')) || (overlay && overlay.classList.contains('show'));
    if (btn.isConnected && !elsewhere) open();
  }, HELLO_LAUGH_DELAY);
}

/** @param {string} id le bouton du dialogue, si le personnage peut être chatouillé maintenant (K1) */
function tickleButtonHTML(id) {
  if (!CHARACTER_TICKLES[id] || !tickleAwake(id)) return '';
  return '<button class="btn-ghost" id="btn-tickle">🪶 Des chatouilles ?</button>';
}
/** @param {string} text la réponse du personnage remplace la bulle du dialogue, et elle est dite */
function tickleSay(text) {
  const old = document.querySelector('#modal-body .speech');
  if (old) old.outerHTML = speechBubble(text);
  bindSpeakButtons();
  speak(text);
}
/**
 * Le personnage a dit non ou stop : le bouton disparaît, il se repose 60 s.
 * @param {string} id
 * @param {HTMLElement} btn
 * @param {string} text
 */
function tickleRest(id, btn, text) {
  tickleRestUntil[id] = Date.now() + TICKLE_REST_MS;
  btn.remove();
  tickleSay(text);
}
/**
 * Branche le bouton du dialogue. Chaque dialogue repart de zéro : l'envie est
 * tirée au premier toucher, le compteur aussi (K2).
 * @param {string} id
 */
function tickleBind(id) {
  const btn = document.getElementById('btn-tickle');
  const card = CHARACTER_TICKLES[id];
  if (!btn || !card) return;
  let count = 0;
  /** @type {boolean | null} */
  let wants = null;
  setHandler(btn, 'click', () => {
    if (wants === null) wants = random() < card.want;
    if (!wants) {
      tickleRest(id, btn, card.no);
      return;
    }
    count++;
    if (count >= card.max) {
      tickleRest(id, btn, card.stop);
      return;
    }
    giggle(document.querySelector('#modal-body .char-header .emoji'));
    tickleSay(card.laughs[(count - 1) % card.laughs.length]);
  });
}

export { tickleBind, tickleButtonHTML, tickleHelloThen };
