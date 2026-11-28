import { pickRandom, random } from '../lib/index.js';
import { playSound } from './sound.js';

/** @type {number | undefined} */
let toastTimer; // le message en cours disparaît 1,6 s après le dernier
/** @param {string} msg */
function showToast(msg) {
  const t = /** @type {HTMLElement} */ (document.getElementById('toast'));
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}

/** @param {VibratePattern} pattern */
function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

/** @param {HTMLElement} el */
function shakeEl(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

// Le rire (Monde des Chatouilles) : l'élément pouffe (classe `giggle-wiggle`,
// relancée même s'il riait déjà) et le son `giggle` joue.
/** @param {Element | null | undefined} el */
function giggle(el) {
  playSound('giggle');
  if (!(el instanceof HTMLElement)) return;
  el.classList.remove('giggle-wiggle');
  void el.offsetWidth;
  el.classList.add('giggle-wiggle');
}

// fonctions appelées après chaque retour d'erreur (voir onWrongFeedback)
/** @type {Array<(el: HTMLElement | null) => void>} */
const wrongFeedbackHooks = [];
/** @param {(el: HTMLElement | null) => void} fn */
function onWrongFeedback(fn) {
  wrongFeedbackHooks.push(fn);
}

/** @param {HTMLElement | null} el le bouton fautif, ou null pour une erreur sans bouton (paire ratée, temps écoulé) */
function wrongFeedback(el) {
  playSound('wrong');
  vibrate(80);
  if (el) {
    shakeEl(el);
    el.style.opacity = '0.4';
    setTimeout(() => (el.style.opacity = '1'), 400);
  }
  // abonnés (par exemple le mode chacun son tour, qui passe la main)
  wrongFeedbackHooks.forEach((fn) => fn(el));
}

/* ---------- Confettis ---------- */
function confetti() {
  const box = /** @type {HTMLElement} */ (document.getElementById('confetti'));
  const colors = ['#FF8969', '#FFAAD4', '#FFCB4C', '#2EC4C6', '#FFFFFF', '#B388FF'];
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = random() * 100 + '%';
    p.style.background = pickRandom(colors);
    p.style.animationDuration = 1.4 + random() * 1.2 + 's';
    p.style.animationDelay = random() * 0.4 + 's';
    p.style.transform = `rotate(${random() * 360}deg)`;
    box.appendChild(p);
    setTimeout(() => p.remove(), 3200);
  }
}

export { confetti, giggle, onWrongFeedback, shakeEl, showToast, vibrate, wrongFeedback };
