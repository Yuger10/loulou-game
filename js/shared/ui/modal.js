/* ---------- Fenêtre modale ----------
   `shared` ne connaît pas les features : celles qui doivent réagir à
   l'ouverture ou à la fermeture d'une fenêtre (minuteur, relances
   anti-devinette, gains en attente…) s'inscrivent ici. */
import { newVoiceScene, stopSpeech } from './voice.js';

/** @type {Array<() => void>} */
const modalOpenHooks = [],
  /** @type {Array<() => void>} */
  modalCloseHooks = [];
/** @param {() => void} fn */
function onModalOpen(fn) {
  modalOpenHooks.push(fn);
}
/** @param {() => void} fn */
function onModalClose(fn) {
  modalCloseHooks.push(fn);
}
// raccourci : la même fonction à l'ouverture et à la fermeture
/** @param {() => void} fn */
function onModalChange(fn) {
  onModalOpen(fn);
  onModalClose(fn);
}

// Garde de fermeture : un formulaire avec des changements non enregistrés
// (js/shared/ui/form.js) peut retenir la fermeture demandée par l'enfant
// (✕, poignée, clic à côté, Échap). Le garde renvoie false pour la retenir.
// Tout nouveau contenu l'efface.
/** @typedef {() => boolean} ModalCloseGuard renvoie false pour retenir la fermeture */
/** @type {ModalCloseGuard | null} */
let modalCloseGuard = null;
/** @param {ModalCloseGuard | null} fn */
function setModalCloseGuard(fn) {
  modalCloseGuard = fn;
}
// fermeture demandée par l'enfant : passe par le garde
function requestCloseModal() {
  if (modalCloseGuard && modalCloseGuard() === false) return false;
  closeModal();
  return true;
}

/** @param {string} html */
function openModal(html) {
  modalCloseGuard = null;
  newVoiceScene(); // la première phrase de la fenêtre coupera celle de l'écran d'avant
  const m0 = document.getElementById('modal');
  if (m0) m0.classList.remove('has-form');
  // tout nouveau contenu invalide ce qui dépendait de l'ancien : minuteur de
  // défi, relance programmée après une erreur (anti-devinette), gains en
  // attente… Chaque feature concernée s'inscrit avec onModalOpen.
  modalOpenHooks.forEach((fn) => fn());
  const body = /** @type {HTMLElement} */ (document.getElementById('modal-body') || document.getElementById('modal'));
  body.innerHTML = html;
  const ov = /** @type {HTMLElement} */ (document.getElementById('overlay'));
  ov.classList.add('show');
  document.body.classList.add('modal-open');
  // la fenêtre repart toujours du haut
  const m = document.getElementById('modal');
  if (m) m.scrollTop = 0;
}

function closeModal() {
  modalCloseGuard = null;
  modalCloseHooks.forEach((fn) => fn());
  /** @type {HTMLElement} */ (document.getElementById('overlay')).classList.remove('show');
  document.body.classList.remove('modal-open');
  stopSpeech();
  newVoiceScene();
}

export { closeModal, onModalChange, onModalClose, onModalOpen, openModal, requestCloseModal, setModalCloseGuard };
