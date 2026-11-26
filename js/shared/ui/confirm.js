/* ---------- Fenêtre de confirmation du jeu ----------
   Remplace les boîtes confirm() du navigateur, peu lisibles et que la voix ne
   lit pas. Elle s'ouvre PAR-DESSUS la fenêtre en cours (sans l'effacer), lit
   la question à voix haute, et met en avant le choix prudent.

   askConfirm({ text, confirmLabel, cancelLabel, danger, typeWord })
     → Promise<boolean>
   - danger (par défaut true) : bouton de confirmation rouge, « Annuler » mis
     en avant comme action principale ;
   - typeWord : double confirmation, il faut taper ce mot (sans tenir compte
     des majuscules) pour que le bouton s'active ;
   - Échap ou toucher à côté : `dismissValue` (false par défaut ; null pour
     « Garder tes changements ? », où ne rien choisir ramène au formulaire) ;
   - primaryYes : le « oui » est l'action principale (bouton mis en avant). */
import { speak } from './voice.js';
import { setHandler } from './handlers.js';

/**
 * @typedef {object} ConfirmOptions
 * @property {string} [text]
 * @property {string} [confirmLabel]
 * @property {string} [cancelLabel]
 * @property {boolean} [danger]
 * @property {string} [typeWord]
 * @property {boolean | null} [dismissValue]
 * @property {boolean} [primaryYes]
 */
/** @typedef {boolean | null} ConfirmResult */

/** @type {((result: ConfirmResult) => void) | null} */
let confirmClose = null;

const CONFIRM_DEFAULTS = {
  text: '',
  confirmLabel: 'Oui',
  cancelLabel: 'Annuler',
  danger: true,
  typeWord: '',
  dismissValue: /** @type {boolean | null} */ (false),
  primaryYes: false,
};
/** @typedef {typeof CONFIRM_DEFAULTS} ConfirmSettings */
/**
 * La fenêtre ouverte : ses boutons, son champ (double confirmation) et le mot attendu.
 * @typedef {{ el: HTMLElement, o: ConfirmSettings, word: string, yes: HTMLElement, no: HTMLElement,
 *   input: HTMLInputElement, typed: () => boolean }} ConfirmUI
 */

/**
 * @param {ConfirmOptions} [opts]
 * @returns {Promise<ConfirmResult>}
 */
function askConfirm(opts) {
  /** @type {ConfirmSettings} */
  const o = Object.assign({}, CONFIRM_DEFAULTS, opts || {});
  if (confirmClose) confirmClose(null);
  const el = confirmLayer();
  const word = String(o.typeWord || '').trim();
  el.innerHTML = confirmBoxHTML(o, word);
  el.hidden = false;
  speak(String(o.text).replace(/<[^>]+>/g, ''));
  // les deux boutons viennent d'être écrits juste au-dessus
  const yes = /** @type {HTMLElement} */ (el.querySelector('[data-confirm="yes"]')),
    no = /** @type {HTMLElement} */ (el.querySelector('[data-confirm="no"]'));
  const input = /** @type {HTMLInputElement} */ (el.querySelector('#confirm-input'));
  const typed = () => !word || (input && input.value.trim().toLowerCase() === word.toLowerCase());
  const refresh = () => yes.setAttribute('aria-disabled', typed() ? 'false' : 'true');
  refresh();
  return new Promise((resolve) => {
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.preventDefault();
        close(o.dismissValue);
      } else if (e.key === 'Enter' && e.target === input && typed()) {
        e.preventDefault();
        close(true);
      }
    };
    /** @param {ConfirmResult} result */
    const close = (result) => {
      document.removeEventListener('keydown', onKey, true);
      el.hidden = true;
      el.innerHTML = '';
      confirmClose = null;
      resolve(result);
    };
    confirmClose = close;
    document.addEventListener('keydown', onKey, true); // avant la fenêtre derrière (qui fermerait sur Échap)
    if (input) {
      input.addEventListener('input', refresh);
      setTimeout(() => input.focus(), 0);
    } else setTimeout(() => no.focus(), 0);
    confirmBindButtons({ el, o, word, yes, no, input, typed }, close);
  });
}

// la couche de la fenêtre, créée au premier appel
function confirmLayer() {
  let el = document.getElementById('confirm-layer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'confirm-layer';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * @param {ConfirmSettings} o
 * @param {string} word le mot à taper (double confirmation), ou rien
 */
function confirmBoxHTML(o, word) {
  return `
    <div class="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirm-text">
      <p id="confirm-text" class="confirm-text">${o.text}</p>
      ${
        word
          ? `<label class="confirm-type">Pour confirmer, écris <strong>${word}</strong>
        <input id="confirm-input" type="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="done"></label>`
          : ''
      }
      <div class="confirm-actions">
        <button type="button" class="${o.primaryYes ? 'form-primary' : o.danger ? 'danger' : 'form-secondary'}" data-confirm="yes">${o.confirmLabel}</button>
        <button type="button" class="${o.primaryYes ? 'form-secondary' : 'form-primary'}" data-confirm="no">${o.cancelLabel}</button>
      </div>
    </div>`;
}

/**
 * @param {ConfirmUI} c
 * @param {(result: ConfirmResult) => void} close
 */
function confirmBindButtons(c, close) {
  const { el, o, word, yes, no, input, typed } = c;
  setHandler(yes, 'click', () => {
    if (!typed()) {
      speak(`Pour confirmer, écris ${word}.`);
      if (input) input.focus();
      return;
    }
    close(true);
  });
  setHandler(no, 'click', () => close(false));
  setHandler(el, 'click', (e) => {
    if (e.target === el) close(o.dismissValue);
  });
}

export { askConfirm };
